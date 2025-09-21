const db = require('../config/database');

const Relatorio = {};

// Vendas por período (total vendido por produto)
Relatorio.vendasPorPeriodo = (inicio, fim) => new Promise((resolve, reject) => {
  const sql = `
    SELECT p.id, p.nome,
      SUM(ip.quantidade) AS total_vendido,
      SUM(ip.quantidade * ip.preco_unit) AS receita
    FROM pedidos ped
    JOIN itens_pedido ip ON ped.id = ip.pedido_id
    JOIN produtos p ON ip.produto_id = p.id
    WHERE ped.data_pedido BETWEEN ? AND ?
    GROUP BY p.id, p.nome
    ORDER BY receita DESC
  `;
  db.query(sql, [inicio, fim], (err, results) => err ? reject(err) : resolve(results));
});

// Pedidos por cliente
Relatorio.pedidosPorCliente = (clienteId) => new Promise((resolve, reject) => {
  const sql = `
    SELECT ped.id, ped.data_pedido, ped.status, ped.total,
      GROUP_CONCAT(CONCAT(p.nome, ' x', ip.quantidade) SEPARATOR ', ') AS itens
    FROM pedidos ped
    LEFT JOIN itens_pedido ip ON ped.id = ip.pedido_id
    LEFT JOIN produtos p ON ip.produto_id = p.id
    WHERE ped.cliente_id = ?
    GROUP BY ped.id
    ORDER BY ped.data_pedido DESC
  `;
  db.query(sql, [clienteId], (err, results) => err ? reject(err) : resolve(results));
});

module.exports = Relatorio;
