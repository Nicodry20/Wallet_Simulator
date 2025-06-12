import express from 'express';
import pool from './db.js';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());

const authenticate = (req, res, next) => {
  req.user = { id: 1 }; // simulado para test
  next();
};

app.get('/', (req, res) => {
  res.send('🚀 API de Wallet funcionando correctamente!');
});

app.get('/api/profile', authenticate, async (req, res) => {
  const result = await pool.query('SELECT name, email, balance FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(result.rows[0]);
});

app.get('/api/balance', authenticate, async (req, res) => {
  const result = await pool.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length > 0) {
    res.json({ balance: result.rows[0].balance });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});

app.post('/api/transfer', authenticate, async (req, res) => {
  const { receiver_id, amount } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !amount || amount <= 0) return res.status(400).json({ error: 'Datos inválidos' });

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
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/transactions', authenticate, async (req, res) => {
  const result = await pool.query(
    `SELECT t.id, t.amount, t.sender_id, t.receiver_id, t.created_at,
            u1.name AS sender_name, u2.name AS receiver_name
     FROM transactions t
     LEFT JOIN users u1 ON t.sender_id = u1.id
     LEFT JOIN users u2 ON t.receiver_id = u2.id
     WHERE t.sender_id = $1 OR t.receiver_id = $1
     ORDER BY t.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

app.get('/api/contacts', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT contact_id, alias FROM contacts WHERE owner_id = $1',
    [req.user.id]
  );
  res.json(result.rows);
});

app.post('/api/contacts', authenticate, async (req, res) => {
  const { contact_id, alias } = req.body;
  if (!contact_id || !alias) return res.status(400).json({ error: 'Faltan datos' });

  await pool.query(
    'INSERT INTO contacts (owner_id, contact_id, alias) VALUES ($1, $2, $3)',
    [req.user.id, contact_id, alias]
  );
  res.json({ message: 'Contacto agregado' });
});

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en puerto ${port}`);
});

import loginHandler from './api/login.js';
app.post('/login', loginHandler);
