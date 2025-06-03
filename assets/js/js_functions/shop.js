let allProducts = [];
let filteredProducts = [];
let categories = [];
let minPrice = 0;
let maxPrice = 10000;
let currentPage = 1;
const productsPerPage = 12;

let priceRangeSlider;
let minPriceInput;
let maxPriceInput;

// Declare Swal, noUiSlider, and jQuery if they are not already defined
if (typeof Swal === "undefined") {
  var Swal = {}; // Or attempt to load it via CDN or a module loader
}

if (typeof noUiSlider === "undefined") {
  // Attempt to load it via CDN or a module loader.  If you are using a bundler like webpack or parcel, you should import it instead.
  console.error(
    "noUiSlider is not defined.  Please include the noUiSlider library."
  );
}

if (typeof jQuery === "undefined") {
  var jQuery = {}; // Or attempt to load it via CDN or a module loader
}

// Generate star rating display
function generateStarRating(rating) {
  let stars = "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars +=
      '<span class="text-15 fw-medium text-warning-600 d-flex"><i class="ph-fill ph-star"></i></span>';
  }

  if (hasHalfStar) {
    stars +=
      '<span class="text-15 fw-medium text-warning-600 d-flex"><i class="ph-fill ph-star-half"></i></span>';
  }

  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars +=
      '<span class="text-15 fw-medium text-gray-400 d-flex"><i class="ph-fill ph-star"></i></span>';
  }

  return stars;
}

// Show toast notification
function showToast(message, type = "success") {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.position = "fixed";
    toastContainer.style.top = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = "9999";
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement("div");
  toast.style.backgroundColor = "#000000";
  toast.style.color = "#00FF00";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "4px";
  toast.style.marginBottom = "10px";
  toast.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  toast.style.minWidth = "250px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease-in-out";

  const icons = {
    success:
      '<i class="ph-fill ph-check-circle" style="margin-right: 8px;"></i>',
    error: '<i class="ph-fill ph-x-circle" style="margin-right: 8px;"></i>',
    warning:
      '<i class="ph-fill ph-warning-circle" style="margin-right: 8px;"></i>',
    info: '<i class="ph-fill ph-info" style="margin-right: 8px;"></i>',
  };

  toast.innerHTML = `
    <div style="display: flex; align-items: center;">
      ${icons[type] || ""}
      <span>${message}</span>
    </div>
  `;
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.marginLeft = "10px";
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.color = "#00FF00";
  closeBtn.style.fontSize = "20px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.float = "right";
  closeBtn.onclick = () => {
    removeToast(toast);
  };

  toast.querySelector("div").appendChild(closeBtn);
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
  }, 10);
  setTimeout(() => {
    removeToast(toast);
  }, 2000);
  function removeToast(toastElement) {
    toastElement.style.opacity = "0";
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
    }, 300);
  }
}

// Show error messages with SweetAlert
const showError = (message) => {
  console.error(message);
  Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonText: "OK",
  });
};

// Create a product card element
const createProductCard = (product) => {
  const productCard = document.createElement("div");
  productCard.className =
    "product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2";

  let badgeHtml = "";
  if (product.stock <= 5 && product.stock > 0) {
    badgeHtml = `<span class="product-card__badge bg-warning-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">Limited</span>`;
  } else if (product.stock === 0) {
    badgeHtml = `<span class="product-card__badge bg-danger-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">Out of Stock</span>`;
  }

  const ratingHtml = generateStarRating(product.averageRating || 0);
  const imageUrl = product.mainImage
    ? `../uploads/${product.mainImage}`
    : "../assets/images/products/default.png";

  productCard.innerHTML = `
    <div class="bg-white p-2 rounded-pill z-1 position-absolute inset-inline-end-0 inset-block-start-0 me-16 mt-16 shadow-sm">
      <button type="button" class="wishlist-btn w-40 h-40 text-md d-flex justify-content-center align-items-center rounded-circle hover-bg-main-two-600 hover-text-white" data-product-id="${product._id}">
        <i class="ph ph-heart fs-4"></i>
      </button>
    </div>
    <a href="product-details.html?id=${product._id}" class="product-card__thumb flex-center rounded-8 position-relative">
      ${badgeHtml}
      <img src="${imageUrl}" alt="${product.productName}" class="w-auto max-w-100 product-image" />
    </a>
    <div class="product-card__content mt-16">
      <h6 class="title text-lg fw-semibold mt-12 mb-8">
        <a href="product-details.html?id=${product._id}" class="link text-line-2">${product.productName}</a>
      </h6>
      <div class="flex-align mb-20 mt-16 gap-6">
        <span class="text-xs fw-medium text-gray-500">${product.averageRating || 0}</span>
        ${ratingHtml}
        <span class="text-xs fw-medium text-gray-500">(${product.reviewCount || 0})</span>
      </div>
      <div class="mt-8">
        <span class="text-gray-900 text-xs fw-medium mt-8">Stock: ${product.stock}</span>
      </div>
      <div class="product-card__price my-20">
        <span class="text-heading text-md fw-semibold">
          ${product.productPrice} TND
          <span class="text-gray-500 fw-normal">/Qty</span>
        </span>
      </div>
      <button 
        class="product-card__cart btn ${
          product.stock > 0
            ? "bg-gray-50 text-heading hover-bg-main-600 hover-text-white"
            : "bg-gray-100 text-gray-500"
        } py-11 px-24 rounded-8 flex-center gap-8 fw-medium add-to-cart-btn"
        data-product-id="${product._id}" 
        ${product.stock === 0 ? "disabled" : ""}>
        ${product.stock > 0 ? 'Add To Cart <i class="ph ph-shopping-cart"></i>' : "Out of Stock"}
      </button>
    </div>
  `;
  setupProductCardEventListeners(productCard, product._id, product.stock);

  return productCard;
};

