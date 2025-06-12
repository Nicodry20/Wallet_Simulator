import pool from '../db.js';
import auth from './auth.js';

export default async function handler(req, res) {
  await new Promise(resolve => auth(req, res, resolve));
  const userId = req.user.id;

  if (req.method === 'GET') {
    const result = await pool.query(
      'SELECT contact_id, alias FROM contacts WHERE owner_id = $1',
      [userId]
    );
    return res.json(result.rows);
  }

  if (req.method === 'POST') {
    const { contact_id, alias } = req.body;
    if (!contact_id || !alias) return res.status(400).json({ error: 'Faltan datos' });

    await pool.query(
      'INSERT INTO contacts (owner_id, contact_id, alias) VALUES ($1, $2, $3)',
      [userId, contact_id, alias]
    );
    return res.status(201).json({ message: 'Contacto agregado' });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
