
const verificarAdmin = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.tipo_usuario_id === 1) {
    return next(); // usuário é admin -> continua
  }

  // se não for admin:
  // pode mandar uma flash message ou redirecionar
  return res.redirect('/login?erro=acesso-negado');
};

module.exports = verificarAdmin;
