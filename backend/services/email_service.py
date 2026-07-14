import logging
from typing import List, Optional
from config import settings
from database import SessionLocal
from models.email_log import EmailLog

logger = logging.getLogger(__name__)

try:
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
    from jinja2 import Environment, BaseLoader
    FASTMAIL_AVAILABLE = True
except (ImportError, ModuleNotFoundError) as e:
    FASTMAIL_AVAILABLE = False
    logger.warning(f"fastapi_mail or jinja2 not available. Email service will run in fallback mock mode. Details: {e}")

if FASTMAIL_AVAILABLE:
    # Connection config
    conf = ConnectionConfig(
        MAIL_USERNAME   = settings.MAIL_USERNAME,
        MAIL_PASSWORD   = settings.MAIL_PASSWORD,
        MAIL_FROM       = settings.MAIL_FROM,
        MAIL_FROM_NAME  = settings.MAIL_FROM_NAME,
        MAIL_PORT       = settings.MAIL_PORT,
        MAIL_SERVER     = settings.MAIL_SERVER,
        MAIL_STARTTLS   = settings.MAIL_STARTTLS,
        MAIL_SSL_TLS    = settings.MAIL_SSL_TLS,
        USE_CREDENTIALS = True,
        VALIDATE_CERTS  = True,
    )
    fm = FastMail(conf)
else:
    conf = None
    fm = None

# Base email HTML template
BASE_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body        { font-family: Arial, sans-serif; margin: 0; padding: 0;
                  background: #f7faf8; }
    .container  { max-width: 580px; margin: 30px auto;
                  background: #ffffff; border-radius: 10px;
                  overflow: hidden;
                  border: 0.5px solid rgba(26,92,56,0.15); }
    .header     { background: #1a5c38; padding: 24px 28px; }
    .header h1  { color: #ffffff; margin: 0; font-size: 18px;
                  font-weight: 500; }
    .header p   { color: rgba(255,255,255,0.7); margin: 4px 0 0;
                  font-size: 12px; }
    .accent-bar { height: 3px; background: #c9a84c; }
    .body       { padding: 28px; }
    .body p     { color: #2d2d2d; font-size: 14px; line-height: 1.6;
                  margin: 0 0 12px; }
    .info-box   { background: #f7faf8;
                  border: 0.5px solid rgba(26,92,56,0.15);
                  border-left: 3px solid #c9a84c;
                  border-radius: 8px; padding: 14px 16px;
                  margin: 16px 0; }
    .info-row   { display: flex; margin-bottom: 8px; font-size: 13px; }
    .info-label { color: #1a5c38; font-weight: bold;
                  min-width: 160px; }
    .info-val   { color: #2d2d2d; }
    .btn        { display: inline-block; background: #1a5c38;
                  color: #ffffff; padding: 10px 24px;
                  border-radius: 8px; text-decoration: none;
                  font-size: 14px; font-weight: 500;
                  border-bottom: 2px solid #c9a84c;
                  margin-top: 8px; }
    .badge      { display: inline-block; padding: 4px 12px;
                  border-radius: 20px; font-size: 12px;
                  font-weight: 500; }
    .badge-green  { background: #eaf4ee; color: #1a5c38; }
    .badge-gold   { background: #fdf6e3; color: #a8863c; }
    .badge-red    { background: #fef2f2; color: #b91c1c; }
    .footer     { background: #f7faf8; padding: 16px 28px;
                  border-top: 1px solid rgba(26,92,56,0.08); }
    .footer p   { color: #999; font-size: 11px; margin: 0;
                  line-height: 1.6; }
    .divider    { height: 1px; background: rgba(26,92,56,0.08);
                  margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Jharkhand Bijli Office</h1>
      <p>झारखंड बिजली कार्यालय — Energy Department</p>
    </div>
    <div class="accent-bar"></div>
    <div class="body">
      {{ body_content }}
    </div>
    <div class="footer">
      <p>This is an automated email from the Jharkhand Bijli Office
         Project Management System.<br>
         Please do not reply to this email.<br>
         © 2025 Jharkhand Energy Department, Government of Jharkhand</p>
    </div>
  </div>
</body>
</html>
"""

def render_template(body_content: str) -> str:
    if not FASTMAIL_AVAILABLE:
        return body_content
    env = Environment(loader=BaseLoader())
    template = env.from_string(BASE_TEMPLATE)
    return template.render(body_content=body_content)

async def send_email(
    subject    : str,
    recipients : List[str],
    body_html  : str,
    event_type : str = "Notification",
) -> bool:
    recipients_str = ", ".join(recipients)
    
    if not settings.MAIL_ENABLED or not FASTMAIL_AVAILABLE:
        status_msg = "Email service is disabled in settings" if not settings.MAIL_ENABLED else "fastapi_mail package is not installed (fallback mode)"
        logger.info(f"Email fallback: Would send to {recipients}: {subject} ({status_msg})")
        # Log skipped email attempt to database
        db = SessionLocal()
        try:
            log_entry = EmailLog(
                recipients = recipients_str,
                subject    = subject,
                event_type = event_type,
                status     = "Skipped",
                error_msg  = status_msg
            )
            db.add(log_entry)
            db.commit()
        except Exception as db_err:
            logger.error(f"Failed to log skipped email to DB: {db_err}")
        finally:
            db.close()
        return True

    # Setup database logging session
    db = SessionLocal()
    log_entry = EmailLog(
        recipients = recipients_str,
        subject    = subject,
        event_type = event_type,
        status     = "Pending"
    )
    try:
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
    except Exception as db_err:
        logger.error(f"Failed to create pending email log in DB: {db_err}")

    try:
        message = MessageSchema(
            subject    = subject,
            recipients = recipients,
            body       = render_template(body_html),
            subtype    = MessageType.html,
        )
        await fm.send_message(message)
        logger.info(f"Email sent to {recipients}: {subject}")
        
        # Update log to success
        if log_entry.log_id:
            try:
                log_entry.status = "Success"
                db.commit()
            except Exception as db_err:
                logger.error(f"Failed to update email log to success in DB: {db_err}")
        return True
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        # Update log to failure
        if log_entry.log_id:
            try:
                log_entry.status = "Failed"
                log_entry.error_msg = str(e)[:500]
                db.commit()
            except Exception as db_err:
                logger.error(f"Failed to update email log to failure in DB: {db_err}")
        return False
    finally:
        db.close()
