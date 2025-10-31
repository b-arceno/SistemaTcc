const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { autenticar, isAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==================== UTIL ====================
const parseNumber = (valor) => (isNaN(valor) ? 0 : Number(valor));

// ==================== UPLOAD ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ==================== DASHBOARD ====================
router.get('/', autenticar, isAdmin, async (req, res) => {
  try {
    const [pedidos] = await db.query(`
      SELECT 
        p.id, 
        u.nome AS cliente, 
        p.data_pedido, 
        p.status, 
        p.total, 
        f.descricao AS forma_pagamento
      FROM pedidos p
      JOIN usuarios u ON p.cliente_id = u.id
      JOIN forma_pagamento f ON p.forma_pagamento_id = f.id
      ORDER BY p.data_pedido DESC
      LIMIT 10
    `);

    pedidos.forEach(p => p.total = parseNumber(p.total));
    res.render('admin/dashboard', { usuario: req.session.usuario, pedidos });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { usuario: req.session.usuario, pedidos: [] });
  }
});

// ==================== CATEGORIAS ====================
router.get('/categorias', autenticar, isAdmin, async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT id, nome FROM categoria_produto');
    res.render('admin/categorias', { categorias, categoriaEdit: null });
  } catch (err) {
    console.error(err);
    res.render('admin/categorias', { categorias: [], categoriaEdit: null });
  }
});

router.post('/categorias', autenticar, isAdmin, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome || nome.trim() === '') return res.status(400).send('Nome obrigatório');
    await db.query('INSERT INTO categoria_produto (nome) VALUES (?)', [nome]);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao cadastrar categoria');
  }
});

router.get('/categorias/editar/:id', autenticar, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const [[categoriaEdit]] = await db.query('SELECT * FROM categoria_produto WHERE id = ?', [id]);
    const [categorias] = await db.query('SELECT * FROM categoria_produto');
    res.render('admin/categorias', { categorias, categoriaEdit });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/categorias');
  }
});

router.post('/categorias/editar/:id', autenticar, isAdmin, async (req, res) => {
  const id = req.params.id;
  const { nome } = req.body;
  if (!nome || nome.trim() === '') return res.status(400).send('Nome obrigatório');
  try {
    await db.query('UPDATE categoria_produto SET nome = ? WHERE id = ?', [nome, id]);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao editar categoria');
  }
});

router.get('/categorias/deletar/:id', autenticar, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM categoria_produto WHERE id = ?', [id]);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao deletar categoria');
  }
});

// ==================== PRODUTOS ====================
router.get('/produtos', autenticar, isAdmin, async (req, res) => {
  try {
    const [produtos] = await db.query(`
      SELECT p.id, p.nome, p.preco, p.categoria_id, p.imagem, p.descricao, c.nome AS categoria_nome
      FROM produtos p
      JOIN categoria_produto c ON p.categoria_id = c.id
      ORDER BY p.nome ASC
    `);
    const [categorias] = await db.query('SELECT id, nome FROM categoria_produto');
    produtos.forEach(prod => prod.preco = parseNumber(prod.preco));
    res.render('admin/produtos', { produtos, categorias });
  } catch (err) {
    console.error(err);
    res.render('admin/produtos', { produtos: [], categorias: [] });
  }
});

router.post('/produtos', autenticar, isAdmin, upload.single('imagem'), async (req, res) => {
  try {
    const { nome, preco, categoria_id, descricao } = req.body;
    if (!nome || !preco || !categoria_id) return res.status(400).send('Campos obrigatórios faltando');
    const precoNum = parseFloat(preco);
    if (isNaN(precoNum) || precoNum <= 0) return res.status(400).send('Preço inválido');
    const imagem = req.file ? req.file.filename : null;

    await db.query(
      `INSERT INTO produtos (nome, preco, categoria_id, descricao, imagem)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, precoNum, categoria_id, descricao, imagem]
    );
    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao cadastrar produto');
  }
});

router.get('/produtos/deletar/:id', autenticar, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const [produto] = await db.query('SELECT imagem FROM produtos WHERE id = ?', [id]);
    if (produto.length && produto[0].imagem) {
      const caminho = path.join(__dirname, '../public/uploads', produto[0].imagem);
      if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
    }
    await db.query('DELETE FROM produtos WHERE id = ?', [id]);
    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao deletar produto');
  }
});

// ==================== PEDIDOS ====================
router.get('/pedidos', autenticar, isAdmin, async (req, res) => {
  try {
    const [pedidos] = await db.query(`
      SELECT 
        p.id, 
        u.nome AS cliente, 
        p.data_pedido, 
        p.status, 
        p.total, 
        f.descricao AS forma_pagamento
      FROM pedidos p
      JOIN usuarios u ON p.cliente_id = u.id
      JOIN forma_pagamento f ON p.forma_pagamento_id = f.id
      ORDER BY p.data_pedido DESC
    `);
    pedidos.forEach(p => p.total = parseNumber(p.total));
    res.render('admin/pedidos', { pedidos });
  } catch (err) {
    console.error(err);
    res.render('admin/pedidos', { pedidos: [] });
  }
});

router.get('/pedidos/visualizar/:id', autenticar, isAdmin, async (req, res) => {
  const pedidoId = req.params.id;
  try {
    const [[pedido]] = await db.query(`
      SELECT p.*, u.nome AS cliente, f.descricao AS forma_pagamento
      FROM pedidos p
      JOIN usuarios u ON p.cliente_id = u.id
      JOIN forma_pagamento f ON p.forma_pagamento_id = f.id
      WHERE p.id = ?
    `, [pedidoId]);
    if (!pedido) return res.redirect('/admin/pedidos');

    pedido.total = parseNumber(pedido.total);

    const [itens] = await db.query(`
      SELECT i.*, pr.nome AS produto_nome, i.preco_unit AS preco_unitario
      FROM itens_pedido i
      JOIN produtos pr ON i.produto_id = pr.id
      WHERE i.pedido_id = ?
    `, [pedidoId]);
    itens.forEach(i => i.preco_unitario = parseNumber(i.preco_unitario));

    res.render('admin/pedidoDetalhes', { pedido, itens });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/pedidos');
  }
});

// Atualizar status do pedido
router.post('/pedidos/:id/status', autenticar, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const statusValidos = ['pendente', 'em andamento', 'finalizado', 'cancelado'];

  if (!statusValidos.includes(status)) return res.status(400).send('Status inválido');

  try {
    await db.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, id]);
    res.redirect('/admin/pedidos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar status');
  }
});

// ==================== RELATÓRIOS ====================
router.get('/relatorios', autenticar, isAdmin, async (req, res) => {
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
