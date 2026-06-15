import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>📦 BoiteAVoisins</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Objets</Link>
        {user ? (
          <>
            <Link to="/items/new" style={styles.link}>Proposer un objet</Link>
            <Link to="/reservations" style={styles.link}>Mes réservations</Link>
            <span style={styles.user}>👤 {user.name} ({user.neighborhood})</span>
            <button onClick={handleLogout} style={styles.button}>Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Connexion</Link>
            <Link to="/register" style={styles.link}>Inscription</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    background: '#2f6f4f',
    color: 'white',
    flexWrap: 'wrap',
  },
  logo: { color: 'white', fontSize: '1.3rem', fontWeight: 'bold', textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  link: { color: 'white', textDecoration: 'none' },
  user: { fontSize: '0.9rem' },
  button: {
    background: 'white',
    color: '#2f6f4f',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
  },
};
