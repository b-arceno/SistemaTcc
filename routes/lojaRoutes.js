const express = require('express');
const router = express.Router();
const lojaController = require('../controllers/lojaController');


// Página inicial da loja
router.get('/', lojaController.categorias);

// Produtos de uma categoria
router.get('/categoria/:id', lojaController.produtosPorCategoria);

// Detalhes do produto
router.get('/produto/:id', lojaController.detalhesProduto);

//carrinho
router.get('/carrinho', lojaController.verCarrinho);
router.post('/carrinho/adicionar', lojaController.adicionarAoCarrinho);
router.post('/carrinho/remover', lojaController.removerDoCarrinho);
router.post('/carrinho/atualizar', lojaController.atualizarCarrinho);
router.get('/checkout', lojaController.checkout);
router.post('/finalizar', lojaController.finalizarPedido);
router.get('/pedidos', lojaController.meusPedidos);


module.exports = router;
