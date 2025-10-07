import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore – even if server fails, clear local auth
    } finally {
      logout();
      navigate('/');
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>🎮 Gaming Platform</Link>

        <div style={styles.links}>
          <Link to="/games" style={styles.link}>Games</Link>

          {user ? (
            <>
              <Link to="/profile" style={styles.link}>Profile</Link>
              <button onClick={handleLogout} style={styles.button}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.link}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: { background: '#1a1a1a', padding: '1rem 0', color: 'white' },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2rem',
  },
  logo: { fontSize: '1.5rem', fontWeight: 'bold', color: 'white', textDecoration: 'none' },
  links: { display: 'flex', gap: '1.5rem', alignItems: 'center' },
  link: { color: 'white', textDecoration: 'none' },
  button: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
