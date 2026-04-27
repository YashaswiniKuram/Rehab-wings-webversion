from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Patient
from schemas import (
    PatientRegister,
    PatientLogin,
    PatientSetPassword,
    PatientResponse,
    PatientStats,
)
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("/register", response_model=PatientResponse)
def register_patient(data: PatientRegister, db: Session = Depends(get_db)):
    """Register a new patient with a password."""
    existing = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient ID '{data.patient_id}' already exists.",
        )

    patient = Patient(
        name=data.name,
        patient_id=data.patient_id,
        password_hash=hash_password(data.password),
        high_score=0,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    token = create_access_token({"sub": patient.patient_id, "name": patient.name})
    return PatientResponse(
        name=patient.name,
        patient_id=patient.patient_id,
        high_score=patient.high_score,
        token=token,
    )


@router.post("/login", response_model=PatientResponse)
def login_patient(data: PatientLogin, db: Session = Depends(get_db)):
    """
    Login an existing patient.
    - If the patient was created by the desktop app (no password), they must set one first.
    - Otherwise, verify the password.
    """
    patient = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No patient found with ID: {data.patient_id}",
        )

    # Desktop-created patient without a password
    if not patient.password_hash:
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="This account was created on the desktop app. Please set a password first.",
        )

    if not verify_password(data.password, patient.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )

    token = create_access_token({"sub": patient.patient_id, "name": patient.name})
    return PatientResponse(
        name=patient.name,
        patient_id=patient.patient_id,
        high_score=patient.high_score or 0,
        token=token,
    )


@router.post("/set-password")
def set_password(data: PatientSetPassword, db: Session = Depends(get_db)):
    """
    Set a password for an existing desktop-created patient
    who doesn't have a web password yet.
    """
    patient = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found.",
        )
    if patient.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is already set. Use login instead.",
        )

    patient.password_hash = hash_password(data.password)
    db.commit()

    token = create_access_token({"sub": patient.patient_id, "name": patient.name})
    return PatientResponse(
        name=patient.name,
        patient_id=patient.patient_id,
        high_score=patient.high_score or 0,
        token=token,
    )


@router.get("/{patient_id}/stats", response_model=PatientStats)
def get_patient_stats(patient_id: str, db: Session = Depends(get_db)):
    """Get detailed statistics for a patient."""
    from sqlalchemy import func
    from models import GameSession

    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    stats = (
        db.query(
            func.count(GameSession.id).label("total_sessions"),
            func.coalesce(func.sum(GameSession.duration_seconds), 0).label("total_play_time"),
            func.coalesce(func.avg(GameSession.score), 0).label("avg_score"),
        )
        .filter(GameSession.patient_id == patient_id)
        .first()
    )

    return PatientStats(
        name=patient.name,
        patient_id=patient.patient_id,
        total_sessions=stats.total_sessions or 0,
        total_play_time=int(stats.total_play_time or 0),
        high_score=patient.high_score or 0,
        avg_score=round(float(stats.avg_score or 0), 2),
    )
