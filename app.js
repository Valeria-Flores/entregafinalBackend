const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

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

productsRouter.get('/', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : req.products.length;
  res.json(req.products.slice(0, limit));
});

productsRouter.get('/:pid', (req, res) => {
  const product = req.products.find(p => p.id === req.params.pid);
  if (product) {
    res.json(product);
  } else {
    res.status(404).send('Producto no encontrado');
  }
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
  const cart = req.carts.find(c => c.id === req.params.cid);
  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).send('Carrito no encontrado');
  }
});

cartsRouter.post('/:cid/product/:pid', (req, res) => {
  const cart = req.carts.find(c => c.id === req.params.cid);
  if (!cart) {
    return res.status(404).send('Carrito no encontrado');
  }

  const productId = req.params.pid;
  const quantity = req.body.quantity || 1;

  const existingProductIndex = cart.products.findIndex(p => p.id === productId);
  if (existingProductIndex !== -1) {
    cart.products[existingProductIndex].quantity += quantity;
  } else {
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

app.use('/api/carts', cartsRouter);

// Iniciar el servidor
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
