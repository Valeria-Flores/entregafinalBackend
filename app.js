const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();


const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos

const TicketRepository = require('./src/repositories/TicketRepository');
const authMiddleware = require('./src/middlewares/authMiddleware');

const ticketRepository = new TicketRepository();

const nodemailer = require('nodemailer');



// Rutas para servir vistas
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'products.html'));
});

app.get('/carts/:cid', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'cart.html'));
});


// Rutas para productos
const productsRouter = express.Router();

// Middleware para leer el archivo de productos
productsRouter.use((req, res, next) => {
  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error interno del servidor');
    } else {
      req.products = JSON.parse(data);
      next();
    }
  });
});

//productsRouter.get('/', (req, res) => {
  //const limit = req.query.limit ? parseInt(req.query.limit) : req.products.length;
  //res.json(req.products.slice(0, limit));
//});

// Ruta para obtener productos
// Ruta para obtener productos
productsRouter.get('/', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10; // Default 10
  const page = req.query.page ? parseInt(req.query.page) : 1; // Default 1
  const sort = req.query.sort; // Puede ser "asc" o "desc"
  const query = req.query.query; // Para filtrar por categoría o disponibilidad

  let filteredProducts = req.products; // Inicializar filteredProducts

  // Filtrar por query (categoría o disponibilidad)
  if (query) {
    filteredProducts = filteredProducts.filter(product => 
      product.category.includes(query) || 
      (product.stock > 0 && query.toLowerCase() === 'disponible')
    );
  }

  // Ordenar productos
  if (sort === 'asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sort === 'desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  // Paginación
  const totalProducts = filteredProducts.length; // Aquí está bien referenciado
  const totalPages = Math.ceil(totalProducts / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Información de paginación
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;
  const response = {
    status: 'success',
    payload: paginatedProducts,
    totalPages: totalPages,
    prevPage: hasPrevPage ? page - 1 : null,
    nextPage: hasNextPage ? page + 1 : null,
    page: page,
    hasPrevPage: hasPrevPage,
    hasNextPage: hasNextPage,
    prevLink: hasPrevPage ? `/api/products?page=${page - 1}&limit=${limit}` : null,
    nextLink: hasNextPage ? `/api/products?page=${page + 1}&limit=${limit}` : null,
  };

  res.json(response);
});


productsRouter.post('/', (req, res) => {
  const { title, description, code, price, stock, category, thumbnails } = req.body;
  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  const newProduct = {
    id: uuidv4(),
    title,
    description,
    code,
    price,
    status: true,
    stock,
    category,
    thumbnails: thumbnails || []
  };

  req.products.push(newProduct);
  fs.writeFile('productos.json', JSON.stringify(req.products), err => {
    if (err) {
      console.error(err);
      res.status(500).send('Error interno del servidor');
    } else {
      res.status(201).json(newProduct);
    }
  });
});

productsRouter.put('/:pid', (req, res) => {
  const productIndex = req.products.findIndex(p => p.id === req.params.pid);
  if (productIndex !== -1) {
    req.products[productIndex] = { ...req.products[productIndex], ...req.body };
    fs.writeFile('productos.json', JSON.stringify(req.products), err => {
      if (err) {
        console.error(err);
        res.status(500).send('Error interno del servidor');
      } else {
        res.json(req.products[productIndex]);
      }
    });
  } else {
    res.status(404).send('Producto no encontrado');
  }
});

productsRouter.delete('/:pid', (req, res) => {
  const productIndex = req.products.findIndex(p => p.id === req.params.pid);
  if (productIndex !== -1) {
    const product = req.products[productIndex];
    if (product.owner && product.owner.role === 'premium') {
      sendProductDeletionEmail(product.owner.email, product.title);
    }
    req.products.splice(productIndex, 1);
    fs.writeFile('productos.json', JSON.stringify(req.products), err => {
      if (err) {
        console.error(err);
        res.status(500).send('Error interno del servidor');
      } else {
        res.status(204).send();
      }
    });
  } else {
    res.status(404).send('Producto no encontrado');
  }
});

function sendProductDeletionEmail(email, productTitle) {
  const transporter = nodemailer.createTransport({ /* Configuración del transporte */ });
  const mailOptions = {
    from: 'noreply@tuapp.com',
    to: email,
    subject: 'Producto eliminado',
    text: `El producto "${productTitle}" ha sido eliminado de tu cuenta.`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });
}

app.use('/api/products', productsRouter);

// Rutas para carritos
const cartsRouter = express.Router();

// Middleware para leer el archivo de carritos
cartsRouter.use((req, res, next) => {
  fs.readFile('carrito.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error interno del servidor');
    } else {
      req.carts = JSON.parse(data);
      next();
    }
  });
});

cartsRouter.post('/', (req, res) => {
  const newCart = {
    id: uuidv4(),
    products: []
  };

  req.carts.push(newCart);
  fs.writeFile('carrito.json', JSON.stringify(req.carts), err => {
    if (err) {
      console.error(err);
      res.status(500).send('Error interno del servidor');
    } else {
      res.status(201).json(newCart);
    }
  });
});

cartsRouter.get('/:cid', (req, res) => {
  const cart = req.carts.find(cart => cart.id === req.params.cid);
  if (cart) {
    res.json(cart);
  } else {
    res.status(404).send('Carrito no encontrado');
  }
});


