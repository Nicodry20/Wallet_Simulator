// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PG_USER,         // postgres
  host: process.env.PG_HOST,         // localhost
  database: process.env.PG_DATABASE, // wallet_db
  password: process.env.PG_PASSWORD, // 1199khma
  port: process.env.PG_PORT,         // 5432
});

// Comprobación de conexión (opcional)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('Conexión a PostgreSQL establecida:', res.rows[0]);
  }
});

module.exports = pool;
