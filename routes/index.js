const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Página de login
router.get('/login', (req, res) => {
    res.render('login');
});

// Autenticar login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.render('login', { erro: 'Email não encontrado' });
        }

        const usuario = results[0];
        bcrypt.compare(senha, usuario.senha, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
                req.session.usuario = {
                    id: usuario.id,
                    nome: usuario.nome,
                    tipo_usuario_id: usuario.tipo_usuario_id
                };
                res.redirect('/loja');
            } else {
                res.render('login', { erro: 'Senha incorreta' });
            }
        });
    });
});

// Página de registro
router.get('/registro', (req, res) => {
    res.render('registro');
});

// Criar novo usuário
router.post('/registro', (req, res) => {
    const { nome, email, senha, tipo_usuario_id, telefone } = req.body;

    bcrypt.hash(senha, saltRounds, (err, hashSenha) => {
        if (err) throw err;

        db.query(
            'INSERT INTO usuarios (nome, email, senha, tipo_usuario_id, telefone) VALUES (?, ?, ?, ?, ?)',
            [nome, email, hashSenha, tipo_usuario_id, telefone],
            (err) => {
                if (err) throw err;
                res.redirect('/login');
            }
        );
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
