const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// GET /relatorios/vendas?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
router.get('/vendas', relatorioController.vendasPorPeriodo);

// GET /relatorios/pedidos-cliente/:clienteId
router.get('/pedidos-cliente/:clienteId', relatorioController.pedidosPorCliente);

module.exports = router;
