document.addEventListener("DOMContentLoaded", () => {
    // your data
    const cartItems = [
      { name: "Disque Dur MSI 960Go", image: "../assets/images/products/disque-dur-interne-msi.jpg", price: 179, quantity: 1, link: "product-details.html" },
      { name: "Bureau motorisé gaming Ksix avec hauteur réglable - Blanc", image: "../assets/images/products/bureau.png", price: 2399, quantity: 1, link: "product-details.html" },
      { name: '"Old Money" Oversized Sweat-shirt - Beige', image: "../assets/images/products/oversize.png", price: 79, quantity: 1, link: "product-details.html" },
      { name: "Wooden Baby Walker", image: "../assets/images/products/baby-walker.webp", price: 125, quantity: 1, link: "product-details.html" }
    ];
  
    // containers
    const tableBody     = document.getElementById("cart-table-body");
    const cartCards     = document.getElementById("cart-cards");
    const subtotalEl    = document.getElementById("cart-subtotal");
    const deliveryFeeEl = document.getElementById("delivery-fee");
    const finalTotalEl  = document.getElementById("final-total-price");
  
    const DELIVERY_FEE = 15;
  
    // render both table & cards
    function renderCart() {
      tableBody.innerHTML = "";
      cartCards.innerHTML = "";
  
      cartItems.forEach((item, idx) => {
        const sub = item.price * item.quantity;
  
        // desktop row
        const tr = document.createElement("tr");
        tr.dataset.index = idx;
        tr.innerHTML = `
          <td>
            <div class="table-product">
              <div class="product-thumb">
                <a href="${item.link}"><img src="${item.image}" alt="${item.name}"/></a>
              </div>
              <div class="product-content">
                <h6><a href="${item.link}">${item.name}</a></h6>
              </div>
            </div>
          </td>
          <td><span class="price">${item.price} DT</span></td>
          <td>
            <div class="quantity-control">
              <button class="btn-qty" data-action="decrease">-</button>
              <input type="text" value="${item.quantity}" readonly />
              <button class="btn-qty" data-action="increase">+</button>
            </div>
          </td>
          <td><span class="price item-subtotal">${sub} DT</span></td>
          <td><button class="btn-remove">Remove</button></td>
        `;
        tableBody.appendChild(tr);
  
        // mobile card
        const card = document.createElement("div");
        card.className = "cart-card";
        card.dataset.index = idx;
        card.innerHTML = `
          <div class="card-product">
            <div class="product-thumb">
              <a href="${item.link}"><img src="${item.image}" alt="${item.name}"/></a>
            </div>
            <div class="product-details">
              <h6><a href="${item.link}">${item.name}</a></h6>
              <p>Unit Price: <span class="price">${item.price} DT</span></p>
              <div class="quantity-control">
                <button class="btn-qty" data-action="decrease">-</button>
                <input type="text" value="${item.quantity}" readonly />
                <button class="btn-qty" data-action="increase">+</button>
              </div>
              <p>Subtotal: <span class="price item-subtotal">${sub} DT</span></p>
              <button class="btn-remove">Remove</button>
            </div>
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
      subtotalEl.textContent    = `${subTotal} DT`;
      deliveryFeeEl.textContent = `${DELIVERY_FEE} DT`;
      finalTotalEl.textContent  = `${subTotal + DELIVERY_FEE} DT`;
    }
  
    // catch all clicks on qty & remove
    document.addEventListener("click", e => {
      const btn = e.target.closest(".btn-qty, .btn-remove");
      if (!btn) return;
  
      const container = btn.closest("tr, .cart-card");
      const idx = Number(container.dataset.index);
      if (isNaN(idx)) return;
  
      if (btn.classList.contains("btn-qty")) {
        // increase / decrease
        let qty = cartItems[idx].quantity;
        if (btn.dataset.action === "increase") qty++;
        else if (qty > 1) qty--;
        cartItems[idx].quantity = qty;
        renderCart();
      }
  
      if (btn.classList.contains("btn-remove")) {
        // remove item
        cartItems.splice(idx, 1);
        renderCart();
      }
    });
  
    // first render
    renderCart();
  });
  