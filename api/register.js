import pool from '../db.js';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  const { name, email, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, balance) VALUES ($1, $2, $3, $4)',
      [name, email, hash, 0]
    );
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar' });
  }
}
