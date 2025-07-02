const express = require('express');
const router = express.Router();

// Middleware para verificar se o usuário é admin (exemplo simples)
function verificaAdmin(req, res, next) {
  if (req.session.usuario && req.session.usuario.tipo_usuario_id === 2) {
    next();
  } else {
    res.status(403).send('Acesso negado. Você precisa ser administrador.');
  }
}

// Página inicial do admin (dashboard)
router.get('/', verificaAdmin, (req, res) => {
  res.send('Bem-vindo ao painel administrativo!');
});

// Outras rotas de admin podem ser adicionadas aqui
// Exemplo: gerenciar usuários
router.get('/usuarios', verificaAdmin, (req, res) => {
  res.send('Lista de usuários - área administrativa');
});

module.exports = router;
