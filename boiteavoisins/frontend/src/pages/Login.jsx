import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
        </label>
        <label>
          Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
        </label>
        <button type="submit" disabled={loading} style={styles.submit}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p>
        Pas encore de compte ? <Link to="/register">S'inscrire</Link>
      </p>
    </div>
  );
}

const styles = {
  container: { maxWidth: '400px', margin: '40px auto', padding: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  input: { display: 'block', marginTop: '4px', padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
  submit: {
    background: '#2f6f4f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px',
    cursor: 'pointer',
  },
};
