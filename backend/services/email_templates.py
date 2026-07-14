# ── 1. ACCOUNT APPROVED ─────────────────────────────────────
def account_approved_email(
    full_name : str,
    username  : str,
    role      : str,
) -> dict:
    body = f"""
    <p>Dear <strong>{full_name}</strong>,</p>
    <p>Your account for the Jharkhand Bijli Office Project Management
       System has been <strong style="color:#1a5c38">approved</strong>.
       You can now log in using your credentials.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Username</span>
        <span class="info-val">{username}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Role Assigned</span>
        <span class="info-val">
          <span class="badge badge-green">{role}</span>
        </span>
      </div>
    </div>
    <p>You can log in at the system portal using your registered
       username and password.</p>
    <p>If you have any issues logging in, please contact
       your system administrator.</p>
    """
    return {
        "subject" : "Account Approved — Jharkhand Bijli Office Portal",
        "body"    : body,
    }

# ── 2. ACCOUNT REJECTED ─────────────────────────────────────
def account_rejected_email(
    full_name : str,
    reason    : str = "Does not meet eligibility criteria",
) -> dict:
    body = f"""
    <p>Dear <strong>{full_name}</strong>,</p>
    <p>We regret to inform you that your registration request for the
       Jharkhand Bijli Office Project Management System has been
       <strong style="color:#b91c1c">rejected</strong>.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Reason</span>
        <span class="info-val">{reason}</span>
      </div>
    </div>
    <p>If you believe this is an error, please contact your department
       head or system administrator for assistance.</p>
    """
    return {
        "subject" : "Registration Request Rejected — Jharkhand Bijli Office",
        "body"    : body,
    }

# ── 3. DOCUMENT APPROVED ────────────────────────────────────
def document_approved_email(
    uploader_name   : str,
    document_name   : str,
    document_type   : str,
    approved_by     : str,
    project_name    : str = "N/A",
) -> dict:
    body = f"""
    <p>Dear <strong>{uploader_name}</strong>,</p>
    <p>Your uploaded document has been
       <strong style="color:#1a5c38">approved and verified</strong>
       by the authorized manager.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Document Name</span>
        <span class="info-val">{document_name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Document Type</span>
        <span class="info-val">
          <span class="badge badge-green">{document_type}</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Related Project</span>
        <span class="info-val">{project_name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Approved By</span>
        <span class="info-val">{approved_by}</span>
      </div>
    </div>
    <p>The extracted data from this document has been added to the
       system database and linked to the relevant project records.</p>
    """
    return {
        "subject" : f"Document Approved: {document_name}",
        "body"    : body,
    }

# ── 4. DOCUMENT REJECTED ────────────────────────────────────
def document_rejected_email(
    uploader_name : str,
    document_name : str,
    rejected_by   : str,
    reason        : str,
) -> dict:
    body = f"""
    <p>Dear <strong>{uploader_name}</strong>,</p>
    <p>Your uploaded document has been
       <strong style="color:#b91c1c">rejected</strong>
       during the verification process.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Document Name</span>
        <span class="info-val">{document_name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Rejected By</span>
        <span class="info-val">{rejected_by}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reason for Rejection</span>
        <span class="info-val"
              style="color:#b91c1c">{reason}</span>
      </div>
    </div>
    <p>Please review the document, make the necessary corrections,
       and re-upload it for verification.</p>
    <p>If you have questions about this rejection, please contact
       your manager directly.</p>
    """
    return {
        "subject" : f"Document Rejected: {document_name}",
        "body"    : body,
    }

