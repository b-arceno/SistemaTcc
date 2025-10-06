const express = require('express');
const router = express.Router();
const db = require('../config/database');


router.get('/', async (req, res) => {
    try {
        const [produtos] = await db.query('SELECT * FROM produtos LIMIT 6');
        produtos.forEach(p => p.preco = Number(p.preco)); // garante que preco seja number

        res.render('loja/index', { produtos });
    } catch (err) {
        console.error('Erro ao carregar página da loja:', err);
        res.status(500).send('Erro ao carregar loja.');
    }
});

router.get('/produtos', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [produtos] = await db.query('SELECT * FROM produtos LIMIT ? OFFSET ?', [limit, offset]);
        produtos.forEach(p => p.preco = Number(p.preco));

        res.render('loja/produtos', { produtos, page, categoriaId: null });
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        res.status(500).send('Erro ao carregar produtos.');
    }
});

router.get('/categorias/:id', async (req, res) => {
    try {
        const categoriaId = parseInt(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [produtos] = await db.query(
            'SELECT * FROM produtos WHERE categoria_id = ? LIMIT ? OFFSET ?',
            [categoriaId, limit, offset]
        );
        produtos.forEach(p => p.preco = Number(p.preco));

        res.render('loja/produtos', { produtos, page, categoriaId });
    } catch (err) {
        console.error('Erro ao carregar produtos por categoria:', err);
        res.status(500).send('Erro ao carregar produtos por categoria.');
    }
});

router.get('/produtos/:id', async (req, res) => {
    try {
        const produtoId = parseInt(req.params.id);
        const [produtos] = await db.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);

        if (produtos.length === 0) return res.status(404).send('Produto não encontrado');

        const produto = produtos[0];
        produto.preco = Number(produto.preco);

        res.render('loja/detalhes', { produto });
    } catch (err) {
        console.error('Erro ao carregar detalhes do produto:', err);
        res.status(500).send('Erro ao carregar detalhes do produto.');
    }
});

router.get('/categorias', async (req, res) => {
    try {
        const [categorias] = await db.query('SELECT * FROM categoria_produto');
        res.render('loja/categorias', { categorias });
    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        res.status(500).send('Erro ao carregar categorias.');
    }
});

router.get('/carrinho', (req, res) => {
    const carrinho = req.session.carrinho || [];
    let total = 0;
    carrinho.forEach(item => total += (item.preco || 0) * (item.quantidade || 0));

    res.render('loja/carrinho', { carrinho, total });
});

router.post('/carrinho/adicionar', async (req, res) => {
    const { produtoId, quantidade } = req.body;
    const qtd = parseInt(quantidade) || 1;

    try {
        const [produtos] = await db.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
        if (produtos.length === 0) return res.status(404).send('Produto não encontrado');

        const produto = produtos[0];
        produto.preco = Number(produto.preco);

        if (!req.session.carrinho) req.session.carrinho = [];

        const index = req.session.carrinho.findIndex(item => item.id === produto.id);
        if (index >= 0) {
            req.session.carrinho[index].quantidade += qtd;
        } else {
            req.session.carrinho.push({ ...produto, quantidade: qtd });
        }

        res.redirect('/loja/carrinho');
    } catch (err) {
        console.error('Erro ao adicionar produto:', err);
        res.status(500).send('Erro ao adicionar produto ao carrinho.');
    }
});

router.post('/carrinho/remover/:id', (req, res) => {
    const produtoId = parseInt(req.params.id);
    if (!req.session.carrinho) req.session.carrinho = [];

    req.session.carrinho = req.session.carrinho.filter(item => item.id !== produtoId);
    res.redirect('/loja/carrinho');
});

router.get('/checkout', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');

    const carrinho = req.session.carrinho || [];
    if (carrinho.length === 0) return res.redirect('/loja/carrinho');

    let total = 0;
    carrinho.forEach(item => total += (item.preco || 0) * (item.quantidade || 0));

    res.render('loja/checkout', { usuario: req.session.usuario, carrinho, total });
});

router.post('/checkout', async (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');

    const usuarioId = req.session.usuario.id;
    const carrinho = req.session.carrinho || [];
    if (carrinho.length === 0) return res.redirect('/loja/carrinho');

    const { nome, endereco, pagamento } = req.body;

    try {
        let total = 0;
        carrinho.forEach(item => total += (item.preco || 0) * (item.quantidade || 0));

        const [pedidoResult] = await db.query(
            'INSERT INTO pedidos (usuario_id, data_pedido, status_pedido_id, status_pagamento_id, forma_pagamento_id, nome_cliente, endereco) VALUES (?, NOW(), 1, 1, ?, ?, ?)',
            [usuarioId, pagamento === 'pix' ? 2 : pagamento === 'cartao' ? 3 : 1, nome, endereco, total]
        );

        const pedidoId = pedidoResult.insertId;

        for (let item of carrinho) {
            await db.query(
                'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
                [pedidoId, item.id, item.quantidade, item.preco]
            );
        }

        req.session.carrinho = [];
        res.redirect('/loja/pedidos');
    } catch (err) {
        console.error('Erro ao finalizar pedido:', err);
        res.status(500).send('Erro ao finalizar pedido.');
    }
});

router.get('/pedidos', async (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');

    try {
        const [pedidos] = await db.query(
            `SELECT p.id, p.data_pedido, sp.descricao AS status, p.total
             FROM pedidos p
             JOIN status_pedido sp ON p.status_pedido_id = sp.id
             WHERE p.usuario_id = ?
             ORDER BY p.data_pedido DESC`,
            [req.session.usuario.id]
        );
        res.render('loja/pedidos', { pedidos });
    } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
        res.status(500).send('Erro ao carregar pedidos.');
    }
});

module.exports = router;
