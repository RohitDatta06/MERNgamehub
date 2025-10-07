import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Arcade MERN — Play & Compete</h1>

      <p style={styles.subtitle}>
        A full-stack MERN arcade with JWT login, Mongo-backed leaderboards, and six classic games.
        Built with React + TypeScript (Vite), Express, MongoDB, and Render.
      </p>

      <div style={styles.features}>
        {/* 1) Project description: features + tech stack */}
        <div style={styles.feature}>
          <h2>🧩 About the Project</h2>
          <p>
            Six classic games (Snake, Tetris, Flappy Bird, Minesweeper, Cross The Road, Pong) with
            per-game leaderboards and personal stats. A REST API stores scores in MongoDB, and JWT
            auth keeps your session lightweight and fast.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            <strong>Tech stack:</strong> React + TypeScript (Vite), Zustand, React Router, Express,
            Zod, Mongoose, JWT, MongoDB Atlas, hosted on Render.
          </p>
        </div>

        {/* 2) How to use */}
        <div style={styles.feature}>
          <h2>🚀 How to Use</h2>
          <p style={{ marginBottom: '0.5rem' }}>Quick start :</p>
          <ol style={{ textAlign: 'left', margin: '0 auto', maxWidth: 420, lineHeight: 1.6 }}>
            <li>Go to <strong>Register</strong> and create an account.</li>
            <li>
              Use <em>any</em> email — email verification is disabled to make trying it out easy.
            </li>
            <li>Log in and open <strong>Games</strong>.</li>
            <li>Pick a title and play. The HUD shows your live score.</li>
            <li>Hit <strong>Submit Score</strong> to save it to the leaderboard.</li>
            <li>Check your <strong>Profile</strong> for best scores and totals.</li>
          </ol>
        </div>

      
       
      </div>

      <Link to="/games" style={styles.button}>Start Playing</Link>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  title: { fontSize: '3rem', marginBottom: '1rem', color: '#2c3e50' },
  subtitle: { fontSize: '1.25rem', color: '#7f8c8d', marginBottom: '3rem' },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
  },
  feature: {
    background: '#f8f9fa',
    padding: '2rem',
    borderRadius: '8px',
  },
  button: {
    display: 'inline-block',
    background: '#3498db',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '1.1rem',
  },
};
