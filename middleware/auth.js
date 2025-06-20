import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export default function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contiene { id }
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido' });
  }
}
