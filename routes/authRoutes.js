const express = require('express');
const router = express.Router();
const db = require('../config/database'); // promise
const bcrypt = require('bcrypt'); // se tiver senha criptografada

// Página de login
router.get('/login', (req, res) => {
  res.render('login'); // cria views/login.ejs
});

// Autenticar login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [usuarios] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (usuarios.length === 0) return res.send("Usuário não encontrado");

    const usuario = usuarios[0];

    // Se a senha estiver criptografada
    // const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    // if (!senhaCorreta) return res.send("Senha incorreta");

    // Se não estiver criptografada, só compara direto:
    if (usuario.senha !== senha) return res.send("Senha incorreta");

    // Salva usuário na sessão
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      tipo_usuario_id: usuario.tipo_usuario_id
    };

    res.redirect('/loja');
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao fazer login");
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
