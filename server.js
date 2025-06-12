const express = require('express');
const pool = require('./db');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const authenticate = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());

app.get('/', (req, res) => {
  res.send('🚀 API de Wallet Simulator funcionando correctamente!');
});

// Registro
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hash]);
    res.json({ message: 'Usuario registrado' });
  } catch (error) {
    console.error('🔥 Error en registro:', error);
    res.status(500).json({ error: 'Error en el registro' });
  }
});


// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('🔥 Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
  }
});


// Perfil
app.get('/api/profile', authenticate, async (req, res) => {
  const result = await pool.query('SELECT name, email, balance FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(result.rows[0]);
});

// Balance
app.get('/api/balance', authenticate, async (req, res) => {
  const result = await pool.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ balance: result.rows[0].balance });
});

// Transferencia
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
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Historial
app.get('/api/transactions', authenticate, async (req, res) => {
  const result = await pool.query(
    `SELECT
      t.id, t.amount, t.sender_id, t.receiver_id, t.created_at,
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

// Contactos
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

// Recarga
app.post('/api/recharge', authenticate, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' });

  await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
  await pool.query('INSERT INTO transactions (sender_id, receiver_id, amount) VALUES ($1, NULL, $2)', [req.user.id, amount]);
  res.json({ message: 'Recarga de transporte registrada' });
});

// Pago de impuestos
app.post('/api/pay-tax', authenticate, async (req, res) => {
  const { concept, amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' });

  await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
  await pool.query('INSERT INTO transactions (sender_id, receiver_id, amount) VALUES ($1, NULL, $2)', [req.user.id, amount]);
  res.json({ message: `Pago de ${concept} registrado` });
});

// Notificaciones
app.post('/api/notifications', authenticate, async (req, res) => {
  const { message } = req.body;
  await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [req.user.id, message]);
  res.json({ message: 'Notificación guardada' });
});

app.get('/api/notifications', authenticate, async (req, res) => {
  const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
