import pool from './db.js';
import auth from './auth.js';

export default async function handler(req, res) {
  await new Promise(resolve => auth(req, res, resolve));
  const { to, amount } = req.body;

  if (amount <= 0 || to === req.user.id) return res.status(400).json({ error: 'Monto o receptor inválido' });

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    const sender = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
    if (sender.rows[0].balance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const receiver = await client.query('SELECT id FROM users WHERE id = $1', [to]);
    if (receiver.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario receptor no existe' });
    }

    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, to]);
    await client.query(
      'INSERT INTO transactions (sender_id, recipient_id, amount, date) VALUES ($1, $2, $3, NOW())',
      [req.user.id, to, amount]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Transferencia exitosa' });
  } catch {
    res.status(500).json({ error: 'No se pudo completar la transferencia' });
  }
}
