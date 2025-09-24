const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Página inicial da loja
router.get('/', (req, res) => {
    db.query('SELECT * FROM produtos', (err, produtos) => {
        if (err) throw err;
        res.render('loja/index', { produtos });
    });
});

// Listar categorias
router.get('/categorias', (req, res) => {
    db.query('SELECT * FROM categoria_produto', (err, categorias) => {
        if (err) throw err;
        res.render('loja/categorias', { categorias });
    });
});

// Listar todos os produtos (rota /loja/produtos)
router.get('/produtos', (req, res) => {
    db.query('SELECT * FROM produtos', (err, produtos) => {
        if (err) throw err;
        res.render('loja/produtos', { produtos });
    });
});

// Carrinho
router.get('/carrinho', (req, res) => {
    res.render('loja/carrinho', { carrinho: req.session.carrinho || [] });
});

// Checkout
router.get('/checkout', (req, res) => {
    res.render('loja/checkout', { usuario: req.session.usuario });
});

// Pedidos do cliente
router.get('/pedidos', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');

    db.query(
        `SELECT p.id, p.data_pedido, sp.descricao AS status, p.total
         FROM pedidos p
         JOIN status_pedido sp ON p.status_pedido_id = sp.id
         WHERE p.usuario_id=?`,
        [req.session.usuario.id],
        (err, pedidos) => {
            if (err) throw err;
            res.render('loja/pedidos', { pedidos });
        }
    );
});

module.exports = router;
