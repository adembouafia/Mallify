function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(name)
}

let currentProduct = null

function getUserToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// Function to load product details
function loadProductDetails() {
    const productId = getUrlParameter("id")

    if (!productId) {
    showAlert("danger", "Product ID is missing from URL")
    return
    }

    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true)

    xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
        try {
        const response = JSON.parse(xhr.responseText)

        if (response.status === "success" && response.data && response.data.product) {
            currentProduct = response.data.product // Store the product
            displayProductDetails(currentProduct)
            setupImageSlider(currentProduct)
            loadProductReviews(productId)

            // Initialize price display and shipping fee
            initializePriceDisplay()

            // Setup quantity buttons ONLY after loading product
            setupQuantityButtons()
        } else {
            showAlert("danger", "Failed to load product data")
        }
        } catch (e) {
        console.error("Error parsing product data:", e)
        showAlert("danger", "Error processing server response")
        }
    } else {
        showAlert("danger", "Failed to load product data")
    }
    }

    xhr.onerror = () => {
    showAlert("danger", "Network error occurred")
    }

    xhr.send()
}

// Function to display product details
function displayProductDetails(product) {
    // Update product name
    const productNameElement = document.querySelector(".product-details__content h5")
    if (productNameElement) {
    productNameElement.textContent = product.productName || "Product Name Not Available"
    }

    // Update product ID/SKU
    const skuElement = document.querySelector(".flex-align.flex-wrap.gap-12 + span + span")
    if (skuElement) {
    skuElement.innerHTML = `<span class="text-gray-400">SKU:</span>${product.productId || "N/A"}`
    }

    // Update price
    const priceElement = document.querySelector(".flex-align.gap-8 h6")
    if (priceElement) {
    priceElement.textContent = `${product.productPrice || 0} DT`
    }

    // Update star rating - New code
    updateProductStarRating(product.averageRating || 4.7);

    // Update regular price if available
    const regularPriceElement = document.querySelector(".flex-align.gap-4 h6")
    if (regularPriceElement && product.regularPrice) {
    regularPriceElement.textContent = `${product.regularPrice} DT`
    }

    // Update discount percentage if available
    const discountElement = document.querySelector(".flex-align.gap-8.text-main-two-600")
    if (discountElement && product.regularPrice && product.productPrice) {
    const discount = Math.round(((product.regularPrice - product.productPrice) / product.regularPrice) * 100)
    if (discount > 0) {
        discountElement.innerHTML = `<i class="ph-fill ph-seal-percent text-xl"></i> -${discount}%`
    } else {
        discountElement.parentElement.style.display = "none"
    }
    }

    // Update description
    const descriptionElement = document.querySelector(".product-details__content p.text-gray-700")
    if (descriptionElement) {
    descriptionElement.textContent = product.description || "No description available"
    }

    const descTabContent = document.querySelector("#pills-description");
    if (descTabContent) {
        const detailedDescription = document.querySelector("#pills-description p:first-of-type");
        if (detailedDescription) {
            detailedDescription.innerHTML = product.productDetails || "No detailed description available";
        }
    }
    

    // Update stock information
    const stockElement = document.querySelector('label[for="stock"]')
    if (stockElement) {
    stockElement.textContent = `Total Stock: ${product.stock || 0}`
    }

    // Update availability
    const availabilityElement = document.querySelector(
    ".product-dContent__box .mb-40:nth-of-type(2) ul li:nth-of-type(4) .text-gray-500",
    )
    if (availabilityElement) {
    availabilityElement.textContent = ` ${product.availability || "N/A"}`
    }


    // Update shop name - Fixed to use the correct element selector
    const shopNameElement = document.getElementById("shop-name-detail");
    if (shopNameElement) {
        // Check if shop is populated as an object with shopName
        if (product.shop && typeof product.shop === "object" && product.shop.shopName) {
            shopNameElement.textContent = product.shop.shopName;
        }
        // Check if shop is just an ID (string or ObjectId)
        else if (product.shop) {
            // Fetch shop details using the shop ID
            fetchShopDetails(product.shop, shopNameElement);
        } else {
            shopNameElement.textContent = "Shop";
        }
    }
}

