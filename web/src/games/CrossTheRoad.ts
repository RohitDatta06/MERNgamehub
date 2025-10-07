export class CrossTheRoad {
  private player = { x: 0, y: 0, w: 30, h: 30 };
  private cars: { x: number; y: number; speed: number; w: number; h: number }[] = [];
  private score = 0;
  private over = false;

  // layout
  private lanes = 5;
  private laneHeight = 60; // keep your lane step
  private sidePadding = 12;

  // loop
  private rafId: number | null = null;
  private lastTs = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    // NOTE: support isOver flag for GameHost
    private onScoreUpdate: (score: number, isOver?: boolean) => void
  ) {
    this.resetInternal();
  }

  // ---- public API expected by GameHost ----
  start() {
    window.addEventListener('keydown', this.onKey);
    this.stopLoop();
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    window.removeEventListener('keydown', this.onKey);
    this.stopLoop();
  }

  reset() {
    this.stop();
    this.resetInternal();
    this.onScoreUpdate(0);
    this.start();
  }

  isGameOver(): boolean {
    return this.over;
  }

  getScore(): number {
    return this.score;
  }

  // ---- internals ----
  private resetInternal() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // player starts centered bottom
    this.player.w = 30;
    this.player.h = 30;
    this.player.x = Math.floor(cw / 2 - this.player.w / 2);
    this.player.y = ch - this.player.h - 10;

    // build cars across lane rows (skip top/bottom safe rows)
    this.cars = [];
    const trafficRows = this.lanes - 1; // lanes between safe zones
    for (let i = 1; i <= trafficRows; i++) {
      const y = i * this.laneHeight + (this.laneHeight - 40) / 2; // center car height in lane
      // 3–4 cars per lane, alternating directions/speeds
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = 120 + i * 15; // px/s

      const count = 3 + (i % 2); // 3 or 4
      for (let c = 0; c < count; c++) {
        const w = 60;
        const h = 40;
        const x = Math.random() * (cw + 200) - 100; // start slightly offscreen occasionally
        this.cars.push({ x, y, speed: dir * speed, w, h });
      }
    }

    this.score = 0;
    this.over = false;
    this.draw(0);
  }

  private stopLoop() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (ts: number) => {
    const dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;

    this.update(dt);
    this.draw(dt);

    if (!this.over) this.rafId = requestAnimationFrame(this.loop);
  };

  private onKey = (e: KeyboardEvent) => {
    if (this.over) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const horizStep = 30;
    const vertStep = this.laneHeight;

    if (e.key === 'ArrowUp') {
      this.player.y -= vertStep;
      // reached (or passed) the top safe zone
      if (this.player.y < 0) {
        // success: wrap to bottom, +10 points
        this.player.y = ch - this.player.h - 10;
        this.score += 10;
        this.onScoreUpdate(this.score);
      }
    } else if (e.key === 'ArrowDown') {
      this.player.y = Math.min(ch - this.player.h - 10, this.player.y + vertStep);
    } else if (e.key === 'ArrowLeft') {
      this.player.x = Math.max(this.sidePadding, this.player.x - horizStep);
    } else if (e.key === 'ArrowRight') {
      this.player.x = Math.min(cw - this.player.w - this.sidePadding, this.player.x + horizStep);
    }
  };

  private update(dt: number) {
    if (this.over) return;

    // move cars & wrap
    const cw = this.canvas.width;
    for (const car of this.cars) {
      car.x += car.speed * dt;
      if (car.speed > 0 && car.x > cw + 80) car.x = -80;
      if (car.speed < 0 && car.x < -80) car.x = cw + 80;
    }

    // collision (only when inside traffic rows)
    const inTrafficBand =
      this.player.y >= this.laneHeight - this.player.h && // just above first safe row
      this.player.y <= (this.lanes - 1) * this.laneHeight;

    if (inTrafficBand) {
      const px1 = this.player.x;
      const py1 = this.player.y;
      const px2 = px1 + this.player.w;
      const py2 = py1 + this.player.h;

      for (const car of this.cars) {
        const cx1 = car.x;
        const cy1 = car.y;
        const cx2 = cx1 + car.w;
        const cy2 = cy1 + car.h;

        if (px1 < cx2 && px2 > cx1 && py1 < cy2 && py2 > cy1) {
          this.end();
          return;
        }
      }
    }
  }

  private end() {
    this.over = true;
    this.stopLoop();
    this.onScoreUpdate(this.score, true);
  }

  // ---- rendering (dark gamer look) ----
  private draw(_dt: number) {
    const { ctx, canvas, laneHeight, lanes } = this;

    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0b1020');
    grad.addColorStop(1, '#0a0f1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // top/bottom safe zones
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, laneHeight);
    ctx.fillRect(0, (lanes - 1) * laneHeight, canvas.width, laneHeight);

    // traffic lanes
    for (let i = 1; i < lanes - 1; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#0f172a' : '#111827';
      ctx.fillRect(0, i * laneHeight, canvas.width, laneHeight);
    }

    // lane dividers (dashed)
    ctx.setLineDash([12, 10]);
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.65)'; // golden
    ctx.lineWidth = 2;
    for (let i = 1; i < lanes; i++) {
      ctx.beginPath();
      ctx.moveTo(this.sidePadding, i * laneHeight + 0.5);
      ctx.lineTo(canvas.width - this.sidePadding, i * laneHeight + 0.5);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // cars (blue glow)
    for (const car of this.cars) {
      ctx.fillStyle = '#3b82f6';
      ctx.shadowColor = 'rgba(59,130,246,0.6)';
      ctx.shadowBlur = 12;
      ctx.fillRect(car.x, car.y, car.w, car.h);
    }
    ctx.shadowBlur = 0;

    // player (frog) — neon green
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = 'rgba(34,197,94,0.7)';
    ctx.shadowBlur = 12;
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.shadowBlur = 0;
  }
}
