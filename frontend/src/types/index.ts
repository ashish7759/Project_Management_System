export interface Department {
  department_id: number;
  department_name: string;
  department_head?: string | null;
  contact_email?: string | null;
}

export interface User {
  user_id: number;
  full_name: string;
  employee_id: string;
  email: string;
  mobile: string;
  username: string;
  role: 'Admin' | 'Manager' | 'Operator' | 'Viewer';
  status: 'Pending' | 'Active' | 'Inactive';
  created_at: string;
  last_login?: string | null;
  department_id?: number | null;
  department?: Department | null;
}

export interface MasterDocument {
  document_id: number;
  file_name: string;
  file_type: string;
  original_file_path: string;
  upload_date: string;
  uploaded_by?: number | null;
  ocr_status: 'Processing' | 'Completed' | 'Failed';
  verification_status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: number | null;
  approved_at?: string | null;
  raw_ocr_text?: string | null;
  ai_extracted_json?: string | null;
}

export interface Project {
  project_id: string;
  project_name: string;
  location?: string | null;
  district?: string | null;
  department_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_amount?: number | null;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed';
  actual_progress: number;
  planned_progress: number;
  document_id?: number | null;
  created_at: string;
  department?: Department | null;
}

export interface Contractor {
  contractor_id: string;
  contractor_name: string;
  work_order_number?: string | null;
  project_id?: string | null;
  contact_info?: string | null;
  registration_number?: string | null;
  created_at: string;
}

export interface Location {
  location_id: number;
  location_name: string;
  district: string;
  state: string;
  pin_code?: string | null;
  project_id?: string | null;
}

export interface ProgressHistory {
  history_id: number;
  project_id: string;
  updated_by?: number | null;
  actual_progress: number;
  notes?: string | null;
  updated_at: string;
  updater_name?: string | null;
}

export interface Milestone {
  milestone_id: number;
  project_id: string;
  target_date: string;
  planned_progress: number;
}

export interface AuditLog {
  log_id: number;
  user_id?: number | null;
  username?: string | null;
  action_type: string;
  module: string;
  details?: string | null;
  ip_address?: string | null;
  timestamp: string;
}
