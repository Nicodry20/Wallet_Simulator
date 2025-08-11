// server.js
const express = require('express');
const pingDbRouter = require('./routes/pingDb'); // ajustá el path si lo pusiste en otra carpeta

const app = express();
app.use(express.json());

// Rutas
app.use('/api', pingDbRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
