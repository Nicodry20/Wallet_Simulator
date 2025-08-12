const express = require('express');
const pingDbRouter = require('./routes/pingDb');

const app = express();
app.use(express.json());

app.use('/api', pingDbRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
app.use('/ping-db', require('./routes/ping'));

