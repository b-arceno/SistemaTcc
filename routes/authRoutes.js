const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');

router.get('/login', (req, res) => res.render('login'));

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email=?', [email]);
    if (usuarios.length === 0) return res.send('Usuário não encontrado');
    const usuario = usuarios[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) return res.send('Senha incorreta');
    req.session.usuario = usuario;
    res.redirect(usuario.tipo_usuario_id === 1 ? '/admin' : '/loja');
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
