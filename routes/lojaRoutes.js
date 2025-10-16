const express = require('express');
const router = express.Router();
const db = require('../config/database');

// =====================
// Página inicial da loja
// =====================
router.get('/', async (req, res) => {
  try {
    const [produtos] = await db.query('SELECT * FROM produtos LIMIT 6');
    produtos.forEach(p => p.preco = Number(p.preco));
    res.render('loja/index', { produtos });
  } catch (err) {
    console.error('Erro ao carregar página da loja:', err);
    res.status(500).send('Erro ao carregar loja.');
  }
});

// =====================
// Listagem de produtos
// =====================
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

// =====================
// Produtos por categoria
// =====================
router.get('/categorias/:id', async (req, res) => {
  try {
    const categoriaId = Number(req.params.id);
    if (isNaN(categoriaId)) return res.status(400).send('Categoria inválida.');

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

// =====================
// Detalhes do produto
// =====================
router.get('/produtos/:id', async (req, res) => {
  try {
    const produtoId = Number(req.params.id);
    if (isNaN(produtoId)) return res.status(400).send('ID do produto inválido.');

    const [produtos] = await db.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
    if (produtos.length === 0) return res.status(404).send('Produto não encontrado.');

    const produto = produtos[0];
    produto.preco = Number(produto.preco);

    res.render('loja/detalhes', { produto });
  } catch (err) {
    console.error('Erro ao carregar detalhes do produto:', err);
    res.status(500).send('Erro ao carregar detalhes do produto.');
  }
});

// =====================
// Carrinho
// =====================
router.get('/carrinho', (req, res) => {
  const carrinho = req.session.carrinho || [];
  const total = carrinho.reduce((acc, item) => acc + (item.preco || 0) * (item.quantidade || 0), 0);

  res.render('loja/carrinho', { carrinho, total });
});

router.post('/carrinho/adicionar', async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    const qtd = parseInt(quantidade) || 1;

    const [produtos] = await db.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
    if (produtos.length === 0) return res.status(404).send('Produto não encontrado.');

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
    console.error('Erro ao adicionar produto ao carrinho:', err);
    res.status(500).send('Erro ao adicionar produto ao carrinho.');
  }
});

router.post('/carrinho/remover/:id', (req, res) => {
  const produtoId = Number(req.params.id);
  if (!req.session.carrinho) req.session.carrinho = [];

  req.session.carrinho = req.session.carrinho.filter(item => item.id !== produtoId);
  res.redirect('/loja/carrinho');
});

// =====================
// Checkout
// =====================
router.get('/checkout', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  const carrinho = req.session.carrinho || [];
  if (carrinho.length === 0) return res.redirect('/loja/carrinho');

  const total = carrinho.reduce((acc, item) => acc + (item.preco || 0) * (item.quantidade || 0), 0);

  res.render('loja/checkout', { usuario: req.session.usuario, carrinho, total });
});

router.post('/checkout', async (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  const clienteId = req.session.usuario.id;
  const carrinho = req.session.carrinho || [];
  if (carrinho.length === 0) return res.redirect('/loja/carrinho');

  const { nome, endereco, forma_pagamento } = req.body;

  try {
    const total = carrinho.reduce((acc, item) => acc + (item.preco || 0) * (item.quantidade || 0), 0);
    const formaPagamentoId = parseInt(forma_pagamento);

    if (![1, 2, 3].includes(formaPagamentoId)) {
      throw new Error('Forma de pagamento inválida.');
    }

    const [pedidoResult] = await db.query(
      `INSERT INTO pedidos (cliente_id, data_pedido, status, total, forma_pagamento_id)
       VALUES (?, NOW(), ?, ?, ?)`,
      [clienteId, 'pendente', total, formaPagamentoId]
    );

    const pedidoId = pedidoResult.insertId;

    const itensPromises = carrinho.map(item =>
      db.query(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unit) VALUES (?, ?, ?, ?)',
        [pedidoId, item.id, item.quantidade, item.preco]
      )
    );
    await Promise.all(itensPromises);

    req.session.carrinho = [];
    res.redirect('/loja/pedidos');
  } catch (err) {
    console.error('Erro ao finalizar pedido:', err);
    res.status(500).send('Erro ao finalizar pedido.');
  }
});

// =====================
// Pedidos do usuário
// =====================
router.get('/pedidos', async (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  try {
    const [pedidos] = await db.query(
      `SELECT p.id, p.data_pedido AS data, p.status, p.total, f.descricao AS forma_pagamento
       FROM pedidos p
       JOIN forma_pagamento f ON p.forma_pagamento_id = f.id
       WHERE p.cliente_id = ?
       ORDER BY p.data_pedido DESC`,
      [req.session.usuario.id]
    );

    res.render('loja/pedidos', { pedidos });
  } catch (err) {
    console.error('Erro ao carregar pedidos:', err);
    res.status(500).send('Erro ao carregar pedidos.');
  }
});

// =====================
// Página "Meu Perfil"
// =====================
router.get('/perfil', async (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  try {
    const [dadosUsuario] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.session.usuario.id]);
    if (!dadosUsuario || dadosUsuario.length === 0) return res.status(404).send('Usuário não encontrado');
    res.render('loja/perfil', { usuario: dadosUsuario[0], mensagem: null });
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    res.status(500).send('Erro ao carregar perfil.');
  }
});

// =====================
// Atualizar perfil
// =====================
router.post('/perfil/editar', async (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  const { nome, email, telefone, endereco, senha } = req.body;

  try {
    await db.query(
      `UPDATE clientes 
       SET nome = ?, email = ?, telefone = ?, endereco = ?, senha = ?
       WHERE id = ?`,
      [nome, email, telefone, endereco, senha, req.session.usuario.id]
    );

    req.session.usuario.nome = nome;
    req.session.usuario.email = email;
    req.session.usuario.telefone = telefone;
    req.session.usuario.endereco = endereco;

    const [dadosAtualizados] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.session.usuario.id]);

    res.render('loja/perfil', { usuario: dadosAtualizados[0], mensagem: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).send('Erro ao atualizar perfil.');
  }
});

// =====================
// Excluir conta
// =====================
router.post('/perfil/excluir', async (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');

  try {
    const usuarioId = req.session.usuario.id;
    await db.query(
      'DELETE FROM itens_pedido WHERE pedido_id IN (SELECT id FROM pedidos WHERE cliente_id = ?)',
      [usuarioId]
    );
    await db.query('DELETE FROM pedidos WHERE cliente_id = ?', [usuarioId]);
    await db.query('DELETE FROM clientes WHERE id = ?', [usuarioId]);

    req.session.destroy(() => {
      res.redirect('/login');
    });
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    res.status(500).send('Erro ao excluir conta.');
  }
});

module.exports = router;
