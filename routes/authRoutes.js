const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');

// Página de login
router.get('/login', (req, res) => res.render('login'));

// Ação de login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Busca o usuário na tabela clientes
        const [clientes] = await db.query(
            'SELECT id, nome, email, telefone, endereco, senha FROM clientes WHERE email=?', 
            [email]
        );

        if (clientes.length === 0) return res.status(401).render('login', { erro: 'Email ou senha incorretos' });

        const cliente = clientes[0];
        const senhaCorreta = await bcrypt.compare(senha, cliente.senha);

        if (!senhaCorreta) return res.status(401).render('login', { erro: 'Email ou senha incorretos' });

        // Salva sessão
        req.session.usuario = cliente;
        res.redirect('/loja');
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).send('Erro no servidor');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) console.error('Erro ao destruir sessão:', err);
        res.redirect('/login');
    });
});

module.exports = router;