// Setup event listeners for product card buttons
function setupProductCardEventListeners(productCard, productId, productStock) {
  const addToCartBtn = productCard.querySelector(".add-to-cart-btn");
  if (addToCartBtn && productStock > 0) {
    addToCartBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      addToCart(productId);
    });
  }

  const wishlistBtn = productCard.querySelector(".wishlist-btn");
  if (wishlistBtn) {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      isProductInWishlist(productId, (isInWishlist) => {
        if (isInWishlist) {
          const icon = wishlistBtn.querySelector("i");
          wishlistBtn.classList.add("active");
          icon.classList.remove("ph", "ph-heart");
          icon.classList.add("ph-fill", "ph-heart", "text-main-two-600");
        }
      });
    }

    wishlistBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        showToast("Please log in to add products to your wishlist", "error");
        return;
      }

      // Toggle wishlist based on current state
      this.classList.contains("active")
        ? removeFromWishlist(productId)
        : addToWishlist(productId);
    });
  }

  return productCard;
}

// Add product to cart
function addToCart(productId) {
  const token = localStorage.getItem("token");
  const clientId = localStorage.getItem("userId");

  if (!token || !clientId) {
    showToast("Please log in to add products to your cart", "error");
    return;
  }

  const addToCartBtn = document.querySelector(
    `.add-to-cart-btn[data-product-id="${productId}"]`
  );
  if (addToCartBtn) {
    addToCartBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    addToCartBtn.disabled = true;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/cart/add", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onload = () => {
    if (addToCartBtn) {
      addToCartBtn.innerHTML =
        'Add To Cart <i class="ph ph-shopping-cart"></i>';
      addToCartBtn.disabled = false;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        showToast("Product added to cart successfully!", "success");

        if (
          window.mallifyCounters &&
          typeof window.mallifyCounters.incrementCartCount === "function"
        ) {
          window.mallifyCounters.incrementCartCount();
        } else {
          const cartCountElement = document.querySelector(".cart-count");
          if (cartCountElement && response.cart && response.cart.items) {
            cartCountElement.textContent = response.cart.items.length;
          }
        }
      } catch (error) {
        console.error("Error parsing cart response:", error);
        showToast("Error adding product to cart", "error");
      }
    } else {
      console.error("Failed to add product to cart:", xhr.status);
      showToast("Failed to add product to cart", "error");
    }
  };

  xhr.onerror = () => {
    if (addToCartBtn) {
      addToCartBtn.innerHTML =
        'Add To Cart <i class="ph ph-shopping-cart"></i>';
      addToCartBtn.disabled = false;
    }

    console.error("Network error occurred while adding to cart");
    showToast("Network error occurred", "error");
  };

  const data = {
    productId: productId,
    quantity: 1,
  };

  if (clientId) {
    data.clientId = clientId;
  }

  xhr.send(JSON.stringify(data));
}

// Add product to wishlist
function addToWishlist(productId) {
  const token = localStorage.getItem("token");
  const clientId = localStorage.getItem("userId");

  if (!token || !clientId) {
    showToast("Please log in to add products to your wishlist", "error");
    return;
  }

  const wishlistBtn = document.querySelector(
    `.wishlist-btn[data-product-id="${productId}"]`
  );
  if (wishlistBtn) {
    wishlistBtn.disabled = true;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/favoris/add", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onload = () => {
    if (wishlistBtn) {
      wishlistBtn.disabled = false;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      console.log("Product added to wishlist");

      if (wishlistBtn) {
        const icon = wishlistBtn.querySelector("i");
        wishlistBtn.classList.add("active");
        icon.classList.remove("ph", "ph-heart");
        icon.classList.add("ph-fill", "ph-heart", "text-main-two-600");
      }

      if (
        window.mallifyCounters &&
        typeof window.mallifyCounters.incrementWishlistCount === "function"
      ) {
        window.mallifyCounters.incrementWishlistCount();
      } else {
        const wishlistCountElement = document.querySelector(".wishlist-count");
        if (wishlistCountElement) {
          const currentCount =
            Number.parseInt(wishlistCountElement.textContent) || 0;
          wishlistCountElement.textContent = currentCount + 1;
        }
      }

      showToast("Product added to wishlist", "success");
    } else if (xhr.status === 400) {
      console.log("Product already in wishlist");

      if (wishlistBtn) {
        const icon = wishlistBtn.querySelector("i");
        wishlistBtn.classList.add("active");
        icon.classList.remove("ph", "ph-heart");
        icon.classList.add("ph-fill", "ph-heart", "text-main-two-600");
      }

      showToast("Product is already in your wishlist", "info");
    } else {
      console.error(
        "Error adding product to wishlist:",
        xhr.status,
        xhr.responseText
      );
      showToast("Error adding product to wishlist", "error");
    }
  };

  xhr.onerror = () => {
    if (wishlistBtn) {
      wishlistBtn.disabled = false;
    }

    console.error("Network error occurred while adding to wishlist");
    showToast("Network error occurred", "error");
  };

  const data = { productId: productId };

  if (clientId) {
    data.clientId = clientId;
  }

  xhr.send(JSON.stringify(data));
}

