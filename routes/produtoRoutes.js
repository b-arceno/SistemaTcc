const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Rotas para produto
router.get('/', produtoController.listar);
router.post('/', produtoController.criar);
router.get('/:id', produtoController.buscarPorId);
router.put('/:id', produtoController.atualizar);
router.delete('/:id', produtoController.deletar);

module.exports = router;