// Function to fetch shop details
function fetchShopDetails(shopId, shopNameElement) {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/shop/public/${shopId}`, true)

    xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
        try {
        const response = JSON.parse(xhr.responseText)

        if (response.status === "success" && response.data && response.data.shop) {
            shopNameElement.textContent = response.data.shop.shopName || "Unknown Shop"
        } else {
            shopNameElement.textContent = "Shop"
            console.error("Failed to load shop data")
        }
        } catch (e) {
        console.error("Error parsing shop data:", e)
        shopNameElement.textContent = "Shop"
        }
    } else {
        console.error("Failed to load shop data")
        shopNameElement.textContent = "Shop"
    }
    }

    xhr.onerror = () => {
    console.error("Network error occurred while fetching shop data")
    shopNameElement.textContent = "Shop"
    }

    xhr.send()
}

function setupImageSlider(product) {
    const sliderFor = document.querySelector('.product-details__thumb-slider');
    const sliderNav = document.querySelector('.product-details__images-slider');

    if (!sliderFor || !sliderNav) return;

    // Vider les anciens sliders
    sliderFor.innerHTML = '';
    sliderNav.innerHTML = '';

    // Ajouter l’image principale
    if (product.mainImage) {
        const mainImageUrl = `/uploads/${product.mainImage}`;

        const mainSlide = document.createElement('div');
        mainSlide.innerHTML = `
            <div class="product-details__thumb flex-center h-100">
                <img src="${mainImageUrl}" class="img-fluid main-img" alt="${product.productName}">
            </div>`;
        sliderFor.appendChild(mainSlide);

        const mainThumb = document.createElement('div');
        mainThumb.innerHTML = `
            <div class="max-w-120 max-h-120 h-100 flex-center border border-gray-100 rounded-16 p-8">
                <img src="${mainImageUrl}" class="img-thumbnail thumb-img" alt="${product.productName}">
            </div>`;
        sliderNav.appendChild(mainThumb);
    }

    // Ajouter les autres images
    if (product.otherImages && product.otherImages.length > 0) {
        product.otherImages.forEach(image => {
            const imageUrl = `/uploads/${image}`;

            const slide = document.createElement('div');
            slide.innerHTML = `
                <div class="product-details__thumb flex-center h-100">
                    <img src="${imageUrl}" class="img-fluid main-img" alt="${product.productName}">
                </div>`;
            sliderFor.appendChild(slide);

            const thumb = document.createElement('div');
            thumb.innerHTML = `
                <div class="max-w-120 max-h-120 h-100 flex-center border border-gray-100 rounded-16 p-8">
                    <img src="${imageUrl}" class="img-thumbnail thumb-img" alt="${product.productName}">
                </div>`;
            sliderNav.appendChild(thumb);
        });
    }

    // Fallback si aucune image
    if (sliderFor.children.length === 0) {
        const placeholder = "/images/placeholder-product.png";

        const placeholderSlide = document.createElement('div');
        placeholderSlide.innerHTML = `
            <div class="product-details__thumb flex-center h-100">
                <img src="${placeholder}" class="img-fluid main-img" alt="Placeholder">
            </div>`;
        sliderFor.appendChild(placeholderSlide);

        const placeholderThumb = document.createElement('div');
        placeholderThumb.innerHTML = `
            <div class="max-w-120 max-h-120 h-100 flex-center border border-gray-100 rounded-16 p-8">
                <img src="${placeholder}" class="img-thumbnail thumb-img" alt="Placeholder">
            </div>`;
        sliderNav.appendChild(placeholderThumb);
    }

    // Initialiser slick
    try {
        if (typeof jQuery !== 'undefined') {
            const $for = jQuery('.product-details__thumb-slider');
            const $nav = jQuery('.product-details__images-slider');

            if ($for.hasClass('slick-initialized')) $for.slick('unslick');
            if ($nav.hasClass('slick-initialized')) $nav.slick('unslick');

            $for.slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                fade: true,
                asNavFor: '.product-details__images-slider'
            });

            $nav.slick({
                slidesToShow: 3,
                slidesToScroll: 1,
                asNavFor: '.product-details__thumb-slider',
                dots: false,
                centerMode: true,
                focusOnSelect: true,
                responsive: [
                    {
                        breakpoint: 768,
                        settings: {
                            slidesToShow: 3
                        }
                    },
                    {
                        breakpoint: 480,
                        settings: {
                            slidesToShow: 2
                        }
                    }
                ]
            });
        }
    } catch (e) {
        console.error("Error initializing slick slider:", e);
    }
}



// Function to load product reviews
function loadProductReviews(productId) {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/product/${productId}/reviews`, true)
    
    // Add auth token if available
    const token = getUserToken();
    if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.responseText);

                if (response.status === "success" && response.data && response.data.reviews) {
                    // Enrich review data with client profile information if needed
                    if (response.data.reviews.length > 0) {
                        fetchClientProfiles(response.data.reviews).then(enrichedReviews => {
                            displayReviews(enrichedReviews);
                            
                            // Calculate stats from the reviews
                            const stats = {
                                averageRating: response.data.averageRating || calculateAverageRating(enrichedReviews),
                                totalReviews: enrichedReviews.length,
                                ratingCounts: calculateRatingCounts(enrichedReviews)
                            };
                            updateReviewStats(stats);
                        });
                    } else {
                        displayReviews([]);
                        updateReviewStats({
                            averageRating: 0,
                            totalReviews: 0,
                            ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                        });
                    }
                } else {
                    console.log("No reviews found or error loading reviews");
                    displayReviews([]);
                }
            } catch (e) {
                console.error("Error parsing reviews data:", e);
                displayReviews([]);
            }
        } else {
            console.error("Failed to load reviews");
            displayReviews([]);
        }
    }

    xhr.onerror = () => {
        console.error("Network error occurred while loading reviews");
        displayReviews([]);
    }

    xhr.send()
}

