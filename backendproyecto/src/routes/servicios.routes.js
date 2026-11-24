'use strict';

const { Router } = require('express');
const controller = require('../controllers/servicios.controller');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.replace);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