//Agregar producto al carrito
cartsRouter.post('/:cid/product/:pid', (req, res) => {
  const cart = req.carts.find(c => c.id === req.params.cid);
  if (!cart) {
    return res.status(404).send('Carrito no encontrado');
  }

  const productId = req.params.pid; // ID del producto
  const quantity = req.body.quantity || 1; // Cantidad a agregar

  // Verifica si el producto ya está en el carrito
  const existingProductIndex = cart.products.findIndex(p => p.id === productId);
  if (existingProductIndex !== -1) {
    // Si existe, solo actualiza la cantidad
    cart.products[existingProductIndex].quantity += quantity;
  } else {
    // Si no existe, agrega el nuevo producto, solo almacenando el ID
    cart.products.push({ id: productId, quantity });
  }

  fs.writeFile('carrito.json', JSON.stringify(req.carts), err => {
    if (err) {
      console.error(err);
      res.status(500).send('Error interno del servidor');
    } else {
      res.status(201).json(cart);
    }
  });
});


// Eliminar un producto del carrito
cartsRouter.delete('/:cid/products/:pid', (req, res) => {
  const cart = req.carts.find(c => c.id === req.params.cid);
  if (!cart) {
    return res.status(404).send('Carrito no encontrado');
  }

  const productIndex = cart.products.findIndex(p => p.id === req.params.pid);
  if (productIndex !== -1) {
    cart.products.splice(productIndex, 1);
    fs.writeFile('carrito.json', JSON.stringify(req.carts), err => {
      if (err) {
        console.error(err);
        res.status(500).send('Error interno del servidor');
      } else {
        res.status(204).send();
      }
    });
  } else {
    res.status(404).send('Producto no encontrado en el carrito');
  }
});

// Actualizar el carrito con un arreglo de productos
cartsRouter.put('/:cid', (req, res) => {
  const cart = req.carts.find(c => c.id === req.params.cid);
  if (!cart) {
    return res.status(404).send('Carrito no encontrado');
  }

  cart.products = req.body.products;
  fs.writeFile('carrito.json', JSON.stringify(req.carts), err => {
    if (err) {
      console.error(err);
      res.status(500).send('Error interno del servidor');
    } else {
      res.json(cart);
    }
  });
});

// Actualizar sólo la cantidad de un producto en el carrito
cartsRouter.put('/:cid/products/:pid', (req, res) => {
  const cart = req.carts.find(c => c.id === req.params.cid);
  if (!cart) {
    return res.status(404).send('Carrito no encontrado');
  }

  const product = cart.products.find(p => p.id === req.params.pid);
  if (product) {
    product.quantity = req.body.quantity; // Actualizar la cantidad
    fs.writeFile('carrito.json', JSON.stringify(req.carts), err => {
      if (err) {
        console.error(err);
        res.status(500).send('Error interno del servidor');
      } else {
        res.json(product);
      }
    });
  } else {
    res.status(404).send('Producto no encontrado en el carrito');
  }
});

// Eliminar todos los productos del carrito
cartsRouter.delete('/:cid', (req, res) => {
  const cart = req.carts.find(c => c.id === req.params.cid);
  if (cart) {
    cart.products = []; // Vaciar el carrito
    fs.writeFile('carrito.json', JSON.stringify(req.carts), err => {
      if (err) {
        console.error(err);
        res.status(500).send('Error interno del servidor');
      } else {
        res.status(204).send();
      }
    });
  } else {
    res.status(404).send('Carrito no encontrado');
  }
});

// Ruta para finalizar compra
cartsRouter.post('/:cid/checkout', (req, res) => {
  const cart = req.carts.find(cart => cart.id === req.params.cid);
  if (!cart) return res.status(404).send('Carrito no encontrado');

  // Suponemos que hay una función `processPayment` que maneja el pago
  if (processPayment(cart)) {
    sendConfirmationEmail(req.user.email, cart);
    
    // Vaciar el carrito después de la compra
    cart.products = [];
    fs.writeFile('carritos.json', JSON.stringify(req.carts), err => {
      if (err) {
        console.error(err);
        res.status(500).send('Error interno del servidor');
      } else {
        res.json({ message: 'Compra completada y correo enviado' });
      }
    });
  } else {
    res.status(400).send('Error en el proceso de pago');
  }
});

function sendConfirmationEmail(email, cart) {
  const transporter = nodemailer.createTransport({ /* Configuración del transporte */ });
  const mailOptions = {
    from: 'noreply@tuapp.com',
    to: email,
    subject: 'Confirmación de Compra',
    text: `Gracias por tu compra. Tus productos:\n${cart.products.map(p => p.title).join('\n')}`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });
}


app.use('/api/carts', cartsRouter);

const usersRouter = express.Router();

usersRouter.get('/', (req, res) => {
  const users = req.users.map(user => ({
    name: user.name,
    email: user.email,
    role: user.role
  }));
  res.json(users);
});

usersRouter.delete('/', (req, res) => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  req.users = req.users.filter(user => {
    if (new Date(user.lastConnection) < twoDaysAgo) {
      sendDeletionEmail(user.email);
      return false;
    }
    return true;
  });

  fs.writeFile('usuarios.json', JSON.stringify(req.users), err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error interno del servidor');
    }
    res.status(204).send();
  });
});

function sendDeletionEmail(email) {
  const transporter = nodemailer.createTransport({ /* Configuración del transporte */ });
  const mailOptions = {
    from: 'noreply@tuapp.com',
    to: email,
    subject: 'Cuenta eliminada por inactividad',
    text: 'Tu cuenta ha sido eliminada por inactividad en los últimos dos días.'
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });
}




app.get('/current', (req, res) => {
  const userDTO = new UserDTO(req.user);
  res.json(userDTO);
});


// Iniciar el servidor
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
