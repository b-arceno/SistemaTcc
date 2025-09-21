const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT * FROM ItemPedido', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.criar = (req, res) => {
  const { pedido_id, produto_id, quantidade, preco } = req.body;
  db.query(
    'INSERT INTO ItemPedido (pedido_id, produto_id, quantidade, preco) VALUES (?, ?, ?, ?)',
    [pedido_id, produto_id, quantidade, preco],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: results.insertId, pedido_id, produto_id, quantidade });
    }
  );
};

exports.buscarPorId = (req, res) => {
  db.query('SELECT * FROM ItemPedido WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
};

exports.atualizar = (req, res) => {
  const { quantidade, preco } = req.body;
  db.query(
    'UPDATE ItemPedido SET quantidade=?, preco=? WHERE id=?',
    [quantidade, preco, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "ItemPedido atualizado com sucesso" });
    }
  );
};

exports.deletar = (req, res) => {
  db.query('DELETE FROM ItemPedido WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "ItemPedido deletado com sucesso" });
  });
};