// Remove product from wishlist
function removeFromWishlist(productId) {
  const token = localStorage.getItem("token");
  const clientId = localStorage.getItem("userId");

  if (!token || !clientId) {
    showToast("Please log in to remove products from your wishlist", "error");
    return;
  }

  const wishlistBtn = document.querySelector(
    `.wishlist-btn[data-product-id="${productId}"]`
  );
  if (wishlistBtn) {
    wishlistBtn.disabled = true;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("DELETE", "http://localhost:3000/favoris/remove", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onload = () => {
    if (wishlistBtn) {
      wishlistBtn.disabled = false;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      console.log("Product removed from wishlist");

      if (wishlistBtn) {
        const icon = wishlistBtn.querySelector("i");
        wishlistBtn.classList.remove("active");
        icon.classList.remove("ph-fill", "ph-heart", "text-main-two-600");
        icon.classList.add("ph", "ph-heart");
      }

      if (
        window.mallifyCounters &&
        typeof window.mallifyCounters.decrementWishlistCount === "function"
      ) {
        window.mallifyCounters.decrementWishlistCount();
      } else {
        const wishlistCountElement = document.querySelector(".wishlist-count");
        if (wishlistCountElement) {
          const currentCount =
            Number.parseInt(wishlistCountElement.textContent) || 0;
          if (currentCount > 0) {
            wishlistCountElement.textContent = currentCount - 1;
          }
        }
      }

      showToast("Product removed from wishlist", "success");
    } else {
      console.error(
        "Error removing product from wishlist:",
        xhr.status,
        xhr.responseText
      );
      showToast("Error removing product from wishlist", "error");
    }
  };

  xhr.onerror = () => {
    if (wishlistBtn) {
      wishlistBtn.disabled = false;
    }

    console.error("Network error occurred while removing from wishlist");
    showToast("Network error occurred", "error");
  };

  const data = { productId: productId };

  if (clientId) {
    data.clientId = clientId;
  }

  xhr.send(JSON.stringify(data));
}

// Check if product is in wishlist
function isProductInWishlist(productId, callback) {
  const token = localStorage.getItem("token");
  const clientId = localStorage.getItem("userId");

  if (!token || !clientId) {
    callback(false);
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/favoris/${clientId}`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        const favorites = response.favorites || [];

        // Simplified check for product in wishlist
        const isInWishlist = favorites.some((item) => {
          // Handle both object and string representations
          const itemId = item.productId || item;
          return (
            itemId === productId ||
            (itemId && itemId._id === productId) ||
            (item && item.id === productId)
          );
        });

        callback(isInWishlist);
      } catch (error) {
        console.error("Error parsing wishlist data:", error);
        callback(false);
      }
    } else {
      console.error("Failed to fetch wishlist data:", xhr.status);
      callback(false);
    }
  };

  xhr.onerror = () => {
    console.error("Network error occurred while checking wishlist");
    callback(false);
  };

  xhr.send();
}

document.addEventListener("DOMContentLoaded", () => {
  initShop();
});

// Initialize the shop with categories and products
function initShop() {
  showLoading();

  fetchCategories()
    .then(() => {
      return fetchProducts();
    })
    .then(() => {
      updateCategoryUI();
      initModernPriceFilter();
      initRatingFilter();
      updatePriceRange();
      applyFiltersFromURL();
      setupEventListeners();
      setupCategoryDropdown();
      hideLoading();
    })
    .catch((error) => {
      hideLoading();
      showToast("Error initializing shop: " + error.message, "error");
    });
}

// Show loading indicator
function showLoading() {
  const loadingEl = document.createElement("div");
  loadingEl.id = "shop-loading";
  loadingEl.className =
    "position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75 z-index-9999";
  loadingEl.innerHTML =
    '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
  document.body.appendChild(loadingEl);
}

// Hide loading indicator
function hideLoading() {
  const loadingEl = document.getElementById("shop-loading");
  if (loadingEl) {
    loadingEl.remove();
  }
}

// Fetch all categories from API
function fetchCategories() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/categorieswithsubcategories", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);

          if (response && response.categories) {
            categories = response.categories;
            console.log("Categories loaded:", categories);
            resolve();
          } else {
            reject(new Error("Invalid category data format"));
          }
        } catch (error) {
          console.error("Error parsing category data:", error);
          reject(error);
        }
      } else {
        console.error("Failed to fetch categories:", xhr.status);
        reject(new Error("Failed to load categories"));
      }
    };

    xhr.onerror = () => {
      console.error("Network error occurred while fetching categories");
      reject(new Error("Network error"));
    };

    xhr.send();
  });
}

// Fetch all products from API
function fetchProducts() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/product/get", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);

          if (
            response.status === "success" &&
            response.data &&
            response.data.products
          ) {
            allProducts = response.data.products;

            // Make a copy for filtered products
            filteredProducts = [...allProducts];
            console.log("Products loaded:", allProducts.length);
            resolve();
          } else {
            reject(new Error("Invalid product data format"));
          }
        } catch (error) {
          console.error("Error parsing product data:", error);
          reject(error);
        }
      } else {
        console.error("Failed to fetch products:", xhr.status);
        reject(new Error("Failed to load products"));
      }
    };

    xhr.onerror = () => {
      console.error("Network error occurred while fetching products");
      reject(new Error("Network error"));
    };

    xhr.send();
  });
}

// Update category sidebar UI
function updateCategoryUI() {
  const categoryContainer = document.querySelector(".shop-sidebar__box ul");

  if (!categoryContainer) {
    console.error("Category container not found");
    return;
  }

  categoryContainer.innerHTML = "";
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/product/category-counts", true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        if (response.status === "success" && response.categoryCounts) {
          const categoryCounts = response.categoryCounts;
          const totalProductCount = Object.values(categoryCounts).reduce(
            (sum, count) => sum + count,
            0
          );
          const allCategoriesItem = document.createElement("li");
          allCategoriesItem.className = "mb-24";

          const allCategoriesLink = document.createElement("a");
          allCategoriesLink.href = "javascript:void(0)";
          allCategoriesLink.className =
            "text-gray-900 hover-text-main-600 category-link active";
          allCategoriesLink.dataset.category = "all";
          allCategoriesLink.textContent = `All Categories (${totalProductCount})`;

          allCategoriesItem.appendChild(allCategoriesLink);
          categoryContainer.appendChild(allCategoriesItem);
          categories.forEach((category) => {
            const categoryItem = document.createElement("li");
            categoryItem.className = "mb-24";

            const categoryLink = document.createElement("a");
            categoryLink.href = "javascript:void(0)";
            categoryLink.className =
              "text-gray-900 hover-text-main-600 category-link";
            categoryLink.dataset.id = category._id;
            categoryLink.dataset.category = category.categoryName;

            const count = categoryCounts[category._id] || 0;
            categoryLink.textContent = `${category.categoryName} (${count})`;

            console.log(
              `Category ${category.categoryName} has ${count} products`
            );

            categoryItem.appendChild(categoryLink);
            categoryContainer.appendChild(categoryItem);
          });
          setupCategoryEvents();
        } else {
          renderCategoriesWithClientCounting();
        }
      } catch (error) {
        console.error("Error parsing category counts:", error);
        renderCategoriesWithClientCounting();
      }
    } else {
      console.error("Failed to fetch category counts:", xhr.status);
      renderCategoriesWithClientCounting();
    }
  };
  xhr.onerror = () => {
    console.error("Network error occurred while fetching category counts");
    renderCategoriesWithClientCounting();
  };

  xhr.send();
}

// Render categories with product counts
function renderCategoriesWithClientCounting() {
  const categoryContainer = document.querySelector(".shop-sidebar__box ul");
  const categoryCounts = new Map();
  categories.forEach((category) => {
    categoryCounts.set(category._id, 0);
  });
  allProducts.forEach((product) => {
    if (product.banned || (product.shop && product.shop.status === "Banned")) {
      return;
    }
    let categoryId = null;
    if (product.category) {
      categoryId =
        typeof product.category === "object"
          ? product.category._id
          : product.category;
    } else if (product.subCategory && product.subCategory.category) {
      categoryId =
        typeof product.subCategory.category === "object"
          ? product.subCategory.category._id
          : product.subCategory.category;
    } else if (product.parentCategory) {
      categoryId = product.parentCategory;
    }

    if (categoryId && categoryCounts.has(categoryId)) {
      categoryCounts.set(categoryId, categoryCounts.get(categoryId) + 1);
    }
  });
  const totalProductCount = allProducts.filter(
    (product) =>
      !product.banned && !(product.shop && product.shop.status === "Banned")
  ).length;
  const allCategoriesItem = document.createElement("li");
  allCategoriesItem.className = "mb-24";

  const allCategoriesLink = document.createElement("a");
  allCategoriesLink.href = "javascript:void(0)";
  allCategoriesLink.className =
    "text-gray-900 hover-text-main-600 category-link active";
  allCategoriesLink.dataset.category = "all";
  allCategoriesLink.textContent = `All Categories (${totalProductCount})`;

  allCategoriesItem.appendChild(allCategoriesLink);
  categoryContainer.appendChild(allCategoriesItem);
  categories.forEach((category) => {
    const categoryItem = document.createElement("li");
    categoryItem.className = "mb-24";

    const categoryLink = document.createElement("a");
    categoryLink.href = "javascript:void(0)";
    categoryLink.className = "text-gray-900 hover-text-main-600 category-link";
    categoryLink.dataset.id = category._id;
    categoryLink.dataset.category = category.categoryName;

    const count = categoryCounts.get(category._id) || 0;
    categoryLink.textContent = `${category.categoryName} (${count})`;

    categoryItem.appendChild(categoryLink);
    categoryContainer.appendChild(categoryItem);
  });
  setupCategoryEvents();
}

// Set up category sidebar click events
function setupCategoryEvents() {
  document.querySelectorAll(".category-link").forEach((link) => {
    link.addEventListener("click", function () {
      // Remove active class from all category links
      document.querySelectorAll(".category-link").forEach((el) => {
        el.classList.remove("active");
        el.classList.remove("text-main-600");
        el.classList.add("text-gray-900");
      });

      // Add active class to the clicked category
      this.classList.add("active", "text-main-600");
      this.classList.remove("text-gray-900");

      // Update URL with category parameter
      const newUrl = new URL(window.location.href);

      // Always remove subcategory parameter when clicking on a category
      newUrl.searchParams.delete("subcategory");

      if (this.dataset.category !== "all" && this.dataset.id) {
        newUrl.searchParams.set("category", this.dataset.id);
        window.history.replaceState({}, "", newUrl);
        console.log("Updated URL with category parameter:", this.dataset.id);
      } else {
        newUrl.searchParams.delete("category");
        window.history.replaceState({}, "", newUrl);
        console.log("Removed category parameter from URL");
      }

      // Reset to page 1 when changing category
      currentPage = 1;

      // Apply filters immediately with the new category
      applyAllFilters();
    });
  });
}

function initModernPriceFilter() {
  const priceRangeElement = document.getElementById("price-range");

  if (typeof noUiSlider !== "undefined" && priceRangeElement) {
    priceRangeSlider = noUiSlider.create(priceRangeElement, {
      start: [minPrice, maxPrice],
      connect: true,
      step: 10,
      range: {
        min: minPrice,
        max: maxPrice,
      },
      format: {
        to: (value) => Math.round(value),
        from: (value) => Number(value),
      },
      tooltips: [
        {
          to: (value) => value + " TND",
        },
        {
          to: (value) => value + " TND",
        },
      ],
    });

    minPriceInput = document.getElementById("min-price");
    maxPriceInput = document.getElementById("max-price");

    let sliderBeingDragged = false;

    priceRangeSlider.on("start", () => {
      sliderBeingDragged = true;
    });

    priceRangeSlider.on("end", () => {
      sliderBeingDragged = false;
    });

    priceRangeSlider.on("update", (values, handle) => {
      if (sliderBeingDragged) {
        if (handle === 0) {
          minPriceInput.dataset.value = values[0];
        } else {
          maxPriceInput.dataset.value = values[1];
        }
      }
    });

    minPriceInput.addEventListener("input", function () {
      const value = Number(this.value);
      if (!isNaN(value)) {
        this.dataset.value = value;
        priceRangeSlider.set([value, null]);
      }
    });

    maxPriceInput.addEventListener("input", function () {
      const value = Number(this.value);
      if (!isNaN(value)) {
        this.dataset.value = value;
        priceRangeSlider.set([null, value]);
      }
    });

    const priceFilterBtn = document.getElementById("price-filter-btn");
    if (priceFilterBtn) {
      priceFilterBtn.addEventListener("click", () => {
        applyAllFilters();
      });
    }
  }
}

// Initialize rating filter
function initRatingFilter() {
  const ratingItems = document.querySelectorAll(".rating-filter-item");

  ratingItems.forEach((item) => {
    item.addEventListener("click", function () {
      const radio = this.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        ratingItems.forEach((i) => i.classList.remove("active"));
        this.classList.add("active");
        this.style.transform = "scale(1.01)";
        setTimeout(() => {
          this.style.transform = "scale(1)";
        }, 150);

        applyAllFilters();
      }
    });

    const radioInput = item.querySelector('input[type="radio"]');
    if (radioInput) {
      radioInput.addEventListener("change", function () {
        ratingItems.forEach((i) => i.classList.remove("active"));
        this.closest(".rating-filter-item").classList.add("active");
        applyAllFilters();
      });
    }
  });
}

// Update price range
function updatePriceRange() {
  if (allProducts.length === 0) return;

  minPrice = Math.min(...allProducts.map((product) => product.productPrice));
  maxPrice = Math.max(...allProducts.map((product) => product.productPrice));

  minPrice = Math.floor(minPrice);
  maxPrice = Math.ceil(maxPrice);
  if (priceRangeSlider) {
    priceRangeSlider.updateOptions({
      range: {
        min: minPrice,
        max: maxPrice,
      },
    });
    priceRangeSlider.set([minPrice, maxPrice]);
  }
  if (minPriceInput) minPriceInput.value = "";
  if (maxPriceInput) maxPriceInput.value = "";
}

// Apply filters from URL parameters
function applyFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");

  if (categoryParam) {
    console.log("Found category parameter in URL:", categoryParam);

    // Try to find the matching sidebar category link by ID
    const categoryLinks = document.querySelectorAll(".category-link");
    let found = false;

    categoryLinks.forEach((link) => {
      if (link.dataset.id === categoryParam) {
        console.log("Found matching category in sidebar:", link.textContent);
        link.classList.add("active", "text-main-600");
        link.classList.remove("text-gray-900");
        found = true;

        // Remove active class from other links
        categoryLinks.forEach((otherLink) => {
          if (otherLink !== link) {
            otherLink.classList.remove("active", "text-main-600");
            otherLink.classList.add("text-gray-900");
          }
        });
      }
    });

    // If we didn't find a matching link, we'll still set the category filter
    // in the applyAllFilters function
    if (!found) {
      console.log("No matching sidebar category found for ID:", categoryParam);
    }
  }

  // Rest of the function remains the same...
  const minPriceParam = urlParams.get("minPrice");
  const maxPriceParam = urlParams.get("maxPrice");
  if ((minPriceParam || maxPriceParam) && priceRangeSlider) {
    const min = minPriceParam ? Number(minPriceParam) : minPrice;
    const max = maxPriceParam ? Number(maxPriceParam) : maxPrice;
    if (minPriceInput) minPriceInput.value = "";
    if (maxPriceInput) maxPriceInput.value = "";

    priceRangeSlider.set([min, max]);
  }

  const minRatingParam = urlParams.get("minRating");
  if (minRatingParam) {
    const ratingId = `rating${minRatingParam}`;
    const ratingRadio = document.getElementById(ratingId);
    if (ratingRadio) {
      ratingRadio.checked = true;
      const ratingItems = document.querySelectorAll(".rating-filter-item");
      ratingItems.forEach((item) => {
        item.classList.remove("active");
        if (item.contains(ratingRadio)) {
          item.classList.add("active");
        }
      });
    }
  }

  const sortParam = urlParams.get("sort");
  if (sortParam) {
    const sortingSelect = document.getElementById("sorting");
    if (sortingSelect) {
      let sortValue;
      switch (sortParam) {
        case "rating":
          sortValue = "1";
          break;
        case "newest":
          sortValue = "2";
          break;
        case "price_asc":
          sortValue = "3";
          break;
        case "price_desc":
          sortValue = "4";
          break;
      }
      if (sortValue) {
        sortingSelect.value = sortValue;
      }
    }
  }

  const pageParam = urlParams.get("page");
  if (pageParam) {
    currentPage = Number.parseInt(pageParam);
  }

  // Check for search parameters
  const searchParam = urlParams.get("search");
  const nameParam = urlParams.get("name");
  if (searchParam || nameParam) {
    const searchTerm = searchParam || nameParam;
    const searchInputs = document.querySelectorAll(
      'input.search-form__input, input[type="text"], .form-control'
    );
    searchInputs.forEach((input) => {
      if (input.closest("form") && !input.value) {
        input.value = searchTerm;
      }
    });
  }

  applyAllFilters();
}

// Apply all filters and update product display
function applyAllFilters() {
  showLoading();
  const filters = {};
  const urlParams = new URLSearchParams(window.location.search);

  // Get the active category from the sidebar
  const activeCategoryLink = document.querySelector(".category-link.active");
  if (
    activeCategoryLink &&
    activeCategoryLink.dataset.category !== "all" &&
    activeCategoryLink.dataset.id
  ) {
    filters.category = activeCategoryLink.dataset.id;
    console.log(
      "Filtering by sidebar category:",
      activeCategoryLink.dataset.category,
      filters.category
    );
  } else {
    // If no active category in sidebar, check URL for category parameter
    const categoryParam = urlParams.get("category");
    if (categoryParam) {
      filters.category = categoryParam;
      console.log("Filtering by URL category parameter:", categoryParam);
    }
  }

  // Check for subcategory parameter in URL
  const subcategoryParam = urlParams.get("subcategory");
  if (subcategoryParam) {
    filters.subcategory = subcategoryParam;
    console.log("Filtering by URL subcategory parameter:", subcategoryParam);
  }

  if (minPriceInput && maxPriceInput) {
    filters.minPrice = minPriceInput.dataset.value
      ? Number(minPriceInput.dataset.value)
      : minPriceInput.value
        ? Number(minPriceInput.value)
        : minPrice;
    filters.maxPrice = maxPriceInput.dataset.value
      ? Number(maxPriceInput.dataset.value)
      : maxPriceInput.value
        ? Number(maxPriceInput.value)
        : maxPrice;
  }
  const selectedRating = document.querySelector(
    '.rating-filter-item input[type="radio"]:checked'
  );
  if (selectedRating && selectedRating.id !== "ratingAll") {
    filters.minRating = Number.parseInt(
      selectedRating.id.replace("rating", "")
    );
  }
  const sortingSelect = document.getElementById("sorting");
  if (sortingSelect) {
    const sortValue = sortingSelect.value;
    switch (sortValue) {
      case "1":
        filters.sort = "rating";
        break;
      case "2":
        filters.sort = "newest";
        break;
      case "3":
        filters.sort = "price_asc";
        break;
      case "4":
        filters.sort = "price_desc";
        break;
    }
  }

  const selectedShop = document.querySelector(".shop-filter.active");
  if (selectedShop && selectedShop.dataset.shopId) {
    filters.shop = selectedShop.dataset.shopId;
  }

  // Get search parameters from URL
  const searchParam = urlParams.get("search");
  const nameParam = urlParams.get("name");

  if (nameParam) {
    filters.name = nameParam;
  }

  if (searchParam && !nameParam) {
    filters.search = searchParam;
  }

  // Also check search input on the page
  const searchInput = document.getElementById("product-search");
  if (
    searchInput &&
    searchInput.value.trim() &&
    !filters.name &&
    !filters.search
  ) {
    filters.search = searchInput.value.trim();
  }

  const newUrl = new URL(window.location.href);
  Array.from(newUrl.searchParams.keys()).forEach((key) => {
    newUrl.searchParams.delete(key);
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      newUrl.searchParams.set(key, value);
    }
  });
  if (currentPage > 1) {
    newUrl.searchParams.set("page", currentPage);
  }
  window.history.replaceState({}, "", newUrl);

  filters.page = currentPage;
  filters.limit = productsPerPage;

  const xhr = new XMLHttpRequest();
  xhr.open(
    "GET",
    `http://localhost:3000/product/filter?${new URLSearchParams(filters).toString()}`,
    true
  );
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    hideLoading();

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        if (response.status === "success") {
          filteredProducts = response.data.products;

          const totalPages = response.pages;

          displayProducts();
          setupPagination(totalPages);
          updateResultCount(response.results);
        } else {
          showToast("Error applying filters: " + response.message, "error");
        }
      } catch (error) {
        console.error("Error parsing filtered products data:", error);
        showToast("Error parsing filtered products data", "error");
      }
    } else {
      console.error("Failed to fetch filtered products:", xhr.status);
      showToast("Failed to load filtered products", "error");
    }
  };

  xhr.onerror = () => {
    hideLoading();
    console.error("Network error occurred while fetching filtered products");
    showToast("Network error occurred", "error");
  };

  xhr.send();
}

