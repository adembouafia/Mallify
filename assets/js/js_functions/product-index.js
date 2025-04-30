// Function to fetch products and populate the deals section
function fetchAndPopulateDeals() {
    // This endpoint should return products from all shops
    const apiUrl = 'http://localhost:3000/product/get';
  
    const xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log('API Response:', response); // Log the full response
                    
                    const products = response.data.products;
  
                    const dealsContainer = document.querySelector('.deals-week-slider');
  
                    // Check if there are no products and display fallback message
                    if (!products || !Array.isArray(products) || products.length === 0) {
                        dealsContainer.innerHTML = '<p>No Products Available</p>';
                        return;
                    }
                    
                    console.log('Products count:', products.length);
                    console.log('Shops represented:', [...new Set(products.map(p => p.shop?._id || 'unknown'))].length);
  
                    // Destroy existing Slick instance before injecting new content
                    if ($(dealsContainer).hasClass('slick-initialized')) {
                        $(dealsContainer).slick('unslick');
                    }
  
                    dealsContainer.innerHTML = ''; // Clear any existing content
  
                    products.forEach(product => {
                        const productCard = createProductCard(product);
                        dealsContainer.appendChild(productCard);
                    });
  
                    // Re-init AOS and Slick
                    if (typeof AOS !== 'undefined') {
                        AOS.init(); // or AOS.refresh();
                    }
                    
                    $(dealsContainer).slick({
                        slidesToShow: 4,
                        slidesToScroll: 1,
                        arrows: true,
                        prevArrow: $('#deal-week-prev'),
                        nextArrow: $('#deal-week-next'),
                        responsive: [
                            { breakpoint: 992, settings: { slidesToShow: 2 } },
                            { breakpoint: 576, settings: { slidesToShow: 1 } }
                        ]
                    });
  
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    console.log(xhr.responseText);
                }
            } else {
                console.error('Error fetching products:', xhr.status);
            }
        }
    };
  
    xhr.onerror = function () {
        console.error('Network error with API:', apiUrl);
    };
  
    xhr.open('GET', apiUrl, true);
    xhr.send();
}

// Generate star rating dynamically
function generateStarRating(rating = 0) {
    const fullStars = Math.round(rating);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="text-15 fw-medium ${i <= fullStars ? 'text-warning-600' : 'text-gray-400'} d-flex"><i class="ph-fill ph-star"></i></span>`;
    }
    return html;
}

// Function to create a product card dynamically
function createProductCard(product) {
    const imageUrl = product.mainImage ? `http://localhost:3000/uploads/${product.mainImage}` : '/placeholder.jpg';
    const rating = product.averageRating || 0;
    const reviews = product.reviewCount || 0;
    const price = product.productPrice || 'N/A';
    const originalPrice = Math.round(price * 1.2);
    const name = product.productName || 'N/A';
    const id = product._id;
    const shopName = product.shop?.shopName || 'Unknown Shop';
  
    // Log shop info to debug
    console.log(`Product: ${name}, Shop: ${shopName}, Shop ID: ${product.shop?._id || 'unknown'}`);
  
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-aos', 'fade-up');
    wrapper.setAttribute('data-aos-duration', '200');
  
    wrapper.innerHTML = `
      <div class="product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2">
        <div class="product-card__thumb rounded-8 bg-gray-50 position-relative">
          <a href="product-details.html?id=${id}" class="w-100 h-100 flex-center">
            <img src="${imageUrl}" alt="${name}" class="w-100 max-w-auto" onerror="this.src='../assets/images/products/oversize.png'">
          </a>
          <div class="bg-white p-2 rounded-pill z-1 position-absolute inset-inline-end-0 inset-block-start-0 me-16 mt-16 shadow-sm">
            <button type="button" class="wishlist-btn w-40 h-40 text-md d-flex justify-content-center align-items-center rounded-circle hover-bg-main-two-600 hover-text-white">
              <i class="ph ph-heart fs-4"></i>
            </button>
          </div>
        </div>
        <div class="product-card__content mt-16 w-100">
          <h6 class="title text-lg fw-semibold my-16">
            <a href="product-details.html?id=${id}" class="link text-line-2" tabindex="0">${name}</a>
          </h6>
          <div class="flex-align gap-6">
            <div class="flex-align gap-8">
              ${generateStarRating(rating)}
            </div>
            <span class="text-xs fw-medium text-gray-500">${rating}</span>
            <span class="text-xs fw-medium text-gray-500">(${reviews})</span>
          </div>
          <span class="py-2 px-8 text-xs rounded-pill text-main-two-600 bg-main-two-50 mt-16">${shopName}</span>
          <div class="product-card__price mt-16 mb-30">
            <span class="text-gray-400 text-md fw-semibold text-decoration-line-through">${originalPrice} DT</span>
            <span class="text-heading text-md fw-semibold ">${price} DT<span class="text-gray-500 fw-normal">/Qty</span></span>
          </div>
          <a href="cart.html?add=${id}" class="product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 px-24 rounded-8 flex-center gap-8 fw-medium" tabindex="0">
            Add To Cart <i class="ph ph-shopping-cart"></i> 
          </a>
        </div>
      </div>
    `;
  
    return wrapper;
}

document.addEventListener('DOMContentLoaded', function () {
    fetchAndPopulateDeals();
});
