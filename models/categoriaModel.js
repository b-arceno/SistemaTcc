const db = require('../config/db');

exports.getAll = (cb) => db.query('SELECT * FROM categorias', cb);
exports.getById = (id, cb) => db.query('SELECT * FROM categorias WHERE id=?', [id], cb);
exports.create = (categoria, cb) => db.query('INSERT INTO categorias (nome, descricao) VALUES (?,?)',
  [categoria.nome, categoria.descricao], cb);
exports.update = (id, categoria, cb) => db.query('UPDATE categorias SET nome=?, descricao=? WHERE id=?',
  [categoria.nome, categoria.descricao, id], cb);
exports.delete = (id, cb) => db.query('DELETE FROM categorias WHERE id=?', [id], cb);
