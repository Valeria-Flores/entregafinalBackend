document.addEventListener('DOMContentLoaded', () => {
    const cartId = 'carrito_id'; // Aquí se debe poner el ID del carrito
    const cartItemsDiv = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('checkout-btn');
  
    // Función para cargar productos del carrito
    async function loadCart() {
      try {
        const response = await fetch(`/api/carts/${cartId}`);
        if (!response.ok) throw new Error('Error al cargar el carrito');
        const cart = await response.json();
  
        cartItemsDiv.innerHTML = '';
        cart.products.forEach(product => {
          const itemDiv = document.createElement('div');
          itemDiv.textContent = `${product.title} - $${product.price}`;
          cartItemsDiv.appendChild(itemDiv);
        });
      } catch (error) {
        console.error('Error:', error);
      }
    }
  
    // Función para realizar la compra
    async function checkout() {
      try {
        const response = await fetch(`/api/carts/${cartId}/checkout`, {
          method: 'POST'
        });
        if (!response.ok) throw new Error('Error en el proceso de compra');
        alert('Compra completada con éxito. Revisa tu correo para más detalles.');
      } catch (error) {
        console.error('Error:', error);
      }
    }
  
    checkoutBtn.addEventListener('click', checkout);
    loadCart(); // Cargar productos al inicio
  });
  