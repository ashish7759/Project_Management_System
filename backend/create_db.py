import logging
import urllib.parse
from sqlalchemy import create_engine, text

from config import settings


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database():
    db_url = settings.DATABASE_URL
    parsed = urllib.parse.urlparse(db_url)
    
    # Extract the database name from connection string path
    db_name = "AntigravityDB"
    path_part = parsed.path.lstrip("/")
    if "?" in path_part:
        db_name = path_part.split("?")[0]
    elif path_part:
        db_name = path_part

    # Construct url to connect to master database
    master_path = "/master"
    if parsed.query:
        master_path += f"?{parsed.query}"
    
    master_url = db_url.replace(parsed.path, master_path)
    
    # Connect using pymssql directly

    logger.info(f"Connecting to master database to check/create database '{db_name}'...")
    try:
        # Create connection with autocommit since CREATE DATABASE cannot run in transaction blocks
        engine = create_engine(master_url)
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            # Query system catalog to see if db exists
            query = text(f"SELECT database_id FROM sys.databases WHERE name = :db_name")
            result = conn.execute(query, {"db_name": db_name})
            row = result.fetchone()
            if not row:
                logger.info(f"Database '{db_name}' does not exist. Creating it...")
                conn.execute(text(f"CREATE DATABASE [{db_name}]"))
                logger.info(f"Database '{db_name}' created successfully.")
            else:
                logger.info(f"Database '{db_name}' already exists.")
    except Exception as e:
        logger.error(f"Error checking/creating database: {e}")
        logger.info("Please make sure the SQL Server container is running and accessible.")

if __name__ == "__main__":
    create_database()
