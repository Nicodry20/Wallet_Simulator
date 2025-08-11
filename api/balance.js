const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, async (req, res) => {
  const result = await pool.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ balance: result.rows[0].balance });
});

module.exports = router;
