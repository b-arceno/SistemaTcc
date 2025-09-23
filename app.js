// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');

// Corrigido: caminho correto para o database.js
const db = require('./config/database');

// Routers
const authRoutes = require('./routes/index'); // login, registro, senha, reset
const lojaRoutes = require('./routes/lojaRoutes'); // dashboard da loja / admin

const app = express();
const port = 3000;

// Configurações do Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração da sessão
app.use(session({
    secret: 'sua_chave_secreta', // substitua por uma string forte
    resave: false,
    saveUninitialized: true
}));

// Middleware para verificar se usuário está logado
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Rotas
app.use('/', authRoutes);
app.use('/loja', lojaRoutes);

// Página inicial
app.get('/', (req, res) => {
    if (req.session.usuario) {
        res.redirect('/loja');
    } else {
        res.redirect('/login');
    }
});

// Erro 404
app.use((req, res, next) => {
    res.status(404).render('404');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
