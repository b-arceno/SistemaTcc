  const db = require('../config/database');

  const Produto = {};

  // Listar todos os produtos
  Produto.listarTodos = (callback) => {
    db.query('SELECT * FROM produtos', callback);
  };

  // Buscar produto por ID
  Produto.buscarPorId = (id, callback) => {
    db.query('SELECT * FROM produtos WHERE id = ?', [id], callback);
  };

  // Inserir novo produto
  Produto.inserir = (produto, callback) => {
    const sql = `
      INSERT INTO produtos (nome, descricao, preco, categoria_id, imagem)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
      produto.nome,
      produto.descricao,
      produto.preco,
      produto.categoria_id,
      produto.imagem
    ];
    db.query(sql, values, callback);
  };

  // Atualizar produto
  Produto.atualizar = (id, produto, callback) => {
    const sql = `
      UPDATE produtos
      SET nome = ?, descricao = ?, preco = ?, categoria_id = ?, imagem = ?
      WHERE id = ?
    `;
    const values = [
      produto.nome,
      produto.descricao,
      produto.preco,
      produto.categoria_id,
      produto.imagem || null,
      id
    ];
    db.query(sql, values, callback);
  };

  // Excluir produto
  Produto.excluir = (id, callback) => {
    db.query('DELETE FROM produtos WHERE id = ?', [id], callback);
  };

  module.exports = Produto;
