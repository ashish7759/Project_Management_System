import json
import logging
import re
from typing import Dict, Any, Optional
from openai import OpenAI

try:
    from config import settings
except ImportError:
    from backend.config import settings

logger = logging.getLogger(__name__)

def parse_with_regex_fallback(text: str) -> Dict[str, Any]:
    """
    Highly robust regex extractor used when the OpenAI API is offline or unconfigured.
    """
    logger.info("Running regex fallback metadata extraction...")
    
    # Try to find Project IDs like PRJ-123 or JBO-2026-ENG-001
    prj_id_match = re.search(r'(?:Project\s*ID|PRJ|JBO)-?\s*([A-Za-z0-9-]+)', text, re.IGNORECASE)
    project_id = prj_id_match.group(1) if prj_id_match else "PRJ-" + str(hash(text) % 10000).replace("-", "")
    
    # Try to find project name
    prj_name_match = re.search(r'(?:Project\s*Name|Name of Work):\s*(.*?)(?:\n|$)', text, re.IGNORECASE)
    project_name = prj_name_match.group(1).strip() if prj_name_match else "Grid Extension Scheme"

    # Try to find contractor
    contractor_match = re.search(r'(?:Contractor|Agency|M/s)\s*:?\s*([A-Za-z0-9\s,\.]+)', text, re.IGNORECASE)
    contractor_name = contractor_match.group(1).strip() if contractor_match else "M/s Jharkhand Power Solutions"
    
    contractor_id_match = re.search(r'(?:Contractor\s*ID|Reg\s*No):\s*([A-Za-z0-9-]+)', text, re.IGNORECASE)
    contractor_id = contractor_id_match.group(1) if contractor_id_match else "CON-1002"

    # Location & District
    loc_match = re.search(r'(?:Location|Site):\s*([A-Za-z0-9\s,\.]+)', text, re.IGNORECASE)
    location = loc_match.group(1).strip() if loc_match else "Dhurwa Substation"
    
    dist_match = re.search(r'(?:District):\s*([A-Za-z0-9\s]+)', text, re.IGNORECASE)
    district = dist_match.group(1).strip() if dist_match else "Ranchi"

    # Work Order Number
    wo_match = re.search(r'(?:Work\s*Order|W\.O\.|Agreement)\s*(?:No|Number)?\s*:?\s*([A-Za-z0-9/-]+)', text, re.IGNORECASE)
    work_order_number = wo_match.group(1) if wo_match else "JBO/WO/2026/089"

    # Budget Amount
    budget = 1500000.0
    budget_match = re.search(r'(?:Budget|Amount|Cost|Rs\.?|INR)\s*:?\s*(?:Rs\.?)?\s*([\d,]+(?:\.\d+)?)', text, re.IGNORECASE)
    if budget_match:
        try:
            budget = float(budget_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Dates
    start_date = "2026-06-01"
    end_date = "2026-12-31"
    date_matches = re.findall(r'\b\d{4}-\d{2}-\d{2}\b', text)
    if len(date_matches) >= 2:
        start_date = date_matches[0]
        end_date = date_matches[1]

    # Department
    dept_match = re.search(r'(?:Department|Dept):\s*([A-Za-z\s]+)', text, re.IGNORECASE)
    department = dept_match.group(1).strip() if dept_match else "Engineering"

    # Document type
    doc_type = "Work Order"
    if "inspection" in text.lower():
        doc_type = "Inspection Report"
    elif "budget" in text.lower():
        doc_type = "Budget Approval"
    elif "contractor" in text.lower() or "agreement" in text.lower():
        doc_type = "Contractor Agreement"

    return {
        "project_name": project_name,
        "project_id": project_id,
        "location": location,
        "district": district,
        "contractor_name": contractor_name,
        "contractor_id": contractor_id,
        "work_order_number": work_order_number,
        "budget_amount": budget,
        "start_date": start_date,
        "end_date": end_date,
        "department": department,
        "document_type": doc_type,
        "status": "In Progress",
        "description": "Automatically extracted via regex parsing fallback."
    }

def extract_project_metadata_ai(extracted_text: str) -> Dict[str, Any]:
    """
    Send extracted text to GPT-4o to parse structured metadata JSON.
    Falls back to regex-based parser if OpenAI is unconfigured or fails.
    """
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "mock-openai-api-key":
        logger.info("OpenAI API key is mock or empty. Using regex extraction.")
        return parse_with_regex_fallback(extracted_text)

    prompt = f"""You are a document intelligence assistant for an Indian government electricity office. Extract the following fields from the document text in JSON format: project_name, project_id, location, district, contractor_name, contractor_id, work_order_number, budget_amount, start_date, end_date, department, document_type, status, description. If a field is not found, return null.

Ensure budget_amount is returned as a number (float/int) or null.
Ensure start_date and end_date are in ISO format (YYYY-MM-DD) or null.

Text:
{extracted_text}"""

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional metadata parser returning strict JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from OpenAI.")
            
        data = json.loads(content)
        # Validate budget_amount
        if "budget_amount" in data and data["budget_amount"] is not None:
            try:
                data["budget_amount"] = float(str(data["budget_amount"]).replace(",", ""))
            except (ValueError, TypeError):
                data["budget_amount"] = None
        return data
    except Exception as e:
        logger.error(f"OpenAI GPT-4o extraction failed: {e}. Falling back to regex.")
        return parse_with_regex_fallback(extracted_text)
