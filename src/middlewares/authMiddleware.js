const authMiddleware = (req, res, next) => {
    const user = req.user; 
  
    if (!user) {
      return res.status(403).send('Acceso denegado');
    }
  
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      if (!user.isAdmin) {
        return res.status(403).send('Acceso denegado: solo administradores pueden modificar productos');
      }
    }
  
    next();
  };
  
  module.exports = authMiddleware;
  