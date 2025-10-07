import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import Leaderboard from '../components/Leaderboard';
import { Snake } from '../games/Snake';
import { Tetris } from '../games/Tetris';
import { FlappyBird } from '../games/FlappyBird';
import { Minesweeper } from '../games/MineSweeper';
import { CrossTheRoad } from '../games/CrossTheRoad';
import { Pong } from '../games/Pong';

type ScoreCallback = (score: number, isOver?: boolean) => void;

interface GameAPI {
  start(): void;
  stop(): void;
  reset(): void;
  isGameOver?(): boolean;
}

type GameCtor = new (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  onScoreUpdate: ScoreCallback
) => GameAPI;

const titleCase = (s: string) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export default function GameHost() {
  const { slug } = useParams<{ slug: string }>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameAPI | null>(null);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lbRefresh, setLbRefresh] = useState(0);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const user = useAuthStore((s) => s.user);

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!canvasRef.current || !slug) return;

    setScore(0);
    setGameOver(false);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameMap: Partial<Record<string, GameCtor>> = {
      snake: Snake,
      tetris: Tetris,
      'flappy-bird': FlappyBird,
      minesweeper: Minesweeper,
      'cross-the-road': CrossTheRoad,
      pong: Pong,
    };

    const GameClass = gameMap[slug];
    if (!GameClass) return;

    const onScoreUpdate: ScoreCallback = (s, over) => {
      setScore(s);
      if (over || gameRef.current?.isGameOver?.()) {
        setGameOver(true);
      }
    };

    const gameInstance = new GameClass(canvas, ctx, onScoreUpdate);
    gameRef.current = gameInstance;
    gameInstance.start();

    return () => {
      try {
        gameRef.current?.stop();
      } finally {
        gameRef.current = null;
      }
    };
  }, [slug]);

  const handleRestart = () => {
    gameRef.current?.reset();
    setScore(0);
    setGameOver(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      setToast({ text: 'Please login to submit scores', type: 'error' });
      return;
    }
    if (!slug) return;
    try {
      await api.post(`/scores/${slug}`, { value: score });
      setLbRefresh((x) => x + 1);
      setToast({ text: 'Score submitted successfully!', type: 'success' });
    } catch {
      setToast({ text: 'Failed to submit score', type: 'error' });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.gameArea}>
        <div style={styles.hud}>
          <h1 style={styles.title}>{slug ? titleCase(slug) : 'Game'}</h1>
          <div style={styles.hudRight}>
            <div style={styles.score}>Score: {score}</div>
            <button onClick={handleRestart} style={styles.button}>
              Restart
            </button>
            {gameOver && user && (
              <button onClick={handleSubmit} style={styles.submitButton}>
                Submit Score
              </button>
            )}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          style={styles.canvas}
        />

        {gameOver && (
          <div style={styles.gameOverBanner}>
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
          </div>
        )}
      </div>

      {slug && <Leaderboard key={`${slug}-${lbRefresh}`} gameSlug={slug} />}

      {/* ✅ custom toast message */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' },
  gameArea: {
    position: 'relative',
    background: '#0b1020',
    padding: '1rem',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  },
  hud: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    color: '#e5e7eb',
  },
  hudRight: { display: 'flex', gap: '1rem', alignItems: 'center' },
  title: { fontSize: '1.75rem', fontWeight: 600 },
  score: { fontSize: '1.25rem', fontWeight: 'bold' },
  button: {
    background: '#2563eb',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  submitButton: {
    background: '#22c55e',
    color: '#0a0f1a',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  canvas: {
    border: '2px solid #1f2937',
    borderRadius: '12px',
    display: 'block',
    margin: '0 auto',
    boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
  },
  gameOverBanner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(10, 15, 26, 0.95)',
    color: 'white',
    padding: '2rem 3rem',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
  },
  toast: {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
    fontWeight: 600,
    zIndex: 9999,
    transition: 'opacity 0.3s ease',
  },
};
