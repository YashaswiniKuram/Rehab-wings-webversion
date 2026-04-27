from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, time


# ── Patient Schemas ──────────────────────────────────────────────────────────

class PatientRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    patient_id: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=4)


class PatientLogin(BaseModel):
    patient_id: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class PatientSetPassword(BaseModel):
    patient_id: str
    password: str = Field(..., min_length=4)


class PatientResponse(BaseModel):
    name: str
    patient_id: str
    high_score: int
    token: str

    class Config:
        from_attributes = True


class PatientStats(BaseModel):
    name: str
    patient_id: str
    total_sessions: int
    total_play_time: int  # seconds
    high_score: int
    avg_score: Optional[float] = 0.0


# ── Game Session Schemas ─────────────────────────────────────────────────────

class SessionStart(BaseModel):
    patient_id: str


class SessionEnd(BaseModel):
    patient_id: str
    score: int
    duration_seconds: int


class SessionResponse(BaseModel):
    session_id: int
    message: str


class PlaytimeCheck(BaseModel):
    remaining_seconds: int
    can_play: bool


# ── Leaderboard Schemas ─────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    patient_id: str
    high_score: int

    class Config:
        from_attributes = True


class SessionAnalysis(BaseModel):
    session_date: Optional[date] = None
    start_time: Optional[str] = None
    duration_seconds: Optional[int] = None
    score: int
    score_improvement: Optional[int] = None

    class Config:
        from_attributes = True


class DailyStats(BaseModel):
    play_date: Optional[date] = None
    active_players: int
    total_sessions: int
    total_playtime_seconds: int
    best_session_score: int

    class Config:
        from_attributes = True
