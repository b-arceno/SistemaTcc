const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// -------------------- DASHBOARD --------------------
router.get('/', adminController.dashboard);

// -------------------- PRODUTOS --------------------
router.get('/produtos', adminController.listarProdutos);
router.get('/produtos/novo', adminController.formProduto);
router.post('/produtos/novo', adminController.criarProduto);
router.get('/produtos/editar/:id', adminController.formEditarProduto);
router.post('/produtos/editar/:id', adminController.editarProduto);
router.post('/produtos/deletar/:id', adminController.deletarProduto);

// -------------------- CATEGORIAS --------------------
router.get('/categorias', adminController.listarCategorias);
router.get('/categorias/novo', adminController.formCategoria);
router.post('/categorias/novo', adminController.criarCategoria);
router.get('/categorias/editar/:id', adminController.formEditarCategoria);
router.post('/categorias/editar/:id', adminController.editarCategoria);
router.post('/categorias/deletar/:id', adminController.deletarCategoria);

// -------------------- PEDIDOS --------------------
router.get('/pedidos', adminController.listarPedidos);
router.get('/pedidos/:id', adminController.verPedido);

// -------------------- RELATÓRIOS --------------------
router.get('/relatorios', adminController.gerarRelatorios);

module.exports = router;
