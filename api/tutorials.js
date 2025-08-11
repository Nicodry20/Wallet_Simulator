const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM tutorials ORDER BY category');
  res.json(result.rows);
});

module.exports = router;
