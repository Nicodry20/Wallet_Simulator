const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, async (req, res) => {
  const result = await pool.query('SELECT name, email, balance FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(result.rows[0]);
});

router.put('/', authenticate, async (req, res) => {
  const { name, email } = req.body;
  try {
    await pool.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, req.user.id]);
    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo actualizar el perfil' });
  }
});

module.exports = router;
