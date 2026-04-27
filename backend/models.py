from sqlalchemy import Column, Integer, String, Date, Time, TIMESTAMP, ForeignKey, text
from sqlalchemy.orm import relationship
from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    patient_id = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=True)  # New: for web auth
    high_score = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    )

    sessions = relationship("GameSession", back_populates="patient")


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(
        String(50), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False
    )
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    score = Column(Integer, default=0)

    patient = relationship("Patient", back_populates="sessions")
