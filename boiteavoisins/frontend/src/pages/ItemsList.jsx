import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_URL } from '../api/client';
import { useAuth } from '../AuthContext';

export default function ItemsList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [onlyMyNeighborhood, setOnlyMyNeighborhood] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (category) params.category = category;
      if (onlyMyNeighborhood && user) params.neighborhood = user.neighborhood;

      const res = await api.get('/api/items', { params });
      setItems(res.data);
    } catch (err) {
      setError('Impossible de charger les objets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, onlyMyNeighborhood]);

  return (
    <div style={styles.container}>
      <h1>Objets disponibles</h1>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Filtrer par catégorie (ex: bricolage)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.input}
        />
        {user && (
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={onlyMyNeighborhood}
              onChange={(e) => setOnlyMyNeighborhood(e.target.checked)}
            />
            Mon quartier uniquement ({user.neighborhood})
          </label>
        )}
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && items.length === 0 && <p>Aucun objet trouvé.</p>}

      <div style={styles.grid}>
        {items.map((item) => (
          <Link to={`/items/${item.id}`} key={item.id} style={styles.card}>
            {item.photo_url && (
              <img
                src={`${API_URL}${item.photo_url}`}
                alt={item.title}
                style={styles.image}
              />
            )}
            <h3>{item.title}</h3>
            <p style={styles.meta}>
              {item.category || 'Sans catégorie'} · {item.neighborhood}
            </p>
            <p style={styles.meta}>
              Proposé par {item.owner_name} ·{' '}
              <span style={{ color: item.available ? 'green' : 'red' }}>
                {item.available ? 'Disponible' : 'Indisponible'}
              </span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '24px' },
  filters: { display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' },
  input: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '200px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '6px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '12px',
    textDecoration: 'none',
    color: '#222',
    background: '#fff',
  },
  image: { width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' },
  meta: { fontSize: '0.85rem', color: '#666' },
};
