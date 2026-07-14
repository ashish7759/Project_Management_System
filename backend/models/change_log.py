from sqlalchemy import Column, Integer, NVARCHAR, DateTime, text
from database import Base

class DatabaseChangeLog(Base):
    """
    Log of table modifications triggered by the database engine (inserts, updates, deletes).
    """
    __tablename__ = "database_change_log"
    __table_args__ = {"implicit_returning": False}

    change_id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(NVARCHAR(100), nullable=False)
    action = Column(NVARCHAR(20), nullable=False)  # INSERT, UPDATE, DELETE
    row_id = Column(NVARCHAR(100), nullable=True)  # Alphanumeric identifier of the affected record
    timestamp = Column(DateTime, server_default=text("GETDATE()"), nullable=False)
