const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// --------------------- Configurações ---------------------

// Receber dados via POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir CSS, JS, imagens
app.use(express.static(path.join(__dirname, 'public')));

// Configurar visualização EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar sessão
app.use(session({
  secret: 'confeitaria-doce',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 horas
}));

// Disponibilizar sessão em todas as views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// --------------------- Rotas ---------------------

// Redirecionamento raiz para login
app.get('/', (req, res) => res.redirect('/login'));

// Rotas principais
const indexRoutes = require('./routes/index');      // login, registro, logout, esqueceu senha
const lojaRoutes = require('./routes/lojaRoutes');  // loja cliente
const adminRoutes = require('./routes/adminRoutes');// painel admin

app.use('/', indexRoutes);
app.use('/loja', lojaRoutes);
app.use('/admin', adminRoutes);

// Rotas não encontradas
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

// --------------------- Iniciar servidor ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
