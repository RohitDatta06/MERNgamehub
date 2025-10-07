import { Link } from 'react-router-dom';

const games = [
  { slug: 'snake', title: 'Snake', emoji: '🐍', description: 'Classic snake game' },
  { slug: 'tetris', title: 'Tetris', emoji: '🧱', description: 'Stack blocks and clear lines' },
  { slug: 'flappy-bird', title: 'Flappy Bird', emoji: '🐦', description: 'Fly through pipes' },
  { slug: 'minesweeper', title: 'Minesweeper', emoji: '💣', description: 'Clear the minefield' },
  { slug: 'cross-the-road', title: 'Cross The Road', emoji: '🐔', description: 'Avoid traffic' },
  { slug: 'pong', title: 'Pong', emoji: '🏓', description: 'Classic paddle game' },
];

export default function Games() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Choose Your Game</h1>

      <div style={styles.grid}>
        {games.map((game) => (
          <Link key={game.slug} to={`/games/${game.slug}`} style={styles.card}>
            <div style={styles.emoji}>{game.emoji}</div>
            <h2>{game.title}</h2>
            <p style={styles.description}>{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' },
  title: { fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '2rem',
  },
  card: {
    background: '#f8f9fa',
    padding: '2rem',
    borderRadius: '8px',
    textAlign: 'center',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  },
  emoji: { fontSize: '4rem', marginBottom: '1rem' },
  description: { color: '#7f8c8d', marginTop: '0.5rem' },
};
