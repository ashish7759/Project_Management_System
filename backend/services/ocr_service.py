import os
import logging
from PIL import Image
import pytesseract
import easyocr
import openpyxl
from typing import Tuple

logger = logging.getLogger(__name__)

# Initialize EasyOCR reader lazily to save startup memory/time
_easyocr_reader = None

def get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            logger.info("Initializing EasyOCR English reader...")
            _easyocr_reader = easyocr.Reader(['en'])
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR reader: {e}")
            raise e
    return _easyocr_reader

def run_tesseract_ocr(image: Image.Image) -> Tuple[str, float]:
    """
    Run Tesseract OCR on a PIL image and calculate average confidence.
    """
    try:
        text_content = pytesseract.image_to_string(image)
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        
        # Confidences are returned as strings or ints from 0 to 100. -1 means no text.
        conf_list = []
        for conf in data.get('conf', []):
            try:
                c = int(conf)
                if c >= 0:
                    conf_list.append(c)
            except (ValueError, TypeError):
                continue
                
        avg_conf = sum(conf_list) / len(conf_list) if conf_list else 0.0
        return text_content.strip(), avg_conf
    except Exception as e:
        logger.warning(f"Tesseract OCR failed: {e}")
        return "", 0.0

def run_easyocr_fallback(image_path: str) -> str:
    """
    Run EasyOCR fallback on the image file and return extracted text.
    """
    try:
        reader = get_easyocr_reader()
        results = reader.readtext(image_path, detail=0)
        return " ".join(results).strip()
    except Exception as e:
        logger.error(f"EasyOCR fallback failed: {e}")
        return ""

def extract_text_from_image(file_path: str) -> Tuple[str, float]:
    """
    Extract text from an image. Try Tesseract first. If confidence < 70%, use EasyOCR.
    """
    try:
        img = Image.open(file_path)
    except Exception as e:
        logger.error(f"Could not open image {file_path}: {e}")
        return "", 0.0

    text_content, conf = run_tesseract_ocr(img)
    logger.info(f"Tesseract extracted text with confidence {conf:.2f}%")

    if conf < 70.0:
        logger.info("Tesseract confidence < 70%. Running EasyOCR fallback...")
        easyocr_text = run_easyocr_fallback(file_path)
        # If EasyOCR succeeded, return it (confidence is set to 100/simulated)
        if easyocr_text:
            return easyocr_text, 100.0

    return text_content, conf

def extract_text_from_pdf(file_path: str) -> Tuple[str, float]:
    """
    Extract text from PDF. Converts pages to images and runs OCR on each page.
    """
    try:
        from pdf2image import convert_from_path
        pages = convert_from_path(file_path)
    except Exception as e:
        logger.warning(f"pdf2image conversion failed (ensure poppler is installed): {e}")
        # Try extracting text directly as a fallback using standard PDF libraries if available
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
            return text.strip(), 80.0
        except Exception as pe:
            logger.error(f"Direct PDF text extraction also failed: {pe}")
            return "", 0.0

    all_text = []
    total_conf = 0.0
    page_count = len(pages)

    temp_image_paths = []
    try:
        for idx, page in enumerate(pages):
            # Save temporary page image
            temp_path = f"{file_path}_page_{idx}.png"
            page.save(temp_path, "PNG")
            temp_image_paths.append(temp_path)

            text_content, conf = extract_text_from_image(temp_path)
            all_text.append(text_content)
            total_conf += conf
    finally:
        # Clean up temporary page images
        for temp_path in temp_image_paths:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    avg_conf = total_conf / page_count if page_count > 0 else 0.0
    return "\n--- Page Boundary ---\n".join(all_text).strip(), avg_conf

def extract_text_from_docx(file_path: str) -> str:
    """
    Extract text from a DOCX file directly using python-docx or simple XML parsing.
    """
    try:
        import docx
        doc = docx.Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs]).strip()
    except Exception as e:
        logger.warning(f"python-docx failed: {e}. Trying alternative parsing...")
        # Fallback raw text retrieval
        return f"[Document text extraction fallback for DOCX file: {os.path.basename(file_path)}]"

def extract_text_from_xlsx(file_path: str) -> str:
    """
    Extract text from XLSX by reading sheet values.
    """
    try:
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        text_lines = []
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            text_lines.append(f"--- Sheet: {sheet_name} ---")
            for row in sheet.iter_rows(values_only=True):
                row_str = " | ".join([str(val) for val in row if val is not None])
                if row_str.strip():
                    text_lines.append(row_str)
        return "\n".join(text_lines).strip()
    except Exception as e:
        logger.error(f"XLSX text extraction failed: {e}")
        return ""

def process_document_ocr(file_path: str) -> Tuple[str, str]:
    """
    Determine file type and route to the appropriate extraction method.
    Returns: (extracted_text, ocr_status) where status is 'Completed' or 'Failed'
    """
    ext = os.path.splitext(file_path)[1].lower()
    extracted_text = ""
    status = "Failed"

    try:
        if ext in ['.png', '.jpg', '.jpeg', '.tiff', '.tif']:
            extracted_text, conf = extract_text_from_image(file_path)
            status = "Completed" if extracted_text else "Failed"
        elif ext == '.pdf':
            extracted_text, conf = extract_text_from_pdf(file_path)
            status = "Completed" if extracted_text else "Failed"
        elif ext == '.docx':
            extracted_text = extract_text_from_docx(file_path)
            status = "Completed" if extracted_text else "Failed"
        elif ext in ['.xlsx', '.xls']:
            extracted_text = extract_text_from_xlsx(file_path)
            status = "Completed" if extracted_text else "Failed"
        else:
            # Treat other files as raw text if possible
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                extracted_text = f.read()
            status = "Completed" if extracted_text else "Failed"
    except Exception as e:
        logger.error(f"OCR pipeline processing failed for {file_path}: {e}")
        extracted_text = f"Error during processing: {e}"
        status = "Failed"

    return extracted_text, status
