const express = require('express');
const router = express.Router();
const productsModule = require("./products.routes");
products=productsModule.products;
let carts = []
console.log(products)
// Listar los productos de un carrito
router.get('/:cartId', (req, res) => { // Cambiado '/cartId' a '/:cartId' para capturar el parámetro de la URL
    let cartId = parseInt(req.params.cartId);
    const cartPosition = carts.findIndex((c => c.id === cartId));
    if (cartPosition < 0) {
        return res.status(404).send({ status: "Error", error: "Carrito no encontrado" }); // Cambiado response a res
    }
    res.send(carts[cartPosition]); // Acceder a carts[cartPosition] en lugar de carts.cartPosition
});


// Agregar un carrito
router.post('/', (req, res) => {
    console.log(req.body);
    let cart = req.body

    // Asignar un ID
    let newCartId = carts.length + 1;
    while (carts.some(cart => cart.id === newCartId)) {
        newCartId++;
    }
    cart.id = newCartId;
    cart.products = [];

    carts.push(cart)
    res.send({ status: "Success", msg: 'Carrito agregado' })
})

// Agregar un producto al carrito
router.post('/:cartId/product/:productId', (req, res) => {
    const cartId = parseInt(req.params.cartId);
    const productId = parseInt(req.params.productId);

    const cartIndex = carts.findIndex(cart => cart.id === cartId);
    if (cartIndex < 0) {
        return res.status(404).send({ status: "Error", error: "Carrito no encontrado" });
    }
    
    /*const product = products.find(product => product.id === productId);
    if (!product) {
        return res.status(404).send({ status: "Error", error: "Producto no encontrado" });
    }*/

    const productIndex = carts[cartIndex].products.findIndex(item => item.productId === productId);
    if (productIndex !== -1) {
        carts[cartIndex].products[productIndex].quantity++;
    } else {
        // Agregar el producto completo al carrito
        //carts[cartIndex].products.push({ product, quantity: 1 });
        carts[cartIndex].products.push({ productId: productId, quantity: 1 });
    }

    res.status(201).send({ status: "Success", msg: "Producto agregado al carrito" });
});

module.exports = router;
