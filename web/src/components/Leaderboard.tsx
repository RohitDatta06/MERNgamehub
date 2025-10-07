import { useEffect, useState } from 'react';
import api from '../api/axios';

type LeaderboardProps = {
  gameSlug: string;
};

// shape is flexible to tolerate different backends:
// prefer `user.username`, fall back to `userId.username`, then `userName`
type ScoreRow = {
  value: number;
  user?: { username?: string } | null;
  userId?: { username?: string } | string | null;
  userName?: string;
};

export default function Leaderboard({ gameSlug }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ scores: ScoreRow[] }>(
          `/scores/${gameSlug}/leaderboard?limit=10`
        );
        if (alive) setScores(data?.scores ?? []);
      } catch {
        if (alive) setScores([]);
        // optional: toast/log
        // console.error('Failed to fetch leaderboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [gameSlug]);

  const nameOf = (row: ScoreRow): string => {
    if (typeof row.userId === 'string') return row.userId;
    return (
      row.user?.username ||
      (typeof row.userId === 'object' && row.userId?.username) ||
      row.userName ||
      'Anonymous'
    );
  };

  return (
    <section style={styles.container}>
      <h2>🏆 Leaderboard</h2>

      {loading ? (
        <p style={styles.empty}>Loading…</p>
      ) : scores.length === 0 ? (
        <p style={styles.empty}>No scores yet!</p>
      ) : (
        <ol style={styles.list}>
          {scores.map((row, idx) => (
            <li key={idx} style={styles.item}>
              <span style={styles.rank}>#{idx + 1}</span>
              <span style={styles.username}>{nameOf(row)}</span>
              <span style={styles.score}>{row.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginTop: '2rem',
  },
  empty: { color: '#666', fontStyle: 'italic' },
  list: { listStyle: 'none', padding: 0, marginTop: '0.75rem' },
  item: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    background: 'white',
    marginBottom: '0.5rem',
    borderRadius: '4px',
  },
  rank: { fontWeight: 'bold', color: '#3498db', minWidth: 40, textAlign: 'left' },
  username: { flex: 1 },
  score: { fontWeight: 'bold', color: '#27ae60' },
};
