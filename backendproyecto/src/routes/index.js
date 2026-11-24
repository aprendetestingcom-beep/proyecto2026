'use strict';

const { Router } = require('express');

const administradorRoutes = require('./administrador.routes');
const authRoutes = require('./auth.routes');
const clientesRoutes = require('./clientes.routes');
const estadisticasRoutes = require('./estadisticas.routes');
const personalRoutes = require('./personal.routes');
const serviciosRoutes = require('./servicios.routes');

const router = Router();

router.use('/administrador', administradorRoutes);
router.use('/auth', authRoutes);
router.use('/clientes', clientesRoutes);
router.use('/estadisticas', estadisticasRoutes);
router.use('/personal', personalRoutes);
router.use('/servicios', serviciosRoutes);

module.exports = router;