// Display products
function displayProducts() {
  const productsContainer = document.querySelector(".list-grid-wrapper");
  if (!productsContainer) {
    console.error("Products container not found");
    return;
  }

  productsContainer.innerHTML = "";

  if (filteredProducts.length === 0) {
    productsContainer.innerHTML =
      '<div class="col-12 text-center py-5"><p>No products found for the selected filters</p></div>';
    return;
  }

  const activeCategoryLink = document.querySelector(".category-link.active");
  if (activeCategoryLink && activeCategoryLink.dataset.category !== "all") {
    console.log(
      `Displaying ${filteredProducts.length} products for category: ${activeCategoryLink.dataset.category}`
    );
  }

  filteredProducts.forEach((product) => {
    const productCard = createProductCard(product);
    productsContainer.appendChild(productCard);
  });
}

// Setup pagination
function setupPagination(totalPages) {
  const paginationEl = document.querySelector(".pagination");

  if (!paginationEl) return;

  paginationEl.innerHTML = `
    <ul class="pagination justify-content-center">
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="javascript:void(0)" aria-label="Previous">
          <i class="ph ph-caret-left"></i>
        </a>
      </li>
      ${generatePaginationItems(totalPages)}
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="javascript:void(0)" aria-label="Next">
          <i class="ph ph-caret-right"></i>
        </a>
      </li>
    </ul>
  `;

  // Add event listeners to pagination items
  const prevBtn = paginationEl.querySelector(
    ".page-item:first-child .page-link"
  );
  const nextBtn = paginationEl.querySelector(
    ".page-item:last-child .page-link"
  );

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        applyAllFilters();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        applyAllFilters();
      }
    });
  }

  const pageLinks = paginationEl.querySelectorAll(".page-link[data-page]");
  pageLinks.forEach((link) => {
    link.addEventListener("click", function () {
      currentPage = Number(this.dataset.page);
      applyAllFilters();
    });
  });
}

