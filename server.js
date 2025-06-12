import express from 'express';
import pool from './db.js';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticate from './auth.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());

app.get('/', (req, res) => {
  res.send('🚀 API de Wallet funcionando correctamente!');
});

/* 🔐 Registro */
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Faltan datos' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, balance) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, 0]
    );
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error) {
    console.error('Error al registrar:', error.message);
    res.status(500).json({ error: 'Registro fallido' });
  }
});

/* 🔑 Login */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Email no registrado' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Login fallido' });
  }
});

/* 👤 Perfil */
app.get('/profile', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT name, email, balance FROM users WHERE id = $1',
    [req.user.id]
  );
  if (result.rows.length === 0)
    return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(result.rows[0]);
});

/* 💰 Recarga */
app.post('/recharge', authenticate, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0)
    return res.status(400).json({ error: 'Monto inválido' });

  try {
    await pool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [amount, req.user.id]
    );
    res.json({ message: 'Saldo recargado con éxito' });
  } catch {
    res.status(500).json({ error: 'Error al recargar' });
  }
});

/* 💸 Transferencia */
app.post('/transfer', authenticate, async (req, res) => {
  const { to, amount } = req.body;
  const sender_id = req.user.id;

  if (!to || !amount || amount <= 0)
    return res.status(400).json({ error: 'Datos inválidos' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sender = await client.query('SELECT balance FROM users WHERE id = $1', [sender_id]);
    if (sender.rows.length === 0) throw new Error('Remitente no encontrado');
    if (sender.rows[0].balance < amount) throw new Error('Saldo insuficiente');

    const receiver = await client.query('SELECT id FROM users WHERE id = $1', [to]);
    if (receiver.rows.length === 0) throw new Error('Receptor no encontrado');

    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, sender_id]);
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, to]);
    await client.query(
      'INSERT INTO transactions (sender_id, receiver_id, amount, created_at) VALUES ($1, $2, $3, NOW())',
      [sender_id, to, amount]
    );

    await client.query('COMMIT');
    res.json({ message: 'Transferencia exitosa' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

/* 📜 Transacciones */
app.get('/transactions', authenticate, async (req, res) => {
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

/* 📇 Contactos */
app.get('/contacts', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT contact_id, alias FROM contacts WHERE owner_id = $1',
    [req.user.id]
  );
  res.json(result.rows);
});

app.post('/contacts', authenticate, async (req, res) => {
  const { contact_id, alias } = req.body;
  if (!contact_id || !alias)
    return res.status(400).json({ error: 'Faltan datos' });

  await pool.query(
    'INSERT INTO contacts (owner_id, contact_id, alias) VALUES ($1, $2, $3)',
    [req.user.id, contact_id, alias]
  );
  res.json({ message: 'Contacto agregado' });
});

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en puerto ${port}`);
});
