from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database import get_db
from models import Patient, GameSession
from schemas import LeaderboardEntry, SessionAnalysis, DailyStats

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("/", response_model=list[LeaderboardEntry])
def get_leaderboard(
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get top high scores across all patients."""
    patients = (
        db.query(Patient)
        .filter(Patient.high_score > 0)
        .order_by(desc(Patient.high_score))
        .limit(limit)
        .all()
    )

    return [
        LeaderboardEntry(
            rank=idx + 1,
            name=p.name,
            patient_id=p.patient_id,
            high_score=p.high_score or 0,
        )
        for idx, p in enumerate(patients)
    ]


@router.get("/sessions/{patient_id}", response_model=list[SessionAnalysis])
def get_session_history(
    patient_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get session history for a specific patient."""
    sessions = (
        db.query(GameSession)
        .filter(GameSession.patient_id == patient_id)
        .order_by(desc(GameSession.id))
        .limit(limit)
        .all()
    )

    results = []
    prev_score = None
    # Reverse to calculate improvement chronologically, then reverse back
    for s in reversed(sessions):
        improvement = None
        if prev_score is not None:
            improvement = (s.score or 0) - prev_score
        prev_score = s.score or 0

        results.append(
            SessionAnalysis(
                session_date=s.session_date,
                start_time=str(s.start_time) if s.start_time else None,
                duration_seconds=s.duration_seconds,
                score=s.score or 0,
                score_improvement=improvement,
            )
        )

    results.reverse()  # Most recent first
    return results


@router.get("/daily", response_model=list[DailyStats])
def get_daily_stats(
    limit: int = Query(default=14, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """Get daily aggregated statistics."""
    stats = (
        db.query(
            GameSession.session_date.label("play_date"),
            func.count(func.distinct(GameSession.patient_id)).label("active_players"),
            func.count(GameSession.id).label("total_sessions"),
            func.coalesce(func.sum(GameSession.duration_seconds), 0).label(
                "total_playtime_seconds"
            ),
            func.coalesce(func.max(GameSession.score), 0).label("best_session_score"),
        )
        .group_by(GameSession.session_date)
        .order_by(desc(GameSession.session_date))
        .limit(limit)
        .all()
    )

    return [
        DailyStats(
            play_date=s.play_date,
            active_players=s.active_players,
            total_sessions=s.total_sessions,
            total_playtime_seconds=int(s.total_playtime_seconds),
            best_session_score=s.best_session_score or 0,
        )
        for s in stats
    ]
