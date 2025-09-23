const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware para proteger rotas de admin
function isAdmin(req, res, next) {
    if (req.session.usuario && req.session.usuario.tipo_usuario_id === 1) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Dashboard
router.get('/', isAdmin, (req, res) => {
    db.query('SELECT * FROM pedidos', (err, pedidos) => {
        if (err) throw err;
        res.render('dashboard', { pedidos });
    });
});

// Listar produtos
router.get('/produtos', isAdmin, (req, res) => {
    db.query('SELECT * FROM produtos', (err, produtos) => {
        if (err) throw err;
        res.render('produtos', { produtos });
    });
});

// Adicionar produto
router.post('/produtos/adicionar', isAdmin, (req, res) => {
    const { nome, descricao, preco, categoria_id } = req.body;
    db.query(
        'INSERT INTO produtos (nome, descricao, preco, categoria_id) VALUES (?, ?, ?, ?)',
        [nome, descricao, preco, categoria_id],
        (err) => {
            if (err) throw err;
            res.redirect('/loja/produtos');
        }
    );
});

// Editar produto
router.post('/produtos/editar/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, categoria_id } = req.body;

    db.query(
        'UPDATE produtos SET nome=?, descricao=?, preco=?, categoria_id=? WHERE id=?',
        [nome, descricao, preco, categoria_id, id],
        (err) => {
            if (err) throw err;
            res.redirect('/loja/produtos');
        }
    );
});

// Deletar produto
router.get('/produtos/deletar/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM produtos WHERE id=?', [id], (err) => {
        if (err) throw err;
        res.redirect('/loja/produtos');
    });
});

// Pedidos
router.get('/pedidos', isAdmin, (req, res) => {
    db.query(
        `SELECT pedidos.id, usuarios.nome AS cliente, pedidos.data_pedido, status_pedido.descricao AS status
        FROM pedidos
        JOIN usuarios ON pedidos.usuario_id = usuarios.id
        JOIN status_pedido ON pedidos.status_pedido_id = status_pedido.id`,
        (err, pedidos) => {
            if (err) throw err;
            res.render('pedidos', { pedidos });
        }
    );
});

module.exports = router;
