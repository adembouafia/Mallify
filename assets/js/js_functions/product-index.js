const token = localStorage.getItem("token");


function fetchAndPopulateDeals() {
    const apiUrl = 'http://localhost:3000/product/get';
  
    const xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log('API Response:', response); 
                    
                    const products = response.data.products;
  
                    const dealsContainer = document.querySelector('.deals-week-slider');
  
                    if (!products || !Array.isArray(products) || products.length === 0) {
                        dealsContainer.innerHTML = '<p>No Products Available</p>';
                        return;
                    }
                    
                    console.log('Products count:', products.length);
                    console.log('Shops represented:', [...new Set(products.map(p => p.shop?._id || 'unknown'))].length);
  
                    if ($(dealsContainer).hasClass('slick-initialized')) {
                        $(dealsContainer).slick('unslick');
                    }
  
                    dealsContainer.innerHTML = ''; 
  
                    products.forEach(product => {
                        const productCard = createProductCard(product);
                        dealsContainer.appendChild(productCard);
                    });
  
                    if (typeof AOS !== 'undefined') {
                        AOS.init(); 
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

function generateStarRating(rating = 0) {
    const fullStars = Math.round(rating);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="text-15 fw-medium ${i <= fullStars ? 'text-warning-600' : 'text-gray-400'} d-flex"><i class="ph-fill ph-star"></i></span>`;
    }
    return html;
}

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
    <div class="product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2" data-product-id="${id}">
        <div class="product-card__thumb rounded-8 bg-gray-50 position-relative">
        <a href="product-details.html?id=${id}" class="w-100 h-100 flex-center">
            <img src="${imageUrl}" alt="${name}" class="w-100 max-w-auto" onerror="this.src='../assets/images/products/oversize.png'">
        </a>
        <div class="bg-white p-2 rounded-pill z-1 position-absolute inset-inline-end-0 inset-block-start-0 me-16 mt-16 shadow-sm">
            <button type="button" class="wishlist-btn w-40 h-40 text-md d-flex justify-content-center align-items-center rounded-circle hover-bg-main-two-600 hover-text-white" 
                    id="wishlist-btn-${id}" 
                    data-product-id="${id}">
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
            <button 
                class="product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 px-24 rounded-8 flex-center gap-8 fw-medium" 
                data-product-id="${id}">
                Add To Cart <i class="ph ph-shopping-cart"></i> 
            </button>
        </div>
    </div>
    `;
    return wrapper;
}


document.addEventListener('DOMContentLoaded', function () {
    fetchAndPopulateDeals();
    fetchAndPopulateTopSelling();
});


document.addEventListener("DOMContentLoaded", () => {
    checkWishlistStatus()

    document.addEventListener("click", (event) => {
        if (event.target.closest(".wishlist-btn")) {
        event.preventDefault()
        const button = event.target.closest(".wishlist-btn")
        const productId = button.getAttribute("data-product-id")
        const token = localStorage.getItem("token")
        const clientId = localStorage.getItem("userId")

        if (!token) {
            alert("Please log in to add to favorites.")
            return
        }

        if (!clientId) {
            alert("User ID not found.")
            return
        }

        const isInWishlist = button.classList.contains("active")

        const icon = button.querySelector("i")
        const originalIconClass = icon.className
        icon.className = "ph ph-spinner ph-spin"
        button.disabled = true

        if (isInWishlist) {
            removeFromWishlist(clientId, productId, token, button, icon, originalIconClass)
        } else {
            addToWishlist(clientId, productId, token, button, icon, originalIconClass)
        }
        }
    })
})

function checkWishlistStatus() {
    const token = localStorage.getItem("token")
    const clientId = localStorage.getItem("userId")

    if (!token || !clientId) {
        return // Not logged in, skip check
    }

    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/favoris/${clientId}`, true)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
        if (xhr.status === 200) {
            try {
            const response = JSON.parse(xhr.responseText)
            const favorites = response.favorites || []

            const wishlistButtons = document.querySelectorAll(".wishlist-btn")

            wishlistButtons.forEach((button) => {
                const productId = button.getAttribute("data-product-id")
                const isInWishlist = favorites.some(
                (item) => item.productId === productId || (item.productId && item.productId._id === productId),
                )

                if (isInWishlist) {
                updateButtonAppearance(button, true)
                }
            })
            } catch (error) {
            console.error("Error parsing wishlist data:", error)
            }
        }
        }
    }

    xhr.send()
}

function addToWishlist(clientId, productId, token, button, icon, originalIconClass) {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "http://localhost:3000/favoris/add", true)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
        // Reset icon regardless of success/failure
        icon.className = originalIconClass
        button.disabled = false

        if (xhr.status === 200) {
            // Update button appearance
            updateButtonAppearance(button, true)
        } else if (xhr.status === 400) {
            // Product already in favorites
            try {
            const response = JSON.parse(xhr.responseText)
            alert(response.message || "Product already in favorites")
            // Still update the appearance since it's in favorites
            updateButtonAppearance(button, true)
            } catch (e) {
            alert("Product already in favorites")
            updateButtonAppearance(button, true)
            }
        } else {
            alert("Error adding product to favorites. Status: " + xhr.status)
        }
        }
    }

    const data = JSON.stringify({ clientId, productId })
    xhr.send(data)
}

function removeFromWishlist(clientId, productId, token, button, icon, originalIconClass) {
    const xhr = new XMLHttpRequest()
    xhr.open("DELETE", "http://localhost:3000/favoris/remove", true)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
        icon.className = originalIconClass
        button.disabled = false

        if (xhr.status === 200) {
            updateButtonAppearance(button, false)
        } else {
            alert("Error removing product from favorites. Status: " + xhr.status)
        }
        }
    }

    const data = JSON.stringify({ clientId, productId })
    xhr.send(data)
}

function updateButtonAppearance(button, isInWishlist) {
    const icon = button.querySelector("i")

    if (isInWishlist) {
    button.classList.add("active")
    if (icon) {
        icon.className = "fs-4 ph-fill ph-heart text-main-two-600" 
    }
    } else {
    button.classList.remove("active")
    if (icon) {
        icon.className = "ph ph-heart fs-4 text-body" 
    }
    }
}


const style = document.createElement("style")
style.textContent = `
    
    .wishlist-btn.active i {
        color: blue !important;
    }
`
document.head.appendChild(style)



function addToCart(productId, buttonElement) {
    const token = localStorage.getItem("token");
    const clientId = localStorage.getItem("userId");

    if (!token || !clientId) {
        showToast("Authentication Required", "Please log in to add items to your cart.", "warning");
        return;
    }

    const originalHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Adding...`;
    buttonElement.disabled = true;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/cart/add", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            buttonElement.innerHTML = originalHTML;
            buttonElement.disabled = false;

            if (xhr.status === 200) {
                showToast("Success", "Product added to cart!", "success");
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    showToast("Error", response.message || "Failed to add product to cart.", "error");
                } catch (e) {
                    showToast("Error", "An error occurred. Please try again.", "error");
                }
            }
        }
    };

    const data = JSON.stringify({ clientId, productId, quantity: 1 });
    xhr.send(data);
}



