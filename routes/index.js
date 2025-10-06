const express = require('express');
const router = express.Router();
const db = require('../config/database'); // mysql2/promise
const bcrypt = require('bcrypt');

// GET página inicial
router.get('/', (req, res) => {
    res.render('index');
});

// GET Login
router.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

// POST Login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.render('login', { erro: 'Preencha todos os campos!' });
        }

        const [results] = await db.query('SELECT * FROM usuarios WHERE email=?', [email]);

        if (results.length === 0) {
            return res.render('login', { erro: 'Usuário não encontrado!' });
        }

        const usuario = results[0];
        const senhaOk = await bcrypt.compare(senha, usuario.senha);

        if (!senhaOk) {
            return res.render('login', { erro: 'Senha incorreta!' });
        }

        // Salva na sessão
        req.session.usuario = usuario;

        if (usuario.tipo_usuario_id === 1) {
            return res.redirect('/admin');
        } else {
            return res.redirect('/loja');
        }

    } catch (err) {
        console.error('Erro no login:', err);
        res.render('login', { erro: 'Erro no servidor!' });
    }
});

// GET Registro
router.get('/registro', (req, res) => {
    res.render('registro', { erro: null, sucesso: null });
});

// POST Registro
router.post('/registro', async (req, res) => {
    try {
        const { nome, email, telefone, senha } = req.body;

        if (!nome || !email || !telefone || !senha) {
            return res.render('registro', { erro: "Preencha todos os campos!", sucesso: null });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        await db.query(
            "INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario_id) VALUES (?, ?, ?, ?, ?)",
            [nome, email, telefone, senhaHash, 2] // 2 = cliente
        );

        res.render('registro', { erro: null, sucesso: "Cadastro realizado com sucesso! Agora faça login." });

    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        res.render('registro', { erro: "Erro ao cadastrar. Tente novamente.", sucesso: null });
    }
});

// GET Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// GET Recuperar Senha
router.get('/esqueceu-senha', (req, res) => {
    res.render('senha', { mensagem: null, token: null });
});

// POST Enviar e-mail de recuperação (simulação)
router.post('/esqueceu-senha', async (req, res) => {
    try {
        const { email } = req.body;
        const [results] = await db.query('SELECT * FROM usuarios WHERE email=?', [email]);

        if (results.length === 0) {
            return res.render('senha', { mensagem: "E-mail não encontrado!", token: null });
        }

        // Simulação de envio de token
        res.render('senha', { mensagem: "Um link de recuperação foi enviado para seu e-mail.", token: null });

    } catch (err) {
        console.error(err);
        res.render('senha', { mensagem: "Erro no servidor!", token: null });
    }
});

// GET Resetar senha (simulação)
router.get('/reset/:token', (req, res) => {
    const { token } = req.params;
    res.render('senha', { mensagem: null, token });
});

// POST Resetar senha (simulação)
router.post('/reset/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { senha, confirma } = req.body;

        if (senha !== confirma) {
            return res.render('senha', { mensagem: "As senhas não conferem!", token });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        // Aqui você faria o update real no banco com base no token
        res.render('senha', { mensagem: "Senha redefinida com sucesso! Faça login.", token: null });

    } catch (err) {
        console.error(err);
        res.render('senha', { mensagem: "Erro ao redefinir senha!", token });
    }
});

module.exports = router;
