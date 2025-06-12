import pool from '../db.js';
import auth from './middleware/auth.js';

export default async function handler(req, res) {
  await new Promise((resolve, reject) => auth(req, res, resolve));

  try {
    const result = await pool.query(
      'SELECT id, name, email, balance FROM users WHERE id = $1',
      [req.user.id]
    );
    res.status(200).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'No se pudo obtener el perfil' });
  }
}