// Function to fetch client profile information for reviews
async function fetchClientProfiles(reviews) {
    // If no reviews, return empty array
    if (!reviews || reviews.length === 0) return [];
    
    // Create a copy of the reviews to avoid modifying the original
    const enrichedReviews = [...reviews];
    
    // Get the client ID from localStorage if available
    const currentClientId = getUserId();
    
    // Check if we have a token to make authenticated requests
    const token = getUserToken();
    
    console.log("Fetching client profiles for reviews:", enrichedReviews);
    
    try {
        // For each review that has a clientId, try to fetch the client profile
        for (let i = 0; i < enrichedReviews.length; i++) {
            const review = enrichedReviews[i];
            
            // Otherwise we need to fetch the client profile
            if (review.clientId) {
                try {
                    console.log("Fetching profile picture for client:", review.clientId);
                    const response = await fetch(`http://localhost:3000/client/${review.clientId}`, {
                        headers: token ? { "Authorization": `Bearer ${token}` } : {}
                    });
                    
                    if (response.ok) {
                        const clientData = await response.json();
                        console.log("Client data received:", clientData);
                        
                        if (clientData && clientData.profilePicture) {
                            // Store the full URL to the profile picture
                            review.clientProfilePicture = `/uploads/${clientData.profilePicture}`;
                            console.log("Profile picture set:", review.clientProfilePicture);
                        }
                    }
                } catch (err) {
                    console.warn("Could not fetch profile for client", review.clientId, err);
                }
            }
        }
        
        console.log("Enriched reviews with profile pictures:", enrichedReviews);
        return enrichedReviews;
        
    } catch (error) {
        console.error("Error enriching reviews with profile data:", error);
        return enrichedReviews;
    }
}