document.addEventListener("click", function (event) {
    const cartBtn = event.target.closest(".product-card__cart");
    if (cartBtn) {
        event.preventDefault();
        const productId = cartBtn.getAttribute("data-product-id");
        addToCart(productId, cartBtn);
    }
});



function showToast(title, message, type) {
    if (typeof window.Swal !== "undefined") {
        let iconHtml = '';
        let iconColor = '';
        
        switch(type) {
            case 'success':
            iconHtml = '<div style="font-size: 24px; font-weight: bold;">✓</div>';
            iconColor = '#00e676';
            break;
            case 'error':
            iconHtml = '<div style="font-size: 24px; font-weight: bold;">✕</div>';
            iconColor = '#ff1744';
            break;
            case 'warning':
            iconHtml = '<div style="font-size: 24px; font-weight: bold;">!</div>';
            iconColor = '#ff9100';
            break;
            case 'info':
            default:
            iconHtml = '<div style="font-size: 24px; font-weight: bold;">i</div>';
            iconColor = '#40c4ff';
            break;
        }

        window.Swal.fire({
            title: `<span style="font-weight:bold;">${title}</span>`,
            html: `
                <div style="display: flex; align-items: center;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${iconColor}; display: flex; justify-content: center; align-items: center; color: white; margin-right: 10px;">
                    ${iconHtml}
                    </div>
                    <p style="margin:0;">${message}</p>
                </div>
            `,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
            timer: 2000,
            timerProgressBar: true,
            background: "#1e1e2f",
            color: "#fff",
            didOpen: (toast) => {
                toast.addEventListener("mouseenter", window.Swal.stopTimer)
                toast.addEventListener("mouseleave", window.Swal.resumeTimer)
            },
            customClass: {
                popup: "cool-toast-popup",
                timerProgressBar: "cool-toast-timer",
            },
        })
    } else {
        console.log(`${type.toUpperCase()}: ${title} - ${message}`)
    }
}



