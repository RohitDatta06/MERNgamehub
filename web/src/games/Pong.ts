// web/src/games/Pong.ts
export class Pong {
  private w = 600;
  private h = 400;

  private paddle = { x: 270, y: 380, w: 60, h: 12 };
  private ball = { x: 300, y: 200, r: 8, vx: 180, vy: -220 };

  private score = 0;
  private over = false;

  private raf: number | null = null;
  private last = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private onScoreUpdate: (s: number, over?: boolean) => void
  ) {
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.resetInternal();
  }

  // ---- GameHost API ----
  start() {
    window.addEventListener('mousemove', this.onMouse);
    this.stopLoop();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    window.removeEventListener('mousemove', this.onMouse);
    this.stopLoop();
  }

  reset() {
    this.stop();
    this.resetInternal();
    this.onScoreUpdate(0);
    this.start();
  }

  isGameOver() {
    return this.over;
  }

  getScore() {
    return this.score;
  }

  // ---- internals ----
  private resetInternal() {
    this.paddle.x = this.w / 2 - this.paddle.w / 2;
    this.paddle.y = this.h - 20;

    this.ball.x = this.w / 2;
    this.ball.y = this.h / 2;
    // randomize initial horizontal direction a bit
    const dir = Math.random() > 0.5 ? 1 : -1;
    this.ball.vx = 180 * dir;
    this.ball.vy = -220;

    this.score = 0;
    this.over = false;
    this.draw(0);
  }

  private stopLoop() {
    if (this.raf != null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  private onMouse = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    this.paddle.x = Math.max(0, Math.min(this.w - this.paddle.w, x - this.paddle.w / 2));
  };

  private loop = (t: number) => {
    const dt = (t - this.last) / 1000;
    this.last = t;
    this.update(dt);
    this.draw(dt);
    if (!this.over) this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.over) return;

    const b = this.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // left wall
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx *= -1;
    }
    // right wall (it's the “wall opponent”)
    if (b.x + b.r > this.w) {
      b.x = this.w - b.r;
      b.vx *= -1;
    }
    // top wall
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy *= -1;
    }

    // paddle collision
    const p = this.paddle;
    const hitsPaddle =
      b.y + b.r >= p.y &&
      b.y + b.r <= p.y + p.h &&
      b.x >= p.x &&
      b.x <= p.x + p.w &&
      b.vy > 0;

    if (hitsPaddle) {
      b.y = p.y - b.r;
      b.vy *= -1;

      // influence horizontal speed by where it hits the paddle
      const hit = (b.x - (p.x + p.w / 2)) / (p.w / 2); // -1 .. 1
      b.vx = 220 * hit;

      // +1 per successful return
      this.score += 1;
      this.onScoreUpdate(this.score);
    }

    // miss → game over
    if (b.y - b.r > this.h) {
      this.end();
    }
  }

  private end() {
    this.over = true;
    this.stopLoop();
    this.onScoreUpdate(this.score, true);
  }

  // ---- dark “gamer” rendering ----
  private draw(_dt: number) {
    const { ctx } = this;

    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#0b1020');
    g.addColorStop(1, '#0a0f1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    // center line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(this.w / 2, 0);
    ctx.lineTo(this.w / 2, this.h);
    ctx.stroke();

    // paddle (neon green)
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = 'rgba(34,197,94,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);

    // ball (blue glow)
    ctx.shadowColor = 'rgba(59,130,246,0.9)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fill();

    // reset shadow
    ctx.shadowBlur = 0;
  }
}
