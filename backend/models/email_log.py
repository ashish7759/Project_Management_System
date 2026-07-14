from sqlalchemy import Column, Integer, NVARCHAR, DateTime, text
from database import Base

class EmailLog(Base):
    __tablename__ = "email_log"
    __table_args__ = {"implicit_returning": False}

    log_id     = Column(Integer, primary_key=True, autoincrement=True)
    recipients = Column(NVARCHAR(500), nullable=False)
    subject    = Column(NVARCHAR(300), nullable=False)
    event_type = Column(NVARCHAR(100), nullable=False)
    status     = Column(NVARCHAR(20),  nullable=False)
    error_msg  = Column(NVARCHAR(500), nullable=True)
    sent_at    = Column(DateTime, server_default=text("GETDATE()"))
