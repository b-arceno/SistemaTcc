const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.listar);
router.post('/', clienteController.criar);
router.get('/:id', clienteController.buscarPorId);
router.put('/:id', clienteController.atualizar);
router.delete('/:id', clienteController.deletar);

module.exports = router;
