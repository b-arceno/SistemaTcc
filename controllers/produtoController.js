const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT * FROM Produto', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.criar = (req, res) => {
  const { nome, descricao, preco, categoria_id, imagem } = req.body;
  db.query(
    'INSERT INTO Produto (nome, descricao, preco, categoria_id, imagem) VALUES (?, ?, ?, ?, ?)',
    [nome, descricao, preco, categoria_id, imagem],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: results.insertId, nome, preco });
    }
  );
};

exports.buscarPorId = (req, res) => {
  db.query('SELECT * FROM Produto WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
};

exports.atualizar = (req, res) => {
  const { nome, descricao, preco, categoria_id, imagem } = req.body;
  db.query(
    'UPDATE Produto SET nome=?, descricao=?, preco=?, categoria_id=?, imagem=? WHERE id=?',
    [nome, descricao, preco, categoria_id, imagem, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Produto atualizado com sucesso" });
    }
  );
};

exports.deletar = (req, res) => {
  db.query('DELETE FROM Produto WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Produto deletado com sucesso" });
  });
};
