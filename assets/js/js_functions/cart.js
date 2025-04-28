document.addEventListener("DOMContentLoaded", () => {
  // containers
  const tableBody = document.getElementById("cart-table-body");
  const cartCards = document.getElementById("cart-cards");
  const subtotalEl = document.getElementById("cart-subtotal");
  const deliveryFeeEl = document.getElementById("delivery-fee");
  const finalTotalEl = document.getElementById("final-total-price");

  const DELIVERY_FEE = 15;
  let cartItems = [];

  // Fetch cart items from the server
  function fetchCartItems() {
    // Get the client ID directly from localStorage
    const clientId = localStorage.getItem('userId');
    
    if (!clientId) {
      console.error("User ID not found in localStorage");
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/cart/${clientId}`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
      if (this.status === 200) {
        const response = JSON.parse(this.responseText);
        
        // Debug: Log the first product to see its structure
        if (response.cart && response.cart.items && response.cart.items.length > 0) {
          console.log("First product from DB:", response.cart.items[0].productId);
        } else {
          console.log("Cart is empty or has a different structure:", response.cart);
        }
        
        // Transform the data to match the expected format
        if (response.cart && response.cart.items) {
          cartItems = response.cart.items.map(item => {
            const product = item.productId;
            
            // Get the mainImage from the product
            let imagePath = '';
            if (product.mainImage) {
              // Construct the path to the image in the uploads directory
              imagePath = `/uploads/${product.mainImage}`;
            }
            
            return {
              id: product._id,
              name: product.productName,
              image: imagePath,
              price: product.productPrice,
              quantity: item.quantity,
              link: `product-details.html?id=${product._id}`
            };
          });
        } else {
          cartItems = [];
        }
        
        renderCart();
      } else {
        console.error('Failed to fetch cart items:', this.status, this.responseText);
      }
    };
    
    xhr.onerror = function() {
      console.error('Request error');
    };
    
    xhr.send();
  }

  // render both table & cards
  function renderCart() {
    tableBody.innerHTML = "";
    cartCards.innerHTML = "";

    if (cartItems.length === 0) {
      // Show empty cart message
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-8">
            Your cart is empty. <a href="index.html" class="text-primary">Continue shopping</a>
          </td>
        </tr>
      `;
      
      cartCards.innerHTML = `
        <div class="cart-card empty-cart">
          <p class="text-center py-8">
            Your cart is empty. <a href="index.html" class="text-primary">Continue shopping</a>
          </p>
        </div>
      `;
      
      // Set totals to zero
      subtotalEl.textContent = "0 DT";
      deliveryFeeEl.textContent = "0 DT";
      finalTotalEl.textContent = "0 DT";
      
      return;
    }

    cartItems.forEach((item, idx) => {
      const sub = item.price * item.quantity;

      // desktop row
      const tr = document.createElement("tr");
      tr.dataset.index = idx;
      tr.innerHTML = `
        <td>
          <div class="table-product">
            <div class="product-thumb">
              <a href="${item.link}">
                ${item.image ? `<img src="${item.image}" alt="${item.name}"/>` : `<span class="no-image">${item.name}</span>`}
              </a>
            </div>
            <div class="product-content">
              <h6><a href="${item.link}">${item.name}</a></h6>
            </div>
          </div>
        </td>
        <td><span class="price">${item.price.toFixed(2)} DT</span></td>
        <td>
          <div class="quantity-control">
            <button class="btn-qty" data-action="decrease">-</button>
            <input type="text" value="${item.quantity}" readonly />
            <button class="btn-qty" data-action="increase">+</button>
          </div>
        </td>
        <td><span class="price item-subtotal">${sub.toFixed(2)} DT</span></td>
        <td><button class="btn-remove">Remove</button></td>
      `;
      tableBody.appendChild(tr);

      // mobile card - updated to match your existing CSS structure
      const card = document.createElement("div");
      card.className = "cart-card";
      card.dataset.index = idx;
      card.innerHTML = `
        <div class="card-product">
          <div class="product-thumb">
            <a href="${item.link}">
              ${item.image ? `<img src="${item.image}" alt="${item.name}"/>` : `<span class="no-image">${item.name}</span>`}
            </a>
          </div>
          <div class="product-details">
            <h6><a href="${item.link}">${item.name}</a></h6>
            <p>Unit Price: <span class="price">${item.price.toFixed(2)} DT</span></p>
            <div class="quantity-control">
              <button class="btn-qty" data-action="decrease">-</button>
              <input type="text" value="${item.quantity}" readonly />
              <button class="btn-qty" data-action="increase">+</button>
            </div>
            <p>Subtotal: <span class="price item-subtotal">${sub.toFixed(2)} DT</span></p>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-remove">REMOVE</button>
        </div>
      `;
      cartCards.appendChild(card);
    });

    recalcTotals();
  }

  // calculate directly from data
  function recalcTotals() {
    const subTotal = cartItems.reduce(
      (sum, { price, quantity }) => sum + price * quantity,
      0
    );
    subtotalEl.textContent = `${subTotal.toFixed(2)} DT`;
    deliveryFeeEl.textContent = `${DELIVERY_FEE.toFixed(2)} DT`;
    finalTotalEl.textContent = `${(subTotal + DELIVERY_FEE).toFixed(2)} DT`;
  }

  // Update cart item quantity on the server
  function updateCartItemQuantity(productId, quantity) {
    const clientId = localStorage.getItem('userId');
    
    if (!clientId) {
      console.error("User ID not found in localStorage");
      return;
    }
    
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', '/cart/update', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
      if (this.status !== 200) {
        console.error('Failed to update cart item:', this.status, this.responseText);
      }
    };
    
    xhr.send(JSON.stringify({
      clientId,
      productId,
      quantity
    }));
  }

  // Remove cart item from the server
  function removeCartItem(productId) {
    const clientId = localStorage.getItem('userId');
    
    if (!clientId) {
      console.error("User ID not found in localStorage");
      return;
    }
    
    const xhr = new XMLHttpRequest();
    xhr.open('DELETE', '/cart/remove', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
      if (this.status !== 200) {
        console.error('Failed to remove cart item:', this.status, this.responseText);
      }
    };
    
    xhr.send(JSON.stringify({
      clientId,
      productId
    }));
  }

  // catch all clicks on qty & remove
  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn-qty, .btn-remove");
    if (!btn) return;

    const container = btn.closest("tr, .cart-card");
    if (!container) return;
    
    const idx = Number(container.dataset.index);
    if (isNaN(idx)) return;

    if (btn.classList.contains("btn-qty")) {
      // increase / decrease
      let qty = cartItems[idx].quantity;
      if (btn.dataset.action === "increase") qty++;
      else if (qty > 1) qty--;
      
      cartItems[idx].quantity = qty;
      
      // Update on server
      updateCartItemQuantity(cartItems[idx].id, qty);
      
      renderCart();
    }

    if (btn.classList.contains("btn-remove")) {
      // Remove from server
      removeCartItem(cartItems[idx].id);
      
      // remove item locally
      cartItems.splice(idx, 1);
      renderCart();
    }
  });

  // first fetch and render
  fetchCartItems();
});