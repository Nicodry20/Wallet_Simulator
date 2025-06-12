import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: { rejectUnauthorized: false },
});

// Prueba de conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.stack);
  } else {
    console.log('✅ Conexión a PostgreSQL exitosa:', res.rows[0]);
  }
});

export default pool;