// Function to display reviews
function displayReviews(reviews) {
    const container = document.querySelector("#pills-reviews .col-lg-6:first-of-type");
    
    if (!container) {
        console.error("Review container not found");
        return;
    }
    
    // Clear existing reviews
    container.innerHTML = '<h6 class="mb-24">Reviews</h6>';
    
    if (!reviews || reviews.length === 0) {
        const noReviews = document.createElement("div");
        noReviews.className = "text-center py-24";
        noReviews.textContent = "No reviews yet. Be the first to review this product!";
        container.appendChild(noReviews);
        
        // Even with no reviews, update the stats to show zeros
        updateReviewStats({
            averageRating: 0,
            totalReviews: 0,
            ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
        
        return;
    }
    
    // Create reviews element
    reviews.forEach((review) => {
        const el = document.createElement("div");
        el.className = "d-flex align-items-start gap-24 pb-44 border-bottom border-gray-100 mb-44 review-item";
        
        // Profile picture handling: Check if user has a profile picture
        let profileImgHtml = '';
        
        if (review.clientProfilePicture) {
            // If user has a profile picture, use it with the correct path
            // Note: We're not prepending /uploads/ as that's already included in the path
            profileImgHtml = `<img src="${review.clientProfilePicture}" alt="${review.clientName}" 
                              class="w-52 h-52 object-fit-cover rounded-circle flex-shrink-0">`;
        } else {
            // Otherwise use the initial in a colored circle
            const initial = (review.clientName || "A").charAt(0).toUpperCase();
            profileImgHtml = `<div class="w-52 h-52 bg-main-50 rounded-circle flex-center flex-shrink-0 text-main-600 fw-bold">
                              ${initial}
                            </div>`;
        }
        
        el.innerHTML = `
            ${profileImgHtml}
            <div class="flex-grow-1">
                <div class="flex-between align-items-start gap-8">
                    <div>
                        <h6 class="mb-12 text-md">${review.clientName || "Anonymous"}</h6>
                        <div class="flex-align gap-8 stars">${renderStars(review.rating)}</div>
                    </div>
                    <span class="text-gray-800 text-xs">${formatDateDiff(review.createdAt)}</span>
                </div>
                <h6 class="mb-14 text-md mt-24">${review.title || "Review"}</h6>
                <p class="text-gray-700">${review.comment || "No comment provided"}</p>

            </div>
        `;
        
        container.appendChild(el);
    });
    
    // Calculate and update the statistics
    const stats = {
        averageRating: currentProduct.averageRating || calculateAverageRating(reviews),
        totalReviews: reviews.length,
        ratingCounts: calculateRatingCounts(reviews)
    };
    
    // Update the statistics in the UI
    updateReviewStats(stats);
}

function renderStars(rating) {
    let stars = "";
    for (let i = 0; i < 5; i++) {
        stars += `<span class="text-15 fw-medium ${i < rating ? "text-warning-600" : "text-gray-300"} d-flex">
                    <i class="ph-fill ph-star"></i>
                </span>`;
    }
    return stars;
}

function formatDateDiff(dateStr) {
    const reviewDate = new Date(dateStr);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(reviewDate.getTime())) {
        return "Recently";
    }
    
    const diffTime = Math.abs(now - reviewDate);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Format based on time difference
    if (diffMinutes < 60) {
        return diffMinutes <= 1 ? "Just now" : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    } else if (diffDays < 30) {
        return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    } else if (diffMonths < 12) {
        return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
    } else {
        return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
    }
}

// Function to update a review element with data
function updateReviewElement(element, review) {
    if (!element || !review) return

    // Update reviewer name
    const nameElement = element.querySelector("h6.text-md")
    if (nameElement) {
    nameElement.textContent = review.userName || "Anonymous"
    }

    // Update rating stars
    const starsContainer = element.querySelector(".flex-align.gap-8")
    if (starsContainer) {
    starsContainer.innerHTML = ""
    for (let i = 0; i < 5; i++) {
        const star = document.createElement("span")
        star.className = `text-15 fw-medium ${i < review.rating ? "text-warning-600" : "text-gray-300"} d-flex`
        star.innerHTML = '<i class="ph-fill ph-star"></i>'
        starsContainer.appendChild(star)
    }
    }

    // Update date
    const dateElement = element.querySelector(".text-gray-800.text-xs")
    if (dateElement) {
    const reviewDate = new Date(review.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now - reviewDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    dateElement.textContent = `${diffDays} ${diffDays === 1 ? "Day" : "Days"} ago`
    }

    // Update title
    const titleElement = element.querySelector("h6.text-md.mt-24")
    if (titleElement) {
    titleElement.textContent = review.title || "Review"
    }

    // Update content
    const contentElement = element.querySelector("p.text-gray-700")
    if (contentElement) {
    contentElement.textContent = review.content || "No comment provided"
    }
}

// Function to update review statistics
function updateReviewStats(stats) {
    if (!stats) return;

    // Update average rating
    const avgRatingElement = document.querySelector(".border.border-gray-100.rounded-8.px-40.py-52 h2");
    if (avgRatingElement) {
        avgRatingElement.textContent = stats.averageRating.toFixed(1) || "0.0";
        
        // Also update the main product rating at the top of the page
        updateProductStarRating(stats.averageRating);
    }

    // Get all progress bars and count elements
    const ratingContainers = document.querySelectorAll('.flex-align.gap-8.mb-20, .flex-align.gap-8.mb-0');
    
    if (!ratingContainers || ratingContainers.length === 0) {
        console.error("Rating bars not found in the DOM");
        return;
    }
    
    console.log(`Found ${ratingContainers.length} rating bars`);
    
    // Set up stars based on average rating
    const starsContainer = document.querySelector(".border.border-gray-100.rounded-8.px-40.py-52 .flex-align.gap-8");
    if (starsContainer) {
        starsContainer.innerHTML = renderStars(Math.round(stats.averageRating));
    }
    
    // Update rating bars (5 to 1 stars)
    for (let i = 0; i < ratingContainers.length; i++) {
        const container = ratingContainers[i];
        const rating = 5 - i; // 5, 4, 3, 2, 1
        const progressBar = container.querySelector('.progress-bar');
        const countElement = container.querySelector('.text-gray-900.flex-shrink-0:last-child');
        
        if (progressBar && countElement) {
            const count = stats.ratingCounts[rating] || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            
            // Log for debugging
            console.log(`Rating ${rating}: ${count} reviews, ${percentage.toFixed(1)}%`);
            
            // Update the progress bar width
            progressBar.style.width = `${percentage}%`;
            
            // Update the count text
            countElement.textContent = count.toString();
        }
    }
}

// Assure-toi d'inclure cette fonction dans ton script prod-details-client.js
async function handleReviewSubmit(event) {
    event.preventDefault();
  
    const productId = getUrlParameter("id");
    const ratingInput = document.getElementById("rating-input");
    const titleInput = document.getElementById("review-title");
    const contentInput = document.getElementById("review-comment");
    const token = getUserToken();
  
    // Validation basique
    if (!productId) return showAlert("danger", "Product ID is missing");
    if (!ratingInput.value) return showAlert("danger", "Please select a rating");
    if (!titleInput.value) return showAlert("danger", "Please enter a review title");
    if (!contentInput.value) return showAlert("danger", "Please enter review content");
    if (!token) return showAlert("danger", "You must be logged in to submit a review");
  
    // Préparation des données
    const reviewData = {
      rating: parseInt(ratingInput.value, 10),
      title: titleInput.value.trim(),
      comment: contentInput.value.trim()
    };
  
    console.log("Sending reviewData:", reviewData);
  
    // UI feedback
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...`;
    submitBtn.disabled = true;
  
    try {
      // Fixed URL to match backend endpoint exactly
      const res = await fetch(`http://localhost:3000/product/${productId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });
  
      const data = await res.json();
      console.log("Server responded:", data);
  
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }
  
      // succès
      showAlert("success", "Review submitted successfully!");
      event.target.reset();
      ratingInput.value = "";
      // réinitialise les étoiles si nécessaire
      document.querySelectorAll(".rating-stars .text-15").forEach(star => {
        star.classList.replace("text-warning-600", "text-gray-300");
      });
      loadProductReviews(productId);
  
    } catch (err) {
      console.error("Submission error:", err);
      showAlert("danger", err.message || "Failed to submit review. Please try again.");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
}
  


// Function to handle quantity changes
function setupQuantityButtons() {
    const minusBtnOrig = document.querySelector(".quantity__minus")
    const plusBtnOrig = document.querySelector(".quantity__plus")
    const quantityInput = document.getElementById("side-price-insert-prod")

    if (!minusBtnOrig || !plusBtnOrig || !quantityInput || !currentProduct) return
    const maxStock = currentProduct.stock || 0
    const minusBtn = minusBtnOrig.cloneNode(true)
    const plusBtn = plusBtnOrig.cloneNode(true)
    minusBtnOrig.parentNode.replaceChild(minusBtn, minusBtnOrig)
    plusBtnOrig.parentNode.replaceChild(plusBtn, plusBtnOrig)
    quantityInput.value = Math.min(Math.max(Number.parseInt(quantityInput.value) || 1, 1), maxStock)
    minusBtn.addEventListener("click", (e) => {
    e.preventDefault()
    let current = quantityInput.valueAsNumber || 1
    current = current - 1
    if (current < 1) current = 1
    quantityInput.value = current
    updateTotalPrice()
    })

    plusBtn.addEventListener("click", (e) => {
    e.preventDefault()
    let current = quantityInput.valueAsNumber || 1
    current = current + 1
    if (current > maxStock) {
        current = maxStock
        showSweetAlert("warning", "Stock Limit", "Cannot add more than available stock")
    }
    quantityInput.value = current
    updateTotalPrice()
    })
    quantityInput.addEventListener("input", () => {
    let val = quantityInput.valueAsNumber
    if (isNaN(val) || val < 1) {
        val = 1
    } else if (val > maxStock) {
        val = maxStock
        showSweetAlert("warning", "Stock Limit", "Cannot add more than available stock")
    }
    quantityInput.value = val
    updateTotalPrice()
    })

    quantityInput.addEventListener("keypress", (e) => {
    if (!/[0-9]/.test(e.key)) e.preventDefault()
    })

    updateTotalPrice()
}

// Function to update total price based on quantity
function updateTotalPrice() {
    if (!currentProduct) return
    const quantityInput = document.getElementById("side-price-insert-prod")
    const priceElement = document.getElementById("side-price-prod")
    if (quantityInput && priceElement) {
    const quantity = Number.parseInt(quantityInput.value) || 1
    const unitPrice = currentProduct.productPrice || 0
    const totalPrice = (quantity * unitPrice).toFixed(2)
    priceElement.innerHTML = `<h6 class="text-20 text-gray-900">${totalPrice} DT</h6>`
    }
}

// Replace the setupAddToCartButton function with this corrected version
function setupAddToCartButton() {
    const addToCartBtn = document.querySelector(".btn.btn-main")

    if (addToCartBtn) {
    // Remove any existing event listeners
    const newAddToCartBtn = addToCartBtn.cloneNode(true)
    addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn)

    newAddToCartBtn.addEventListener("click", (e) => {
        e.preventDefault()

        const productId = getUrlParameter("id")
        const quantity = Number.parseInt(document.getElementById("side-price-insert-prod").value)

        if (!productId) {
        showSweetAlert("error", "Error", "Product ID is missing")
        return
        }

        // Check if user is logged in
        const userId = getUserId()

        if (!userId) {
        showAuthModal()
        } else {
            addToCart(productId, quantity, false, userId)
        }
    })
    }
}

