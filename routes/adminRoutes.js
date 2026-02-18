const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { autenticar, isAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==================== FUNÇÃO UTIL ====================
const parseNumber = (valor) => (isNaN(valor) ? 0 : Number(valor));

// ==================== CONFIGURAÇÃO UPLOAD ====================
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
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN forma_pagamento f ON p.forma_pagamento_id = f.id
      ORDER BY p.data_pedido DESC
    `);

    pedidos.forEach(p => p.total = parseNumber(p.total));
    res.render('admin/dashboard', { usuario: req.session.usuario, pedidos });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { usuario: req.session.usuario, pedidos: [] });
  }
});


// ==================== CATEGORIAS ====================

// Listar categorias
router.get('/categorias', autenticar, isAdmin, async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT id, nome FROM categoria_produto');
    res.render('admin/categorias', { categorias, categoriaEdit: null });
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.render('admin/categorias', { categorias: [], categoriaEdit: null });
  }
});

// Cadastrar categoria
router.post('/categorias', autenticar, isAdmin, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome || nome.trim() === '') {
      return res.status(400).send('O nome da categoria é obrigatório.');
    }
    await db.query('INSERT INTO categoria_produto (nome) VALUES (?)', [nome]);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error('Erro ao cadastrar categoria:', err);
    res.status(500).send('Erro ao cadastrar categoria');
  }
});

// Editar categoria (carregar dados)
router.get('/categorias/editar/:id', autenticar, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [[categoriaEdit]] = await db.query('SELECT * FROM categoria_produto WHERE id = ?', [id]);
    const [categorias] = await db.query('SELECT * FROM categoria_produto');
    if (!categoriaEdit) return res.redirect('/admin/categorias');

    res.render('admin/categorias', { categorias, categoriaEdit });
  } catch (err) {
    console.error('Erro ao carregar categoria para edição:', err);
    res.redirect('/admin/categorias');
  }
});

// Salvar edição
router.post('/categorias/editar/:id', autenticar, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;

  try {
    if (!nome || nome.trim() === '') {
      return res.status(400).send('O nome da categoria é obrigatório.');
    }

    await db.query('UPDATE categoria_produto SET nome = ? WHERE id = ?', [nome, id]);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error('Erro ao editar categoria:', err);
    res.status(500).send('Erro ao editar categoria');
  }
});

// Deletar categoria
router.get('/categorias/deletar/:id', autenticar, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM categoria_produto WHERE id = ?', [id]);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error('Erro ao deletar categoria:', err);
    res.status(500).send('Erro ao deletar categoria');
  }
});


// ==================== PRODUTOS ====================
router.get('/produtos', autenticar, isAdmin, async (req, res) => {
  try {
    const [produtos] = await db.query(`
      SELECT p.id, p.nome, p.preco, p.categoria_id, p.imagem, p.descricao, p.ativo, c.nome AS categoria_nome
      FROM produtos p
      JOIN categoria_produto c ON p.categoria_id = c.id
      ORDER BY p.nome ASC
    `);

    const [categorias] = await db.query('SELECT id, nome FROM categoria_produto');

    res.render('admin/produtos', {
      produtos,
      categorias,
      produtoEdit: null
    });
  } catch (err) {
    console.error(err);
    res.render('admin/produtos', {
      produtos: [],
      categorias: [],
      produtoEdit: null
    });
  }
});

// Editar produto (GET)
router.get('/produtos/editar/:id', autenticar, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
  const [[produtoEdit]] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);

    const [produtos] = await db.query(`
      SELECT p.id, p.nome, p.preco, p.categoria_id, p.imagem, p.descricao, p.ativo, c.nome AS categoria_nome
      FROM produtos p
      JOIN categoria_produto c ON p.categoria_id = c.id
      ORDER BY p.nome ASC
    `);

    const [categorias] = await db.query('SELECT id, nome FROM categoria_produto');

    res.render('admin/produtos', {
      produtos,
      categorias,
      produtoEdit
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/produtos');
  }
});

// Toggle ativação do produto (ativar/desativar)
router.get('/produtos/toggle/:id', autenticar, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const [[produto]] = await db.query('SELECT ativo FROM produtos WHERE id = ?', [id]);
    if (!produto) return res.redirect('/admin/produtos');
    const novoEstado = produto.ativo === 1 ? 0 : 1;
    await db.query('UPDATE produtos SET ativo = ? WHERE id = ?', [novoEstado, id]);
    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/produtos');
  }
});
// Cadastrar novo produto (POST)
router.post('/produtos', autenticar, isAdmin, upload.single('imagem'), async (req, res) => {
  const { nome, preco, categoria_id, descricao } = req.body;
  const precoNum = parseFloat(preco);
  const imagem = req.file ? req.file.filename : null;

  try {
    await db.query(
      'INSERT INTO produtos (nome, preco, categoria_id, descricao, imagem) VALUES (?, ?, ?, ?, ?)',
      [nome, precoNum, categoria_id, descricao, imagem]
    );

    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao cadastrar produto');
  }
});


// Editar produto (POST)
router.post('/produtos/editar/:id', autenticar, isAdmin, upload.single('imagem'), async (req, res) => {
  const id = req.params.id;
  const { nome, preco, categoria_id, descricao } = req.body;
  const precoNum = parseFloat(preco);

  try {
    const [[produto]] = await db.query('SELECT imagem FROM produtos WHERE id = ?', [id]);
    let imagem = produto.imagem;

    if (req.file) {
      if (imagem) {
        const caminhoAntigo = path.join(__dirname, '../public/uploads', imagem);
        if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
      }
      imagem = req.file.filename;
    }

    await db.query(
      'UPDATE produtos SET nome=?, preco=?, categoria_id=?, descricao=?, imagem=? WHERE id=?',
      [nome, precoNum, categoria_id, descricao, imagem, id]
    );

    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar produto');
  }
});

// Deletar produto
router.get('/produtos/deletar/:id', autenticar, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    // Busca produto e imagem
    const [[produto]] = await db.query('SELECT imagem FROM produtos WHERE id = ?', [id]);

    // Verifica se produto está presente em itens de pedidos (histórico)
    const [[pedidoRef]] = await db.query('SELECT COUNT(*) AS cnt FROM itens_pedido WHERE produto_id = ?', [id]);
    if (pedidoRef && pedidoRef.cnt > 0) {
      // Se houver histórico, não deletar: desativar o produto para preservação de histórico
      await db.query('UPDATE produtos SET ativo = 0 WHERE id = ?', [id]);
      // Remove do carrinho para evitar compras futuras
      await db.query('DELETE FROM carrinho WHERE produto_id = ?', [id]);
      return res.redirect('/admin/produtos');
    }

    // Se não houver histórico, simplesmente desative (mantendo registros) e limpe o carrinho
    await db.query('UPDATE produtos SET ativo = 0 WHERE id = ?', [id]);
    await db.query('DELETE FROM carrinho WHERE produto_id = ?', [id]);

    // Não removemos imagem nem outras tabelas para manter histórico; apenas desativamos
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
      JOIN usuarios u ON p.usuario_id = u.id
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
      JOIN usuarios u ON p.usuario_id = u.id
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
      SELECT DATE(data_pedido) AS data, SUM(total) AS total_vendas, COUNT(*) AS total_pedidos
      FROM pedidos
      GROUP BY DATE(data_pedido)
      ORDER BY DATE(data_pedido) DESC
    `);

    const [status] = await db.query(`
      SELECT status AS descricao, COUNT(*) AS total
      FROM pedidos
      GROUP BY status
    `);

    // Relatório detalhado de produtos vendidos
    const [produtosVendidos] = await db.query(`
      SELECT 
        pr.id,
        pr.nome AS produto_nome,
        pr.imagem,
        SUM(i.quantidade) AS total_quantidade,
        i.preco_unit AS preco_unitario,
        SUM(i.quantidade * i.preco_unit) AS total_venda,
        COUNT(DISTINCT i.pedido_id) AS total_pedidos
      FROM itens_pedido i
      JOIN produtos pr ON i.produto_id = pr.id
      GROUP BY pr.id, i.preco_unit
      ORDER BY SUM(i.quantidade * i.preco_unit) DESC
    `);

    produtosVendidos.forEach(p => {
      p.preco_unitario = parseNumber(p.preco_unitario);
      p.total_venda = parseNumber(p.total_venda);
    });

    res.render('admin/relatorios', { vendas, status, produtosVendidos });
  } catch (err) {
    console.error(err);
    res.render('admin/relatorios', { vendas: [], status: [], produtosVendidos: [] });
  }
});

