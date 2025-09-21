const db = require('../config/database');
const bcrypt = require('bcrypt');

exports.listar = (req, res) => {
  db.query('SELECT * FROM Admin', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.criar = async (req, res) => {
  const { nome, email, senha } = req.body;
  const senhaHash = await bcrypt.hash(senha, 10);

  db.query('INSERT INTO Admin (nome, email, senha) VALUES (?, ?, ?)', 
    [nome, email, senhaHash], 
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: results.insertId, nome, email });
    });
};

exports.buscarPorId = (req, res) => {
  db.query('SELECT * FROM Admin WHERE id = ?', [req.params.id], 
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result[0]);
    });
};

exports.atualizar = (req, res) => {
  const { nome, email } = req.body;
  db.query('UPDATE Admin SET nome = ?, email = ? WHERE id = ?', 
    [nome, email, req.params.id], 
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Admin atualizado com sucesso" });
    });
};

exports.deletar = (req, res) => {
  db.query('DELETE FROM Admin WHERE id = ?', [req.params.id], 
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Admin deletado com sucesso" });
    });
};

exports.login = (req, res) => {
  const { email, senha } = req.body;

  db.query('SELECT * FROM Admin WHERE email = ?', [email], async (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(404).json({ error: "Admin não encontrado" });

    const admin = result[0];
    const senhaValida = await bcrypt.compare(senha, admin.senha);

    if (!senhaValida) return res.status(401).json({ error: "Senha inválida" });

    res.json({ message: "Login realizado com sucesso", admin: { id: admin.id, nome: admin.nome, email: admin.email } });
  });
};
