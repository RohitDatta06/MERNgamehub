export class FlappyBird {
  private bird = { x: 100, y: 0, vy: 0, r: 12 };
  private pipes: { x: number; gapY: number; passed?: boolean }[] = [];
  private score = 0;
  private over = false;

  private gravity = 900; // px/s²
  private jumpVel = -300; // px/s
  private gap = 150;
  private pipeWidth = 60;
  private pipeSpeed = 150; // px/s
  private spawnTimer = 0;
  private spawnInterval = 1400; // ms between pipes

  private rafId: number | null = null;
  private last = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private onScoreUpdate: (score: number, over?: boolean) => void
  ) {
    this.canvas.width = 600;
    this.canvas.height = 400;
    this.resetInternal();
  }

  // -------- Core GameHost API --------
  start() {
    window.addEventListener('keydown', this.key);
    this.canvas.addEventListener('mousedown', this.flap);
    this.stopLoop();
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    window.removeEventListener('keydown', this.key);
    this.canvas.removeEventListener('mousedown', this.flap);
    this.stopLoop();
  }

  reset() {
    this.stop();
    this.resetInternal();
    this.onScoreUpdate(0);
    this.start();
  }

  getScore() {
    return this.score;
  }

  isGameOver() {
    return this.over;
  }

  // -------- Internals --------
  private resetInternal() {
    this.bird = { x: 100, y: this.canvas.height / 2, vy: 0, r: 12 };
    this.pipes = [];
    this.score = 0;
    this.over = false;
    this.spawnTimer = 0;
    this.draw();
  }

  private stopLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private key = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'ArrowUp') this.flap();
  };

  private flap = () => {
    if (!this.over) this.bird.vy = this.jumpVel;
  };

  private loop = (t: number) => {
    const dt = (t - this.last) / 1000;
    this.last = t;

    this.update(dt);
    this.draw();

    if (!this.over) this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.over) return;

    // Bird physics
    this.bird.vy += this.gravity * dt;
    this.bird.y += this.bird.vy * dt;

    // spawn new pipes
    this.spawnTimer += dt * 1000;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      const minGapTop = 50;
      const maxGapTop = this.canvas.height - this.gap - 50;
      const gapY = minGapTop + Math.random() * (maxGapTop - minGapTop);
      this.pipes.push({ x: this.canvas.width, gapY });
    }

    // move pipes
    for (const pipe of this.pipes) pipe.x -= this.pipeSpeed * dt;
    this.pipes = this.pipes.filter((p) => p.x + this.pipeWidth > -10);

    // check collisions and scoring
    const b = this.bird;
    for (const pipe of this.pipes) {
      // passed pipe
      if (!pipe.passed && pipe.x + this.pipeWidth < b.x - b.r) {
        pipe.passed = true;
        this.score += 1;
        this.onScoreUpdate(this.score);
      }

      // collision with pipe
      const withinPipeX = b.x + b.r > pipe.x && b.x - b.r < pipe.x + this.pipeWidth;
      if (withinPipeX) {
        if (b.y - b.r < pipe.gapY || b.y + b.r > pipe.gapY + this.gap) {
          this.end();
          return;
        }
      }
    }

    // ground/ceiling
    if (b.y + b.r > this.canvas.height || b.y - b.r < 0) {
      this.end();
      return;
    }
  }

  private end() {
    this.over = true;
    this.stopLoop();
    this.onScoreUpdate(this.score, true);
  }

  private draw() {
    const { ctx, canvas } = this;
    const b = this.bird;

    // background
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0b1020');
    g.addColorStop(1, '#0a0f1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // pipes
    for (const pipe of this.pipes) {
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = 'rgba(34,197,94,0.6)';
      ctx.shadowBlur = 12;
      ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);
      ctx.fillRect(
        pipe.x,
        pipe.gapY + this.gap,
        this.pipeWidth,
        canvas.height - (pipe.gapY + this.gap)
      );
    }
    ctx.shadowBlur = 0;

    // bird
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = 'rgba(245,158,11,0.7)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
