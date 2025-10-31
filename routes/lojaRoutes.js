const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const { autenticar } = require('../middlewares/auth');

// =====================
// Página inicial da loja
// =====================
router.get('/', autenticar, async (req, res) => {
  try {
    const [produtos] = await db.query(`
      SELECT p.*, c.nome AS categoria_nome 
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LIMIT 6
    `);
    produtos.forEach(p => p.preco = Number(p.preco));
    res.render('loja/index', { produtos, usuario: req.session.usuario });
  } catch (err) {
    console.error('Erro ao carregar loja:', err);
    res.status(500).send('Erro ao carregar loja.');
  }
});

// =====================
// Página de categorias
// =====================
router.get('/categorias', autenticar, async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM categorias ORDER BY nome');
    res.render('loja/categorias', { categorias, usuario: req.session.usuario });
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
    res.status(500).send('Erro ao carregar categorias.');
  }
});

// =====================
// Produtos por categoria
// =====================
router.get('/categorias/:id', autenticar, async (req, res) => {
  try {
    const categoriaId = Number(req.params.id);
    if (isNaN(categoriaId)) return res.status(400).send('Categoria inválida.');

    const [[categoria]] = await db.query('SELECT * FROM categorias WHERE id = ?', [categoriaId]);
    if (!categoria) return res.status(404).send('Categoria não encontrada.');

    const [produtos] = await db.query('SELECT * FROM produtos WHERE categoria_id = ?', [categoriaId]);
    produtos.forEach(p => p.preco = Number(p.preco));

    res.render('loja/produtos', { categoria, produtos, usuario: req.session.usuario });
  } catch (err) {
    console.error('Erro ao carregar produtos por categoria:', err);
    res.status(500).send('Erro ao carregar produtos por categoria.');
  }
});

// =====================
// Listagem de todos os produtos com paginação
// =====================
router.get('/produtos', autenticar, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    const [produtos] = await db.query('SELECT * FROM produtos LIMIT ? OFFSET ?', [limit, offset]);
    produtos.forEach(p => p.preco = Number(p.preco));

    res.render('loja/produtos', { produtos, page, categoria: null, usuario: req.session.usuario });
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    res.status(500).send('Erro ao carregar produtos.');
  }
});

// =====================
// Detalhes do produto
// =====================
router.get('/produtos/:id', autenticar, async (req, res) => {
  try {
    const produtoId = Number(req.params.id);
    if (isNaN(produtoId)) return res.status(400).send('ID do produto inválido.');

    const [[produto]] = await db.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
    if (!produto) return res.status(404).send('Produto não encontrado.');

    produto.preco = Number(produto.preco);
    res.render('loja/detalhes', { produto, usuario: req.session.usuario });
  } catch (err) {
    console.error('Erro ao carregar detalhes do produto:', err);
    res.status(500).send('Erro ao carregar detalhes do produto.');
  }
});

// =====================
// Carrinho persistente no banco
// =====================
router.get('/carrinho', autenticar, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const [carrinho] = await db.query(`
      SELECT c.quantidade, p.id, p.nome, p.preco, p.imagem
      FROM carrinho c
      JOIN produtos p ON c.produto_id = p.id
      WHERE c.usuario_id = ?
    `, [usuarioId]);

    carrinho.forEach(item => item.preco = Number(item.preco));
    const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

    res.render('loja/carrinho', { carrinho, total, usuario: req.session.usuario });
  } catch (err) {
    console.error('Erro ao carregar carrinho:', err);
    res.status(500).send('Erro ao carregar carrinho.');
  }
});

router.post('/carrinho/adicionar', autenticar, async (req, res) => {
  try {
    const { produtoId, quantidade } = req.body;
    const qtd = parseInt(quantidade) || 1;
    const usuarioId = req.session.usuario.id;

    const [[produto]] = await db.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
    if (!produto) return res.status(404).send('Produto não encontrado.');

    const [[itemCarrinho]] = await db.query('SELECT * FROM carrinho WHERE usuario_id = ? AND produto_id = ?', [usuarioId, produtoId]);

    if (itemCarrinho) {
      await db.query('UPDATE carrinho SET quantidade = quantidade + ? WHERE id = ?', [qtd, itemCarrinho.id]);
    } else {
      await db.query('INSERT INTO carrinho (usuario_id, produto_id, quantidade) VALUES (?, ?, ?)', [usuarioId, produtoId, qtd]);
    }

    res.redirect('/loja/carrinho');
  } catch (err) {
    console.error('Erro ao adicionar produto ao carrinho:', err);
    res.status(500).send('Erro ao adicionar produto ao carrinho.');
  }
});

router.post('/carrinho/remover/:id', autenticar, async (req, res) => {
  try {
    const produtoId = Number(req.params.id);
    const usuarioId = req.session.usuario.id;

    await db.query('DELETE FROM carrinho WHERE usuario_id = ? AND produto_id = ?', [usuarioId, produtoId]);
    res.redirect('/loja/carrinho');
  } catch (err) {
    console.error('Erro ao remover produto do carrinho:', err);
    res.status(500).send('Erro ao remover produto do carrinho.');
  }
});

// =====================
// Página de checkout
// =====================
router.get('/checkout', autenticar, async (req, res) => {
  try {
    const usuario = req.session.usuario;
    res.render('loja/checkout', { usuario });
  } catch (err) {
    console.error('Erro ao carregar checkout:', err);
    res.status(500).send('Erro ao carregar checkout');
  }
});

