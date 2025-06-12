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

app.post('/api/transfer', authenticate, async (req, res) => {
  const { receiver_id, amount } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sender = await client.query('SELECT balance FROM users WHERE id = $1', [sender_id]);
    if (sender.rows.length === 0) throw new Error('Remitente no encontrado');
    if (sender.rows[0].balance < amount) throw new Error('Saldo insuficiente');

    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, sender_id]);
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, receiver_id]);
    await client.query('INSERT INTO transactions (sender_id, receiver_id, amount) VALUES ($1, $2, $3)', [sender_id, receiver_id, amount]);

    await client.query('COMMIT');
    res.json({ message: 'Transferencia exitosa' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en transferencia:', error.message);
    res.status(500).json({ error: 'Error al transferir' });
  } finally {
    client.release();
  }
});

app.get('/api/contacts', authenticate, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query('SELECT contact_id, alias FROM contacts WHERE owner_id = $1', [userId]);
  res.json(result.rows);
});

app.post('/api/contacts', authenticate, async (req, res) => {
  const owner_id = req.user.id;
  const { contact_id, alias } = req.body;

  if (!contact_id || !alias) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  await pool.query('INSERT INTO contacts (owner_id, contact_id, alias) VALUES ($1, $2, $3)', [owner_id, contact_id, alias]);
  res.json({ message: 'Contacto agregado' });
});

app.get('/api/contacts', authenticate, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query('SELECT contact_id, alias FROM contacts WHERE owner_id = $1', [userId]);
  res.json(result.rows);
});

app.post('/api/contacts', authenticate, async (req, res) => {
  const owner_id = req.user.id;
  const { contact_id, alias } = req.body;

  if (!contact_id || !alias) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  await pool.query('INSERT INTO contacts (owner_id, contact_id, alias) VALUES ($1, $2, $3)', [owner_id, contact_id, alias]);
  res.json({ message: 'Contacto agregado' });
});

app.get('/api/profile', authenticate, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query('SELECT name, email, balance FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json(result.rows[0]);
});
