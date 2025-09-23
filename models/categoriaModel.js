const db = require('../config/database');

exports.getAll = (cb) => db.query('SELECT * FROM categoria_produto', cb);
exports.getById = (id, cb) => db.query('SELECT * FROM categoria_produto WHERE id=?', [id], cb);
exports.create = (categoria, cb) => db.query(
  'INSERT INTO categoria_produto (nome, descricao) VALUES (?, ?)',
  [categoria.nome, categoria.descricao], cb
);
exports.update = (id, categoria, cb) => db.query(
  'UPDATE categoria_produto SET nome=?, descricao=? WHERE id=?',
  [categoria.nome, categoria.descricao, id], cb
);
exports.delete = (id, cb) => db.query('DELETE FROM categoria_produto WHERE id=?', [id], cb);
