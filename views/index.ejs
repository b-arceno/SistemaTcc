const express = require('express');
const router = express.Router();
const db = require('../config/database');
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
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.render('login', { erro: 'Preencha todos os campos!' });
    }

    db.query('SELECT * FROM usuarios WHERE email=?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.render('login', { erro: 'Erro no servidor!' });
        }
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
            res.redirect('/admin');
        } else {
            res.redirect('/loja');
        }
    });
});

// GET Registro
router.get('/registro', (req, res) => {
    res.render('registro', { erro: null, sucesso: null });
});

// POST Registro
router.post('/registro', async (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    if (!nome || !email || !telefone || !senha) {
        return res.render('registro', { erro: "Preencha todos os campos!", sucesso: null });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    db.query(
        "INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario_id) VALUES (?, ?, ?, ?, ?)",
        [nome, email, telefone, senhaHash, 2], // 2 = cliente
        (err) => {
            if (err) {
                console.error(err);
                return res.render('registro', { erro: "Erro ao cadastrar. Tente novamente.", sucesso: null });
            }
            res.render('registro', { erro: null, sucesso: "Cadastro realizado com sucesso! Agora faça login." });
        }
    );
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

// POST Enviar e-mail de recuperação (simples)
router.post('/esqueceu-senha', (req, res) => {
    const { email } = req.body;

    db.query('SELECT * FROM usuarios WHERE email=?', [email], (err, results) => {
        if (err || results.length === 0) {
            return res.render('senha', { mensagem: "E-mail não encontrado!", token: null });
        }

        // Aqui você pode gerar token e mandar e-mail.
        // Por enquanto, simulação:
        res.render('senha', { mensagem: "Um link de recuperação foi enviado para seu e-mail.", token: null });
    });
});

// GET Resetar senha (simulado)
router.get('/reset/:token', (req, res) => {
    const { token } = req.params;
    res.render('senha', { mensagem: null, token });
});

// POST Resetar senha (simulado)
router.post('/reset/:token', async (req, res) => {
    const { token } = req.params;
    const { senha, confirma } = req.body;

    if (senha !== confirma) {
        return res.render('senha', { mensagem: "As senhas não conferem!", token });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // Aqui você faria um update real com base no token e usuário relacionado
    // Simulação:
    res.render('senha', { mensagem: "Senha redefinida com sucesso! Faça login.", token: null });
});

module.exports = router;
