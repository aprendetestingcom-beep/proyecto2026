'use strict';

const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const RESOURCES = {
  administrador: '/api/administrador',
  auth: '/api/auth',
  clientes: '/api/clientes',
  estadisticas: '/api/estadisticas',
  personal: '/api/personal',
  servicios: '/api/servicios'
};

app.get('/', (req, res) => {
  res.json({
    name: 'API de servicios de limpieza para hoteles',
    version: '1.0.0',
    endpoints: RESOURCES
  });
});

app.get('/api', (req, res) => {
  res.json({ endpoints: RESOURCES });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
