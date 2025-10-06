const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// === DASHBOARD ===
router.get('/', isAdmin, async (req, res) => {
    try {
        const [pedidos] = await db.query(`
            SELECT p.id, u.nome AS cliente, p.data_pedido, p.status, p.total
            FROM pedidos p
            JOIN usuarios u ON p.cliente_id = u.id
            ORDER BY p.data_pedido DESC
            LIMIT 10
        `);
        res.render('admin/dashboard', { usuario: req.session.usuario, pedidos });
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', { usuario: req.session.usuario, pedidos: [] });
    }
});

// === CATEGORIAS ===
router.get('/categorias', isAdmin, async (req, res) => {
    try {
        const [categorias] = await db.query('SELECT id, nome FROM categoria_produto');
        res.render('admin/categorias', { categorias });
    } catch (err) {
        console.error(err);
        res.render('admin/categorias', { categorias: [] });
    }
});

router.post('/categorias', isAdmin, async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).send('Nome obrigatório');
        await db.query('INSERT INTO categoria_produto (nome) VALUES (?)', [nome]);
        res.redirect('/admin/categorias');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});

router.get('/categorias/editar/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    const [categoria] = await db.query('SELECT * FROM categoria_produto WHERE id = ?', [id]);
    if (!categoria[0]) return res.redirect('/admin/categorias');
    res.render('admin/categorias', { categorias: categoria });
});

router.get('/categorias/deletar/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    await db.query('DELETE FROM categoria_produto WHERE id = ?', [id]);
    res.redirect('/admin/categorias');
});

// === PRODUTOS ===
router.get('/produtos', isAdmin, async (req, res) => {
    try {
        const [produtos] = await db.query(`
            SELECT p.id, p.nome, p.preco, p.categoria_id, p.imagem, p.descricao, c.nome AS categoria_nome
            FROM produtos p
            JOIN categoria_produto c ON p.categoria_id = c.id
            ORDER BY p.nome ASC
        `);
        const [categorias] = await db.query('SELECT id, nome FROM categoria_produto');
        res.render('admin/produtos', { produtos, categorias });
    } catch (err) {
        console.error(err);
        res.render('admin/produtos', { produtos: [], categorias: [] });
    }
});

router.post('/produtos', isAdmin, upload.single('imagem'), async (req, res) => {
    try {
        const { nome, preco, categoria_id, descricao } = req.body;
        const imagem = req.file ? req.file.filename : null;
        await db.query(`
            INSERT INTO produtos (nome, preco, categoria_id, descricao, imagem)
            VALUES (?, ?, ?, ?, ?)
        `, [nome, preco, categoria_id, descricao, imagem]);
        res.redirect('/admin/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar produto');
    }
});

router.get('/produtos/deletar/:id', isAdmin, async (req, res) => {
    const id = req.params.id;
    const [produto] = await db.query('SELECT imagem FROM produtos WHERE id = ?', [id]);
    if (produto[0] && produto[0].imagem) {
        const caminho = path.join(__dirname, '../public/uploads', produto[0].imagem);
        if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
    }
    await db.query('DELETE FROM produtos WHERE id = ?', [id]);
    res.redirect('/admin/produtos');
});

// === PEDIDOS ===
router.get('/pedidos', isAdmin, async (req, res) => {
    try {
        const [pedidos] = await db.query(`
            SELECT p.id, u.nome AS cliente, p.data_pedido, p.status, p.total
            FROM pedidos p
            JOIN usuarios u ON p.cliente_id = u.id
            ORDER BY p.data_pedido DESC
        `);
        res.render('admin/pedidos', { pedidos });
    } catch (err) {
        console.error(err);
        res.render('admin/pedidos', { pedidos: [] });
    }
});

// === RELATÓRIOS ===
router.get('/relatorios', isAdmin, async (req, res) => {
    try {
        const [vendas] = await db.query(`
            SELECT DATE(data_pedido) AS data, SUM(total) AS total_vendas
            FROM pedidos
            GROUP BY DATE(data_pedido)
            ORDER BY DATE(data_pedido) DESC
        `);

        const [status] = await db.query(`
            SELECT status AS descricao, COUNT(*) AS total
            FROM pedidos
            GROUP BY status
        `);

        res.render('admin/relatorios', { vendas, status });
    } catch (err) {
        console.error(err);
        res.render('admin/relatorios', { vendas: [], status: [] });
    }
});

module.exports = router;
