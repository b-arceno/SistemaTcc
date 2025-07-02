const Produto = require('../models/produtoModel');
const db = require('../config/database');

// Mostrar todos os produtos
exports.listar = (req, res) => {
  const termoBusca = req.query.busca || '';

  Produto.listarTodos((err, produtos) => {
    if (err) return res.send('Erro ao listar produtos');

    produtos = produtos
      .filter(p => p.nome.toLowerCase().includes(termoBusca.toLowerCase()))
      .map(p => ({ ...p, preco: Number(p.preco) }));

    res.render('produtos/listar', { produtos, termoBusca });
  });
};

// Formulário para novo produto
exports.novo = (req, res) => {
  db.query('SELECT * FROM categoria_produto', (err, categorias) => {
    if (err) return res.send('Erro ao buscar categorias');
    res.render('produtos/novo', { categorias });
  });
};

// Inserir novo produto no banco
exports.inserir = (req, res) => {
  const imagem = req.file ? req.file.filename : null;

  const novoProduto = {
    ...req.body,
    imagem
  };

  Produto.inserir(novoProduto, (err, resultado) => {
    if (err) return res.send('Erro ao inserir produto');
    res.redirect('/produtos');
  });
};



// Formulário de edição
exports.editar = (req, res) => {
  const id = req.params.id;

  Produto.buscarPorId(id, (err, resultados) => {
    if (err || resultados.length === 0) return res.send('Produto não encontrado');

    const produto = { ...resultados[0], preco: Number(resultados[0].preco) };

    db.query('SELECT * FROM categoria_produto', (err2, categorias) => {
      if (err2) return res.send('Erro ao buscar categorias');
      res.render('produtos/editar', { produto, categorias });
    });
  });
};

// Atualizar produto
exports.atualizar = (req, res) => {
  const id = req.params.id;
  const dadosAtualizados = req.body;

  Produto.atualizar(id, dadosAtualizados, (err, resultado) => {
    if (err) return res.send('Erro ao atualizar produto');
    res.redirect('/produtos');
  });
};

// Excluir produto
exports.excluir = (req, res) => {
  const id = req.params.id;

  Produto.excluir(id, (err, resultado) => {
    if (err) return res.send('Erro ao excluir produto');
    res.redirect('/produtos');
  });
};
