usersRouter.get('/:uid', authMiddleware, (req, res) => {
    if (!req.user.isAdmin) {
      return res.status(403).send('Acceso denegado');
    }
    
    const user = req.users.find(u => u.id === req.params.uid);
    if (user) {
      res.json(user);
    } else {
      res.status(404).send('Usuario no encontrado');
    }
  });
  
  usersRouter.put('/:uid', authMiddleware, (req, res) => {
    if (!req.user.isAdmin) {
      return res.status(403).send('Acceso denegado');
    }
  
    const user = req.users.find(u => u.id === req.params.uid);
    if (user) {
      Object.assign(user, req.body);
      fs.writeFile('usuarios.json', JSON.stringify(req.users), err => {
        if (err) {
          console.error(err);
          res.status(500).send('Error interno del servidor');
        } else {
          res.json(user);
        }
      });
    } else {
      res.status(404).send('Usuario no encontrado');
    }
  });
  
  usersRouter.delete('/:uid', authMiddleware, (req, res) => {
    if (!req.user.isAdmin) {
      return res.status(403).send('Acceso denegado');
    }
  
    const userIndex = req.users.findIndex(u => u.id === req.params.uid);
    if (userIndex !== -1) {
      req.users.splice(userIndex, 1);
      fs.writeFile('usuarios.json', JSON.stringify(req.users), err => {
        if (err) {
          console.error(err);
          res.status(500).send('Error interno del servidor');
        } else {
          res.status(204).send();
        }
      });
    } else {
      res.status(404).send('Usuario no encontrado');
    }
  });
  