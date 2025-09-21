function autenticar(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/login'); // só entra se estiver logado
  }
  next();
}

function isAdmin(req, res, next) {
  if (req.session.usuario?.tipo_usuario_id === 1) {
    return next();
  }
  return res.status(403).send('Acesso permitido somente para administradores.');
}

module.exports = { autenticar, isAdmin };
