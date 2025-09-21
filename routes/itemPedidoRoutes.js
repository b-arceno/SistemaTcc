const express = require('express');
const router = express.Router();
const itemPedidoController = require('../controllers/itemPedidoController');

// Rotas para itens do pedido
router.get('/', itemPedidoController.listar);
router.post('/', itemPedidoController.criar);
router.get('/:id', itemPedidoController.buscarPorId);
router.put('/:id', itemPedidoController.atualizar);
router.delete('/:id', itemPedidoController.deletar);

module.exports = router;
