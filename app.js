const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./config/database');

const authRoutes = require('./routes/index');
const lojaRoutes = require('./routes/lojaRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- importa adminRoutes

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: '35331042',
    resave: false,
    saveUninitialized: true
}));

// Disponibiliza usuário logado nas views
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Rotas
app.use('/', authRoutes);
app.use('/loja', lojaRoutes);
app.use('/admin', adminRoutes); // <-- adiciona rotas de admin

// Redirecionamento padrão
app.get('/', (req, res) => {
    if (req.session.usuario) {
        // Se for admin, joga para painel admin
        if (req.session.usuario.tipo_usuario_id === 1) {
            return res.redirect('/admin');
        }
        // Se for cliente, joga para loja
        return res.redirect('/loja');
    } else {
        return res.redirect('/login');
    }
});

// 404
app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
