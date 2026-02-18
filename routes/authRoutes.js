// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const transporter = require('../config/email');

// ================= LOGIN =================
router.get('/login', (req, res) => {
  res.render('login', { erro: null });
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (usuarios.length === 0) {
      return res.render('login', { erro: 'Email ou senha incorretos.' });
    }

    const usuario = usuarios[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha);

    if (!senhaOk) {
      return res.render('login', { erro: 'Email ou senha incorretos.' });
    }

    // Cria sessão
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo_usuario_id: usuario.tipo_usuario_id || 2
    };

    req.session.save(() => {
      if (usuario.tipo_usuario_id === 1) res.redirect('/admin');
      else res.redirect('/loja');
    });

  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).send('Erro no servidor.');
  }
});

// ================= REGISTRO =================
router.get('/registro', (req, res) => {
  res.render('registro', { erro: null, sucesso: null });
});

router.post('/registro', async (req, res) => {
  try {
    const { nome, email, telefone, senha } = req.body;

    const [existe] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existe.length > 0) {
      return res.render('registro', { erro: 'E-mail já cadastrado.', sucesso: null });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    await db.query(
      'INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario_id) VALUES (?, ?, ?, ?, ?)',
      [nome, email, telefone, senhaHash, 2]
    );

    res.render('registro', { erro: null, sucesso: 'Cadastro realizado com sucesso! Faça login.' });

  } catch (err) {
    console.error('Erro ao registrar:', err);
    res.status(500).send('Erro ao registrar usuário.');
  }
});

// ================= ESQUECEU A SENHA =================
router.get('/esqueceu-senha', (req, res) => {
  res.render('senha', { mensagem: null, token: null });
});

router.post('/esqueceu-senha', async (req, res) => {
  try {
    const { email } = req.body;
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (usuarios.length === 0) {
      return res.render('senha', { mensagem: 'E-mail não encontrado!', token: null });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expira = new Date(Date.now() + 3600000); // 1 hora

    await db.query('UPDATE usuarios SET reset_token=?, reset_token_expira=? WHERE email=?', [
      token,
      expira,
      email
    ]);

    const resetLink = `${process.env.APP_URL}/reset/${token}`;

    await transporter.sendMail({
      to: email,
      from: process.env.MAIL_FROM,
      subject: 'Recuperação de Senha - Lu Doces 🍰',
      html: `
        <h2>Recuperação de senha</h2>
        <p>Você solicitou uma redefinição de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha (válido por 1 hora):</p>
        <a href="${resetLink}" style="color: #d96db5;">${resetLink}</a>
        <br><br>
        <p>Se você não solicitou, ignore este e-mail.</p>
      `
    });

    res.render('senha', { mensagem: 'Um e-mail de recuperação foi enviado!', token: null });

  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);
    res.render('senha', { mensagem: 'Erro ao enviar o e-mail.', token: null });
  }
});

// ================= REDEFINIR SENHA =================
router.get('/reset/:token', async (req, res) => {
  const { token } = req.params;

  const [usuarios] = await db.query(
    'SELECT * FROM usuarios WHERE reset_token=? AND reset_token_expira > NOW()',
    [token]
  );

  if (usuarios.length === 0) {
    return res.render('senha', { mensagem: 'Token inválido ou expirado.', token: null });
  }

  res.render('senha', { mensagem: null, token });
});

router.post('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { senha, confirma } = req.body;

  if (senha !== confirma) {
    return res.render('senha', { mensagem: 'As senhas não conferem!', token });
  }

  const [usuarios] = await db.query(
    'SELECT * FROM usuarios WHERE reset_token=? AND reset_token_expira > NOW()',
    [token]
  );

  if (usuarios.length === 0) {
    return res.render('senha', { mensagem: 'Token inválido ou expirado.', token: null });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await db.query(
    'UPDATE usuarios SET senha=?, reset_token=NULL, reset_token_expira=NULL WHERE id=?',
    [senhaHash, usuarios[0].id]
  );

  res.render('senha', { mensagem: 'Senha redefinida com sucesso! Faça login.', token: null });
});

// ================= LOGOUT =================
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
