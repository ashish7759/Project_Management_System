# Jharkhand Bijli Office (JBO) - Project Management & Document Intelligence System

This is a production-grade, secure, and role-based enterprise web application designed to digitize document management, automate data extraction via OCR & AI (GPT-4o), and monitor electricity infrastructure projects for the Jharkhand Bijli Vitran Nigam Limited.

---

## ⚡ Technology Stack

### Frontend
- **Framework**: React.js with TypeScript & Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6 (Role-checked protected routes)
- **State & Validation**: React Hook Form + Zod Schema Validation
- **Visualizations**: Recharts for dashboard analytics
- **Client**: Axios with request token interceptors & 401 session handlers

### Backend
- **Framework**: Python FastAPI
- **Database ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Security**: JWT Authentication (python-jose) + Bcrypt password hashing + brute force rate limiting
- **OCR Engine**: Tesseract OCR + EasyOCR (English character fallback)
- **AI Integration**: OpenAI API (GPT-4o) for metadata extraction
- **Reporting**: ReportLab (official JBO letterhead PDF) + OpenPyXL (styled Excel workbooks)

### Database
- **Database Engine**: Microsoft SQL Server (MS SQL Server)
- **Driver Connector**: `pymssql` (pure Python SQL Server driver, no system-level ODBC driver required)

---

## 🛠️ Installation & Setup

### Prerequisites
1. **Python**: Python 3.10 to 3.14
2. **Node.js**: Node.js 18+ (with npm package manager)
3. **Database**: Access to an MS SQL Server instance
4. **Tesseract OCR**: Install [Tesseract binary](https://github.com/UB-Mannheim/tesseract/wiki) on your system path.

---

### Backend Configuration

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Configure your environment variables. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to specify your MS SQL database URL and OpenAI API Key:
   ```env
   DATABASE_URL=mssql+pymssql://sa:YourSecurePassword@localhost:1433/JharkhandBijliDB
   SECRET_KEY=949f50e95a9e33c69ee0e3e2cdb479bb333a597a7837704dfbd9079f1cdb6d2e
   OPENAI_API_KEY=your-openai-api-key
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE_MB=20
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   CORS_ORIGINS=http://localhost:5173
   ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```bash
   alembic upgrade head
   ```

5. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API docs will be active at: `http://localhost:8000/docs`

---

### Frontend Configuration

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open your browser to: `http://localhost:5173`

4. (Optional) Compile production build:
   ```bash
   npm run build
   ```

---

## 🔑 User Roles & Authorization Grid

The system enforces strict Role-Based Access Controls (RBAC) at both API and router levels:

| Resource Path / Action | Admin | Manager | Operator | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard** (`/dashboard`) | Read / Write | Read / Write | Read / Write | Read |
| **Employee Approvals** (`/admin/users`) | Full Control | None | None | None |
| **Audit Log Trail** (`/admin/audit-log`) | Full Control | None | None | None |
| **Upload Documents** (`/documents/upload`) | Upload | Upload | Upload | None |
| **Draft Verification Fields** | Save Draft | Save Draft | Save Draft | None |
| **Approve / Lock Documents** | Approve | Approve | None | None |
| **Project Tracking** (`/projects`) | View / Edit | View / Edit | View / Edit | Read |
| **Log Actual Progress %** | Log Progress | Log Progress | Log Progress | None |
| **Set Planned Milestone Dates** | Save Target | Save Target | None | None |
| **Reports Hub** (`/reports`) | PDF / Excel | PDF / Excel | None | PDF / Excel |

*Bootstrap Note: The very first user to register on the platform will automatically be promoted to **Admin** with **Active** status. Subsequent user registrations will default to **Pending** status and must be approved by the Admin in the User Management screen.*
