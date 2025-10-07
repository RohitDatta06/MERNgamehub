export class Snake {
  private snake: { x: number; y: number }[] = [];
  private food: { x: number; y: number } = { x: 0, y: 0 };
  private direction: 'up' | 'down' | 'left' | 'right' = 'right';
  private nextDirection: 'up' | 'down' | 'left' | 'right' = 'right';
  private score = 0;
  private gameOver = false;

  // NEW: RAF-based loop (smoother), fixed timestep updates
  private rafId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly stepMs = 100; // 10 updates/sec; tweak to taste

  private readonly gridSize = 20;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    // supports isOver flag
    private onScoreUpdate: (score: number, isOver?: boolean) => void
  ) {
    this.resetInternal();
  }

  // PUBLIC API expected by GameHost
  start() {
    document.addEventListener('keydown', this.handleKeyPress);
    // (Re)start RAF loop
    this.stopLoopOnly();
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    document.removeEventListener('keydown', this.handleKeyPress);
    this.stopLoopOnly();
  }

  // FIX: reset now fully restarts the game (previous behavior assumed the loop kept running)
  reset() {
    this.stop(); // remove listeners + stop loop, then rebuild & start fresh
    this.resetInternal();
    this.onScoreUpdate(0);
    this.start();
  }

  // ---------------- internal ----------------

  private resetInternal() {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.gameOver = false;
    this.placeFoodNotOnSnake();
    this.draw(); // draw initial frame
  }

  private stopLoopOnly() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (ts: number) => {
    const dt = ts - this.lastTime;
    this.lastTime = ts;

    // Fixed-step simulation for consistent gameplay
    this.accumulator += dt;
    while (this.accumulator >= this.stepMs) {
      this.update();
      this.accumulator -= this.stepMs;
    }

    // Always draw (smoother visuals)
    this.draw();

    if (!this.gameOver) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private handleKeyPress = (e: KeyboardEvent) => {
    const key = e.key;
    if (key === 'ArrowUp' && this.direction !== 'down') this.nextDirection = 'up';
    else if (key === 'ArrowDown' && this.direction !== 'up') this.nextDirection = 'down';
    else if (key === 'ArrowLeft' && this.direction !== 'right') this.nextDirection = 'left';
    else if (key === 'ArrowRight' && this.direction !== 'left') this.nextDirection = 'right';
  };

  private placeFoodNotOnSnake() {
    const cols = Math.floor(this.canvas.width / this.gridSize);
    const rows = Math.floor(this.canvas.height / this.gridSize);

    let tries = 0;
    do {
      this.food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
      tries++;
      if (tries > 500) break; // safety valve
    } while (this.snake.some((seg) => seg.x === this.food.x && seg.y === this.food.y));
  }

  private update() {
    if (this.gameOver) return;

    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };

    if (this.direction === 'up') head.y--;
    else if (this.direction === 'down') head.y++;
    else if (this.direction === 'left') head.x--;
    else if (this.direction === 'right') head.x++;

    const cols = Math.floor(this.canvas.width / this.gridSize);
    const rows = Math.floor(this.canvas.height / this.gridSize);

    // walls
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      this.endGame();
      return;
    }
    // self-collision
    if (this.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    // eat
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.onScoreUpdate(this.score);
      this.placeFoodNotOnSnake();
    } else {
      this.snake.pop();
    }
  }

  private endGame() {
    this.gameOver = true;
    this.stopLoopOnly(); // stop ticking but keep listener (so restart button can call reset())
    this.onScoreUpdate(this.score, true); // notify GameHost
  }

  // ---- dark theme / gamer look rendering ----
  private draw() {
    const { ctx, canvas, gridSize } = this;

    // Background (dark, subtle gradient)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0b1020');
    grad.addColorStop(1, '#0a0f1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid for the gamer look
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }

    // Snake (rounded rectangles, neon-ish)
    ctx.fillStyle = '#16a34a'; // base green
    ctx.shadowColor = 'rgba(34,197,94,0.4)';
    ctx.shadowBlur = 8;

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    };

    this.snake.forEach((seg, i) => {
      const px = seg.x * gridSize;
      const py = seg.y * gridSize;
      // head brighter
      if (i === 0) {
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = 'rgba(34,197,94,0.7)';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = '#16a34a';
        ctx.shadowColor = 'rgba(34,197,94,0.4)';
        ctx.shadowBlur = 8;
      }
      drawRoundRect(px + 1, py + 1, gridSize - 2, gridSize - 2, 4);
    });

    // Food (glow)
    ctx.shadowColor = 'rgba(244,63,94,0.9)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    const fx = this.food.x * gridSize + gridSize / 2;
    const fy = this.food.y * gridSize + gridSize / 2;
    ctx.arc(fx, fy, gridSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // reset shadow for next frame
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  // Helpers for host (unchanged API)
  getScore(): number {
    return this.score;
  }
  isGameOver(): boolean {
    return this.gameOver;
  }
}
