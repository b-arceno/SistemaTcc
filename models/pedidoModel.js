const db = require('../config/database');

// =====================
// LISTAR TODOS (Admin)
// =====================
exports.getAll = (cb) => {
  const sql = `
    SELECT ped.*, u.nome AS cliente_nome, u.email AS cliente_email
    FROM pedidos ped
    LEFT JOIN usuarios u ON ped.usuario_id = u.id
    ORDER BY ped.id DESC
  `;
  db.query(sql, cb);
};

// =====================
// BUSCAR POR ID
// =====================
exports.getById = (id, cb) => {
  const sql = `
    SELECT ped.*, u.nome AS cliente_nome, u.email AS cliente_email
    FROM pedidos ped
    LEFT JOIN usuarios u ON ped.usuario_id = u.id
    WHERE ped.id = ?
  `;
  db.query(sql, [id], cb);
};

// =====================
// CRIAR PEDIDO
// =====================
exports.create = (pedido, cb) => {
  const sql = `
    INSERT INTO pedidos (usuario_id, status, total, forma_pagamento, data_pedido)
    VALUES (?, ?, ?, ?, NOW())
  `;
  db.query(sql, [pedido.usuario_id, pedido.status, pedido.total, pedido.forma_pagamento], cb);
};

// =====================
// ATUALIZAR STATUS
// =====================
exports.updateStatus = (id, status, cb) => {
  const sql = 'UPDATE pedidos SET status=? WHERE id=?';
  db.query(sql, [status, id], cb);
};

// =====================
// DELETAR PEDIDO
// =====================
exports.delete = (id, cb) => {
  const sql = 'DELETE FROM pedidos WHERE id=?';
  db.query(sql, [id], cb);
};

// =====================
// LISTAR PEDIDOS DE UM USUÁRIO (cliente logado)
// =====================
exports.getByUsuario = (usuarioId, cb) => {
  const sql = `
    SELECT * FROM pedidos
    WHERE usuario_id = ?
    ORDER BY data_pedido DESC
  `;
  db.query(sql, [usuarioId], cb);
};
