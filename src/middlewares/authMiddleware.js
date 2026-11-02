const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'No autorizado',
      message: 'Debe iniciar sesión para realizar esta operación.'
    });
  }
  
  return res.redirect('/login?error=' + encodeURIComponent('Su sesión ha expirado o no ha iniciado sesión.'));
};

module.exports = { requireAuth };
