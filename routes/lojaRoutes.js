const express = require('express');
const router = express.Router();
const db = require('../config/database'); // promise
const { autenticar } = require('../middlewares/auth');

// ------------------------
// Página inicial da Loja (ABERTA)
// ------------------------
router.get('/', async (req, res) => {
  res.render('loja/index', { usuario: req.session.usuario || null });
});

// ------------------------
// Listar todos os produtos (ABERTA)
// ------------------------
router.get('/produtos', async (req, res) => {
  try {
    const [produtos] = await db.query("SELECT * FROM produtos");
    res.render('loja/produtos', { usuario: req.session.usuario || null, produtos });
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    res.status(500).send("Erro ao carregar produtos");
  }
});

// ------------------------
// Listar categorias (ABERTA)
// ------------------------
router.get('/categorias', async (req, res) => {
  try {
    const [categorias] = await db.query("SELECT * FROM categorias");
    res.render('loja/categorias', { usuario: req.session.usuario || null, categorias });
  } catch (err) {
    console.error("Erro ao buscar categorias:", err);
    res.status(500).send("Erro ao carregar categorias");
  }
});

// ------------------------
// Produtos de uma categoria (ABERTA)
// ------------------------
router.get('/categoria/:id', async (req, res) => {
  try {
    const categoriaId = req.params.id;
    const [categoria] = await db.query("SELECT nome FROM categorias WHERE id = ?", [categoriaId]);
    if (categoria.length === 0) return res.status(404).send("Categoria não encontrada");

    const [produtos] = await db.query("SELECT * FROM produtos WHERE categoria_id = ?", [categoriaId]);
    res.render('loja/produtos', {
      usuario: req.session.usuario || null,
      produtos,
      categoriaNome: categoria[0].nome
    });
  } catch (err) {
    console.error("Erro ao buscar produtos da categoria:", err);
    res.status(500).send("Erro ao carregar produtos da categoria");
  }
});

// ------------------------
// Detalhes de um produto (ABERTA)
// ------------------------
router.get('/produto/:id', async (req, res) => {
  try {
    const produtoId = req.params.id;
    const [produto] = await db.query("SELECT * FROM produtos WHERE id = ?", [produtoId]);
    if (produto.length === 0) return res.status(404).send("Produto não encontrado");

    res.render('loja/detalhes', { usuario: req.session.usuario || null, produto: produto[0] });
  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    res.status(500).send("Erro ao carregar detalhes do produto");
  }
});

// ------------------------
// Carrinho do usuário (PROTEGIDO)
// ------------------------
router.get('/carrinho', autenticar, (req, res) => {
  const carrinho = req.session.carrinho || [];
  res.render('loja/carrinho', { usuario: req.session.usuario, carrinho });
});

router.post('/carrinho/adicionar', autenticar, (req, res) => {
  const { produtoId, nome, preco, quantidade } = req.body;
  if (!req.session.carrinho) req.session.carrinho = [];

  const itemIndex = req.session.carrinho.findIndex(p => p.produtoId == produtoId);
  if (itemIndex >= 0) {
    req.session.carrinho[itemIndex].quantidade += parseInt(quantidade);
  } else {
    req.session.carrinho.push({ produtoId, nome, preco: parseFloat(preco), quantidade: parseInt(quantidade) });
  }

  res.redirect('/loja/carrinho');
});

router.post('/carrinho/atualizar', autenticar, (req, res) => {
  const { produtoId, quantidade } = req.body;
  const carrinho = req.session.carrinho || [];
  const item = carrinho.find(p => p.produtoId == produtoId);
  if (item) item.quantidade = parseInt(quantidade);
  res.redirect('/loja/carrinho');
});

router.post('/carrinho/remover', autenticar, (req, res) => {
  const { produtoId } = req.body;
  req.session.carrinho = (req.session.carrinho || []).filter(p => p.produtoId != produtoId);
  res.redirect('/loja/carrinho');
});

// ------------------------
// Checkout e finalização de pedido (PROTEGIDO)
// ------------------------
router.get('/checkout', autenticar, (req, res) => {
  const carrinho = req.session.carrinho || [];
  res.render('loja/checkout', { usuario: req.session.usuario, carrinho });
});

router.post('/finalizar', autenticar, async (req, res) => {
  try {
    const carrinho = req.session.carrinho || [];
    if (carrinho.length === 0) return res.redirect('/loja/carrinho');

    const { forma_pagamento } = req.body;

    // Inserir pedido
    const [resultado] = await db.query(
      "INSERT INTO pedidos (cliente_id, data_pedido, status_id, forma_pagamento_id) VALUES (?, NOW(), 1, ?)",
      [req.session.usuario.id, forma_pagamento]
    );

    const pedidoId = resultado.insertId;

    // Inserir itens do pedido
    for (let item of carrinho) {
      await db.query(
        "INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)",
        [pedidoId, item.produtoId, item.quantidade, item.preco]
      );
    }

    // Limpar carrinho
    req.session.carrinho = [];
    res.redirect('/loja/pedidos');
  } catch (err) {
    console.error("Erro ao finalizar pedido:", err);
    res.status(500).send("Erro ao finalizar pedido");
  }
});

// ------------------------
// Listar pedidos do usuário (PROTEGIDO)
// ------------------------
router.get('/pedidos', autenticar, async (req, res) => {
  try {
    const [pedidos] = await db.query(
      `SELECT p.id, p.data_pedido, sp.descricao AS status_pedido, fp.descricao AS forma_pagamento
       FROM pedidos p
       JOIN status_pedido sp ON p.status_id = sp.id
       JOIN forma_pagamento fp ON p.forma_pagamento_id = fp.id
       WHERE p.cliente_id = ?`,
      [req.session.usuario.id]
    );
    res.render('loja/pedidos', { usuario: req.session.usuario, pedidos });
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err);
    res.status(500).send("Erro ao carregar pedidos");
  }
});

module.exports = router;
