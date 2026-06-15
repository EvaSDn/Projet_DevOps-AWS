import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function NewItem() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      if (photo) formData.append('photo', photo);

      const res = await api.post('/api/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/items/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Proposer un objet</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label>
          Titre *
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={styles.input}
          />
        </label>
        <label>
          Catégorie
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="ex: bricolage, jardinage, livres..."
            style={styles.input}
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={styles.input}
          />
        </label>
        <label>
          Photo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            style={styles.input}
          />
        </label>
        <button type="submit" disabled={loading} style={styles.submit}>
          {loading ? 'Création...' : 'Publier'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '24px' },
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
