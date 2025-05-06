function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(name)
}

let currentProduct = null

function getUserToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

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

            initializePriceDisplay()

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
    const productNameElement = document.querySelector(".product-details__content h5")
    if (productNameElement) {
    productNameElement.textContent = product.productName || "Product Name Not Available"
    }

    const skuElement = document.querySelector(".flex-align.flex-wrap.gap-12 + span + span")
    if (skuElement) {
    skuElement.innerHTML = `<span class="text-gray-400">SKU:</span>${product.productId || "N/A"}`
    }

    const priceElement = document.querySelector(".flex-align.gap-8 h6")
    if (priceElement) {
    priceElement.textContent = `${product.productPrice || 0} DT`
    }

    updateProductStarRating(product.averageRating || 4.7);

    const regularPriceElement = document.querySelector(".flex-align.gap-4 h6")
    if (regularPriceElement && product.regularPrice) {
    regularPriceElement.textContent = `${product.regularPrice} DT`
    }

    const discountElement = document.querySelector(".flex-align.gap-8.text-main-two-600")
    if (discountElement && product.regularPrice && product.productPrice) {
    const discount = Math.round(((product.regularPrice - product.productPrice) / product.regularPrice) * 100)
    if (discount > 0) {
        discountElement.innerHTML = `<i class="ph-fill ph-seal-percent text-xl"></i> -${discount}%`
    } else {
        discountElement.parentElement.style.display = "none"
    }
    }

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
    

    const stockElement = document.querySelector('label[for="stock"]')
    if (stockElement) {
    stockElement.textContent = `Total Stock: ${product.stock || 0}`
    }

    const availabilityElement = document.querySelector(
    ".product-dContent__box .mb-40:nth-of-type(2) ul li:nth-of-type(4) .text-gray-500",
    )
    if (availabilityElement) {
    availabilityElement.textContent = ` ${product.availability || "N/A"}`
    }


    const shopNameElement = document.getElementById("shop-name-detail");
    if (shopNameElement) {
        if (product.shop && typeof product.shop === "object" && product.shop.shopName) {
            shopNameElement.textContent = product.shop.shopName;
        }
        else if (product.shop) {
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

    sliderFor.innerHTML = '';
    sliderNav.innerHTML = '';

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

    const customSliderStyles = document.createElement('style');
    customSliderStyles.textContent = `
        .slick-prev, .slick-next {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            width: 40px !important;
            height: 100% !important;
            top: 0 !important;
            transform: none !important;
            z-index: 10;
            padding: 0;
            cursor: pointer;
            position: absolute;
        }
        
        .slick-prev {
            left: 5px !important;
        }
        
        .slick-next {
            right: 5px !important;
        }
        
        .slick-prev:before,
        .slick-next:before {
            display: block !important;
            color: white !important;
            font-size: 32px !important;
            font-weight: bold !important;
            opacity: 1 !important;
            background: transparent !important;
            font-family: sans-serif !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            text-shadow: 0 0 8px rgba(0,0,0,0.5) !important;
            line-height: 1 !important;
        }
        
        .slick-prev:before {
            content: '‹' !important;
        }
        
        .slick-next:before {
            content: '›' !important;
        }
        
        /* Also apply styling to You Might Also Like buttons */
        #new-arrival-prev,
        #new-arrival-next {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        
        #new-arrival-prev i,
        #new-arrival-next i {
            color: white !important;
            font-size: 32px !important;
            text-shadow: 0 0 8px rgba(0,0,0,0.5) !important;
        }
    `;
    document.head.appendChild(customSliderStyles);

    try {
        if (typeof jQuery !== 'undefined') {
            const $for = jQuery('.product-details__thumb-slider');
            const $nav = jQuery('.product-details__images-slider');

            if ($for.hasClass('slick-initialized')) $for.slick('unslick');
            if ($nav.hasClass('slick-initialized')) $nav.slick('unslick');

            $for.slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: true,
                fade: true,
                asNavFor: '.product-details__images-slider'
            });

            $nav.slick({
                slidesToShow: 3,
                slidesToScroll: 1,
                asNavFor: '.product-details__thumb-slider',
                dots: false,
                arrows: true,
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

            const newArrivalSlider = jQuery('.new-arrival__slider');
            if (newArrivalSlider.length) {
                newArrivalSlider.slick({
                    slidesToShow: 4,
                    slidesToScroll: 1,
                    arrows: true,
                    prevArrow: $('#new-arrival-prev'),
                    nextArrow: $('#new-arrival-next'),
                    dots: false,
                    responsive: [
                        {
                            breakpoint: 1200,
                            settings: {
                                slidesToShow: 3,
                            }
                        },
                        {
                            breakpoint: 992,
                            settings: {
                                slidesToShow: 2,
                            }
                        },
                        {
                            breakpoint: 768,
                            settings: {
                                slidesToShow: 1,
                            }
                        }
                    ]
                });
            }
        }
    } catch (e) {
        console.error("Error initializing slick slider:", e);
    }
}



// Function to load product reviews
function loadProductReviews(productId) {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/product/${productId}/reviews`, true)
    
    const token = getUserToken();
    if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.responseText);

                if (response.status === "success" && response.data && response.data.reviews) {
                    if (response.data.reviews.length > 0) {
                        fetchClientProfiles(response.data.reviews).then(enrichedReviews => {
                            displayReviews(enrichedReviews);
                            
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

// Function to fetch client profile information for reviews - CONVERTED FROM FETCH TO XHR
function fetchClientProfiles(reviews) {
    return new Promise((resolve, reject) => {
        if (!reviews || reviews.length === 0) return resolve([]);
        
        const enrichedReviews = [...reviews];
        const token = getUserToken();
        
        console.log("Fetching client profiles for reviews:", enrichedReviews);
        
        let completedRequests = 0;
        const reviewsWithClientId = enrichedReviews.filter(r => r.clientId);
        
        if (reviewsWithClientId.length === 0) {
            return resolve(enrichedReviews);
        }
        
        for (let i = 0; i < enrichedReviews.length; i++) {
            const review = enrichedReviews[i];
            
            if (review.clientId) {
                console.log("Fetching profile picture for client:", review.clientId);
                
                const xhr = new XMLHttpRequest();
                xhr.open("GET", `http://localhost:3000/client/${review.clientId}`, true);
                
                if (token) {
                    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                }
                
                xhr.onload = function() {
                    completedRequests++;
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const clientData = JSON.parse(xhr.responseText);
                            console.log("Client data received:", clientData);
                            
                            if (clientData && clientData.profilePicture) {
                                review.clientProfilePicture = `/uploads/${clientData.profilePicture}`;
                                console.log("Profile picture set:", review.clientProfilePicture);
                            }
                        } catch (err) {
                            console.warn("Could not parse client data for", review.clientId, err);
                        }
                    }
                    
                    if (completedRequests === reviewsWithClientId.length) {
                        console.log("Enriched reviews with profile pictures:", enrichedReviews);
                        resolve(enrichedReviews);
                    }
                };
                
                xhr.onerror = function() {
                    completedRequests++;
                    console.warn("Could not fetch profile for client", review.clientId);
                    
                    if (completedRequests === reviewsWithClientId.length) {
                        console.log("Enriched reviews with profile pictures:", enrichedReviews);
                        resolve(enrichedReviews);
                    }
                };
                
                xhr.send();
            }
        }
    });
}

