const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
const express = require('express');
const pool = require('./db'); // o el path correcto
const app = express();

app.get('/ping-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`✅ Conectado a la DB: ${result.rows[0].now}`);
  } catch (err) {
    console.error('❌ Error al conectar con la DB:', err);
    res.status(500).send('Error al conectar con la base de datos');
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor escuchando en el puerto 3000');
});
