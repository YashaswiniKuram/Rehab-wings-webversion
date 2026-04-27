from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import patients, game, leaderboard

app = FastAPI(
    title="Flappy Bird Rehab API",
    description="Backend API for the HandGesture-Controlled Flappy Bird web game",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(patients.router)
app.include_router(game.router)
app.include_router(leaderboard.router)


@app.on_event("startup")
def on_startup():
    """Initialize the database on server startup."""
    init_db()


@app.get("/")
def root():
    return {"message": "Flappy Bird Rehab API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
