const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Página de login
router.get('/login', (req, res) => {
  res.render('login', { erro: null });
});

// Login POST
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
    if (err || results.length === 0) {
      return res.render('login', { erro: 'Usuário não encontrado.' });
    }

    const usuario = results[0];
    if (usuario.senha !== senha) {
      return res.render('login', { erro: 'Senha incorreta.' });
    }

    // Salva sessão
    req.session.usuario = usuario;
    res.redirect('/loja');
  });
});

// Página de registro
router.get('/registro', (req, res) => {
  res.render('registro', { erro: null, sucesso: null });
});

// Registro POST
router.post('/registro', (req, res) => {
  const { nome, email, telefone, senha } = req.body;
  const tipo_usuario_id = 1; // cliente

  const query = `INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario_id) VALUES (?, ?, ?, ?, ?)`;

  db.query(query, [nome, email, telefone, senha, tipo_usuario_id], (err) => {
    if (err) {
      console.log(err);
      return res.render('registro', { erro: 'Erro ao registrar. Tente outro e-mail.', sucesso: null });
    }

    res.render('registro', { erro: null, sucesso: 'Cadastro realizado com sucesso! Faça login.' });
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/loja');
  });
});

module.exports = router;
