import pool from '../db.js';
import auth from './auth.js';

export default async function handler(req, res) {
  await new Promise(resolve => auth(req, res, resolve));

  const result = await pool.query(
    `SELECT
      t.id,
      t.amount,
      t.sender_id,
      t.recipient_id,
      t.date,
      u1.name AS sender_name,
      u2.name AS recipient_name
     FROM transactions t
     LEFT JOIN users u1 ON t.sender_id = u1.id
     LEFT JOIN users u2 ON t.recipient_id = u2.id
     WHERE t.sender_id = $1 OR t.recipient_id = $1
     ORDER BY t.date DESC`,
    [req.user.id]
  );

  res.json(result.rows);
}
