// Permissões por papel sempre validadas no servidor, nunca apenas pela interface.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Permissão insuficiente' });
    }
    next();
  };
}

module.exports = requireRole;
