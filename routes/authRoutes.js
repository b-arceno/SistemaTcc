const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');

router.get('/login', (req, res) => res.render('login'));

router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const [usuarios] = await db.query(
            'SELECT id, senha, tipo_usuario_id, nome FROM usuarios WHERE email=?', 
            [email]
        );

        if (usuarios.length === 0) return res.status(401).render('login', { erro: 'Email ou senha incorretos' });

        const usuario = usuarios[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) return res.status(401).render('login', { erro: 'Email ou senha incorretos' });

        req.session.usuario = usuario;
        res.redirect(usuario.tipo_usuario_id === 1 ? '/admin' : '/loja');
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).send('Erro no servidor');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) console.error('Erro ao destruir sessão:', err);
        res.redirect('/login');
    });
});

module.exports = router;