function createProductCardTopSelling(product) {
    const imageUrl = product.mainImage ? `http://localhost:3000/uploads/${product.mainImage}` : '../assets/images/products/oversize.png';
    const rating = product.averageRating || 0;
    const reviews = product.reviewCount || 0;
    const price = product.productPrice || 'N/A';
    const name = product.productName || 'N/A';
    const id = product._id;
    const shopName = product.shop?.shopName || 'Unknown Shop';
    
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-aos', 'fade-up');
    wrapper.setAttribute('data-aos-duration', '200');
    
    wrapper.innerHTML = `
        <div class="product-card hover-card-shadows p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2">
            <a href="product-details.html?id=${id}" class="product-card__thumb flex-center rounded-8 position-relative">
                <img src="${imageUrl}" alt="${name}" class="w-auto max-w-275" onerror="this.src='../assets/images/products/oversize.png'">
            </a>
            <div class="bg-white p-2 rounded-pill z-1 position-absolute inset-inline-end-0 inset-block-start-0 me-16 mt-16 shadow-sm">
                <button type="button" class="wishlist-btn w-40 h-40 text-md d-flex justify-content-center align-items-center rounded-circle hover-bg-main-two-600 hover-text-white" 
                        id="wishlist-btn-${id}" 
                        data-product-id="${id}">
                <i class="ph ph-heart fs-4"></i>
                </button>
            </div>
            <div class="product-card__content mt-16">                
                <h6 class="title text-lg fw-semibold mt-12 mb-20">
                    <a href="product-details.html?id=${id}" class="link text-line-2 d-flex" tabindex="0">${name}</a>
                </h6>
                <div class="flex-align gap-6">
                    <div class="flex-align gap-8">
                    ${generateStarRating(rating)}
                    </div>
                    <span class="text-xs fw-medium text-gray-500">${rating}</span>
                    <span class="text-xs fw-medium text-gray-500">(${reviews})</span>
                </div>
                <span class="py-2 px-8 text-xs rounded-pill text-main-two-600 bg-main-two-50 mt-16">${shopName}</span>
                <div class="product-card__price my-20">
                    <span class="text-heading text-md fw-semibold">${price} Dt <span class="text-gray-500 fw-normal">/Qty</span></span>
                </div>
                <a href="cart.html" class="product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 px-24 rounded-pill flex-center gap-8 fw-medium" tabindex="0" data-product-id="${id}">
                    Add To Cart <i class="ph ph-shopping-cart"></i> 
                </a>
            </div>
        </div>
    `;
    
    return wrapper;
}



function fetchAndPopulateTopSelling() {
    const apiUrl = 'http://localhost:3000/product/get';
    const xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log('API Response for Top Selling:', response); 
                    
                    const products = response.data.products;
  
                    const topSellingContainer = document.querySelector('#top-selling-slider');
  
                    if (!products || !Array.isArray(products) || products.length === 0) {
                        topSellingContainer.innerHTML = '<p>No Products Available</p>';
                        return;
                    }
                    
                    console.log('Top Selling Products count:', products.length);
  
                    if ($(topSellingContainer).hasClass('slick-initialized')) {
                        $(topSellingContainer).slick('unslick');
                    }
  
                    topSellingContainer.innerHTML = ''; 

                    const topProducts = products.slice(0, 5);
                    
                    topProducts.forEach(product => {
                        const productCard = createProductCardTopSelling(product);
                        topSellingContainer.appendChild(productCard);
                    });
  
                    if (typeof AOS !== 'undefined') {
                        AOS.init(); 
                    }
                    
                    $(topSellingContainer).slick({
                        slidesToShow: 4,
                        slidesToScroll: 1,
                        arrows: true,
                        prevArrow: $('#top-selling-prev'),
                        nextArrow: $('#top-selling-next'),
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
                console.error('Error fetching top selling products:', xhr.status);
            }
        }
    };
  
    xhr.onerror = function () {
        console.error('Network error with API:', apiUrl);
    };
  
    xhr.open('GET', apiUrl, true);
    xhr.send();
}



function createProductCardTrending(product) {
    
}



function fetchAndPopulateTrendingProducts(){

}