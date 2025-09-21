const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT * FROM Categoria', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.criar = (req, res) => {
  const { nome } = req.body;
  db.query('INSERT INTO Categoria (nome) VALUES (?)', [nome], 
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: results.insertId, nome });
    });
};

exports.buscarPorId = (req, res) => {
  db.query('SELECT * FROM Categoria WHERE id = ?', [req.params.id], 
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result[0]);
    });
};

exports.atualizar = (req, res) => {
  const { nome } = req.body;
  db.query('UPDATE Categoria SET nome = ? WHERE id = ?', [nome, req.params.id], 
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Categoria atualizada com sucesso" });
    });
};

exports.deletar = (req, res) => {
  db.query('DELETE FROM Categoria WHERE id = ?', [req.params.id], 
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Categoria deletada com sucesso" });
    });
};
