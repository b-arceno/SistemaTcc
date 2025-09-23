const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./config/database');

const authRoutes = require('./routes/index');
const lojaRoutes = require('./routes/lojaRoutes');

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

app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

app.use('/', authRoutes);
app.use('/loja', lojaRoutes);

app.get('/', (req, res) => {
    if (req.session.usuario) {
        res.redirect('/loja');
    } else {
        res.redirect('/login');
    }
});

app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
