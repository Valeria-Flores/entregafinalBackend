const express = require('express');
const cartsRoutes = require("./routes/carts.routes");
const productsRoutes = require("./routes/products.routes");
const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const PORT = 8080;

app.get('/ping', (req, res) => {
    res.send({ status: "ok" })
})

app.use('/api/products', productsRoutes.router)
app.use('/api/carts', cartsRoutes)


app.listen(PORT, () => {
    console.log(`Server run on port ${PORT}`);
})