// Generate pagination items
function generatePaginationItems(totalPages) {
  let items = "";

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      items += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium ${
            i === currentPage
              ? "bg-main-600 text-white"
              : "text-neutral-600 border border-gray-100"
          }" 
            href="javascript:void(0)" data-page="${i}">${i}</a>
        </li>
      `;
    } else if (
      (i === 2 && currentPage > 3) ||
      (i === totalPages - 1 && currentPage < totalPages - 2)
    ) {
      items += `
        <li class="page-item disabled">
          <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="javascript:void(0)">...</a>
        </li>
      `;
    }
  }

  return items;
}

// Update result count
function updateResultCount(totalResults) {
  const resultCountEl = document.querySelector(
    ".flex-between.gap-16.flex-wrap.mb-40 span"
  );

  if (resultCountEl) {
    const start = (currentPage - 1) * productsPerPage + 1;
    const end = Math.min(start + productsPerPage - 1, totalResults);

    resultCountEl.textContent = `Showing ${start}-${end} of ${totalResults} result${totalResults !== 1 ? "s" : ""}`;
  }
}

// Setup event listeners
function setupEventListeners() {
  const filterPriceBtn = document.querySelector(".custom--range .btn-main");
  if (filterPriceBtn) {
    filterPriceBtn.addEventListener("click", () => {
      applyAllFilters();
    });
  }

  document
    .querySelectorAll('.common-radio input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        applyAllFilters();
      });
    });

  const sortingSelect = document.getElementById("sorting");
  if (sortingSelect) {
    sortingSelect.addEventListener("change", () => {
      applyAllFilters();
    });

    if (!sortingSelect.querySelector('option[value="3"]')) {
      const priceOptions = `
        <option value="3">Price: Low to High</option>
        <option value="4">Price: High to Low</option>
      `;
      sortingSelect.innerHTML += priceOptions;
    }
  }

  const searchInput = document.getElementById("product-search");
  const searchButton = document.getElementById("search-button");

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", () => {
      currentPage = 1;
      applyAllFilters();
    });

    searchInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        searchButton.click();
      }
    });
  }

  const listBtn = document.querySelector(".list-btn");
  const gridBtn = document.querySelector(".grid-btn");
  if (listBtn && gridBtn) {
    listBtn.addEventListener("click", () => {
      const productsContainer = document.querySelector(".list-grid-wrapper");
      productsContainer.classList.add("list-view");
      listBtn.classList.add("bg-main-600", "text-white", "border-main-600");
      listBtn.classList.remove("border-gray-100");

      gridBtn.classList.remove("bg-main-600", "text-white", "border-main-600");
      gridBtn.classList.add("border-gray-100");

      if (productsContainer.childElementCount === 1) {
        const singleCard = productsContainer.querySelector(".product-card");
        if (singleCard) {
          singleCard.style.cssText = "";
          singleCard.style.maxWidth = "100%";
          singleCard.style.margin = "0";
          singleCard.style.width = "100%";
          singleCard.style.display = "flex";
          singleCard.style.flexDirection = "row";
          singleCard.style.alignItems = "center";
          singleCard.style.justifyContent = "flex-start";
          singleCard.style.padding = "20px";
          const thumb = singleCard.querySelector(".product-card__thumb");
          const content = singleCard.querySelector(".product-card__content");

          if (thumb) {
            thumb.style.cssText = "";
            thumb.style.maxWidth = "200px";
            thumb.style.width = "30%";
            thumb.style.marginRight = "20px";
            thumb.style.flexShrink = "0";
          }

          if (content) {
            content.style.cssText = "";
            content.style.marginTop = "0";
            content.style.width = "60%";
            content.style.flexGrow = "1";
            content.style.textAlign = "left";
          }
        }
      }
    });

    gridBtn.addEventListener("click", () => {
      const productsContainer = document.querySelector(".list-grid-wrapper");
      productsContainer.classList.remove("list-view");
      gridBtn.classList.add("bg-main-600", "text-white", "border-main-600");
      gridBtn.classList.remove("border-gray-100");

      listBtn.classList.remove("bg-main-600", "text-white", "border-main-600");
      listBtn.classList.add("border-gray-100");

      if (productsContainer.childElementCount === 1) {
        const singleCard = productsContainer.querySelector(".product-card");
        if (singleCard) {
          singleCard.style.cssText = "";
          singleCard.style.maxWidth = "350px";
          singleCard.style.margin = "0 auto";
          const thumb = singleCard.querySelector(".product-card__thumb");
          const content = singleCard.querySelector(".product-card__content");

          if (thumb) {
            thumb.style.cssText = "";
          }

          if (content) {
            content.style.cssText = "";
          }
        }
      }
    });
  }

  const sidebarBtn = document.querySelector(".sidebar-btn");
  const sidebar = document.querySelector(".shop-sidebar");
  const sidebarClose = document.querySelector(".shop-sidebar__close");

  if (sidebarBtn && sidebar && sidebarClose) {
    sidebarBtn.addEventListener("click", () => {
      sidebar.classList.add("show");
    });

    sidebarClose.addEventListener("click", () => {
      sidebar.classList.remove("show");
    });
  }

  const resetFiltersBtn = document.getElementById("reset-filters");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      const allCategoriesLink = document.querySelector(
        '.category-link[data-category="all"]'
      );
      if (allCategoriesLink) {
        allCategoriesLink.click();
      }

      if (priceRangeSlider) {
        priceRangeSlider.set([minPrice, maxPrice]);
      }

      const allRatingRadio = document.getElementById("ratingAll");
      if (allRatingRadio) {
        allRatingRadio.checked = true;
        const ratingItems = document.querySelectorAll(".rating-filter-item");
        ratingItems.forEach((item) => {
          item.classList.remove("active");
          if (item.contains(allRatingRadio)) {
            item.classList.add("active");
          }
        });
      }

      const sortingSelect = document.getElementById("sorting");
      if (sortingSelect) {
        sortingSelect.value = "1";
      }

      const searchInput = document.getElementById("product-search");
      if (searchInput) {
        searchInput.value = "";
      }

      currentPage = 1;
      applyAllFilters();
    });
  }
}

// Setup category dropdown
function setupCategoryDropdown() {
  console.log("Setting up category dropdown handler");

  // Find all category dropdowns
  const categoryDropdowns = document.querySelectorAll(
    "select#categories-list, select.category-select, select[name='category'], .js-example-basic-single"
  );

  categoryDropdowns.forEach((dropdown) => {
    console.log("Found category dropdown:", dropdown);

    // Skip if this dropdown is inside a search form (handled by searchFiltered.js)
    if (
      dropdown.closest(
        "form.form-location-wrapper, form.search-form, form.search-box"
      )
    ) {
      console.log(
        "Skipping dropdown inside search form - will be handled by form submit"
      );
      return;
    }

    // Store original onchange handler if it exists
    const originalOnChange = dropdown.onchange;

    // Add change event listener
    dropdown.addEventListener("change", function (e) {
      const selectedOption = this.options[this.selectedIndex];
      const categoryId = this.value;

      console.log("Dropdown category changed:", {
        value: categoryId,
        text: selectedOption ? selectedOption.textContent : null,
      });

      // Skip default options
      if (
        !categoryId ||
        categoryId === "1" ||
        categoryId === "All Categories" ||
        (selectedOption && selectedOption.disabled) ||
        (selectedOption &&
          selectedOption.textContent.includes("All Categories"))
      ) {
        console.log("Skipping default option");
        return;
      }

      // Call original onchange handler if it exists
      if (typeof originalOnChange === "function") {
        originalOnChange.call(this, e);
      }

      // If we're on the shop page, find the matching sidebar category and activate it
      if (window.location.pathname.includes("shop.html")) {
        const sidebarLinks = document.querySelectorAll(".category-link");
        let found = false;

        sidebarLinks.forEach((link) => {
          if (link.dataset.id === categoryId) {
            // Simulate a click on the sidebar link to trigger the existing filtering logic
            link.click();
            found = true;
          }
        });

        if (!found) {
          // If no matching sidebar link, update URL and apply filters directly
          const newUrl = new URL(window.location.href);
          // Remove subcategory parameter when selecting a category
          newUrl.searchParams.delete("subcategory");
          newUrl.searchParams.set("category", categoryId);
          window.history.replaceState({}, "", newUrl);

          currentPage = 1;
          applyAllFilters();
        }
      } else {
        // If not on shop page, redirect
        window.location.href = `shop.html?category=${encodeURIComponent(categoryId)}`;
      }
    });
  });

  // Also handle jQuery select2 if it exists
  if (typeof jQuery !== "undefined") {
    jQuery(document).ready(($) => {
      $(".js-example-basic-single").on("select2:select", function (e) {
        // Skip select2 dropdowns that are inside search forms
        if (
          $(this).closest(
            "form.form-location-wrapper, form.search-form, form.search-box"
          ).length > 0
        ) {
          console.log("Skipping select2 dropdown inside search form");
          return;
        }

        const categoryId = e.params.data.id;
        console.log("Select2 category changed:", categoryId);

        if (
          categoryId &&
          categoryId !== "1" &&
          categoryId !== "All Categories"
        ) {
          // If on shop page, trigger filtering
          if (window.location.pathname.includes("shop.html")) {
            // Try to find and click the matching sidebar category
            const sidebarLinks = document.querySelectorAll(".category-link");
            let found = false;

            sidebarLinks.forEach((link) => {
              if (link.dataset.id === categoryId) {
                link.click();
                found = true;
              }
            });

            if (!found) {
              // If no matching sidebar link, update URL and apply filters directly
              const newUrl = new URL(window.location.href);
              // Remove subcategory parameter when selecting a category
              newUrl.searchParams.delete("subcategory");
              newUrl.searchParams.set("category", categoryId);
              window.history.replaceState({}, "", newUrl);

              currentPage = 1;
              applyAllFilters();
            }
          } else {
            window.location.href = `shop.html?category=${encodeURIComponent(categoryId)}`;
          }
        }
      });
    });
  }
}

// Initialize search forms
function initSearchForms() {
  console.log("Initializing search forms");

  const searchForms = document.querySelectorAll(
    "form.form-location-wrapper, form.search-form, form.search-box"
  );

  searchForms.forEach((form) => {
    console.log("Setting up search form:", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const searchInput = this.querySelector(
        'input[type="text"], .form-control, .search-form__input'
      );

      if (!searchInput) {
        console.warn("Could not find search input in form");
        return;
      }

      // Get the search term
      const searchTerm = searchInput.value.trim();
      const categoryDropdown = this.querySelector(
        "select#categories-list, select.category-select"
      );
      let categoryId = "";

      if (categoryDropdown) {
        const selectedOption =
          categoryDropdown.options[categoryDropdown.selectedIndex];

        if (
          categoryDropdown.value &&
          categoryDropdown.value !== "1" &&
          !(selectedOption && selectedOption.disabled) &&
          !(
            selectedOption &&
            selectedOption.textContent.includes("All Categories")
          )
        ) {
          categoryId = categoryDropdown.value;
        }
      }
      let url = "shop.html";
      const params = [];

      // Add name parameter for the search term only if it's not empty
      if (searchTerm) {
        params.push(`name=${encodeURIComponent(searchTerm)}`);
      }

      // Add category parameter if valid
      if (categoryId) {
        params.push(`category=${encodeURIComponent(categoryId)}`);
      }

      // Add parameters to URL if we have any
      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      console.log("Redirecting to:", url);

      // Navigate to the shop page
      window.location.href = url;
    });
  });

  // Also handle direct clicks on search buttons
  const searchButtons = document.querySelectorAll(
    ".search-form__button, button[type='submit']"
  );

  searchButtons.forEach((button) => {
    // Skip if the button is already inside a form (will be handled by form submit)
    if (button.closest("form")) {
      return;
    }

    button.addEventListener("click", (e) => {
      e.preventDefault();

      // Find the closest search input
      const searchInput = document.querySelector(
        'input[type="text"], .form-control, .search-form__input'
      );

      if (!searchInput) {
        console.warn("Could not find search input for button");
        return;
      }

      // Get the search term
      const searchTerm = searchInput.value.trim();

      // Build the URL - if search term is empty, just go to shop page
      let url = "shop.html";

      // Only add search parameter if we have a term
      if (searchTerm) {
        url += "?name=" + encodeURIComponent(searchTerm);
      }

      console.log("Redirecting to:", url);

      // Navigate to the shop page
      window.location.href = url;
    });
  });
}
