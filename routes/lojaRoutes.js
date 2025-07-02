const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Página inicial da loja — lista de categorias
router.get('/', (req, res) => {
  db.query('SELECT * FROM categoria_produto', (err, categorias) => {
    if (err) return res.send('Erro ao carregar categorias');
    res.render('loja/categorias', { categorias, session: req.session });
  });
});

// Produtos da categoria selecionada
router.get('/categoria/:id', (req, res) => {
  const categoriaId = req.params.id;

  const sql = `
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    JOIN categoria_produto c ON p.categoria_id = c.id
    WHERE p.categoria_id = ?
  `;

  db.query(sql, [categoriaId], (err, produtos) => {
    if (err) return res.send('Erro ao carregar produtos');

    const produtosFormatados = produtos.map(p => ({
      ...p,
      preco: Number(p.preco)
    }));

    res.render('loja/produtos', {
      produtos: produtosFormatados,
      categoriaNome: produtos[0] ? produtos[0].categoria_nome : 'Categoria',
      session: req.session
    });
  });
});

// Página de detalhes de um produto
router.get('/produto/:id', (req, res) => {
  const produtoId = req.params.id;

  const sql = `
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    JOIN categoria_produto c ON p.categoria_id = c.id
    WHERE p.id = ?
  `;

  db.query(sql, [produtoId], (err, resultados) => {
    if (err) return res.send('Erro ao carregar produto');
    if (resultados.length === 0) return res.send('Produto não encontrado');

    const produto = {
      ...resultados[0],
      preco: Number(resultados[0].preco)
    };

    res.render('loja/detalhes', { produto, session: req.session });
  });
});

// Página do carrinho
router.get('/carrinho', (req, res) => {
  const carrinho = req.session.carrinho || [];
  res.render('loja/carrinho', { carrinho, session: req.session });
});

// Adicionar produto ao carrinho
router.post('/carrinho/adicionar', (req, res) => {
  const { produtoId, nome, preco } = req.body;
  const quantidade = parseInt(req.body.quantidade) || 1;

  if (!req.session.carrinho) {
    req.session.carrinho = [];
  }

  const index = req.session.carrinho.findIndex(item => item.produtoId == produtoId);
  if (index !== -1) {
    req.session.carrinho[index].quantidade += quantidade;
  } else {
    req.session.carrinho.push({ produtoId, nome, preco: parseFloat(preco), quantidade });
  }

  res.redirect('/loja/carrinho');
});
// Adicionar ao carrinho
router.post('/carrinho/adicionar', (req, res) => {
  const { produtoId, nome, preco, quantidade } = req.body;

  if (!req.session.carrinho) {
    req.session.carrinho = [];
  }

  const existente = req.session.carrinho.find(p => p.produtoId == produtoId);
  if (existente) {
    existente.quantidade += parseInt(quantidade);
  } else {
    req.session.carrinho.push({
      produtoId,
      nome,
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade)
    });
  }

  res.redirect('/loja/carrinho');
});

// Visualizar carrinho
router.get('/carrinho', (req, res) => {
  res.render('loja/carrinho');
});

module.exports = router;