// Replace the addToCart function with this corrected version
function addToCart(productId, quantity, redirectToCheckout = false, userId) {
    // If no userId, use localStorage for temporary storage
    if (!userId) {
    const cart = JSON.parse(localStorage.getItem("cart")) || []
    const existingProductIndex = cart.findIndex((item) => item.productId === productId)

    if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += quantity
    } else {
        cart.push({
        productId: productId,
        quantity: quantity,
        })
    }
    localStorage.setItem("cart", JSON.stringify(cart))

    updateCartCount(cart)

    if (redirectToCheckout) {
        window.location.href = "/checkout.html"
    } else {
        showSweetAlert("success", "Success", "Product added to cart!")
    }
    return
    }

    // User is logged in, add to cart in database
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "http://localhost:3000/cart/add", true)
    xhr.setRequestHeader("Content-Type", "application/json")

    // Show loading indicator
    const loadingIndicator = document.createElement("div")
    loadingIndicator.className = "loading-indicator"
    loadingIndicator.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding to cart...'
    document.body.appendChild(loadingIndicator)

    xhr.onload = () => {
    // Remove loading indicator
    if (document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator)
    }

    if (xhr.status >= 200 && xhr.status < 300) {
        try {
        const response = JSON.parse(xhr.responseText)

        // Update cart count in UI
        const cartCountElement = document.querySelector(".cart-count")
        if (cartCountElement && response.cart && response.cart.items) {
            const totalItems = response.cart.items.reduce((total, item) => total + item.quantity, 0)
            cartCountElement.textContent = totalItems
        }
        
        // Immediately update cart count in real-time using the global counter function
        const token = localStorage.getItem("token")
        if (window.mallifyCounters && typeof window.mallifyCounters.fetchCartCount === 'function') {
            window.mallifyCounters.fetchCartCount(userId, token);
        }

        if (redirectToCheckout) {
            window.location.href = "/checkout.html"
        } else {
            showSweetAlert("success", "Success", "Product added to cart!")
        }
        } catch (e) {
        console.error("Error parsing response:", e)
        showSweetAlert("error", "Error", "Error processing server response")
        }
    } else {
        try {
        const response = JSON.parse(xhr.responseText)
        showSweetAlert("error", "Error", response.message || "Failed to add product to cart")
        } catch (e) {
        showSweetAlert("error", "Error", "Failed to add product to cart")
        }
    }
    }

    xhr.onerror = () => {
    // Remove loading indicator
    if (document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator)
    }
    showSweetAlert("error", "Error", "Network error occurred")
    }

    xhr.send(
    JSON.stringify({
        clientId: userId,
        productId: productId,
        quantity: quantity,
    }),
    )
}

