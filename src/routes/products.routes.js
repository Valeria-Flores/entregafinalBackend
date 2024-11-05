const express = require('express');
const router = express.Router();

// Simulamos una DB
let products = []

// Listar todos los productos
router.get('/', (req, res) => {
    res.send(products);
})

// Agregar un producto
router.post('/', (req, res) => {
    console.log(req.body);
    let product = req.body

    if (!product.title || !product.description || !product.code || !product.price || !product.stock || !product.category) {
        return res.status(400).send({ status: "error", msg: "Valores incompletos."})
    }

    // Asignar un ID
    let newProductId = products.length + 1;
    while (products.some(product => product.id === newProductId)) {
        newProductId++;
    }
    product.id = newProductId;

    // Asignar status
    product.status = true;

    products.push(product)
    res.send({ status: "Success", msg: 'Producto agregado' })
})

// Actualizar producto
router.put('/:productId', (req, res) => {
    let productId = parseInt(req.params.productId)
    let productUpdate = req.body;
    const productPosition = products.findIndex((p => p.id === productId));

    if (productPosition < 0) {
        return response.status(202).send({ status: "Info", error: "Producto no encontrado" });
    }
    productUpdate.id=productId;
    productUpdate.status=true;
    products[productPosition] = productUpdate;

    res.send({ status: "Success", message: "Producto actualizado.", data: products[productPosition] }); 

})


// Eliminar producto
router.delete('/:productId', (req, res) => {
    let productId = parseInt(req.params.productId);
    const productSize = products.length;

    const productPosition = products.findIndex((p => p.id === productId));
    if (productPosition < 0) {
        return response.status(202).send({ status: "info", error: "Usuario no encontrado" });
    }

    products.splice(productPosition, 1);
    if (products.length === productSize) {
        return response.status(500).send({ status: "Error", error: "No se pudo eliminar el producto." });
    }

    res.send({ status: "Success", message: "Producto eliminado." }); 

})
module.exports = {
    products: products,
    router:router
}

let currentPage = 1;
const limit = 10; // Número de productos por página

const fetchProducts = async (page = 1) => {
    const response = await fetch(`/api/products?limit=${limit}&page=${page}`);
    const data = await response.json();
    displayProducts(data.payload);
    updatePagination(data);
};

const displayProducts = (products) => {
    const container = document.getElementById('products-container');
    container.innerHTML = ''; // Limpiar contenedor
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.innerHTML = `
            <h2>${product.title}</h2>
            <p>${product.description}</p>
            <p>Precio: $${product.price}</p>
            <button onclick="addToCart('${product.id}')">Agregar al carrito</button>
        `;
        container.appendChild(productElement);
    });
};

const updatePagination = (data) => {
    const currentPageElement = document.getElementById('currentPage');
    currentPageElement.textContent = data.page;

    document.getElementById('prevPage').disabled = !data.hasPrevPage;
    document.getElementById('nextPage').disabled = !data.hasNextPage;

    document.getElementById('prevPage').onclick = () => fetchProducts(data.prevPage);
    document.getElementById('nextPage').onclick = () => fetchProducts(data.nextPage);
};

// Inicializar la carga de productos
fetchProducts(currentPage);
