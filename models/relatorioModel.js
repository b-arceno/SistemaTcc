const db = require('../config/database');

const Relatorio = {};

Relatorio.vendasPorPeriodo = (inicio, fim) => new Promise((resolve, reject) => {
  const sql = `
    SELECT p.id, p.nome,
      SUM(ip.quantidade) AS total_vendido,
      SUM(ip.quantidade * ip.preco) AS receita
    FROM pedidos ped
    JOIN itens_pedido ip ON ped.id = ip.pedido_id
    JOIN produtos p ON ip.produto_id = p.id
    WHERE ped.data_pedido BETWEEN ? AND ?
    GROUP BY p.id, p.nome
    ORDER BY receita DESC
  `;
  db.query(sql, [inicio, fim], (err, results) => err ? reject(err) : resolve(results));
});

Relatorio.pedidosPorCliente = (clienteId) => new Promise((resolve, reject) => {
  db.query('SELECT * FROM pedidos WHERE cliente_id = ? ORDER BY data_pedido DESC', [clienteId], (err, results) => err ? reject(err) : resolve(results));
});

module.exports = Relatorio;
