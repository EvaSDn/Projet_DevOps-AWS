const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `item-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  const { neighborhood, category } = req.query;
  let query = 'SELECT items.*, users.name AS owner_name FROM items JOIN users ON items.owner_id = users.id WHERE 1=1';
  const params = [];

  if (neighborhood) {
    params.push(neighborhood);
    query += ` AND items.neighborhood = $${params.length}`;
  }
  if (category) {
    params.push(category);
    query += ` AND items.category = $${params.length}`;
  }

  query += ' ORDER BY items.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT items.*, users.name AS owner_name, users.email AS owner_email
       FROM items JOIN users ON items.owner_id = users.id
       WHERE items.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
  const { title, description, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Le titre est requis' });
  }

  const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO items (owner_id, title, description, photo_url, category, neighborhood)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title, description || null, photoUrl, category || null, req.user.neighborhood]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', authMiddleware, upload.single('photo'), async (req, res) => {
  const { title, description, category, available } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }
    if (existing.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : existing.rows[0].photo_url;

    const result = await pool.query(
      `UPDATE items SET title = $1, description = $2, category = $3, available = $4, photo_url = $5
       WHERE id = $6 RETURNING *`,
      [
        title || existing.rows[0].title,
        description ?? existing.rows[0].description,
        category ?? existing.rows[0].category,
        available !== undefined ? available === 'true' || available === true : existing.rows[0].available,
        photoUrl,
        req.params.id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }
    if (existing.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Objet supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
