const express = require('express');
const pool = require('../db'); // ajustá el path si pusiste db.js en otra carpeta

const router = express.Router();

router.get('/ping-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    console.error('❌ Error al conectar con la DB:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
