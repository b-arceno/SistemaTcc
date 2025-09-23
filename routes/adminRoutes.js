const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAdmin } = require('../middlewares/auth');

router.get('/', isAdmin, async (req, res) => {
    res.render('admin/dashboard', { usuario: req.session.usuario });
});

// CATEGORIAS
router.get('/categorias', isAdmin, async (req, res) => {
    const [categorias] = await db.query('SELECT * FROM categoria_produto');
    res.render('admin/categorias', { categorias });
});

router.post('/categorias', isAdmin, async (req, res) => {
    const { nome } = req.body;
    if (!nome) return res.status(400).send('Nome é obrigatório');
    await db.query('INSERT INTO categoria_produto (nome) VALUES (?)', [nome]);
    res.redirect('/admin/categorias');
});

router.post('/categorias/editar/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    await db.query('UPDATE categoria_produto SET nome=? WHERE id=?', [nome, id]);
    res.redirect('/admin/categorias');
});

router.get('/categorias/deletar/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM categoria_produto WHERE id=?', [id]);
    res.redirect('/admin/categorias');
});

// PRODUTOS
router.get('/produtos', isAdmin, async (req, res) => {
    const [produtos] = await db.query(`
        SELECT p.*, c.nome AS categoria_nome
        FROM produtos p
        JOIN categoria_produto c ON p.categoria_id = c.id
    `);
    const [categorias] = await db.query('SELECT * FROM categoria_produto');
    res.render('admin/produtos', { produtos, categorias });
});

router.post('/produtos', isAdmin, async (req, res) => {
    const { nome, preco, categoria_id } = req.body;
    if (!nome || !preco || !categoria_id) return res.status(400).send('Todos os campos são obrigatórios');
    await db.query('INSERT INTO produtos (nome, preco, categoria_id) VALUES (?,?,?)', [nome, preco, categoria_id]);
    res.redirect('/admin/produtos');
});

router.post('/produtos/editar/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nome, preco, categoria_id } = req.body;
    await db.query('UPDATE produtos SET nome=?, preco=?, categoria_id=? WHERE id=?', [nome, preco, categoria_id, id]);
    res.redirect('/admin/produtos');
});

router.get('/produtos/deletar/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM produtos WHERE id=?', [id]);
    res.redirect('/admin/produtos');
});

// PEDIDOS
router.get('/pedidos', isAdmin, async (req, res) => {
    const [pedidos] = await db.query(`
        SELECT p.id, u.nome AS cliente, p.data_pedido, sp.descricao AS status, fp.descricao AS forma_pagamento
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN status_pedido sp ON p.status_pedido_id = sp.id
        JOIN forma_pagamento fp ON p.forma_pagamento_id = fp.id
        ORDER BY p.data_pedido DESC
    `);
    res.render('admin/pedidos', { pedidos });
});

router.post('/pedidos/atualizar-status/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    await db.query('UPDATE pedidos SET status_pedido_id=? WHERE id=?', [status, id]);
    res.redirect('/admin/pedidos');
});

// RELATÓRIOS
router.get('/relatorios', isAdmin, async (req, res) => {
    const [vendas] = await db.query('SELECT DATE(data_pedido) AS data, SUM(total) AS total_vendas FROM pedidos GROUP BY DATE(data_pedido) ORDER BY DATE(data_pedido) DESC');
    const [status] = await db.query('SELECT status_pedido_id, COUNT(*) AS total FROM pedidos GROUP BY status_pedido_id');
    res.render('admin/relatorios', { vendas, status });
});

module.exports = router;
