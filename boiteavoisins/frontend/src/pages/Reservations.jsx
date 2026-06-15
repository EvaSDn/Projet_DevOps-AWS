import { useEffect, useState } from 'react';
import api from '../api/client';

const statusLabels = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  completed: 'Terminée',
};

const statusColors = {
  pending: '#e67e22',
  accepted: '#27ae60',
  rejected: '#c0392b',
  completed: '#7f8c8d',
};

export default function Reservations() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [sentRes, receivedRes] = await Promise.all([
        api.get('/api/reservations/mine'),
        api.get('/api/reservations/received'),
      ]);
      setSent(sentRes.data);
      setReceived(receivedRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des réservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/reservations/${id}`, { status });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    }
  };

  if (loading) return <p style={styles.container}>Chargement...</p>;

  return (
    <div style={styles.container}>
      <h1>Mes réservations</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Demandes envoyées</h2>
      {sent.length === 0 && <p>Aucune demande envoyée.</p>}
      <ul style={styles.list}>
        {sent.map((r) => (
          <li key={r.id} style={styles.item}>
            <strong>{r.item_title}</strong> — du {r.start_date.slice(0, 10)} au {r.end_date.slice(0, 10)}
            {' '}
            <span style={{ color: statusColors[r.status], fontWeight: 'bold' }}>
              {statusLabels[r.status]}
            </span>
            {r.status === 'accepted' && (
              <button onClick={() => updateStatus(r.id, 'completed')} style={styles.actionButton}>
                Marquer comme terminée
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2>Demandes reçues sur mes objets</h2>
      {received.length === 0 && <p>Aucune demande reçue.</p>}
      <ul style={styles.list}>
        {received.map((r) => (
          <li key={r.id} style={styles.item}>
            <strong>{r.item_title}</strong> — demandé par {r.requester_name} du {r.start_date.slice(0, 10)} au {r.end_date.slice(0, 10)}
            {' '}
            <span style={{ color: statusColors[r.status], fontWeight: 'bold' }}>
              {statusLabels[r.status]}
            </span>
            {r.status === 'pending' && (
              <>
                <button onClick={() => updateStatus(r.id, 'accepted')} style={styles.actionButton}>Accepter</button>
                <button onClick={() => updateStatus(r.id, 'rejected')} style={styles.rejectButton}>Refuser</button>
              </>
            )}
            {r.status === 'accepted' && (
              <button onClick={() => updateStatus(r.id, 'completed')} style={styles.actionButton}>
                Marquer comme terminée
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '24px' },
  list: { listStyle: 'none', padding: 0 },
  item: { padding: '10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  actionButton: {
    background: '#2f6f4f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
  },
  rejectButton: {
    background: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
  },
};