# ── 5. PROJECT DELAYED ALERT ────────────────────────────────
def project_delayed_email(
    manager_name  : str,
    project_name  : str,
    project_id    : str,
    planned_pct   : int,
    actual_pct    : int,
    end_date      : str,
    department    : str,
) -> dict:
    variance = planned_pct - actual_pct
    body = f"""
    <p>Dear <strong>{manager_name}</strong>,</p>
    <p>This is an automated alert. The following project has been
       marked as <strong style="color:#b91c1c">DELAYED</strong>
       based on the latest progress update.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Project Name</span>
        <span class="info-val">{project_name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Project ID</span>
        <span class="info-val">{project_id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Department</span>
        <span class="info-val">{department}</span>
      </div>
      <div class="info-row">
        <span class="info-label">End Date</span>
        <span class="info-val"
              style="color:#b91c1c">{end_date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Planned Progress</span>
        <span class="info-val">{planned_pct}%</span>
      </div>
      <div class="info-row">
        <span class="info-label">Actual Progress</span>
        <span class="info-val"
              style="color:#b91c1c">{actual_pct}%</span>
      </div>
      <div class="info-row">
        <span class="info-label">Variance</span>
        <span class="info-val">
          <span class="badge badge-red">
            -{variance}% behind schedule
          </span>
        </span>
      </div>
    </div>
    <p>Please review this project and take necessary action to
       bring it back on schedule. Update the progress notes
       with the reason for delay.</p>
    """
    return {
        "subject" : f"⚠ Project Delayed Alert: {project_name}",
        "body"    : body,
    }

# ── 6. PASSWORD RESET ───────────────────────────────────────
def password_reset_email(
    full_name    : str,
    new_password : str,
    reset_by     : str,
) -> dict:
    body = f"""
    <p>Dear <strong>{full_name}</strong>,</p>
    <p>Your password for the Jharkhand Bijli Office Portal has been
       <strong>reset</strong> by the system administrator.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">New Password</span>
        <span class="info-val"
              style="font-family:monospace; font-size:15px;
                     color:#1a5c38; font-weight:bold">
          {new_password}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Reset By</span>
        <span class="info-val">{reset_by}</span>
      </div>
    </div>
    <p style="color:#b91c1c; font-size:13px">
      ⚠ Please log in and change your password immediately
      from the Settings page.
    </p>
    <p>If you did not request this password reset, please contact
       your system administrator immediately.</p>
    """
    return {
        "subject" : "Password Reset — Jharkhand Bijli Office Portal",
        "body"    : body,
    }

# ── 7. MONTHLY SUMMARY REPORT ───────────────────────────────
def monthly_summary_email(
    recipient_name    : str,
    month_year        : str,
    total_docs        : int,
    approved_docs     : int,
    pending_docs      : int,
    total_projects    : int,
    delayed_projects  : int,
    completed_projects: int,
) -> dict:
    body = f"""
    <p>Dear <strong>{recipient_name}</strong>,</p>
    <p>Here is the monthly summary report for
       <strong>{month_year}</strong>.</p>
    <div class="info-box">
      <p style="margin:0 0 10px; font-weight:bold;
                color:#1a5c38">Documents Summary</p>
      <div class="info-row">
        <span class="info-label">Total Documents</span>
        <span class="info-val">{total_docs}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Approved</span>
        <span class="info-val">
          <span class="badge badge-green">{approved_docs}</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Pending Verification</span>
        <span class="info-val">
          <span class="badge badge-gold">{pending_docs}</span>
        </span>
      </div>
      <div class="divider"></div>
      <p style="margin:0 0 10px; font-weight:bold;
                color:#1a5c38">Projects Summary</p>
      <div class="info-row">
        <span class="info-label">Total Projects</span>
        <span class="info-val">{total_projects}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Completed</span>
        <span class="info-val">
          <span class="badge badge-green">{completed_projects}</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Delayed</span>
        <span class="info-val">
          <span class="badge badge-red">{delayed_projects}</span>
        </span>
      </div>
    </div>
    <p>Log in to the portal to view detailed reports and
       export them in PDF or Excel format.</p>
    """
    return {
        "subject" : f"Monthly Summary Report — {month_year}",
        "body"    : body,
    }

# ── 8. ACCOUNT DEACTIVATED ──────────────────────────────────
def account_deactivated_email(
    full_name    : str,
    deactivated_by: str,
) -> dict:
    body = f"""
    <p>Dear <strong>{full_name}</strong>,</p>
    <p>Your account on the Jharkhand Bijli Office Project Management
       System has been <strong style="color:#b91c1c">
       deactivated</strong>.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Deactivated By</span>
        <span class="info-val">{deactivated_by}</span>
      </div>
    </div>
    <p>You will no longer be able to log in to the system.
       If you believe this is an error, please contact your
       department head or system administrator.</p>
    """
    return {
        "subject" : "Account Deactivated — Jharkhand Bijli Office",
        "body"    : body,
    }
