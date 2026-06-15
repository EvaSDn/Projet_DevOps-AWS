import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, neighborhood);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Inscription</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label>
          Nom
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
        </label>
        <label>
          Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
        </label>
        <label>
          Quartier / Immeuble
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="ex: 75011 ou Résidence Les Tilleuls"
            required
            style={styles.input}
          />
        </label>
        <button type="submit" disabled={loading} style={styles.submit}>
          {loading ? 'Création...' : "S'inscrire"}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
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
