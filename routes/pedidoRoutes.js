const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Rotas para pedido
router.get('/', pedidoController.listar);
router.post('/', pedidoController.criar);
router.get('/:id', pedidoController.buscarPorId);
router.put('/:id', pedidoController.atualizar);
router.delete('/:id', pedidoController.deletar);

module.exports = router;