// Function to setup rating stars
function setupRatingStars() {
    const stars = document.querySelectorAll(".rating-stars .text-15")
    const ratingInput = document.getElementById("rating-input")

    if (stars.length > 0 && ratingInput) {
    stars.forEach((star, index) => {
        star.addEventListener("click", () => {
        // Set rating value
        ratingInput.value = index + 1

        // Update star colors
        stars.forEach((s, i) => {
            if (i <= index) {
            s.classList.replace("text-gray-300", "text-warning-600")
            } else {
            s.classList.replace("text-warning-600", "text-gray-300")
            }
        })
        })

        // Add hover effect
        star.addEventListener("mouseenter", () => {
        stars.forEach((s, i) => {
            if (i <= index) {
            s.classList.replace("text-gray-300", "text-warning-600")
            }
        })
        })

        star.addEventListener("mouseleave", () => {
        const rating = Number.parseInt(ratingInput.value) || 0
        stars.forEach((s, i) => {
            if (i < rating) {
            s.classList.replace("text-gray-300", "text-warning-600")
            } else {
            s.classList.replace("text-warning-600", "text-gray-300")
            }
        })
        })
    })
    }
}

// Function to show alerts
function showAlert(type, message) {
    const alertDiv = document.createElement("div")
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`
    alertDiv.role = "alert"
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `

    const container = document.querySelector(".container")
    container.insertBefore(alertDiv, container.firstChild)

    // Declare bootstrap here to avoid undefined variable error
    let bsAlert
    try {
    bsAlert = new bootstrap.Alert(alertDiv)
    } catch (error) {
    console.error("Bootstrap Alert not properly initialized:", error)
    }

    setTimeout(() => {
    if (alertDiv.parentNode) {
        if (bsAlert && bsAlert.close) {
        bsAlert.close()
        } else {
        // Fallback to removing the element if bsAlert is not available or close method is missing
        alertDiv.parentNode.removeChild(alertDiv)
        }
    }
    }, 5000)
}

// Function to initialize price display
function initializePriceDisplay() {
    if (!currentProduct) return

    // Set initial price display
    const priceElement = document.getElementById("side-price-prod")
    if (priceElement) {
    priceElement.innerHTML = `<h6 class="text-20 text-gray-900">${currentProduct.productPrice.toFixed(2)} DT</h6>`
    }

    // Set shipping fee to always be 15 DT
    const shippingElement = document.getElementById("shipping-fee")
    if (shippingElement) {
    shippingElement.textContent = "15 DT"
    }
}

// Add these helper functions if they don't exist
function getUserId() {

    return localStorage.getItem("userId") || sessionStorage.getItem("userId")
}

// Add this function to check for pending cart items after login
function checkPendingCartItems() {
    const pendingItem = localStorage.getItem("pendingCartItem")

    if (pendingItem) {
    try {
        const item = JSON.parse(pendingItem)
        const currentTime = new Date().getTime()

        // Only process if the pending item is less than 30 minutes old
        if (currentTime - item.timestamp < 30 * 60 * 1000) {
        const userId = getUserId()

        if (userId) {
            // User is now logged in, add the pending item to cart
            addToCart(item.productId, item.quantity, false, userId)

            // Clear the pending item
            localStorage.removeItem("pendingCartItem")
        }
        } else {
        // Item is too old, remove it
        localStorage.removeItem("pendingCartItem")
        }
    } catch (e) {
        console.error("Error processing pending cart item:", e)
        localStorage.removeItem("pendingCartItem")
    }
    }
}

