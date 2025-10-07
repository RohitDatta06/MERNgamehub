import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import type { AxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type LoginResponse = {
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
  accessToken: string;
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      loginSchema.parse({ email, password });

      const { data } = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      setAuth(data.user, data.accessToken);
      navigate('/games');
    } catch (err: unknown) {
      // Prefer Zod error message if validation failed
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? 'Invalid input');
        return;
      }
      // Axios error from server
      const ax = err as AxiosError<any>;
      const msg =
        (ax.response?.data?.error?.message as string | undefined) ||
        (ax.response?.data?.message as string | undefined) ||
        ax.message ||
        'Login failed';
      setError(msg);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Login</h1>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="email"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoComplete="current-password"
          required
        />

        <button type="submit" style={styles.button}>Login</button>

        <div style={styles.link}>
          Don&apos;t have an account?{' '}
          <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '400px', margin: '4rem auto', padding: '0 2rem' },
  form: { background: '#f8f9fa', padding: '2rem', borderRadius: '8px' },
  title: { marginBottom: '1.5rem', textAlign: 'center' },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    background: '#3498db',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  error: {
    background: '#e74c3c',
    color: 'white',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  link: { textAlign: 'center', marginTop: '1rem' },
};
