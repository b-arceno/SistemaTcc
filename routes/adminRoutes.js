const express = require('express');
const router = express.Router();
const db = require('../config/database'); // já é o .promise()

// Middleware para proteger rotas de admin
function isAdmin(req, res, next) {
    if (req.session.usuario && req.session.usuario.tipo_usuario_id === 1) {
        next();
    } else {
        res.redirect('/login');
    }
}

// -------------------------
// DASHBOARD
// -------------------------
router.get('/', isAdmin, (req, res) => {
    res.render('admin/dashboard', { usuario: req.session.usuario });
});

// -------------------------
// CRUD CATEGORIAS
// -------------------------

// Listar categorias
router.get('/categorias', isAdmin, async (req, res) => {
    try {
        const editarId = req.query.editar;
        const [categorias] = await db.query('SELECT * FROM categoria_produto');

        let categoriaParaEditar = null;
        if (editarId) {
            categoriaParaEditar = categorias.find(c => c.id == editarId);
        }

        res.render('admin/categorias', { categorias, categoriaParaEditar });
    } catch (err) {
        console.error(err);
        res.send('Erro ao buscar categorias.');
    }
});

// Adicionar categoria
router.post('/categorias', isAdmin, async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).send('Nome é obrigatório');
        await db.query('INSERT INTO categoria_produto (nome) VALUES (?)', [nome]);
        res.redirect('/admin/categorias');
    } catch (err) {
        console.error(err);
        res.send('Erro ao adicionar categoria.');
    }
});

// Atualizar categoria
router.post('/categorias/editar/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;
        await db.query('UPDATE categoria_produto SET nome=? WHERE id=?', [nome, id]);
        res.redirect('/admin/categorias');
    } catch (err) {
        console.error(err);
        res.send('Erro ao atualizar categoria.');
    }
});

// Deletar categoria
router.get('/categorias/deletar/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM categoria_produto WHERE id=?', [id]);
        res.redirect('/admin/categorias');
    } catch (err) {
        console.error(err);
        res.send('Erro ao excluir categoria.');
    }
});

// -------------------------
// CRUD PRODUTOS
// -------------------------

router.get('/produtos', isAdmin, async (req, res) => {
    try {
        const editarId = req.query.editar;

        const [produtos] = await db.query(`
            SELECT p.*, c.nome AS categoria_nome
            FROM produtos p
            JOIN categoria_produto c ON p.categoria_id = c.id
        `);

        const [categorias] = await db.query('SELECT * FROM categoria_produto');

        let produtoParaEditar = null;
        if (editarId) {
            produtoParaEditar = produtos.find(p => p.id == editarId);
        }

        res.render('admin/produtos', { produtos, categorias, produtoParaEditar });
    } catch (err) {
        console.error(err);
        res.send('Erro ao buscar produtos.');
    }
});

// Adicionar produto
router.post('/produtos', isAdmin, async (req, res) => {
    try {
        const { nome, preco, categoria_id } = req.body;
        if (!nome || !preco || !categoria_id) return res.status(400).send('Todos os campos são obrigatórios');
        await db.query('INSERT INTO produtos (nome, preco, categoria_id) VALUES (?, ?, ?)', [nome, preco, categoria_id]);
        res.redirect('/admin/produtos');
    } catch (err) {
        console.error(err);
        res.send('Erro ao adicionar produto.');
    }
});

// Atualizar produto
router.post('/produtos/editar/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, preco, categoria_id } = req.body;
        await db.query('UPDATE produtos SET nome=?, preco=?, categoria_id=? WHERE id=?', [nome, preco, categoria_id, id]);
        res.redirect('/admin/produtos');
    } catch (err) {
        console.error(err);
        res.send('Erro ao atualizar produto.');
    }
});

// Deletar produto
router.get('/produtos/deletar/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM produtos WHERE id=?', [id]);
        res.redirect('/admin/produtos');
    } catch (err) {
        console.error(err);
        res.send('Erro ao excluir produto.');
    }
});

// -------------------------
// PEDIDOS
// -------------------------
router.get('/pedidos', isAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT pe.id, u.nome AS cliente, pe.data_pedido, pe.status, pe.total
            FROM pedidos pe
            JOIN usuarios u ON pe.cliente_id = u.id
            ORDER BY pe.data_pedido DESC
        `;
        const [pedidos] = await db.query(sql);
        res.render('admin/pedidos', { pedidos });
    } catch (err) {
        console.error(err);
        res.send('Erro ao buscar pedidos.');
    }
});

// Atualizar status do pedido
router.post('/pedidos/atualizar-status/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query('UPDATE pedidos SET status=? WHERE id=?', [status, id]);
        res.redirect('/admin/pedidos');
    } catch (err) {
        console.error(err);
        res.send('Erro ao atualizar status do pedido.');
    }
});

// -------------------------
// RELATÓRIOS
// -------------------------
router.get('/relatorios', isAdmin, async (req, res) => {
    try {
        const sqlVendas = `
            SELECT DATE(data_pedido) AS data, SUM(total) AS total_vendas
            FROM pedidos
            GROUP BY DATE(data_pedido)
            ORDER BY DATE(data_pedido) DESC
        `;

        const sqlStatus = `
            SELECT status, COUNT(*) AS total
            FROM pedidos
            GROUP BY status
        `;

        const [vendas] = await db.query(sqlVendas);
        const [status] = await db.query(sqlStatus);

        res.render('admin/relatorios', { vendas, status });
    } catch (err) {
        console.error(err);
        res.send('Erro ao gerar relatórios.');
    }
});

module.exports = router;
