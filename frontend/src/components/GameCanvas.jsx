import { useRef, useEffect, useCallback, useState } from 'react';
import FlappyBirdEngine, { GAME_STATE } from '../utils/gameEngine';

export default function GameCanvas({ highScore = 0, onScoreChange, onGameOver, onStateChange, flapTrigger }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new FlappyBirdEngine(canvas, {
      highScore,
      onScoreChange: (score) => onScoreChange?.(score),
      onGameOver: (score) => onGameOver?.(score),
      onStateChange: (state) => onStateChange?.(state),
    });

    engineRef.current = engine;
    setCanvasReady(true);

    // Handle window resize
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, [highScore]);

  // Listen for flap trigger from hand gesture
  useEffect(() => {
    if (flapTrigger && engineRef.current) {
      engineRef.current.flap();
    }
  }, [flapTrigger]);

  // Keyboard & mouse/touch handlers
  const handleFlap = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.state === GAME_STATE.GAME_OVER) {
      engine.restart();
    } else {
      engine.flap();
    }
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleFlap]);

  return (
    <div className="flex justify-center items-center w-full">
      <canvas
        ref={canvasRef}
        id="game-canvas"
        className="rounded-2xl shadow-2xl shadow-black/50 cursor-pointer border border-slate-700/30 max-w-full"
        onClick={handleFlap}
        onTouchStart={(e) => {
          e.preventDefault();
          handleFlap();
        }}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
