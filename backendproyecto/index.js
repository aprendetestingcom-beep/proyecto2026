'use strict';

require('dotenv').config();

const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = Number(process.env.PORT) || 3000;

(async () => {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`[api] Servidor escuchando en http://localhost:${PORT}`);
  });
})();
