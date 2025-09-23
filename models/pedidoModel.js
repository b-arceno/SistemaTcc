const db = require('../config/database');

exports.getAll = (cb) => {
  const sql = `
    SELECT ped.*, c.nome AS cliente_nome
    FROM pedidos ped
    LEFT JOIN clientes c ON ped.cliente_id = c.id
    ORDER BY ped.id DESC
  `;
  db.query(sql, cb);
};

exports.getById = (id, cb) => db.query('SELECT * FROM pedidos WHERE id=?', [id], cb);

exports.create = (pedido, cb) => {
  const sql = 'INSERT INTO pedidos (cliente_id, status, total) VALUES (?, ?, ?)';
  db.query(sql, [pedido.cliente_id, pedido.status, pedido.total], cb);
};

exports.updateStatus = (id, status, cb) => {
  db.query('UPDATE pedidos SET status=? WHERE id=?', [status, id], cb);
};

exports.delete = (id, cb) => db.query('DELETE FROM pedidos WHERE id=?', [id], cb);
