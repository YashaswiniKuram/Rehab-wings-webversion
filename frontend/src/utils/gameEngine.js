/**
 * Flappy Bird Game Engine — Pure JavaScript Canvas Game
 * Ported from the Pygame desktop version with identical physics.
 */

const GAME_STATE = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
};

export default class FlappyBirdEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Base resolution (matches desktop)
    this.BASE_WIDTH = 500;
    this.BASE_HEIGHT = 600;

    // Scale factor for responsive sizing
    this.scale = 1;

    // Callbacks
    this.onScoreChange = options.onScoreChange || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // ── Bird 
    this.birdWidth = 40;
    this.birdHeight = 30;
    this.birdX = this.BASE_WIDTH / 4;
    this.birdY = this.BASE_HEIGHT / 2;
    this.birdVelocity = 0;
    this.birdRotation = 0;

    // ── Physics 
    this.gravity = 0.5;
    this.jumpStrength = -8;

    // ── Pipes 
    this.pipeWidth = 60;
    this.pipeGap = 180;
    this.pipeSpeed = 3;
    this.pipes = [];
    this.pipeSpawnTimer = 0;
    this.pipeSpawnInterval = 90; // frames between pipe spawns

    // ── Background 
    this.bgX = 0;
    this.bgSpeed = 1;

    // ── Score 
    this.score = 0;
    this.highScore = options.highScore || 0;

    // ── State 
    this.state = GAME_STATE.READY;
    this.animationId = null;
    this.lastTime = 0;

    // ── Assets 
    this.bgImage = new Image();
    this.birdImage = new Image();
    this.assetsLoaded = 0;
    this.totalAssets = 2;

    // ── Ground 
    this.groundHeight = 60;

    // Load assets
    this._loadAssets();
  }

  _loadAssets() {
    const onLoad = () => {
      this.assetsLoaded++;
      if (this.assetsLoaded >= this.totalAssets) {
        this.resize();
        this._drawReady();
      }
    };

    this.bgImage.onload = onLoad;
    this.birdImage.onload = onLoad;
    this.bgImage.src = '/assets/background.png';
    this.birdImage.src = '/assets/bird.png';
  }

  // ── Resize / Scale ───────────────────────────────────────────────

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const maxWidth = Math.min(parent.clientWidth, 500);
    const maxHeight = Math.min(window.innerHeight - 120, 700);

    // Maintain aspect ratio
    const ratio = this.BASE_WIDTH / this.BASE_HEIGHT;
    let width = maxWidth;
    let height = width / ratio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.scale = width / this.BASE_WIDTH;
  }

  // ── Game Actions ─────────────────────────────────────────────────

  flap() {
    if (this.state === GAME_STATE.READY) {
      this.state = GAME_STATE.PLAYING;
      this.onStateChange(this.state);
      this._spawnPipe();
      this.birdVelocity = this.jumpStrength;
      this._startLoop();
    } else if (this.state === GAME_STATE.PLAYING) {
      this.birdVelocity = this.jumpStrength;
    }
  }

  restart() {
    this.birdY = this.BASE_HEIGHT / 2;
    this.birdVelocity = 0;
    this.birdRotation = 0;
    this.pipes = [];
    this.pipeSpawnTimer = 0;
    this.score = 0;
    this.bgX = 0;
    this.state = GAME_STATE.READY;
    this.onScoreChange(0);
    this.onStateChange(this.state);
    this._stopLoop();
    this._drawReady();
  }

  destroy() {
    this._stopLoop();
  }

  // ── Game Loop ────────────────────────────────────────────────────

  _startLoop() {
    this.lastTime = performance.now();
    const loop = (now) => {
      if (this.state !== GAME_STATE.PLAYING) return;
      this.animationId = requestAnimationFrame(loop);
      this._update();
      this._draw();
    };
    this.animationId = requestAnimationFrame(loop);
  }

  _stopLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // ── Update ───────────────────────────────────────────────────────

  _update() {
    // Bird physics
    this.birdVelocity += this.gravity;
    this.birdY += this.birdVelocity;

    // Bird rotation based on velocity
    this.birdRotation = Math.min(Math.max(this.birdVelocity * 3, -30), 90);

    // Scroll background
    this.bgX -= this.bgSpeed;
    if (this.bgX <= -this.BASE_WIDTH) {
      this.bgX = 0;
    }

    // Move pipes
    for (const pipe of this.pipes) {
      pipe.x -= this.pipeSpeed;

      // Check if bird passed the pipe
      if (!pipe.passed && pipe.x + this.pipeWidth < this.birdX) {
        pipe.passed = true;
        this.score++;
        if (this.score > this.highScore) {
          this.highScore = this.score;
        }
        this.onScoreChange(this.score);
      }
    }

    // Remove off-screen pipes
    this.pipes = this.pipes.filter((p) => p.x > -this.pipeWidth);

    // Spawn new pipes
    this.pipeSpawnTimer++;
    if (this.pipeSpawnTimer >= this.pipeSpawnInterval) {
      this._spawnPipe();
      this.pipeSpawnTimer = 0;
    }

    // Collision detection
    if (this._checkCollision()) {
      this.state = GAME_STATE.GAME_OVER;
      this.onStateChange(this.state);
      this.onGameOver(this.score);
      this._drawGameOver();
      this._stopLoop();
    }
  }

  _spawnPipe() {
    const minHeight = 80;
    const maxHeight = this.BASE_HEIGHT - this.pipeGap - minHeight - this.groundHeight;
    const height = minHeight + Math.random() * maxHeight;
    this.pipes.push({
      x: this.BASE_WIDTH + 10,
      height: height,
      passed: false,
    });
  }

  _checkCollision() {
    const bx = this.birdX;
    const by = this.birdY;
    const bw = this.birdWidth;
    const bh = this.birdHeight;

    // Hit ceiling or ground
    if (by <= 0 || by + bh >= this.BASE_HEIGHT - this.groundHeight) {
      return true;
    }

    // Hit pipes — use smaller hitbox for fairness
    const margin = 4;
    for (const pipe of this.pipes) {
      const px = pipe.x;
      const pw = this.pipeWidth;
      const topH = pipe.height;
      const bottomY = topH + this.pipeGap;

      // Horizontal overlap
      if (bx + bw - margin > px && bx + margin < px + pw) {
        // Vertical overlap with top pipe
        if (by + margin < topH) return true;
        // Vertical overlap with bottom pipe
        if (by + bh - margin > bottomY) return true;
      }
    }

    return false;
  }

  // ── Drawing ──────────────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx;
    const s = this.scale;

    ctx.save();
    ctx.scale(s, s);

    // Background
    this._drawBackground();

    // Pipes
    this._drawPipes();

    // Ground
    this._drawGround();

    // Bird
    this._drawBird();

    // Score HUD
    this._drawHUD();

    ctx.restore();
  }

  _drawBackground() {
    const ctx = this.ctx;
    if (this.bgImage.complete) {
      ctx.drawImage(this.bgImage, this.bgX, 0, this.BASE_WIDTH, this.BASE_HEIGHT);
      ctx.drawImage(this.bgImage, this.bgX + this.BASE_WIDTH, 0, this.BASE_WIDTH, this.BASE_HEIGHT);
    } else {
      // Fallback sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, this.BASE_HEIGHT);
      gradient.addColorStop(0, '#4EC0CA');
      gradient.addColorStop(0.7, '#71C9CE');
      gradient.addColorStop(1, '#DED895');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.BASE_WIDTH, this.BASE_HEIGHT);
    }
  }

  _drawPipes() {
    const ctx = this.ctx;

    for (const pipe of this.pipes) {
      const topH = pipe.height;
      const bottomY = topH + this.pipeGap;
      const bottomH = this.BASE_HEIGHT - bottomY;

      // Pipe body gradient
      const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + this.pipeWidth, 0);
      pipeGrad.addColorStop(0, '#2D8A3E');
      pipeGrad.addColorStop(0.3, '#3CB44B');
      pipeGrad.addColorStop(0.7, '#3CB44B');
      pipeGrad.addColorStop(1, '#2D8A3E');

      // Top pipe
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x, 0, this.pipeWidth, topH);

      // Top pipe cap
      ctx.fillStyle = '#2D8A3E';
      ctx.fillRect(pipe.x - 4, topH - 25, this.pipeWidth + 8, 25);
      ctx.fillStyle = '#3CB44B';
      ctx.fillRect(pipe.x - 2, topH - 23, this.pipeWidth + 4, 21);

      // Bottom pipe
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(pipe.x, bottomY, this.pipeWidth, bottomH);

      // Bottom pipe cap
      ctx.fillStyle = '#2D8A3E';
      ctx.fillRect(pipe.x - 4, bottomY, this.pipeWidth + 8, 25);
      ctx.fillStyle = '#3CB44B';
      ctx.fillRect(pipe.x - 2, bottomY + 2, this.pipeWidth + 4, 21);

      // Pipe highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(pipe.x + 6, 0, 8, topH - 25);
      ctx.fillRect(pipe.x + 6, bottomY + 25, 8, bottomH - 25);
    }
  }

  _drawGround() {
    const ctx = this.ctx;
    const groundY = this.BASE_HEIGHT - this.groundHeight;

    // Ground
    ctx.fillStyle = '#DED895';
    ctx.fillRect(0, groundY, this.BASE_WIDTH, this.groundHeight);

    // Grass
    ctx.fillStyle = '#5DB850';
    ctx.fillRect(0, groundY, this.BASE_WIDTH, 8);
    ctx.fillStyle = '#4CA840';
    ctx.fillRect(0, groundY, this.BASE_WIDTH, 3);
  }

  _drawBird() {
    const ctx = this.ctx;
    const centerX = this.birdX + this.birdWidth / 2;
    const centerY = this.birdY + this.birdHeight / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((this.birdRotation * Math.PI) / 180);

    if (this.birdImage.complete) {
      ctx.drawImage(
        this.birdImage,
        -this.birdWidth / 2,
        -this.birdHeight / 2,
        this.birdWidth,
        this.birdHeight
      );
    } else {
      // Fallback bird
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.birdWidth / 2, this.birdHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(8, -4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawHUD() {
    const ctx = this.ctx;

    // Score — centered top
    ctx.save();
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeText(this.score, this.BASE_WIDTH / 2, 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(this.score, this.BASE_WIDTH / 2, 60);
    ctx.restore();
  }

  _drawReady() {
    const ctx = this.ctx;
    const s = this.scale;

    ctx.save();
    ctx.scale(s, s);

    this._drawBackground();
    this._drawGround();

    // Draw bird at center (floating idle)
    const time = Date.now() / 500;
    this.birdY = this.BASE_HEIGHT / 2 + Math.sin(time) * 15;
    this._drawBird();

    // Title
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeText('Flappy Bird', this.BASE_WIDTH / 2, this.BASE_HEIGHT / 3 - 20);
    ctx.fillStyle = '#FFD54F';
    ctx.fillText('Flappy Bird', this.BASE_WIDTH / 2, this.BASE_HEIGHT / 3 - 20);

    // Instruction
    ctx.font = '18px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Tap, Click, or Press Space to Start', this.BASE_WIDTH / 2, this.BASE_HEIGHT / 3 + 25);

    // High score
    if (this.highScore > 0) {
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#FFD54F';
      ctx.fillText(`Best: ${this.highScore}`, this.BASE_WIDTH / 2, this.BASE_HEIGHT / 3 + 55);
    }

    ctx.restore();

    // Keep animating the idle bird
    if (this.state === GAME_STATE.READY) {
      requestAnimationFrame(() => this._drawReady());
    }
  }

  _drawGameOver() {
    const ctx = this.ctx;
    const s = this.scale;

    ctx.save();
    ctx.scale(s, s);

    // Draw the last frame
    this._drawBackground();
    this._drawPipes();
    this._drawGround();
    this._drawBird();

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, this.BASE_WIDTH, this.BASE_HEIGHT);

    // Game Over panel
    const panelW = 300;
    const panelH = 200;
    const panelX = (this.BASE_WIDTH - panelW) / 2;
    const panelY = (this.BASE_HEIGHT - panelH) / 2 - 30;

    // Panel background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 16);
    ctx.fill();

    // Panel border
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Game Over text
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillStyle = '#EF4444';
    ctx.fillText('Game Over!', this.BASE_WIDTH / 2, panelY + 50);

    // Score
    ctx.font = '22px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Score: ${this.score}`, this.BASE_WIDTH / 2, panelY + 95);

    // Best
    ctx.font = '18px Inter, sans-serif';
    ctx.fillStyle = '#FFD54F';
    ctx.fillText(`Best: ${this.highScore}`, this.BASE_WIDTH / 2, panelY + 125);

    // Instruction
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Tap or Press Space to Play Again', this.BASE_WIDTH / 2, panelY + 165);

    ctx.restore();
  }
}

export { GAME_STATE };
