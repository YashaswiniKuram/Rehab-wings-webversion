from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

from database import get_db
from models import Patient, GameSession
from schemas import SessionStart, SessionEnd, SessionResponse, PlaytimeCheck
from auth import get_current_patient

router = APIRouter(prefix="/api/game", tags=["game"])

MAX_DAILY_PLAYTIME = 20 * 60  # 20 minutes in seconds


@router.post("/start", response_model=SessionResponse)
def start_session(
    data: SessionStart,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_patient),
):
    """Start a new game session."""
    # Verify the patient exists
    patient = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    now = datetime.now()
    session = GameSession(
        patient_id=data.patient_id,
        session_date=now.date(),
        start_time=now.time(),
        score=0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return SessionResponse(session_id=session.id, message="Session started")


@router.post("/end", response_model=SessionResponse)
def end_session(
    data: SessionEnd,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_patient),
):
    """End a game session, save score and duration."""
    # Get the most recent active session for this patient
    session = (
        db.query(GameSession)
        .filter(GameSession.patient_id == data.patient_id)
        .order_by(GameSession.id.desc())
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="No active session found.")

    now = datetime.now()
    session.end_time = now.time()
    session.duration_seconds = data.duration_seconds
    session.score = data.score

    # Update patient high score if this score is higher
    patient = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
    if patient and (patient.high_score is None or data.score > patient.high_score):
        patient.high_score = data.score

    db.commit()

    return SessionResponse(session_id=session.id, message="Session ended, score saved")


@router.get("/check-playtime/{patient_id}", response_model=PlaytimeCheck)
def check_playtime(
    patient_id: str,
    db: Session = Depends(get_db),
):
    """Check how much daily playtime a patient has remaining."""
    today = date.today()

    total_today = (
        db.query(func.coalesce(func.sum(GameSession.duration_seconds), 0))
        .filter(
            GameSession.patient_id == patient_id,
            GameSession.session_date == today,
        )
        .scalar()
    )

    remaining = max(0, MAX_DAILY_PLAYTIME - int(total_today))
    return PlaytimeCheck(remaining_seconds=remaining, can_play=remaining > 0)