// Add CSS for the toast notification
const toastStyle = document.createElement("style")
toastStyle.textContent = `
.cool-toast {
    position: fixed;
    top: 20px;
    right: -350px;
    width: 320px;
    background-color: #fff;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 0;
    z-index: 9999;
    overflow: hidden;
    transition: right 0.3s ease;
}

.cool-toast.show {
    right: 20px;
}

.cool-toast-content {
    display: flex;
    align-items: center;
    padding: 16px;
}

.cool-toast-icon {
    background-color: #2563eb;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    flex-shrink: 0;
}

.cool-toast-icon i {
    font-size: 20px;
}

.cool-toast-message {
    flex-grow: 1;
}

.cool-toast-message h4 {
    margin: 0 0 5px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.cool-toast-message p {
    margin: 0;
    font-size: 14px;
    color: #64748b;
}

.cool-toast-progress {
    height: 3px;
    background-color: #2563eb;
    width: 0%;
}

@keyframes toast-progress {
    from { width: 0%; }
    to { width: 100%; }
}
`
document.head.appendChild(toastStyle)

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded - initializing product details page")

    if (typeof Swal === "undefined") {
    const sweetAlertScript = document.createElement("script")
    sweetAlertScript.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11"
    document.head.appendChild(sweetAlertScript)
    }

    if (typeof jQuery === "undefined") {
    console.error("jQuery is not loaded. Ensure it is included in your HTML.")
    return
    }

    if (getUserId()) {
    checkRedirectAfterLogin()
    }

    loadProductDetails()
    setupAddToCartButton()
    setupBuyNowButton()
    setupRatingStars()
    
    // Initialize the review form properly
    const reviewForm = document.getElementById("review-form")
    if (reviewForm) {
        console.log("Review form found, adding event listener for submission")
        reviewForm.addEventListener("submit", handleReviewSubmit)
        
        // Make sure the rating stars are clickable
        const ratingStars = document.querySelectorAll(".rating-stars .text-15")
        const ratingInput = document.getElementById("rating-input")
        
        if (ratingStars.length > 0 && ratingInput) {
            ratingStars.forEach((star, index) => {
                star.style.cursor = "pointer"
                star.addEventListener("click", () => {
                    console.log("Star clicked with rating:", index + 1)
                    ratingInput.value = index + 1
                    
                    // Update star appearance
                    ratingStars.forEach((s, i) => {
                        if (i <= index) {
                            s.classList.remove("text-gray-300")
                            s.classList.add("text-warning-600")
                        } else {
                            s.classList.remove("text-warning-600")
                            s.classList.add("text-gray-300")
                        }
                    })
                })
            })
        }
    } else {
        console.log("Review form not found in the DOM")
    }
})

// Log a message to confirm the script is loaded
console.log("Product details client script loaded")

function setupBuyNowButton() {
    const buyNowBtn = document.querySelector(".btn.btn-secondary")

    if (buyNowBtn) {
    // Remove any existing event listeners
    const newBuyNowBtn = buyNowBtn.cloneNode(true)
    buyNowBtn.parentNode.replaceChild(newBuyNowBtn, buyNowBtn)

    newBuyNowBtn.addEventListener("click", (e) => {
        e.preventDefault()

        const productId = getUrlParameter("id")
        const quantity = Number.parseInt(document.getElementById("side-price-insert-prod").value)

        if (!productId) {
        showSweetAlert("error", "Error", "Product ID is missing")
        return
        }

        // Check if user is logged in
        const userId = getUserId()

        if (!userId) {
        showAuthModal()
        } else {
            addToCart(productId, quantity, true, userId)
        }
    })
    }
}

// Declare jQuery and bootstrap as global variables if they are not already
if (typeof jQuery === "undefined") {
    var jQuery = window.jQuery
}

if (typeof bootstrap === "undefined") {
    var bootstrap = window.bootstrap
}

function updateCartCount(cart) {
    const cartCountElement = document.querySelector(".cart-count")
    if (cartCountElement) {
    cartCountElement.textContent = cart.reduce((total, item) => total + item.quantity, 0)
    }
}

// Add this function to check for redirect after login
function checkRedirectAfterLogin() {
    const redirectUrl = localStorage.getItem("redirectAfterLogin")
    if (redirectUrl) {
    localStorage.removeItem("redirectAfterLogin")
    // If we're already on the product page, just reload it
    if (redirectUrl === window.location.href) {
        window.location.reload()
    } else {
        window.location.href = redirectUrl
    }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded - initializing product details page")

    // Load SweetAlert2 if it's not already loaded
    if (typeof Swal === "undefined") {
    const sweetAlertScript = document.createElement("script")
    sweetAlertScript.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11"
    document.head.appendChild(sweetAlertScript)
    }

    // Check if jQuery is loaded
    if (typeof jQuery === "undefined") {
    console.error("jQuery is not loaded. Ensure it is included in your HTML.")
    return
    }

    if (getUserId()) {
    checkRedirectAfterLogin()
    }

    loadProductDetails()
    setupAddToCartButton()
    setupBuyNowButton()
    setupRatingStars()
    const reviewForm = document.getElementById("review-form")
    if (reviewForm) {
    reviewForm.addEventListener("submit", handleReviewSubmit)
    }
})

// Replace the showSweetAlert function with this enhanced version
function showSweetAlert(icon, title, text) {
    // Check if SweetAlert2 is available
    if (typeof Swal !== "undefined") {
    Swal.fire({
        icon: icon, // 'success', 'error', 'warning', 'info', 'question'
        title: title,
        text: text,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
        customClass: {
        popup: "modern-toast",
        title: "modern-toast-title",
        htmlContainer: "modern-toast-content",
        timerProgressBar: "modern-toast-progress",
        },
        iconColor: "white",
        showClass: {
        popup: "animate__animated animate__fadeInRight animate__faster",
        },
        hideClass: {
        popup: "animate__animated animate__fadeOutRight animate__faster",
            },
        })
        } else {
        // Fallback to regular alert if SweetAlert is not available
        showAlert(icon === "error" ? "danger" : icon, text)
        }
}

