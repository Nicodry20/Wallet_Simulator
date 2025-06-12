const express = require('express');
const pool = require('./db');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());

const authenticate = (req, res, next) => {
  req.user = { id: 1 };
  next();
};

app.get('/api/balance', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
      res.json({ balance: result.rows[0].balance });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

app.get('/', (req, res) => {
  res.send('🚀 API de Wallet Simulator funcionando correctamente!');
});
