// routes/index.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // já é mysql2/promise
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');

// ------------------------
// LOGIN
// ------------------------
router.get('/login', (req, res) => {
  res.render('login', { erro: null });
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [results] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.render('login', { erro: 'Usuário não encontrado.' });
    }

    const usuario = results[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.render('login', { erro: 'Senha incorreta.' });
    }

    req.session.usuario = usuario;

    // Redireciona conforme tipo
    if (usuario.tipo_usuario_id === 1) {
      res.redirect('/admin');
    } else {
      res.redirect('/loja');
    }
  } catch (err) {
    console.error(err);
    res.render('login', { erro: 'Erro no servidor.' });
  }
});

// ------------------------
// REGISTRO
// ------------------------
router.get('/registro', (req, res) => {
  res.render('registro', { erro: null, sucesso: null });
});

router.post('/registro', async (req, res) => {
  try {
    const { nome, email, telefone, senha } = req.body;
    const tipo_usuario_id = 2; // Cliente

    const hash = await bcrypt.hash(senha, 10);

    await db.query(
      'INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario_id) VALUES (?, ?, ?, ?, ?)',
      [nome, email, telefone, hash, tipo_usuario_id]
    );

    res.render('registro', { erro: null, sucesso: 'Cadastro realizado com sucesso! Faça login.' });
  } catch (err) {
    console.error(err);
    res.render('registro', { erro: 'Erro ao registrar. Tente outro e-mail.', sucesso: null });
  }
});

// ------------------------
// LOGOUT
// ------------------------
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// ------------------------
// ESQUECEU SENHA
// ------------------------
router.get('/esqueceu-senha', (req, res) => {
  res.render('senha', { token: null, mensagem: null });
});

router.post('/esqueceu-senha', async (req, res) => {
  const { email } = req.body;

  try {
    const [results] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.render('senha', { token: null, mensagem: 'E-mail não cadastrado!' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expira = new Date(Date.now() + 3600000); // 1h

    await db.query(
      'UPDATE usuarios SET reset_token=?, reset_token_expira=? WHERE email=?',
      [token, expira, email]
    );

    const resetLink = `${process.env.APP_URL}/reset/${token}`;

    try {
      await sendMail({
        to: email,
        subject: 'Recuperação de Senha',
        text: `Use este link para redefinir sua senha: ${resetLink}`,
        html: `
          <p>Você solicitou a redefinição de senha.</p>
          <p><a href="${resetLink}" style="padding:10px 16px; border-radius:8px; text-decoration:none; background:#4f46e5; color:#fff;">Redefinir Senha</a></p>
          <p>Se preferir, copie e cole no navegador: ${resetLink}</p>
          <p><small>O link expira em 1 hora.</small></p>
        `,
      });

      return res.render('senha', { token: null, mensagem: 'Enviamos um link de recuperação para o seu e-mail.' });
    } catch (e) {
      console.error(e);
      return res.render('senha', { token: null, mensagem: 'Falha ao enviar e-mail.' });
    }
  } catch (err) {
    console.error(err);
    res.render('senha', { token: null, mensagem: 'Erro no servidor.' });
  }
});

// ------------------------
// RESET DE SENHA
// ------------------------
router.get('/reset/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const [results] = await db.query(
      'SELECT * FROM usuarios WHERE reset_token=? AND reset_token_expira > NOW()',
      [token]
    );

    if (results.length === 0) {
      return res.send('Token inválido ou expirado!');
    }

    res.render('senha', { token, mensagem: null });
  } catch (err) {
    console.error(err);
    res.send('Erro no servidor.');
  }
});

router.post('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { senha, confirma } = req.body;

  if (senha !== confirma) {
    return res.render('senha', { token, mensagem: 'As senhas não coincidem!' });
  }

  try {
    const hash = await bcrypt.hash(senha, 10);

    await db.query(
      'UPDATE usuarios SET senha=?, reset_token=NULL, reset_token_expira=NULL WHERE reset_token=?',
      [hash, token]
    );

    res.send('Senha redefinida com sucesso! Você já pode fazer login.');
  } catch (err) {
    console.error(err);
    res.send('Erro ao salvar nova senha.');
  }
});

module.exports = router;
