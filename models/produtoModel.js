const db = require('../config/database');

const Produto = {};

Produto.listarTodos = () => new Promise((resolve, reject) => {
  const sql = `
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, results) => err ? reject(err) : resolve(results));
});

Produto.buscarPorId = (id) => new Promise((resolve, reject) => {
  const sql = 'SELECT * FROM produtos WHERE id = ?';
  db.query(sql, [id], (err, results) => err ? reject(err) : resolve(results[0]));
});

Produto.inserir = (produto) => new Promise((resolve, reject) => {
  const sql = `INSERT INTO produtos (nome, descricao, preco, categoria_id, imagem) VALUES (?, ?, ?, ?, ?)`;
  const values = [
    produto.nome,
    produto.descricao,
    produto.preco,
    produto.categoria_id || null,
    produto.imagem || null
  ];
  db.query(sql, values, (err, result) => err ? reject(err) : resolve(result));
});

Produto.atualizar = (id, produto) => new Promise((resolve, reject) => {
  const sql = `UPDATE produtos SET nome = ?, descricao = ?, preco = ?, categoria_id = ?, imagem = ? WHERE id = ?`;
  const values = [
    produto.nome,
    produto.descricao,
    produto.preco,
    produto.categoria_id || null,
    produto.imagem || null,
    id
  ];
  db.query(sql, values, (err, result) => err ? reject(err) : resolve(result));
});

Produto.excluir = (id) => new Promise((resolve, reject) => {
  db.query('DELETE FROM produtos WHERE id = ?', [id], (err, result) => err ? reject(err) : resolve(result));
});

module.exports = Produto;
