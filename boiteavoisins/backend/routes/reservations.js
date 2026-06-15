const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { item_id, start_date, end_date } = req.body;

  if (!item_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'item_id, start_date et end_date sont requis' });
  }

  try {
    const item = await pool.query('SELECT * FROM items WHERE id = $1', [item_id]);
    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }
    if (item.rows[0].owner_id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas réserver votre propre objet' });
    }

    const result = await pool.query(
      `INSERT INTO reservations (item_id, requester_id, start_date, end_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [item_id, req.user.id, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT reservations.*, items.title AS item_title, items.photo_url
       FROM reservations JOIN items ON reservations.item_id = items.id
       WHERE reservations.requester_id = $1
       ORDER BY reservations.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/received', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT reservations.*, items.title AS item_title, users.name AS requester_name
       FROM reservations
       JOIN items ON reservations.item_id = items.id
       JOIN users ON reservations.requester_id = users.id
       WHERE items.owner_id = $1
       ORDER BY reservations.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const allowed = ['accepted', 'rejected', 'completed'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status doit être l'un de : ${allowed.join(', ')}` });
  }

  try {
    const reservation = await pool.query(
      `SELECT reservations.*, items.owner_id
       FROM reservations JOIN items ON reservations.item_id = items.id
       WHERE reservations.id = $1`,
      [req.params.id]
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    const resa = reservation.rows[0];

    if ((status === 'accepted' || status === 'rejected') && resa.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }
    if (status === 'completed' && resa.owner_id !== req.user.id && resa.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    const result = await pool.query(
      `UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