// =============================
// VARIAÇÕES DE PRODUTO
// =============================
router.get('/variacoes', autenticar, isAdmin, async (req, res) => {
  try {
    const [variacoes] = await db.query(`
      SELECT v.id, v.nome, v.preco, p.nome AS produto_nome
      FROM variacoes_produto v
      JOIN produtos p ON v.produto_id = p.id
      ORDER BY p.nome ASC
    `);
    const [produtos] = await db.query('SELECT id, nome FROM produtos');
    res.render('admin/variacoes', { variacoes, produtos });
  } catch (err) {
    console.error(err);
    res.render('admin/variacoes', { variacoes: [], produtos: [] });
  }
});

// Formulário para adicionar nova variação
router.get('/variacoes/adicionar', autenticar, isAdmin, async (req, res) => {
  const [produtos] = await db.query('SELECT id, nome FROM produtos');
  res.render('admin/adicionarVariacao', { produtos });
});

// Salvar nova variação
router.post('/variacoes/adicionar', autenticar, isAdmin, async (req, res) => {
  const { produto_id, nome, preco } = req.body;
  try {
    await db.query(
      'INSERT INTO variacoes_produto (produto_id, nome, preco) VALUES (?, ?, ?)',
      [produto_id, nome, preco]
    );
    res.redirect('/admin/variacoes');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao adicionar variação.');
  }
});

// Deletar variação
router.get('/variacoes/deletar/:id', autenticar, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM variacoes_produto WHERE id = ?', [id]);
    res.redirect('/admin/variacoes');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao deletar variação.');
  }
});


module.exports = router;
