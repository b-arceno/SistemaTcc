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
// Detalhes do Produto
// =====================
router.get('/produtos/:id', autenticar, async (req, res) => {
  const { id } = req.params;

  try {
    // Busca o produto e sua média de avaliação
    const [[produto]] = await db.query(`
      SELECT 
        p.*, 
        COALESCE(AVG(a.nota), 0) AS avaliacao_media
      FROM produtos p
      LEFT JOIN avaliacoes a ON a.produto_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);

    if (!produto) {
      return res.status(404).send('Produto não encontrado.');
    }

    // Garante que o preço seja numérico
    produto.preco = Number(produto.preco);

    // Busca as variações (gramas, tamanhos etc.)
    const [variacoes] = await db.query(`
      SELECT * 
      FROM variacoes_produto 
      WHERE produto_id = ?
      ORDER BY preco ASC
    `, [id]);

    // Busca as avaliações com nome do usuário
    const [avaliacoes] = await db.query(`
      SELECT 
        a.id,
        a.nota,
        a.comentario,
        DATE_FORMAT(a.data_avaliacao, '%d/%m/%Y %H:%i') AS data_avaliacao,
        u.nome AS nome_usuario
      FROM avaliacoes a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.produto_id = ?
      ORDER BY a.data_avaliacao DESC
    `, [id]);

    res.render('loja/detalhes', {
      produto,
      variacoes,
      avaliacoes,
      usuario: req.session.usuario
    });
  } catch (erro) {
    console.error('Erro ao carregar os detalhes do produto:', erro);
    res.status(500).send('Erro ao carregar os detalhes do produto.');
  }
});

// =====================
// Enviar Avaliação
// =====================
router.post('/produtos/:id/avaliar', autenticar, async (req, res) => {
  const produtoId = req.params.id;
  const usuarioId = req.session.usuario.id;
  const { nota, comentario } = req.body;

  try {
    // Validação simples
    if (!nota || isNaN(nota) || nota < 1 || nota > 5) {
      return res.status(400).send('Nota inválida.');
    }

    // Insere a nova avaliação
    await db.query(`
      INSERT INTO avaliacoes (usuario_id, produto_id, nota, comentario)
      VALUES (?, ?, ?, ?)
    `, [usuarioId, produtoId, nota, comentario]);

    // Calcula a nova média das avaliações do produto
    const [[{ media }]] = await db.query(`
      SELECT AVG(nota) AS media 
      FROM avaliacoes 
      WHERE produto_id = ?
    `, [produtoId]);

    // Atualiza o campo "avaliacao" na tabela de produtos
    const mediaFinal = media ? Number(media).toFixed(1) : 0.0;

    await db.query(`
      UPDATE produtos 
      SET avaliacao = ? 
      WHERE id = ?
    `, [mediaFinal, produtoId]);

    res.redirect(`/loja/produtos/${produtoId}`);
  } catch (error) {
    console.error('Erro ao enviar avaliação:', error);
    res.status(500).send('Erro ao enviar avaliação.');
  }
});

// =====================
// Carrinho persistente
// =====================
router.get('/carrinho', autenticar, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const [carrinho] = await db.query(`
      SELECT 
        c.produto_id AS id,
        p.nome,
        COALESCE(v.preco, p.preco) AS preco,
        c.quantidade,
        c.variacao_id,
        v.nome AS variacao_nome,
        p.imagem
      FROM carrinho c
      JOIN produtos p ON c.produto_id = p.id
      LEFT JOIN variacoes_produto v ON c.variacao_id = v.id
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

// =====================
// Adicionar ao carrinho (corrigido com variações)
// =====================
router.post('/carrinho/adicionar', autenticar, async (req, res) => {
  const usuarioId = req.session.usuario.id;
  const { produtoId, variacao_id, quantidade } = req.body;

  try {
    // Busca o produto principal
    const [[produto]] = await db.query('SELECT * FROM produtos WHERE id = ?', [produtoId]);
    if (!produto) {
      return res.status(404).send('Produto não encontrado.');
    }

    let precoFinal = produto.preco;
    let variacaoNome = null;

    // Se tiver variação, buscar o preço correto
    if (variacao_id && variacao_id !== '') {
      const [[variacao]] = await db.query(
        'SELECT * FROM variacoes_produto WHERE id = ? AND produto_id = ?',
        [variacao_id, produtoId]
      );

      if (!variacao) {
        return res.status(404).send('Variação não encontrada.');
      }

      precoFinal = variacao.preco;
      variacaoNome = variacao.nome;
    }

// Adiciona ao carrinho
await db.query(`
  INSERT INTO carrinho (usuario_id, produto_id, variacao_id, quantidade, preco_unitario)
  VALUES (?, ?, ?, ?, ?)
`, [usuarioId, produtoId, variacao_id || null, quantidade, precoFinal]);


    console.log(`✅ Produto "${produto.nome}" (${variacaoNome || 'sem variação'}) adicionado ao carrinho com preço: ${precoFinal}`);

    res.redirect('/loja/carrinho');
  } catch (error) {
    console.error('❌ Erro ao adicionar produto ao carrinho:', error);
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
// Checkout
// =====================
router.get('/checkout', autenticar, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;

    // Busca carrinho com preço correto (produto ou variação)
    const [carrinho] = await db.query(`
      SELECT 
        c.produto_id,
        c.variacao_id,
        COALESCE(v.preco, p.preco) AS preco_unitario,
        c.quantidade,
        p.nome,
        v.nome AS variacao_nome,
        p.imagem
      FROM carrinho c
      JOIN produtos p ON c.produto_id = p.id
      LEFT JOIN variacoes_produto v ON c.variacao_id = v.id
      WHERE c.usuario_id = ?
    `, [usuarioId]);

    carrinho.forEach(item => item.preco_unitario = Number(item.preco_unitario));

    if (carrinho.length === 0) return res.redirect('/loja/carrinho');

    const total = carrinho.reduce((acc, item) => acc + item.preco_unitario * item.quantidade, 0);

    const [formasPagamento] = await db.query('SELECT * FROM forma_pagamento');

    res.render('loja/checkout', { usuario: req.session.usuario, carrinho, total, formasPagamento });
  } catch (err) {
    console.error('Erro ao carregar checkout:', err);
    res.status(500).send('Erro ao carregar checkout');
  }
});

// =====================
// Finalizar pedido
// =====================
router.post('/checkout/finalizar', autenticar, async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const { forma_pagamento_id } = req.body;

    if (!forma_pagamento_id) return res.status(400).send('Selecione uma forma de pagamento.');

    // Pega o carrinho completo com preço correto (produto ou variação)
    const [carrinho] = await db.query(`
      SELECT 
        c.produto_id,
        c.variacao_id,
        COALESCE(v.preco, p.preco) AS preco_unitario,
        c.quantidade
      FROM carrinho c
      JOIN produtos p ON c.produto_id = p.id
      LEFT JOIN variacoes_produto v ON c.variacao_id = v.id
      WHERE c.usuario_id = ?
    `, [usuarioId]);

    if (carrinho.length === 0) return res.status(400).send('Nenhum produto no carrinho.');

    // Calcula total
    const total = carrinho.reduce((acc, item) => acc + Number(item.preco_unitario) * item.quantidade, 0);

    // Cria pedido
    const [pedidoResult] = await db.query(
      'INSERT INTO pedidos (usuario_id, data_pedido, total, forma_pagamento_id) VALUES (?, NOW(), ?, ?)',
      [usuarioId, total, forma_pagamento_id]
    );
    const pedidoId = pedidoResult.insertId;

    // Insere itens do pedido
    for (const item of carrinho) {
      await db.query(`
        INSERT INTO itens_pedido (pedido_id, produto_id, variacao_id, quantidade, preco_unit)
        VALUES (?, ?, ?, ?, ?)
      `, [pedidoId, item.produto_id, item.variacao_id || null, item.quantidade, item.preco_unitario]);
    }

    // Limpa carrinho
    await db.query('DELETE FROM carrinho WHERE usuario_id = ?', [usuarioId]);

    res.redirect('/loja/pedido-sucesso');
  } catch (err) {
    console.error('Erro ao finalizar pedido:', err);
    res.status(500).send('Erro ao finalizar pedido');
  }
});

// =====================
// Página de sucesso do pedido
// =====================
router.get('/pedido-sucesso', autenticar, (req, res) => {
  res.render('loja/pedidoSucesso', { usuario: req.session.usuario });
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
      WHERE p.usuario_id = ?
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
      WHERE p.id = ? AND p.usuario_id = ?
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
