// server.js
const express = require('express');
const https = require('https');
const fs = require('fs');
const pool = require('./db');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de HTTPS: lee la llave y el certificado
const httpsOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

app.use(express.json());
app.use(helmet());

// Middleware de autenticación (dummy)
// Simula que el usuario autenticado siempre tiene el id = 1.
const authenticate = (req, res, next) => {
  req.user = { id: 1 };
  next();
};

// Endpoint que envía el saldo disponible del usuario
app.get('/api/balance', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
      res.json({ balance: result.rows[0].balance });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crea el servidor HTTPS
https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`Servidor HTTPS ejecutándose en el puerto ${port}`);
});
