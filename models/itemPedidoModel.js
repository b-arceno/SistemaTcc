const db = require('../config/database');

exports.getByPedido = (pedidoId, cb) => {
  const sql = `
    SELECT ip.*, p.nome AS produto_nome
    FROM itens_pedido ip
    LEFT JOIN produtos p ON ip.produto_id = p.id
    WHERE ip.pedido_id = ?
  `;
  db.query(sql, [pedidoId], cb);
};

exports.create = (item, cb) => {
  const sql = `
    INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [item.pedido_id, item.produto_id, item.quantidade, item.preco_unitario], cb);
};
