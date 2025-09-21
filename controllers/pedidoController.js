const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT * FROM Pedido', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.criar = (req, res) => {
  const { cliente_id, status, total } = req.body;
  db.query(
    'INSERT INTO Pedido (cliente_id, status, total) VALUES (?, ?, ?)',
    [cliente_id, status || 'pendente', total],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: results.insertId, cliente_id, total });
    }
  );
};

exports.buscarPorId = (req, res) => {
  db.query('SELECT * FROM Pedido WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
};

exports.atualizar = (req, res) => {
  const { status, total } = req.body;
  db.query(
    'UPDATE Pedido SET status=?, total=? WHERE id=?',
    [status, total, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Pedido atualizado com sucesso" });
    }
  );
};

exports.deletar = (req, res) => {
  db.query('DELETE FROM Pedido WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Pedido deletado com sucesso" });
  });
};
