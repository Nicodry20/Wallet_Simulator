import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Email no registrado' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.status(200).json({ token });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
