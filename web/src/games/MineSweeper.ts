type Cell = {
  mine: boolean;
  open: boolean;
  flag: boolean;
  count: number;
};

export class Minesweeper {
  private COLS = 12;
  private ROWS = 10;
  private CELL = 32;
  private MINES = 18;

  private grid: Cell[][] = [];
  private firstClick = true;
  private over = false;
  private won = false;
  private score = 0;

  private onLeft = (e: MouseEvent) => this.handleLeftClick(e);
  private onRight = (e: MouseEvent) => this.handleRightClick(e);
  private preventMenu = (e: MouseEvent) => e.preventDefault();

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private onScoreUpdate: (score: number, over?: boolean) => void
  ) {
    this.canvas.width = this.CELL * this.COLS;
    this.canvas.height = this.CELL * this.ROWS;
    this.resetInternal();
  }

  start() {
    this.canvas.addEventListener("click", this.onLeft);
    this.canvas.addEventListener("contextmenu", this.preventMenu);
    this.canvas.addEventListener("mousedown", this.onRight);
    this.draw();
  }

  stop() {
    this.canvas.removeEventListener("click", this.onLeft);
    this.canvas.removeEventListener("contextmenu", this.preventMenu);
    this.canvas.removeEventListener("mousedown", this.onRight);
  }

  reset() {
    this.stop();
    this.resetInternal();
    this.onScoreUpdate(0);
    this.start();
  }

  isGameOver() {
    return this.over || this.won;
  }

  getScore() {
    return this.score;
  }

  private resetInternal() {
    this.grid = Array.from({ length: this.ROWS }, () =>
      Array.from({ length: this.COLS }, (): Cell => ({
        mine: false,
        open: false,
        flag: false,
        count: 0,
      }))
    );
    this.firstClick = true;
    this.over = false;
    this.won = false;
    this.score = 0;
    this.draw();
  }

  private placeMinesSafe(avoidR: number, avoidC: number) {
    let placed = 0;
    while (placed < this.MINES) {
      const r = Math.floor(Math.random() * this.ROWS);
      const c = Math.floor(Math.random() * this.COLS);
      const dr = Math.abs(r - avoidR);
      const dc = Math.abs(c - avoidC);
      const inSafe3x3 = dr <= 1 && dc <= 1;

      if (!inSafe3x3 && !this.grid[r][c].mine) {
        this.grid[r][c].mine = true;
        placed++;
      }
    }

    const dirs = [-1, 0, 1];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c].mine) continue;
        let cnt = 0;
        for (const dy of dirs) {
          for (const dx of dirs) {
            if (dx === 0 && dy === 0) continue;
            const nr = r + dy,
              nc = c + dx;
            if (
              nr >= 0 &&
              nr < this.ROWS &&
              nc >= 0 &&
              nc < this.COLS &&
              this.grid[nr][nc].mine
            ) {
              cnt++;
            }
          }
        }
        this.grid[r][c].count = cnt;
      }
    }
  }

  private handleLeftClick(e: MouseEvent) {
    if (this.over || this.won) return;
    const { row, col } = this.xyToCell(e);
    if (row < 0) return;

    if (this.firstClick) {
      this.placeMinesSafe(row, col);
      this.firstClick = false;
    }

    this.openCell(row, col);
    this.checkWin();
    this.draw();
  }

  private handleRightClick(e: MouseEvent) {
    if (e.button !== 2) return;
    if (this.over || this.won) return;

    const { row, col } = this.xyToCell(e);
    if (row < 0) return;

    const cell = this.grid[row][col];
    if (!cell.open) {
      cell.flag = !cell.flag;
      this.draw();
    }
  }

  private xyToCell(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / this.CELL);
    const row = Math.floor(y / this.CELL);
    if (
      row < 0 ||
      row >= this.ROWS ||
      col < 0 ||
      col >= this.COLS
    ) {
      return { row: -1, col: -1 };
    }
    return { row, col };
  }

  private openCell(r: number, c: number) {
    const cell = this.grid[r][c];
    if (cell.open || cell.flag) return;

    cell.open = true;

    if (cell.mine) {
      this.over = true;
      for (let rr = 0; rr < this.ROWS; rr++) {
        for (let cc = 0; cc < this.COLS; cc++) {
          if (this.grid[rr][cc].mine)
            this.grid[rr][cc].open = true;
        }
      }
      this.onScoreUpdate(this.score, true);
      return;
    }

    this.score += 10;
    this.onScoreUpdate(this.score);

    if (cell.count === 0) {
      const dirs = [-1, 0, 1];
      for (const dy of dirs) {
        for (const dx of dirs) {
          if (dx === 0 && dy === 0) continue;
          const nr = r + dy,
            nc = c + dx;
          if (
            nr >= 0 &&
            nr < this.ROWS &&
            nc >= 0 &&
            nc < this.COLS
          ) {
            if (
              !this.grid[nr][nc].open &&
              !this.grid[nr][nc].mine
            ) {
              this.openCell(nr, nc);
            }
          }
        }
      }
    }
  }

  private checkWin() {
    let opened = 0,
      safes = this.ROWS * this.COLS - this.MINES;
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (
          this.grid[r][c].open &&
          !this.grid[r][c].mine
        )
          opened++;
      }
    }
    if (opened >= safes) {
      this.won = true;
      this.onScoreUpdate(this.score, true);
    }
  }

  // ------------------- RENDERING -------------------
  private draw() {
    const { ctx, canvas, CELL } = this;

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#0b1020");
    grad.addColorStop(1, "#0a0f1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const cell = this.grid[r][c];
        const x = c * CELL;
        const y = r * CELL;

        if (cell.open) {
          if (cell.mine) {
            ctx.fillStyle = "#7f1d1d";
            this.roundRect(x + 1, y + 1, CELL - 2, CELL - 2, 6, true);
          } else if (cell.count === 0) {
            const g = ctx.createLinearGradient(0, y, 0, y + CELL);
            g.addColorStop(0, "#1e293b");
            g.addColorStop(1, "#162036");
            ctx.fillStyle = g;
            this.roundRect(x + 1, y + 1, CELL - 2, CELL - 2, 6, true);
            this.insetTile(x + 1, y + 1, CELL - 2, CELL - 2);
            this.microHatch(x, y, CELL);
          } else {
            ctx.fillStyle = "#111827";
            this.roundRect(x + 1, y + 1, CELL - 2, CELL - 2, 6, true);
          }
        } else {
          ctx.fillStyle = "#0f172a";
          this.roundRect(x + 1, y + 1, CELL - 2, CELL - 2, 6, true);
        }

        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);

        if (cell.open) {
          if (cell.mine) {
            ctx.fillStyle = "#ef4444";
            ctx.shadowColor = "rgba(239,68,68,0.7)";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(
              x + CELL / 2,
              y + CELL / 2,
              CELL * 0.22,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (cell.count > 0) {
            ctx.fillStyle = this.numColor(cell.count);
            ctx.font =
              "bold 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              String(cell.count),
              x + CELL / 2,
              y + CELL / 2 + 1
            );
          }
        } else if (cell.flag) {
          ctx.font = "18px ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#eab308";
          ctx.shadowColor = "rgba(234,179,8,0.6)";
          ctx.shadowBlur = 8;
          ctx.fillText("⚑", x + CELL / 2, y + CELL / 2 + 1);
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  private roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill = true
  ) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
  }

  private insetTile(x: number, y: number, w: number, h: number) {
    const { ctx } = this;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + w - 2, y + 2);
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + 2, y + h - 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(x + 2, y + h - 2);
    ctx.lineTo(x + w - 2, y + h - 2);
    ctx.moveTo(x + w - 2, y + 2);
    ctx.lineTo(x + w - 2, y + h - 2);
    ctx.stroke();
  }

  private microHatch(x: number, y: number, size: number) {
    const { ctx } = this;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let yy = y + 7; yy < y + size - 6; yy += 8) {
      for (let xx = x + 7; xx < x + size - 6; xx += 8) {
        ctx.fillRect(xx, yy, 1, 1);
      }
    }
  }

  private numColor(n: number) {
    switch (n) {
      case 1:
        return "#60a5fa";
      case 2:
        return "#34d399";
      case 3:
        return "#f87171";
      case 4:
        return "#a78bfa";
      case 5:
        return "#fbbf24";
      case 6:
        return "#10b981";
      case 7:
        return "#f472b6";
      default:
        return "#f59e0b";
    }
  }
}
