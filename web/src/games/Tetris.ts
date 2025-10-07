// web/src/games/Tetris.ts
type Matrix = number[][];
const SHAPES: Matrix[] = [
  [[1,1,1,1]],                // I
  [[1,1],[1,1]],              // O
  [[0,1,0],[1,1,1]],          // T
  [[0,1,1],[1,1,0]],          // S
  [[1,1,0],[0,1,1]],          // Z
  [[1,0,0],[1,1,1]],          // J
  [[0,0,1],[1,1,1]],          // L
];
const COLORS = ['#22c55e','#f59e0b','#38bdf8','#f43f5e','#a78bfa','#f97316','#14b8a6'];

export class Tetris {
  private readonly COLS = 10;
  private readonly ROWS = 20;
  private readonly CELL = 24;           // smaller panel size
  private board: number[][] = [];
  private cur?: { m: Matrix; x: number; y: number; c: string };
  private next?: { m: Matrix; c: string };
  private score = 0;
  private over = false;

  private rafId: number | null = null;
  private last = 0;
  private acc = 0;
  private step = 500;                   // ms per drop; tweak for difficulty

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private onScoreUpdate: (score: number, over?: boolean) => void
  ) {
    this.canvas.width = this.CELL * this.COLS;    // 240
    this.canvas.height = this.CELL * this.ROWS;   // 480
    this.resetInternal();
  }

  // ---- GameHost API ----
  start() {
    window.addEventListener('keydown', this.key);
    this.stopLoop();
    this.last = performance.now();
    this.acc = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }
  stop() {
    window.removeEventListener('keydown', this.key);
    this.stopLoop();
  }
  reset() {
    this.stop();
    this.resetInternal();
    this.onScoreUpdate(0);
    this.start();
  }
  isGameOver() { return this.over; }
  getScore() { return this.score; }

  // ---- internals ----
  private resetInternal() {
    this.board = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(0));
    this.score = 0;
    this.over = false;
    this.spawn();
    this.draw();
  }
  private stopLoop() { if (this.rafId) cancelAnimationFrame(this.rafId); this.rafId = null; }

  private randPiece() {
    const i = Math.floor(Math.random() * SHAPES.length);
    const m = SHAPES[i].map(r => r.slice());
    const c = COLORS[i % COLORS.length];
    return { m, c };
  }
  private spawn() {
    const p = this.next ?? this.randPiece();
    this.next = this.randPiece();
    this.cur = { m: p.m, x: Math.floor(this.COLS/2) - Math.ceil(p.m[0].length/2), y: 0, c: p.c };
    if (this.collide(this.cur.m, this.cur.x, this.cur.y)) this.end();
  }
  private end() {
    this.over = true;
    this.stopLoop();
    this.onScoreUpdate(this.score, true);      // 🔔 notify GameHost
  }

  private rotate(m: Matrix): Matrix {
    const R = m.length, C = m[0].length;
    const out = Array.from({ length: C }, () => Array(R).fill(0));
    for (let r=0;r<R;r++) for (let c=0;c<C;c++) out[c][R-1-r] = m[r][c];
    return out;
  }
  private collide(m: Matrix, x: number, y: number): boolean {
    for (let r=0;r<m.length;r++) for (let c=0;c<m[r].length;c++) {
      if (!m[r][c]) continue;
      const nx = x + c, ny = y + r;
      if (nx < 0 || nx >= this.COLS || ny >= this.ROWS) return true;
      if (ny >= 0 && this.board[ny][nx]) return true;
    }
    return false;
  }
  private merge() {
    const { m, x, y, c } = this.cur!;
    const colorIndex = COLORS.indexOf(c) + 1;   // store color id (1..7)
    for (let r=0;r<m.length;r++) for (let cc=0;cc<m[r].length;cc++) {
      if (!m[r][cc]) continue;
      const ny = y + r, nx = x + cc;
      if (ny >= 0) this.board[ny][nx] = colorIndex;
    }
  }
  private clearLines() {
    let cleared = 0;
    for (let r=this.ROWS-1;r>=0;r--) {
      if (this.board[r].every(v => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(Array(this.COLS).fill(0));
        cleared++; r++;
      }
    }
    if (cleared) {
      this.score += cleared * 100;
      this.onScoreUpdate(this.score);
    }
  }

  private drop() {
    if (!this.cur) return;
    if (!this.collide(this.cur.m, this.cur.x, this.cur.y + 1)) {
      this.cur.y++;
    } else {
      this.merge();
      this.clearLines();
      this.spawn();
    }
  }

  private loop = (t: number) => {
    const dt = t - this.last; this.last = t;
    this.acc += dt;
    while (this.acc >= this.step && !this.over) { this.drop(); this.acc -= this.step; }
    this.draw();
    if (!this.over) this.rafId = requestAnimationFrame(this.loop);
  };

  private key = (e: KeyboardEvent) => {
    if (this.over || !this.cur) return;
    const { m, x, y } = this.cur;
    if (e.key === 'ArrowLeft' && !this.collide(m, x-1, y)) this.cur.x--;
    else if (e.key === 'ArrowRight' && !this.collide(m, x+1, y)) this.cur.x++;
    else if (e.key === 'ArrowDown' && !this.collide(m, x, y+1)) this.cur.y++;
    else if (e.key === 'ArrowUp') {
      const rot = this.rotate(m);
      if (!this.collide(rot, x, y)) this.cur.m = rot;
    } else if (e.key === ' ') { // hard drop
      while (!this.collide(this.cur.m, this.cur.x, this.cur.y + 1)) this.cur.y++;
      this.drop();
    }
  };

  // ---- rendering (dark + neat) ----
  private draw() {
    const { ctx, CELL, COLS, ROWS } = this;

    // background gradient
    const g = ctx.createLinearGradient(0,0,0,this.canvas.height);
    g.addColorStop(0,'#0b1020'); g.addColorStop(1,'#0a0f1a');
    ctx.fillStyle = g; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    // subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let x=0;x<=COLS;x++){ ctx.beginPath(); ctx.moveTo(x*CELL+.5,0); ctx.lineTo(x*CELL+.5,ROWS*CELL); ctx.stroke(); }
    for (let y=0;y<=ROWS;y++){ ctx.beginPath(); ctx.moveTo(0,y*CELL+.5); ctx.lineTo(COLS*CELL,y*CELL+.5); ctx.stroke(); }

    // board blocks
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
      const v = this.board[r][c]; if (!v) continue;
      this.drawCell(c, r, COLORS[v-1]);
    }

    // current piece
    if (this.cur) {
      for (let r=0;r<this.cur.m.length;r++) for (let c=0;c<this.cur.m[r].length;c++) {
        if (!this.cur.m[r][c]) continue;
        this.drawCell(this.cur.x + c, this.cur.y + r, this.cur.c);
      }
    }
  }

  private drawCell(cx: number, cy: number, color: string) {
    const { ctx, CELL } = this;
    const x = cx * CELL, y = cy * CELL;
    ctx.fillStyle = color;
    ctx.shadowColor = color + 'aa';
    ctx.shadowBlur = 12;
    ctx.fillRect(x+1, y+1, CELL-2, CELL-2);
    ctx.shadowBlur = 0;
  }
}