// =====================
// Finalizar pedido
// =====================
router.post('/checkout', autenticar, async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const { forma_pagamento } = req.body;
    const dados = req.body;

    console.log('🧾 Dados recebidos no checkout:', dados);

    if (!forma_pagamento) {
      console.log('⚠️ Nenhuma forma de pagamento selecionada!');
      return res.status(400).send('Selecione uma forma de pagamento.');
    }

    // Coleta os produtos do carrinho
    const produtosCarrinho = Object.keys(dados)
      .filter(key => key.startsWith('quantidade_'))
      .map(key => ({
        id: key.split('_')[1],
        quantidade: Number(dados[key])
      }));

    if (produtosCarrinho.length === 0) {
      return res.status(400).send('Carrinho vazio.');
    }

    // Calcula o total
    let total = 0;
    for (const item of produtosCarrinho) {
      const [[produto]] = await db.query('SELECT preco FROM produtos WHERE id = ?', [item.id]);
      total += produto.preco * item.quantidade;
    }

    // Cria o pedido
    const [pedidoResult] = await db.query(
      'INSERT INTO pedidos (usuario_id, data, total, forma_pagamento) VALUES (?, NOW(), ?, ?)',
      [usuario.id, total, forma_pagamento]
    );

    const pedidoId = pedidoResult.insertId;

    // Insere os itens do pedido
    for (const item of produtosCarrinho) {
      await db.query(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade) VALUES (?, ?, ?)',
        [pedidoId, item.id, item.quantidade]
      );
    }

    console.log('✅ Pedido finalizado com sucesso!');
    res.redirect('/loja/pedido-sucesso');
  } catch (err) {
    console.error('Erro ao finalizar pedido:', err);
    res.status(500).send('Erro ao finalizar pedido.');
  }
});

// =====================
// Página de sucesso
// =====================
router.get('/pedido-sucesso', autenticar, (req, res) => {
  res.render('loja/pedido-sucesso');
});

// =====================
// Perfil do usuário
// =====================
router.get('/perfil', autenticar, async (req, res) => {
  try {
    const [[usuario]] = await db.query('SELECT * FROM usuarios WHERE id = ?', [req.session.usuario.id]);
    if (!usuario) return res.status(404).send('Usuário não encontrado.');
    res.render('loja/perfil', { usuario, mensagem: null });
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    res.status(500).send('Erro ao carregar perfil.');
  }
});

router.post('/perfil/editar', autenticar, async (req, res) => {
  try {
    const { nome, email, telefone, cep, rua, numero, complemento, bairro, cidade, estado, senha } = req.body;
    const usuarioId = req.session.usuario.id;

    let query = `
      UPDATE usuarios SET 
      nome = ?, email = ?, telefone = ?, cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?
    `;
    const params = [nome, email, telefone, cep, rua, numero, complemento, bairro, cidade, estado];

    if (senha && senha.trim() !== '') {
      const senhaCriptografada = await bcrypt.hash(senha, 10);
      query += ', senha = ?';
      params.push(senhaCriptografada);
    }

    query += ' WHERE id = ?';
    params.push(usuarioId);

    await db.query(query, params);
    const [[usuarioAtualizado]] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    req.session.usuario = usuarioAtualizado;

    res.render('loja/perfil', { usuario: usuarioAtualizado, mensagem: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).send('Erro ao atualizar perfil.');
  }
});

router.post('/perfil/excluir', autenticar, async (req, res) => {
  try {
    await db.query('DELETE FROM usuarios WHERE id = ?', [req.session.usuario.id]);
    req.session.destroy();
    res.redirect('/login');
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    res.status(500).send('Erro ao excluir conta.');
  }
});

// =====================
// Pedidos do usuário
// =====================
router.get('/pedidos', autenticar, async (req, res) => {
  try {
    const [pedidos] = await db.query(`
      SELECT p.id, p.data_pedido AS data, p.status, p.total, f.descricao AS forma_pagamento
      FROM pedidos p
      JOIN forma_pagamento f ON p.forma_pagamento_id = f.id
      WHERE p.cliente_id = ?
      ORDER BY p.data_pedido DESC
    `, [req.session.usuario.id]);

    res.render('loja/pedidos', { pedidos, usuario: req.session.usuario });
  } catch (err) {
    console.error('Erro ao carregar pedidos:', err);
    res.status(500).send('Erro ao carregar pedidos.');
  }
});

router.get('/pedidos/:id', autenticar, async (req, res) => {
  try {
    const pedidoId = Number(req.params.id);
    if (isNaN(pedidoId)) return res.status(400).send('ID do pedido inválido.');

    const [[pedido]] = await db.query(`
      SELECT p.id, p.data_pedido AS data, p.status, p.total, f.descricao AS forma_pagamento
      FROM pedidos p
      JOIN forma_pagamento f ON p.forma_pagamento_id = f.id
      WHERE p.id = ? AND p.cliente_id = ?
    `, [pedidoId, req.session.usuario.id]);

    if (!pedido) return res.status(404).send('Pedido não encontrado.');

    const [itens] = await db.query(`
      SELECT i.quantidade, i.preco_unit AS preco_unitario, pr.nome AS produto_nome
      FROM itens_pedido i
      JOIN produtos pr ON i.produto_id = pr.id
      WHERE i.pedido_id = ?
    `, [pedidoId]);

    res.render('loja/pedidosDetalhe', { pedido, itens, usuario: req.session.usuario });
  } catch (err) {
    console.error('Erro ao carregar detalhes do pedido:', err);
    res.status(500).send('Erro ao carregar detalhes do pedido.');
  }
});

module.exports = router;
