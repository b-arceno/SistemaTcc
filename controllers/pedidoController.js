const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT id, cliente_id, status, total, data_pedido FROM Pedido', (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar pedidos', detail: err.message });
    res.json(results);
  });
};

exports.criar = (req, res) => {
  const { cliente_id, status, total } = req.body;
  const cid = parseInt(cliente_id);
  const tot = parseFloat(total);

  if (Number.isNaN(cid) || Number.isNaN(tot)) return res.status(400).json({ error: 'Dados inválidos' });

  db.query('INSERT INTO Pedido (cliente_id, status, total) VALUES (?, ?, ?)', [cid, status || 'pendente', tot], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao criar pedido', detail: err.message });
    res.status(201).json({ id: results.insertId, cliente_id: cid, total: tot });
  });
};

exports.buscarPorId = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('SELECT id, cliente_id, status, total, data_pedido FROM Pedido WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar pedido', detail: err.message });
    if (!result[0]) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(result[0]);
  });
};

exports.atualizar = (req, res) => {
  const id = parseInt(req.params.id);
  const { status, total } = req.body;
  const tot = parseFloat(total);

  if (Number.isNaN(id) || Number.isNaN(tot)) return res.status(400).json({ error: 'Dados inválidos' });

  db.query('UPDATE Pedido SET status=?, total=? WHERE id=?', [status, tot, id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao atualizar pedido', detail: err.message });
    res.json({ message: 'Pedido atualizado com sucesso' });
  });
};

exports.deletar = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('DELETE FROM Pedido WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao deletar pedido', detail: err.message });
    res.json({ message: 'Pedido deletado com sucesso' });
  });
};
