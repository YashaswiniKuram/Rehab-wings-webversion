import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCanvas from '../components/GameCanvas';
import useHandGesture from '../hooks/useHandGesture';
import { startGameSession, endGameSession, checkPlaytime } from '../api/client';

export default function Game() {
  const navigate = useNavigate();
  const player = JSON.parse(localStorage.getItem('player') || 'null');

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(player?.high_score || 0);
  const [gameState, setGameState] = useState('READY');
  const [sessionId, setSessionId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [remainingTime, setRemainingTime] = useState(20 * 60);
  const [canPlay, setCanPlay] = useState(true);
  const [showGesture, setShowGesture] = useState(false);
  const [flapTrigger, setFlapTrigger] = useState(0);

  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!player) {
      navigate('/login');
    }
  }, [player, navigate]);

  // Check remaining playtime
  useEffect(() => {
    if (!player) return;
    checkPlaytime(player.patient_id)
      .then((res) => {
        setRemainingTime(res.data.remaining_seconds);
        setCanPlay(res.data.can_play);
      })
      .catch(console.error);
  }, []);

  // Hand gesture callback
  const handleGestureFlap = useCallback(() => {
    setFlapTrigger((prev) => prev + 1);
  }, []);

  const gesture = useHandGesture(handleGestureFlap);

  // Timer
  useEffect(() => {
    if (gameState === 'PLAYING') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(secs);

        // Check playtime limit
        if (secs >= remainingTime) {
          setCanPlay(false);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, remainingTime]);

  // Handle game state changes
  const handleStateChange = useCallback(
    async (state) => {
      setGameState(state);
      if (state === 'PLAYING' && player) {
        try {
          const res = await startGameSession(player.patient_id);
          setSessionId(res.data.session_id);
        } catch (err) {
          console.error('Failed to start session:', err);
        }
      }
    },
    [player]
  );

  // Handle game over
  const handleGameOver = useCallback(
    async (finalScore) => {
      if (!player) return;
      const duration = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);

      try {
        await endGameSession(player.patient_id, finalScore, duration);
      } catch (err) {
        console.error('Failed to save score:', err);
      }

      // Update local high score
      if (finalScore > highScore) {
        setHighScore(finalScore);
        const updated = { ...player, high_score: finalScore };
        localStorage.setItem('player', JSON.stringify(updated));
      }
    },
    [player, highScore]
  );

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!player) return null;

  if (!canPlay) {
    return (
      <div className="page-container flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md animate-slide-up">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Daily Limit Reached</h2>
          <p className="text-slate-400 mb-6">
            You've reached the maximum play time of 20 minutes for today.
            Come back tomorrow to play again!
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-container max-w-3xl">
        {/* Game Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              🎮 Let's Play, <span className="text-primary-300">{player.name}</span>!
            </h1>
          </div>

          {/* Hand Gesture Toggle */}
          <button
            onClick={() => {
              if (showGesture) {
                gesture.stop();
                setShowGesture(false);
              } else {
                gesture.start();
                setShowGesture(true);
              }
            }}
            disabled={gesture.isLoading}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              showGesture
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'
            }`}
          >
            {gesture.isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                🖐️ {showGesture ? 'Gesture ON' : 'Gesture OFF'}
              </>
            )}
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card px-4 py-3 text-center">
            <div className="text-2xl font-bold text-primary-300">{score}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Score</div>
          </div>
          <div className="glass-card px-4 py-3 text-center">
            <div className="text-2xl font-bold text-game-bird">{highScore}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Best</div>
          </div>
          <div className="glass-card px-4 py-3 text-center">
            <div className="text-2xl font-bold text-slate-300">{formatTime(elapsed)}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Time</div>
          </div>
        </div>

        {/* Webcam Feed (small PiP when active) */}
        {showGesture && (
          <div className="relative mb-4 flex justify-end">
            <div className="relative w-40 h-30 rounded-xl overflow-hidden border border-primary-400/30 shadow-lg shadow-primary-500/10">
              <video
                ref={gesture.videoRef}
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
                muted
                playsInline
              />
              <canvas
                ref={gesture.canvasRef}
                className="absolute inset-0 w-full h-full"
                width={320}
                height={240}
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/50 rounded text-xs text-green-400">
                🟢 Live
              </div>
            </div>
          </div>
        )}

        {/* Game Canvas */}
        <GameCanvas
          highScore={highScore}
          onScoreChange={setScore}
          onGameOver={handleGameOver}
          onStateChange={handleStateChange}
          flapTrigger={flapTrigger}
        />

        {/* Instructions */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          {gameState === 'READY' && (
            <p className="animate-pulse">Press <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-300 text-xs">Space</kbd>, Click, or Tap to start</p>
          )}
          {gameState === 'GAME_OVER' && (
            <p>Press <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-300 text-xs">Space</kbd> or Tap to play again</p>
          )}
          {gameState === 'PLAYING' && (
            <p className="text-slate-600">Remaining today: {formatTime(Math.max(0, remainingTime - elapsed))}</p>
          )}
        </div>

        {/* Gesture Error */}
        {gesture.error && (
          <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            ⚠️ {gesture.error}
          </div>
        )}
      </div>
    </div>
  );
}
