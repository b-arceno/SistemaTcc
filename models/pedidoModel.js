const db = require('../config/database');

const Pedido = {};

Pedido.listarTodos = () => new Promise((resolve, reject) => {
  const sql = `
    SELECT ped.*, c.nome AS cliente_nome
    FROM pedidos ped
    LEFT JOIN clientes c ON ped.cliente_id = c.id
    ORDER BY ped.id DESC
  `;
  db.query(sql, (err, results) => err ? reject(err) : resolve(results));
});

Pedido.buscarPorId = (id) => new Promise((resolve, reject) => {
  db.query('SELECT * FROM pedidos WHERE id = ?', [id], (err, results) => err ? reject(err) : resolve(results[0]));
});

Pedido.inserir = (pedido) => new Promise((resolve, reject) => {
  const sql = 'INSERT INTO pedidos (cliente_id, data_pedido, status, total) VALUES (?, ?, ?, ?)';
  const values = [pedido.cliente_id, pedido.data_pedido, pedido.status, pedido.total];
  db.query(sql, values, (err, result) => err ? reject(err) : resolve(result));
});

Pedido.atualizar = (id, pedido) => new Promise((resolve, reject) => {
  const sql = 'UPDATE pedidos SET cliente_id = ?, data_pedido = ?, status = ?, total = ? WHERE id = ?';
  db.query(sql, [pedido.cliente_id, pedido.data_pedido, pedido.status, pedido.total, id], (err, result) => err ? reject(err) : resolve(result));
});

Pedido.excluir = (id) => new Promise((resolve, reject) => {
  db.query('DELETE FROM pedidos WHERE id = ?', [id], (err, result) => err ? reject(err) : resolve(result));
});

module.exports = Pedido;
