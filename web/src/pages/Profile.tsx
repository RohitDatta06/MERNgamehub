import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

type ScoreStat = {
  _id: string;          // game slug, e.g. "snake"
  bestScore: number;
  totalPlays: number;
};

type StatsResponse = { stats: ScoreStat[] };

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ScoreStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<StatsResponse>('/scores/stats/me');
        if (alive) setStats(data.stats ?? []);
      } catch {
        if (alive) setStats([]);
        // optional: toast/log
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const initial =
    user?.username?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?';

  const titleCase = (s: string) =>
    s.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Profile</h1>

      <section style={styles.userCard}>
        <div style={styles.avatar}>{initial}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>
            {user?.username}
          </div>
          <div style={styles.email}>{user?.email}</div>
        </div>
      </section>

      <h2 style={styles.subtitle}>Your Stats</h2>

      {loading ? (
        <p style={styles.empty}>Loading…</p>
      ) : stats.length === 0 ? (
        <p style={styles.empty}>
          No games played yet. Start playing to see your stats!
        </p>
      ) : (
        <div style={styles.statsGrid}>
          {stats.map((stat) => (
            <div key={stat._id} style={styles.statCard}>
              <div style={{ fontWeight: 600 }}>{titleCase(stat._id)}</div>
              <div style={styles.bestScore}>Best Score: {stat.bestScore}</div>
              <div style={styles.plays}>Total Plays: {stat.totalPlays}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' },
  title: { fontSize: '2.5rem', marginBottom: '2rem' },
  userCard: {
    background: '#f8f9fa',
    padding: '2rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#3498db',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  email: { color: '#7f8c8d' },
  subtitle: { fontSize: '1.75rem', marginBottom: '1.5rem' },
  empty: { color: '#7f8c8d', fontStyle: 'italic' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  statCard: { background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' },
  bestScore: { color: '#27ae60', fontWeight: 'bold', marginTop: '0.5rem' },
  plays: { color: '#7f8c8d', marginTop: '0.25rem' },
};
