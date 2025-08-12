const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test de conexión inicial
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conectado a PostgreSQL");
    client.release(); // Liberar la conexión
  } catch (err) {
    console.error("❌ Error al conectar a PostgreSQL:", err.message);
  }
})();

module.exports = pool;