// Function to display reviews
function displayReviews(reviews) {
    const container = document.querySelector("#pills-reviews .col-lg-6:first-of-type");
    
    if (!container) {
        console.error("Review container not found");
        return;
    }
    
    container.innerHTML = '<h6 class="mb-24">Reviews</h6>';
    
    if (!reviews || reviews.length === 0) {
        const noReviews = document.createElement("div");
        noReviews.className = "text-center py-24";
        noReviews.textContent = "No reviews yet. Be the first to review this product!";
        container.appendChild(noReviews);
        
        updateReviewStats({
            averageRating: 0,
            totalReviews: 0,
            ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
        
        return;
    }
    
    reviews.forEach((review) => {
        const el = document.createElement("div");
        el.className = "d-flex align-items-start gap-24 pb-44 border-bottom border-gray-100 mb-44 review-item";
        
        let profileImgHtml = '';
        
        if (review.clientProfilePicture) {
            profileImgHtml = `<img src="${review.clientProfilePicture}" alt="${review.clientName}" 
                            class="w-52 h-52 object-fit-cover rounded-circle flex-shrink-0">`;
        } else {
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
    
    const stats = {
        averageRating: currentProduct.averageRating || calculateAverageRating(reviews),
        totalReviews: reviews.length,
        ratingCounts: calculateRatingCounts(reviews)
    };
    
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
    
    if (isNaN(reviewDate.getTime())) {
        return "Recently";
    }
    
    const diffTime = Math.abs(now - reviewDate);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
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

    const nameElement = element.querySelector("h6.text-md")
    if (nameElement) {
    nameElement.textContent = review.userName || "Anonymous"
    }

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

    const dateElement = element.querySelector(".text-gray-800.text-xs")
    if (dateElement) {
    const reviewDate = new Date(review.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now - reviewDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    dateElement.textContent = `${diffDays} ${diffDays === 1 ? "Day" : "Days"} ago`
    }

    const titleElement = element.querySelector("h6.text-md.mt-24")
    if (titleElement) {
    titleElement.textContent = review.title || "Review"
    }

    const contentElement = element.querySelector("p.text-gray-700")
    if (contentElement) {
    contentElement.textContent = review.content || "No comment provided"
    }
}

// Function to update review statistics
function updateReviewStats(stats) {
    if (!stats) return;

    const avgRatingElement = document.querySelector(".border.border-gray-100.rounded-8.px-40.py-52 h2");
    if (avgRatingElement) {
        avgRatingElement.textContent = stats.averageRating.toFixed(1) || "0.0";
        updateProductStarRating(stats.averageRating);
    }

    const ratingContainers = document.querySelectorAll('.flex-align.gap-8.mb-20, .flex-align.gap-8.mb-0');
    
    if (!ratingContainers || ratingContainers.length === 0) {
        console.error("Rating bars not found in the DOM");
        return;
    }
    
    console.log(`Found ${ratingContainers.length} rating bars`);
    
    const starsContainer = document.querySelector(".border.border-gray-100.rounded-8.px-40.py-52 .flex-align.gap-8");
    if (starsContainer) {
        starsContainer.innerHTML = renderStars(Math.round(stats.averageRating));
    }
    
    for (let i = 0; i < ratingContainers.length; i++) {
        const container = ratingContainers[i];
        const rating = 5 - i; 
        const progressBar = container.querySelector('.progress-bar');
        const countElement = container.querySelector('.text-gray-900.flex-shrink-0:last-child');
        
        if (progressBar && countElement) {
            const count = stats.ratingCounts[rating] || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            
            console.log(`Rating ${rating}: ${count} reviews, ${percentage.toFixed(1)}%`);
            
            progressBar.style.width = `${percentage}%`;
            
            countElement.textContent = count.toString();
        }
    }
}


function handleReviewSubmit(event) {
    event.preventDefault();
  
    const productId = getUrlParameter("id");
    const ratingInput = document.getElementById("rating-input");
    const titleInput = document.getElementById("review-title");
    const contentInput = document.getElementById("review-comment");
    const token = getUserToken();
  
    if (!productId) return showAlert("danger", "Product ID is missing");
    if (!ratingInput.value) return showAlert("danger", "Please select a rating");
    if (!titleInput.value) return showAlert("danger", "Please enter a review title");
    if (!contentInput.value) return showAlert("danger", "Please enter review content");
    if (!token) return showAlert("danger", "You must be logged in to submit a review");
  
    const reviewData = {
      rating: parseInt(ratingInput.value, 10),
      title: titleInput.value.trim(),
      comment: contentInput.value.trim()
    };
  
    console.log("Sending reviewData:", reviewData);
  
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...`;
    submitBtn.disabled = true;
  
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `http://localhost:3000/product/${productId}/review`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    
    xhr.onload = function() {
        try {
            const data = JSON.parse(xhr.responseText);
            console.log("Server responded:", data);
            
            if (xhr.status >= 200 && xhr.status < 300) {
                showAlert("success", "Review submitted successfully!");
                event.target.reset();
                ratingInput.value = "";
                document.querySelectorAll(".rating-stars .text-15").forEach(star => {
                    star.classList.replace("text-warning-600", "text-gray-300");
                });
                loadProductReviews(productId);
            } else {
                showAlert("danger", data.message || "Failed to submit review");
            }
        } catch (err) {
            console.error("Error parsing response:", err);
            showAlert("danger", "Failed to process server response");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };
    
    xhr.onerror = function() {
        console.error("Network error occurred");
        showAlert("danger", "Network error occurred. Please try again.");
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    };
    
    xhr.send(JSON.stringify(reviewData));
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

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "http://localhost:3000/cart/add", true)
    xhr.setRequestHeader("Content-Type", "application/json")

    const loadingIndicator = document.createElement("div")
    loadingIndicator.className = "loading-indicator"
    loadingIndicator.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding to cart...'
    document.body.appendChild(loadingIndicator)

    xhr.onload = () => {
    if (document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator)
    }

    if (xhr.status >= 200 && xhr.status < 300) {
        try {
        const response = JSON.parse(xhr.responseText)

        const cartCountElement = document.querySelector(".cart-count")
        if (cartCountElement && response.cart && response.cart.items) {
            const totalItems = response.cart.items.reduce((total, item) => total + item.quantity, 0)
            cartCountElement.textContent = totalItems
        }
        
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
        ratingInput.value = index + 1

        stars.forEach((s, i) => {
            if (i <= index) {
            s.classList.replace("text-gray-300", "text-warning-600")
            } else {
            s.classList.replace("text-warning-600", "text-gray-300")
            }
        })
        })

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
        alertDiv.parentNode.removeChild(alertDiv)
        }
    }
    }, 5000)
}

// Function to initialize price display
function initializePriceDisplay() {
    if (!currentProduct) return

    const priceElement = document.getElementById("side-price-prod")
    if (priceElement) {
    priceElement.innerHTML = `<h6 class="text-20 text-gray-900">${currentProduct.productPrice.toFixed(2)} DT</h6>`
    }

    const shippingElement = document.getElementById("shipping-fee")
    if (shippingElement) {
    shippingElement.textContent = "15 DT"
    }
}

function getUserId() {

    return localStorage.getItem("userId") || sessionStorage.getItem("userId")
}

function checkPendingCartItems() {
    const pendingItem = localStorage.getItem("pendingCartItem")

    if (pendingItem) {
    try {
        const item = JSON.parse(pendingItem)
        const currentTime = new Date().getTime()

        if (currentTime - item.timestamp < 30 * 60 * 1000) {
        const userId = getUserId()

        if (userId) {
            addToCart(item.productId, item.quantity, false, userId)
            localStorage.removeItem("pendingCartItem")
        }
        } else {
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
    
    const reviewForm = document.getElementById("review-form")
    if (reviewForm) {
        console.log("Review form found, adding event listener for submission")
        reviewForm.addEventListener("submit", handleReviewSubmit)
        
        const ratingStars = document.querySelectorAll(".rating-stars .text-15")
        const ratingInput = document.getElementById("rating-input")
        
        if (ratingStars.length > 0 && ratingInput) {
            ratingStars.forEach((star, index) => {
                star.style.cursor = "pointer"
                star.addEventListener("click", () => {
                    console.log("Star clicked with rating:", index + 1)
                    ratingInput.value = index + 1
                    
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

console.log("Product details client script loaded")

function setupBuyNowButton() {
    const buyNowBtn = document.querySelector(".btn.btn-secondary")

    if (buyNowBtn) {
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

        const userId = getUserId()

        if (!userId) {
        showAuthModal()
        } else {
            addToCart(productId, quantity, true, userId)
        }
    })
    }
}

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

function checkRedirectAfterLogin() {
    const redirectUrl = localStorage.getItem("redirectAfterLogin")
    if (redirectUrl) {
    localStorage.removeItem("redirectAfterLogin")
    if (redirectUrl === window.location.href) {
        window.location.reload()
    } else {
        window.location.href = redirectUrl
    }
    }
}

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
    const reviewForm = document.getElementById("review-form")
    if (reviewForm) {
    reviewForm.addEventListener("submit", handleReviewSubmit)
    }
})


function showSweetAlert(icon, title, text) {
    if (typeof Swal !== "undefined") {
    Swal.fire({
        icon: icon,
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
        showAlert(icon === "error" ? "danger" : icon, text)
        }
}

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

document.addEventListener("DOMContentLoaded", () => {
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
    const starContainer = document.querySelector('.flex-align.flex-wrap.gap-12 .flex-align.gap-8');
    if (!starContainer) return;
    
    if (!starContainer.id) {
        starContainer.id = 'product-star-rating';
    }
    
    const stars = starContainer.querySelectorAll('span');
    if (!stars || stars.length === 0) return;
    
    const ratingValue = Math.round(rating * 2) / 2;
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = (ratingValue % 1) === 0.5;
    
    stars.forEach((star, index) => {
        if (index < fullStars) {
            star.innerHTML = '<i class="ph-fill ph-star"></i>';
            star.className = 'text-15 fw-medium text-warning-600 d-flex';
        } else if (index === fullStars && hasHalfStar) {
            try {
                star.innerHTML = '<i class="ph-fill ph-star-half"></i>';
                star.className = 'text-15 fw-medium text-warning-600 d-flex';
            } catch(e) {
                star.innerHTML = '<i class="ph-fill ph-star"></i>';
                star.className = 'text-15 fw-medium text-warning-600 d-flex';
            }
        } else {
            star.innerHTML = '<i class="ph ph-star"></i>';
            star.className = 'text-15 fw-medium text-gray-300 d-flex';
        }
    });
    
    const ratingText = document.querySelector('.flex-align.flex-wrap.gap-12 .text-sm.fw-medium.text-neutral-600');
    if (ratingText) {
        ratingText.textContent = ratingValue.toFixed(1) + ' Star Rating';
        if (!ratingText.id) {
            ratingText.id = 'product-rating-text';
        }
    }
    
    const ratingCount = document.querySelector('.flex-align.flex-wrap.gap-12 .text-sm.fw-medium.text-gray-500');
    if (ratingCount && currentProduct && currentProduct.reviewCount) {
        ratingCount.textContent = `(${currentProduct.reviewCount})`;
    }
}