// Replace the sweetAlertStyle with this enhanced styling
const sweetAlertStyle = document.createElement("style")
sweetAlertStyle.textContent = `
.modern-toast {
    padding: 12px 16px !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    min-width: 320px !important;
    max-width: 380px !important;
    overflow: hidden !important;
}

.modern-toast.swal2-icon-success {
    background: linear-gradient(135deg, #28c76f, #1f9d57) !important;
}

.modern-toast.swal2-icon-error {
    background: linear-gradient(135deg, #ea5455, #c73e3f) !important;
}

.modern-toast.swal2-icon-warning {
    background: linear-gradient(135deg, #ff9f43, #e67e22) !important;
}

.modern-toast.swal2-icon-info {
    background: linear-gradient(135deg, #00cfe8, #1e9ff2) !important;
}

.modern-toast .swal2-icon {
    margin: 0 12px 0 0 !important;
    height: 2em !important;
    width: 2em !important;
}

.modern-toast .swal2-icon-content {
    font-size: 1.5em !important;
}

.modern-toast-title {
    color: white !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    margin-bottom: 4px !important;
}

.modern-toast-content {
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 0.9rem !important;
    margin: 0 !important;
}

.modern-toast-progress {
    height: 4px !important;
    bottom: 0 !important;
    left: 0 !important;
    position: absolute !important;
    background: rgba(255, 255, 255, 0.3) !important;
}

/* Animation classes */
@keyframes fadeInRight {
    from {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
    }
    to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    }
}

@keyframes fadeOutRight {
    from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    }
    to {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
    }
}

.animate__animated {
    animation-duration: 0.5s;
    animation-fill-mode: both;
}

.animate__faster {
    animation-duration: 0.3s;
}

.animate__fadeInRight {
    animation-name: fadeInRight;
}

.animate__fadeOutRight {
    animation-name: fadeOutRight;
}
`

// Add this to the DOMContentLoaded event to load animate.css if needed
document.addEventListener("DOMContentLoaded", () => {
    // Load SweetAlert2 if it's not already loaded
    if (typeof Swal === "undefined") {
    const sweetAlertScript = document.createElement("script")
    sweetAlertScript.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11"
    document.head.appendChild(sweetAlertScript)
    }
})

// Function to calculate rating counts from reviews array
function calculateRatingCounts(reviews) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    if (!reviews || !Array.isArray(reviews)) return counts;
    
    reviews.forEach(review => {
        const rating = parseInt(review.rating);
        if (rating >= 1 && rating <= 5) {
            counts[rating]++;
        }
    });
    
    return counts;
}

// Function to calculate average rating from reviews array
function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    
    const total = reviews.reduce((sum, review) => sum + (parseInt(review.rating) || 0), 0);
    return (total / reviews.length) || 0;
}

// New function to update product star rating
function updateProductStarRating(rating) {
    // Find the star container 
    const starContainer = document.querySelector('.flex-align.flex-wrap.gap-12 .flex-align.gap-8');
    if (!starContainer) return;
    
    // Add ID if not present already
    if (!starContainer.id) {
        starContainer.id = 'product-star-rating';
    }
    
    // Get all stars in the container
    const stars = starContainer.querySelectorAll('span');
    if (!stars || stars.length === 0) return;
    
    // Round to nearest half for half-star support
    const ratingValue = Math.round(rating * 2) / 2;
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = (ratingValue % 1) === 0.5;
    
    // Update each star
    stars.forEach((star, index) => {
        if (index < fullStars) {
            // Full star
            star.innerHTML = '<i class="ph-fill ph-star"></i>';
            star.className = 'text-15 fw-medium text-warning-600 d-flex';
        } else if (index === fullStars && hasHalfStar) {
            // Half star - using available icon or fallback to full star
            try {
                star.innerHTML = '<i class="ph-fill ph-star-half"></i>';
                star.className = 'text-15 fw-medium text-warning-600 d-flex';
            } catch(e) {
                // If half-star icon not available, use full star
                star.innerHTML = '<i class="ph-fill ph-star"></i>';
                star.className = 'text-15 fw-medium text-warning-600 d-flex';
            }
        } else {
            // Empty star
            star.innerHTML = '<i class="ph ph-star"></i>';
            star.className = 'text-15 fw-medium text-gray-300 d-flex';
        }
    });
    
    // Update the rating text
    const ratingText = document.querySelector('.flex-align.flex-wrap.gap-12 .text-sm.fw-medium.text-neutral-600');
    if (ratingText) {
        ratingText.textContent = ratingValue.toFixed(1) + ' Star Rating';
        if (!ratingText.id) {
            ratingText.id = 'product-rating-text';
        }
    }
    
    // Update rating count
    const ratingCount = document.querySelector('.flex-align.flex-wrap.gap-12 .text-sm.fw-medium.text-gray-500');
    if (ratingCount && currentProduct && currentProduct.reviewCount) {
        ratingCount.textContent = `(${currentProduct.reviewCount})`;
    }
}