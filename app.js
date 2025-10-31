const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/database'); // mysql2/promise

// Rotas
const authRoutes = require('./routes/authRoutes');      // login, registro, logout
const lojaRoutes = require('./routes/lojaRoutes');      // loja, produtos, carrinho, checkout, pedidos
const adminRoutes = require('./routes/adminRoutes');    // área admin (caso tenha)

const app = express();
const port = 3000;

// Configurações do Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sessão com armazenamento no MySQL
const sessionStore = new MySQLStore({}, db);

app.use(session({
    key: 'sessao_confeitaria',
    secret: '35331042',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 horas
        sameSite: 'lax',
        secure: false // importante para HTTP local
    }
}));

// Disponibiliza o usuário logado nas views
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Rotas
app.use('/', authRoutes);        // /login, /registro, /logout
app.use('/loja', lojaRoutes);    // /loja, /loja/produtos, /loja/carrinho, etc
app.use('/admin', adminRoutes);  // /admin

// Redirecionamento padrão
app.get('/', (req, res) => {
    if (req.session.usuario) {
        return res.redirect(req.session.usuario.tipo_usuario_id === 1 ? '/admin' : '/loja');
    }
    res.redirect('/login');
});

// Página 404
app.use((req, res) => {
    res.status(404).render('404');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${port}`);
});
