import pool from '../db.js';
import auth from './middleware/auth.js';

export default async function handler(req, res) {
  await new Promise((resolve, reject) => auth(req, res, resolve));
  const { amount } = req.body;

  if (amount <= 0) return res.status(400).json({ error: 'Monto inválido' });

  try {
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, req.user.id]);
    res.status(200).json({ message: 'Saldo recargado con éxito' });
  } catch {
    res.status(500).json({ error: 'No se pudo recargar' });
  }
}
