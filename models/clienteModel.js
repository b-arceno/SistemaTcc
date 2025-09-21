const db = require('../config/db');

exports.getAll = (cb) => db.query('SELECT * FROM clientes', cb);
exports.getById = (id, cb) => db.query('SELECT * FROM clientes WHERE id=?', [id], cb);
exports.create = (cliente, cb) => db.query(
  'INSERT INTO clientes (nome, email, telefone) VALUES (?,?,?)',
  [cliente.nome, cliente.email, cliente.telefone], cb
);
exports.update = (id, cliente, cb) => db.query(
  'UPDATE clientes SET nome=?, email=?, telefone=? WHERE id=?',
  [cliente.nome, cliente.email, cliente.telefone, id], cb
);
exports.delete = (id, cb) => db.query('DELETE FROM clientes WHERE id=?', [id], cb);
