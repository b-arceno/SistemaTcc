const bcrypt = require('bcrypt'); // se quiser usar senha criptografada
const db = require('../config/database');

// LOGIN
exports.login = (req, res) => {
  const { email, senha } = req.body;

  // Admin fixo
  if (email === "adminconfeitaria@gmail.com" && senha === "35331042") {
    req.session.usuario = { email, tipo: "admin" };
    return res.json({ message: "Login admin realizado", tipo: "admin" });
  }

  // Cliente cadastrado no BD
  const sql = "SELECT * FROM clientes WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no banco" });
    if (results.length === 0) return res.status(401).json({ error: "Usuário não encontrado" });

    const cliente = results[0];

    if (senha === cliente.senha) { // ou bcrypt.compareSync
      req.session.usuario = { id: cliente.id, email: cliente.email, tipo: "cliente" };
      return res.json({ message: "Login cliente realizado", tipo: "cliente" });
    } else {
      return res.status(401).json({ error: "Senha incorreta" });
    }
  });
};

// LOGOUT
exports.logout = (req, res) => {
  req.session.destroy();
  res.json({ message: "Logout feito" });
};
