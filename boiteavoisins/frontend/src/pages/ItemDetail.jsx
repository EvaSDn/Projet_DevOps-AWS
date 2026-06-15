import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_URL } from '../api/client';
import { useAuth } from '../AuthContext';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItem = async () => {
    try {
      const res = await api.get(`/api/items/${id}`);
      setItem(res.data);
    } catch (err) {
      setError('Objet non trouvé.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReserve = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/api/reservations', {
        item_id: item.id,
        start_date: startDate,
        end_date: endDate,
      });
      setMessage('Demande de réservation envoyée !');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réservation.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cet objet ?')) return;
    try {
      await api.delete(`/api/items/${item.id}`);
      navigate('/');
    } catch (err) {
      setError('Erreur lors de la suppression.');
    }
  };

  if (loading) return <p style={styles.container}>Chargement...</p>;
  if (error && !item) return <p style={{ ...styles.container, color: 'red' }}>{error}</p>;

  const isOwner = user && item.owner_id === user.id;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.back}>← Retour</button>

      {item.photo_url && (
        <img src={`${API_URL}${item.photo_url}`} alt={item.title} style={styles.image} />
      )}

      <h1>{item.title}</h1>
      <p style={styles.meta}>
        {item.category || 'Sans catégorie'} · {item.neighborhood}
      </p>
      <p>{item.description}</p>
      <p style={styles.meta}>
        Proposé par {item.owner_name} ({item.owner_email})
      </p>
      <p>
        Statut :{' '}
        <span style={{ color: item.available ? 'green' : 'red' }}>
          {item.available ? 'Disponible' : 'Indisponible'}
        </span>
      </p>

      {isOwner && (
        <div style={styles.ownerActions}>
          <button onClick={handleDelete} style={styles.deleteButton}>Supprimer cet objet</button>
        </div>
      )}

      {!isOwner && (
        <form onSubmit={handleReserve} style={styles.form}>
          <h3>Réserver cet objet</h3>
          <label>
            Du :
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={styles.input}
            />
          </label>
          <label>
            Au :
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={styles.input}
            />
          </label>
          <button type="submit" style={styles.submit}>Demander la réservation</button>
          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '24px' },
  back: { marginBottom: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#2f6f4f' },
  image: { width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' },
  meta: { color: '#666' },
  form: { marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' },
  input: { display: 'block', marginTop: '4px', padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' },
  submit: {
    background: '#2f6f4f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px',
    cursor: 'pointer',
  },
  ownerActions: { marginTop: '16px' },
  deleteButton: {
    background: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
  },
};
