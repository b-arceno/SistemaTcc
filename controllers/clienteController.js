const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT * FROM Cliente', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.criar = (req, res) => {
  const { nome, email, telefone, endereco } = req.body;
  db.query('INSERT INTO Cliente (nome, email, telefone, endereco) VALUES (?, ?, ?, ?)', 
    [nome, email, telefone, endereco], 
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: results.insertId, nome, email });
    });
};

exports.buscarPorId = (req, res) => {
  db.query('SELECT * FROM Cliente WHERE id = ?', [req.params.id], 
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result[0]);
    });
};

exports.atualizar = (req, res) => {
  const { nome, email, telefone, endereco } = req.body;
  db.query('UPDATE Cliente SET nome=?, email=?, telefone=?, endereco=? WHERE id=?', 
    [nome, email, telefone, endereco, req.params.id], 
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Cliente atualizado com sucesso" });
    });
};

exports.deletar = (req, res) => {
  db.query('DELETE FROM Cliente WHERE id = ?', [req.params.id], 
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Cliente deletado com sucesso" });
    });
};
