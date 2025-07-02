const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// Configurações básicas para receber dados POST (formulários e JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurar arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Configurar motor de visualização EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar sessão
app.use(session({
  secret: 'confeitaria-doce',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2 // sessão expira em 2 horas
  }
}));

// Disponibiliza a sessão para todas as views EJS
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Importar rotas
const indexRoutes = require('./routes/index');
const lojaRoutes = require('./routes/lojaRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const adminRoutes = require('./routes/adminRoutes');  // já criado conforme seu pedido

// Usar rotas
app.use('/', indexRoutes);           // rotas de login, registro, logout
app.use('/loja', lojaRoutes);        // rotas da loja (cliente)
app.use('/produtos', produtoRoutes); // rotas de gerenciamento de produtos (admin)
app.use('/admin', adminRoutes);      // painel admin

// Redirecionar "/" para login (opcional)
app.get('/', (req, res) => {
  res.redirect('/loja');
});

// Tratamento básico para rotas não encontradas
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
