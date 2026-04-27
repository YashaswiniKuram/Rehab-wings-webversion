from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "rehab_wings")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

SQLALCHEMY_DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Create all tables and ensure the password_hash column exists
    on the patients table (for backward compatibility with the desktop app).
    """
    Base.metadata.create_all(bind=engine)

    # Add password_hash column if it doesn't exist (existing desktop DB won't have it)
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'patients' "
                "AND COLUMN_NAME = 'password_hash'"
            ),
            {"db": DB_NAME},
        )
        if result.scalar() == 0:
            conn.execute(
                text(
                    "ALTER TABLE patients ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL"
                )
            )
            conn.commit()
