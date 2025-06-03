document.addEventListener("DOMContentLoaded", () => {
  // containers
  const tableBody = document.querySelector(".wishlist-table tbody");
  const wishlistCards = document.querySelector(".wishlist-cards");

  let wishlistItems = [];

  // Fetch wishlist items from the server
  function fetchWishlistItems() {
    // Get the client ID directly from localStorage
    const clientId = localStorage.getItem('userId');
    console.log("Attempting to fetch wishlist with clientId:", clientId);
    
    if (!clientId) {
      console.error("User ID not found in localStorage");
      showEmptyWishlist("Please log in to view your wishlist");
      return;
    }

    // Check if user is logged in by looking for token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Authentication token not found");
      showEmptyWishlist("Please log in to view your wishlist");
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/favoris/${clientId}`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`); // Add token to request
    
    xhr.onload = function() {
      console.log("Wishlist API response status:", this.status);
      console.log("Wishlist API response:", this.responseText);
      
      if (this.status === 200) {
        try {
          const response = JSON.parse(this.responseText);
          
          // Debug: Log the response structure
          console.log("Parsed response:", response);
          
          // Check if response has the expected structure
          if (response.favorites && Array.isArray(response.favorites)) {
            console.log(`Found ${response.favorites.length} wishlist items`);
            
            if (response.favorites.length > 0) {
              console.log("First item structure:", response.favorites[0]);
            }
            
            // Transform the data to match the expected format
            wishlistItems = response.favorites.map(item => {
              // Check if item has the expected structure
              if (!item.productId) {
                console.error("Item missing productId:", item);
                return null;
              }
              
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
                price: product.productPrice || 0,
                stock: product.stock > 0 ? "In Stock" : "Out of Stock",
                rating: 4.8, // Default rating if not available
                link: `product-details.html?id=${product._id}`
              };
            }).filter(item => item !== null); // Remove any null items
          } else {
            console.error("Unexpected response structure:", response);
            wishlistItems = [];
          }
        } catch (e) {
          console.error("Error parsing response:", e);
          wishlistItems = [];
        }
        
        renderWishlist();
      } else if (this.status === 401 || this.status === 403) {
        console.error('Authentication error:', this.responseText);
        showEmptyWishlist("Please log in to view your wishlist");
      } else if (this.status === 404) {
        console.log('No wishlist found for this user');
        showEmptyWishlist();
      } else {
        console.error('Failed to fetch wishlist items:', this.status, this.responseText);
        showEmptyWishlist("Failed to load wishlist");
      }
    };
    
    xhr.onerror = function() {
      console.error('Network request error');
      showEmptyWishlist("Network error occurred");
    };
    
    xhr.send();
  }

  // Show empty wishlist with custom message
  function showEmptyWishlist(message = "Your wishlist is empty") {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-8">
          ${message}. <a href="index.html" class="text-primary">Continue shopping</a>
        </td>
      </tr>
    `;
    
    wishlistCards.innerHTML = `
      <div class="wishlist-card empty-wishlist">
        <p class="text-center py-8">
          ${message}. <a href="index.html" class="text-primary">Continue shopping</a>
        </p>
      </div>
    `;
  }

  // render both table & cards
  function renderWishlist() {
    tableBody.innerHTML = "";
    wishlistCards.innerHTML = "";

    if (wishlistItems.length === 0) {
      showEmptyWishlist();
      return;
    }

    wishlistItems.forEach((item, idx) => {
      // desktop row
      const tr = document.createElement("tr");
      tr.dataset.index = idx;
      tr.dataset.productId = item.id;
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
              <div class="product-rating">
                <span class="stars">★★★★★</span>
                <span class="rating">${item.rating}</span>
              </div>
            </div>
          </div>
        </td>
        <td><span class="price">${item.price.toFixed(2)} TND</span></td>
        <td><span class="stock-status">${item.stock}</span></td>
        <td class="action-buttons">
          <div class="btn-group">
            <button class="btn-add-to-cart" data-product-id="${item.id}">
              <span>Add To Cart</span>
              <i class="ph ph-shopping-cart"></i>
            </button>
            <button class="btn-remove" data-product-id="${item.id}">
              <i class="ph ph-trash"></i>
              <span>Remove</span>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);

      // mobile card
      // Inside your renderWishlist function where you create the card
const card = document.createElement("div");
card.className = "wishlist-card";
card.dataset.index = idx;
card.dataset.productId = item.id;
card.innerHTML = `
<div class="card-product">
  <div class="product-thumb">
    <a href="${item.link}">
      ${item.image ? `<img src="${item.image}" alt="${item.name}"/>` : `<span class="no-image">${item.name}</span>`}
    </a>
  </div>
  <div class="product-details">
    <h6><a href="${item.link}">${item.name}</a></h6>
    <div class="product-rating">
      <span class="stars">★★★★★</span>
      <span class="rating">${item.rating}</span>
    </div>
    <div class="meta">
      <span class="price">${item.price.toFixed(2)} TND</span>
      <span class="stock-status">${item.stock}</span>
    </div>
    <div class="card-actions">
      <div class="btn-group">
        <button class="btn-add-to-cart" data-product-id="${item.id}">
          <i class="ph ph-shopping-cart"></i>
        </button>
        <button class="btn-remove" data-product-id="${item.id}">
          <i class="ph ph-trash"></i>
        </button>
      </div>
    </div>
  </div>
</div>
`;
      wishlistCards.appendChild(card);
    });

    // Center the wishlist cards container
    const style = document.createElement('style');
    style.textContent = `
      .wishlist-cards {
        align-items: center;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .wishlist-card {
        width: 100%;
        max-width: 500px;
      }
    `;
    document.head.appendChild(style);
  }

  // Add to cart functionality
  function addToCart(productId) {
    const clientId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (!clientId || !token) {
      console.error("User ID or token not found in localStorage");
      showNotification('Please log in to add items to cart', 'error');
      return;
    }
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/cart/add', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    xhr.onload = function() {
      if (this.status === 200) {
        console.log('Product added to cart successfully');
        showNotification('Product added to cart successfully', 'success');
        
        // Update cart count in real-time
        if (window.mallifyCounters && typeof window.mallifyCounters.fetchCartCount === 'function') {
          window.mallifyCounters.fetchCartCount(clientId, token);
        }
      } else {
        console.error('Failed to add product to cart:', this.status, this.responseText);
        showNotification('Failed to add product to cart', 'error');
      }
    };
    
    xhr.onerror = function() {
      console.error('Request error');
      showNotification('Network error occurred', 'error');
    };
    
    xhr.send(JSON.stringify({
      clientId,
      productId,
      quantity: 1 // Default quantity
    }));
  }

  // Remove from wishlist functionality
  function removeFromWishlist(productId) {
    const clientId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (!clientId || !token) {
      console.error("User ID or token not found in localStorage");
      showNotification('Please log in to remove items from wishlist', 'error');
      return;
    }
    
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.3)';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '9999';
    
    const spinner = document.createElement('div');
    spinner.style.border = '4px solidrgb(255, 255, 255)';
    spinner.style.borderTop = '4px solidrgb(45, 149, 218)';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.animation = 'spin 1s linear infinite';
    loadingOverlay.appendChild(spinner);
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(loadingOverlay);
    
    const xhr = new XMLHttpRequest();
    xhr.open('DELETE', '/favoris/remove', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    xhr.onload = function() {
      document.body.removeChild(loadingOverlay);
      console.log("Remove API response:", this.status, this.responseText);
      
      if (this.status === 200) {
        console.log('Product removed from wishlist successfully');
        // Remove item from local array
        wishlistItems = wishlistItems.filter(item => item.id !== productId);
        // Re-render the wishlist
        renderWishlist();
        showNotification('Product removed from wishlist', 'success');
        
        // Update wishlist count in real-time
        if (window.mallifyCounters && typeof window.mallifyCounters.fetchWishlistCount === 'function') {
          window.mallifyCounters.fetchWishlistCount(clientId, token);
        }
      } else {
        console.error('Failed to remove product from wishlist:', this.status, this.responseText);
        showNotification('Failed to remove product', 'error');
      }
    };
    
    xhr.onerror = function() {
      document.body.removeChild(loadingOverlay);
      console.error('Request error');
      showNotification('Network error occurred', 'error');
    };
    
    xhr.send(JSON.stringify({
      clientId,
      productId
    }));
  }

  // Simple notification function
  function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.style.position = 'fixed';
      notificationContainer.style.top = '20px';
      notificationContainer.style.right = '20px';
      notificationContainer.style.zIndex = '1000';
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.minWidth = '250px';
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 500);
    }, 3000);
  }

  // Event delegation for button clicks
  document.addEventListener("click", e => {
    // Handle remove button clicks
    if (e.target.closest(".btn-remove")) {
      const btn = e.target.closest(".btn-remove");
      const productId = btn.dataset.productId;
      
      if (productId) {
        removeFromWishlist(productId);
      }
    }
    
    // Handle add to cart button clicks
    if (e.target.closest(".btn-add-to-cart")) {
      const btn = e.target.closest(".btn-add-to-cart");
      const productId = btn.dataset.productId;
      
      if (productId) {
        addToCart(productId);
      }
    }
  });

  // first fetch and render
  fetchWishlistItems();
});