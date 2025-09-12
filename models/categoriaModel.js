const db = require('../config/database');

const Categoria = {};

Categoria.listarTodos = () => new Promise((resolve, reject) => {
  db.query('SELECT * FROM categorias ORDER BY id DESC', (err, results) => err ? reject(err) : resolve(results));
});

Categoria.buscarPorId = (id) => new Promise((resolve, reject) => {
  db.query('SELECT * FROM categorias WHERE id = ?', [id], (err, results) => err ? reject(err) : resolve(results[0]));
});

Categoria.inserir = (categoria) => new Promise((resolve, reject) => {
  db.query('INSERT INTO categorias (nome, descricao) VALUES (?, ?)', [categoria.nome, categoria.descricao], (err, result) => err ? reject(err) : resolve(result));
});

Categoria.atualizar = (id, categoria) => new Promise((resolve, reject) => {
  db.query('UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?', [categoria.nome, categoria.descricao, id], (err, result) => err ? reject(err) : resolve(result));
});

Categoria.excluir = (id) => new Promise((resolve, reject) => {
  db.query('DELETE FROM categorias WHERE id = ?', [id], (err, result) => err ? reject(err) : resolve(result));
});

module.exports = Categoria;
