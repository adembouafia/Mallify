const token = localStorage.getItem("token");

function fetchAndPopulateDeals() {
  const apiUrl = "http://localhost:3000/product/get";

  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log("API Response:", response);

          const products = response.data.products;

          const dealsContainer = document.querySelector(".deals-week-slider");

          if (!products || !Array.isArray(products) || products.length === 0) {
            dealsContainer.innerHTML = "<p>No Products Available</p>";
            return;
          }

          console.log("Products count:", products.length);
          console.log(
            "Shops represented:",
            [...new Set(products.map((p) => p.shop?._id || "unknown"))].length
          );

          if ($(dealsContainer).hasClass("slick-initialized")) {
            $(dealsContainer).slick("unslick");
          }

          dealsContainer.innerHTML = "";

          products.forEach((product) => {
            const productCard = createProductCard(product);
            dealsContainer.appendChild(productCard);
          });

          if (typeof AOS !== "undefined") {
            AOS.init();
          }

          $(dealsContainer).slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            arrows: true,
            prevArrow: $("#deal-week-prev"),
            nextArrow: $("#deal-week-next"),
            responsive: [
              { breakpoint: 992, settings: { slidesToShow: 2 } },
              { breakpoint: 576, settings: { slidesToShow: 1 } },
            ],
          });
        } catch (error) {
          console.error("Error parsing JSON:", error);
          console.log(xhr.responseText);
        }
      } else {
        console.error("Error fetching products:", xhr.status);
      }
    }
  };

  xhr.onerror = () => {
    console.error("Network error with API:", apiUrl);
  };

  xhr.open("GET", apiUrl, true);
  xhr.send();
}

function generateStarRating(rating = 0) {
  const fullStars = Math.round(rating);
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="text-15 fw-medium ${i <= fullStars ? "text-warning-600" : "text-gray-400"} d-flex"><i class="ph-fill ph-star"></i></span>`;
  }
  return html;
}

function createProductCard(product) {
  const imageUrl = product.mainImage
    ? `http://localhost:3000/uploads/${product.mainImage}`
    : "/placeholder.jpg";
  const rating = product.averageRating || 0;
  const reviews = product.reviewCount || 0;
  const price = product.productPrice || "N/A";
  const originalPrice = Math.round(price * 1.2);
  const name = product.productName || "N/A";
  const id = product._id;
  const shopName = product.shop?.shopName || "Unknown Shop";

  // Log shop info to debug
  console.log(
    `Product: ${name}, Shop: ${shopName}, Shop ID: ${product.shop?._id || "unknown"}`
  );

  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-aos", "fade-up");
  wrapper.setAttribute("data-aos-duration", "200");

  wrapper.innerHTML = `
    <div class="product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2" data-product-id="${id}">
        <div class="product-card__thumb rounded-8 position-relative">
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

document.addEventListener("DOMContentLoaded", () => {
  fetchAndPopulateDeals();
  fetchAndPopulateTopSelling();

  fetchCategories()
    .then((categories) => {
      if (categories.length > 0) {
        populateCategoryTabs(categories);

        // Ajouter un gestionnaire d'événements click direct sur tous les boutons d'onglet
        const pillsTab = document.getElementById("pills-tab");
        if (pillsTab) {
          // Gestionnaire pour l'événement Bootstrap
          pillsTab.addEventListener("shown.bs.tab", (event) => {
            const activatedTabButton = event.target;
            if (
              activatedTabButton &&
              typeof activatedTabButton.getAttribute === "function"
            ) {
              const categoryName =
                activatedTabButton.getAttribute("data-category-name");
              if (categoryName) {
                fetchAndPopulateTrendingProducts(categoryName);
              }
            }
          });

          // Gestionnaire de clic direct pour s'assurer que chaque clic déclenche une action
          pillsTab.addEventListener("click", (event) => {
            const clickedButton = event.target.closest(
              "button[data-category-name]"
            );
            if (clickedButton) {
              const categoryName =
                clickedButton.getAttribute("data-category-name");
              if (categoryName) {
                const tabId =
                  clickedButton.getAttribute("data-bs-target") ||
                  `#pills-${categoryName.replace(/\s+/g, "-").replace(/&/g, "and")}`;
                const tabContent = document.querySelector(tabId);
                if (tabContent) {
                  // Activer manuellement l'onglet si nécessaire
                  const allTabPanes = document.querySelectorAll(".tab-pane");
                  allTabPanes.forEach((pane) => {
                    pane.classList.remove("show", "active");
                  });
                  tabContent.classList.add("show", "active");

                  // Activer le bouton
                  const allTabButtons = document.querySelectorAll(".nav-link");
                  allTabButtons.forEach((btn) => {
                    btn.classList.remove("active");
                    btn.setAttribute("aria-selected", "false");
                  });
                  clickedButton.classList.add("active");
                  clickedButton.setAttribute("aria-selected", "true");
                }

                // Charger les produits pour cette catégorie
                fetchAndPopulateTrendingProducts(categoryName);
              }
            }
          });
        }
      }
      fetchAndPopulateTrendingProducts("all");
    })
    .catch((error) => {
      console.error(
        "Failed to initialize categories and trending products:",
        error
      );
      fetchAndPopulateTrendingProducts("all");
    });
});

document.addEventListener("DOMContentLoaded", () => {
  checkWishlistStatus();

  document.addEventListener("click", (event) => {
    if (event.target.closest(".wishlist-btn")) {
      event.preventDefault();
      const button = event.target.closest(".wishlist-btn");
      const productId = button.getAttribute("data-product-id");
      const token = localStorage.getItem("token");
      const clientId = localStorage.getItem("userId");

      if (!token) {
        alert("Please log in to add to favorites.");
        return;
      }

      if (!clientId) {
        alert("User ID not found.");
        return;
      }

      const isInWishlist = button.classList.contains("active");

      const icon = button.querySelector("i");
      const originalIconClass = icon.className;
      icon.className = "ph ph-spinner ph-spin";
      button.disabled = true;

      if (isInWishlist) {
        removeFromWishlist(
          clientId,
          productId,
          token,
          button,
          icon,
          originalIconClass
        );
      } else {
        addToWishlist(
          clientId,
          productId,
          token,
          button,
          icon,
          originalIconClass
        );
      }
    }
  });
});

function checkWishlistStatus() {
  const token = localStorage.getItem("token");
  const clientId = localStorage.getItem("userId");

  if (!token || !clientId) {
    return; 
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/favoris/${clientId}`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          const favorites = response.favorites || [];

          const wishlistButtons = document.querySelectorAll(".wishlist-btn");

          wishlistButtons.forEach((button) => {
            const productId = button.getAttribute("data-product-id");
            const isInWishlist = favorites.some(
              (item) =>
                item.productId === productId ||
                (item.productId && item.productId._id === productId)
            );

            if (isInWishlist) {
              updateButtonAppearance(button, true);
            }
          });
        } catch (error) {
          console.error("Error parsing wishlist data:", error);
        }
      }
    }
  };

  xhr.send();
}

function addToWishlist(
  clientId,
  productId,
  token,
  button,
  icon,
  originalIconClass
) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/favoris/add", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      // Reset icon regardless of success/failure
      icon.className = originalIconClass;
      button.disabled = false;

      if (xhr.status === 200) {
        // Update button appearance
        updateButtonAppearance(button, true);

        // Immediately increment the wishlist counter
        if (
          window.mallifyCounters &&
          typeof window.mallifyCounters.incrementWishlistCount === "function"
        ) {
          window.mallifyCounters.incrementWishlistCount();
        } else {
          // Fallback if function is not available
          const currentCount = Number.parseInt(
            localStorage.getItem("wishlistCount") || "0"
          );
          localStorage.setItem("wishlistCount", currentCount + 1);
          const wishlistCounters =
            document.querySelectorAll(".ph-heart + span");
          wishlistCounters.forEach((counter) => {
            counter.textContent = currentCount + 1;
          });
        }
      } else if (xhr.status === 400) {
        // Product already in favorites
        try {
          const response = JSON.parse(xhr.responseText);
          alert(response.message || "Product already in favorites");
          // Still update the appearance since it's in favorites
          updateButtonAppearance(button, true);
        } catch (e) {
          alert("Product already in favorites");
          updateButtonAppearance(button, true);
        }
      } else {
        alert("Error adding product to favorites. Status: " + xhr.status);
      }
    }
  };

  const data = JSON.stringify({ clientId, productId });
  xhr.send(data);
}

function removeFromWishlist(
  clientId,
  productId,
  token,
  button,
  icon,
  originalIconClass
) {
  const xhr = new XMLHttpRequest();
  xhr.open("DELETE", "http://localhost:3000/favoris/remove", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      icon.className = originalIconClass;
      button.disabled = false;

      if (xhr.status === 200) {
        updateButtonAppearance(button, false);

        // Immediately decrement the wishlist counter
        if (
          window.mallifyCounters &&
          typeof window.mallifyCounters.decrementWishlistCount === "function"
        ) {
          window.mallifyCounters.decrementWishlistCount();
        } else {
          // Fallback if function is not available
          const currentCount = Number.parseInt(
            localStorage.getItem("wishlistCount") || "0"
          );
          const newCount = Math.max(0, currentCount - 1);
          localStorage.setItem("wishlistCount", newCount);
          const wishlistCounters =
            document.querySelectorAll(".ph-heart + span");
          wishlistCounters.forEach((counter) => {
            counter.textContent = newCount;
          });
        }
      } else {
        alert("Error removing product from favorites. Status: " + xhr.status);
      }
    }
  };

  const data = JSON.stringify({ clientId, productId });
  xhr.send(data);
}

function addToCart(productId, buttonElement) {
  const token = localStorage.getItem("token");
  const clientId = localStorage.getItem("userId");

  if (!token || !clientId) {
    showToast(
      "Authentication Required",
      "Please log in to add items to your cart.",
      "warning"
    );
    return;
  }

  const originalHTML = buttonElement.innerHTML;
  buttonElement.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Adding...`;
  buttonElement.disabled = true;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/cart/add", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      buttonElement.innerHTML = originalHTML;
      buttonElement.disabled = false;

      if (xhr.status === 200) {
        showToast("Success", "Product added to cart!", "success");

        // Immediately update cart count in real-time
        if (
          window.mallifyCounters &&
          typeof window.mallifyCounters.fetchCartCount === "function"
        ) {
          window.mallifyCounters.fetchCartCount(clientId, token);
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          showToast(
            "Error",
            response.message || "Failed to add product to cart.",
            "error"
          );
        } catch (e) {
          showToast("Error", "An error occurred. Please try again.", "error");
        }
      }
    }
  };

  const data = JSON.stringify({ clientId, productId, quantity: 1 });
  xhr.send(data);
}

document.addEventListener("click", (event) => {
  const cartBtn = event.target.closest(".product-card__cart");
  if (cartBtn) {
    event.preventDefault();
    const productId = cartBtn.getAttribute("data-product-id");
    addToCart(productId, cartBtn);
  }
});

function showToast(title, message, type) {
  if (typeof window.Swal !== "undefined") {
    let iconHtml = "";
    let iconColor = "";

    switch (type) {
      case "success":
        iconHtml = '<div style="font-size: 24px; font-weight: bold;">✓</div>';
        iconColor = "#00e676";
        break;
      case "error":
        iconHtml = '<div style="font-size: 24px; font-weight: bold;">✕</div>';
        iconColor = "#ff1744";
        break;
      case "warning":
        iconHtml = '<div style="font-size: 24px; font-weight: bold;">!</div>';
        iconColor = "#ff9100";
        break;
      case "info":
      default:
        iconHtml = '<div style="font-size: 24px; font-weight: bold;">i</div>';
        iconColor = "#40c4ff";
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
        toast.addEventListener("mouseenter", window.Swal.stopTimer);
        toast.addEventListener("mouseleave", window.Swal.resumeTimer);
      },
      customClass: {
        popup: "cool-toast-popup",
        timerProgressBar: "cool-toast-timer",
      },
    });
  } else {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  }
}

function createProductCardTopSelling(product) {
  const imageUrl = product.mainImage
    ? `http://localhost:3000/uploads/${product.mainImage}`
    : "../assets/images/products/oversize.png";
  const rating = product.averageRating || 0;
  const reviews = product.reviewCount || 0;
  const price = product.productPrice || "N/A";
  const name = product.productName || "N/A";
  const id = product._id;
  const shopName = product.shop?.shopName || "Unknown Shop";

  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-aos", "fade-up");
  wrapper.setAttribute("data-aos-duration", "200");

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
  const apiUrl = "http://localhost:3000/product/get";
  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log("API Response for Top Selling:", response);

          const products = response.data.products;

          const topSellingContainer = document.querySelector(
            "#top-selling-slider"
          );

          if (!products || !Array.isArray(products) || products.length === 0) {
            topSellingContainer.innerHTML = "<p>No Products Available</p>";
            return;
          }

          console.log("Top Selling Products count:", products.length);

          if ($(topSellingContainer).hasClass("slick-initialized")) {
            $(topSellingContainer).slick("unslick");
          }

          topSellingContainer.innerHTML = "";

          const topProducts = products.slice(0, 5);

          topProducts.forEach((product) => {
            const productCard = createProductCardTopSelling(product);
            topSellingContainer.appendChild(productCard);
          });

          if (typeof AOS !== "undefined") {
            AOS.init();
          }

          $(topSellingContainer).slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            arrows: true,
            prevArrow: $("#top-selling-prev"),
            nextArrow: $("#top-selling-next"),
            responsive: [
              { breakpoint: 992, settings: { slidesToShow: 2 } },
              { breakpoint: 576, settings: { slidesToShow: 1 } },
            ],
          });
        } catch (error) {
          console.error("Error parsing JSON:", error);
          console.log(xhr.responseText);
        }
      } else {
        console.error("Error fetching top selling products:", xhr.status);
      }
    }
  };

  xhr.onerror = () => {
    console.error("Network error with API:", apiUrl);
  };

  xhr.open("GET", apiUrl, true);
  xhr.send();
}

function fetchCategories() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/category", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.categories || []);
          } catch (error) {
            console.error("Error parsing categories JSON:", error);
            reject(error);
          }
        } else {
          console.error(`HTTP error! status: ${xhr.status}`);
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      }
    };
    xhr.onerror = () => {
      console.error("Could not fetch categories: Network error");
      reject(new Error("Network error"));
    };
    xhr.send();
  });
}

function populateCategoryTabs(categories) {
  const pillsTab = document.getElementById("pills-tab");
  if (!pillsTab) {
    console.error("Category tab container #pills-tab not found");
    return;
  }
  pillsTab.innerHTML = ""; // Clear existing static tabs

  // Add "All" tab first
  const allTabItem = document.createElement("li");
  allTabItem.className = "nav-item";
  allTabItem.setAttribute("role", "presentation");
  allTabItem.innerHTML = `
        <button class="nav-link fw-medium text-sm hover-border-main-600 active" id="pills-all-tab" data-bs-toggle="pill" data-bs-target="#pills-all" type="button" role="tab" aria-controls="pills-all" aria-selected="true" data-category-name="all">All</button>
    `;
  pillsTab.appendChild(allTabItem);

  const maxVisibleCategories = 6;
  categories.slice(0, maxVisibleCategories).forEach((category) => {
    if (category && category.categoryName) {
      const tabItem = document.createElement("li");
      tabItem.className = "nav-item";
      tabItem.setAttribute("role", "presentation");
      const categoryIdSanitized = category.categoryName
        .replace(/\s+/g, "-")
        .replace(/&/g, "and"); // Sanitize name for ID
      tabItem.innerHTML = `
            <button class="nav-link fw-medium text-sm hover-border-main-600" id="pills-${categoryIdSanitized}-tab" data-bs-toggle="pill" data-bs-target="#pills-${categoryIdSanitized}" type="button" role="tab" aria-controls="pills-${categoryIdSanitized}" aria-selected="false" data-category-name="${category.categoryName}">${category.categoryName}</button>
        `;
      pillsTab.appendChild(tabItem);
    } else {
      console.warn("Skipping category due to missing categoryName:", category);
    }
  });

  if (categories.length > maxVisibleCategories) {
    const loadMoreItem = document.createElement("li");
    loadMoreItem.className = "nav-item";
    loadMoreItem.setAttribute("role", "presentation");
    loadMoreItem.innerHTML = `
            <button class="nav-link fw-medium text-sm hover-border-main-600" id="pills-load-more-tab" type="button">Load More...</button>
        `;
    pillsTab.appendChild(loadMoreItem);

    const loadMoreButton = document.getElementById("pills-load-more-tab");
    if (loadMoreButton) {
      loadMoreButton.addEventListener("click", () => {
        // Remove the 'More...' button itself
        loadMoreButton.parentElement.remove();
        // Add remaining categories
        categories.slice(maxVisibleCategories).forEach((category) => {
          if (category && category.categoryName) {
            // Check if category and category.categoryName exist
            const tabItem = document.createElement("li");
            tabItem.className = "nav-item";
            tabItem.setAttribute("role", "presentation");
            const categoryIdSanitized = category.categoryName
              .replace(/\s+/g, "-")
              .replace(/&/g, "and");
            tabItem.innerHTML = `
                        <button class="nav-link fw-medium text-sm hover-border-main-600" id="pills-${categoryIdSanitized}-tab" data-bs-toggle="pill" data-bs-target="#pills-${categoryIdSanitized}" type="button" role="tab" aria-controls="pills-${categoryIdSanitized}" aria-selected="false" data-category-name="${category.categoryName}">${category.categoryName}</button>
                    `;
            pillsTab.appendChild(tabItem);
          } else {
            console.warn(
              "Skipping category in 'More' due to missing categoryName:",
              category
            );
          }
        });
        // Note: Bootstrap should automatically handle new tabs if they follow the pattern.
        // If event delegation is set up on pillsTab container, new buttons will also trigger it.
      });
    }
  }
}

function createProductCardTrending(product) {
  const imageUrl = product.mainImage
    ? `http://localhost:3000/uploads/${product.mainImage}`
    : "../assets/images/products/default.png"; // Ensure a default image
  const rating = product.averageRating || 0;
  const reviews = product.reviewCount || 0;
  const price = product.productPrice || "N/A";
  const originalPrice =
    product.originalPrice || Math.round(Number.parseFloat(price) * 1.25); // Assuming originalPrice might not always be present
  const name = product.productName || "N/A";
  const id = product._id;
  const shopName = product.shop?.shopName || "Unknown Shop";
  const createdAt = new Date(product.createdAt);
  const today = new Date();
  const threeDaysAgo = new Date(today.setDate(today.getDate() - 3));

  let newBadgeHTML = "";
  if (createdAt > threeDaysAgo) {
    newBadgeHTML =
      '<span class="product-card__badge bg-warning-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">New</span>';
  }

  const cardHTML = `
        <div class="col-xxl-2 col-xl-3 col-lg-4 col-sm-6" data-aos="fade-up" data-aos-duration="200">
            <div class="product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2" data-product-id="${id}">
                <a href="product-details.html?id=${id}" class="product-card__thumb flex-center rounded-8 position-relative">
                    ${newBadgeHTML}
                    <img src="${imageUrl}" alt="${name}" class="w-100 h-auto" onerror="this.src='../assets/images/products/default.png'">
                </a>
                <div class="bg-white p-2 rounded-pill z-1 position-absolute inset-inline-end-0 inset-block-start-0 me-16 mt-16 shadow-sm">
                    <button type="button" class="wishlist-btn w-40 h-40 text-md d-flex justify-content-center align-items-center rounded-circle hover-bg-main-two-600 hover-text-white" 
                            id="wishlist-btn-${id}" 
                            data-product-id="${id}">
                    <i class="ph ph-heart fs-4"></i>
                    </button>
                </div>
                <div class="product-card__content mt-16">
                    ${product.discountPercentage ? `<span class="text-success-600 bg-success-50 text-sm fw-medium py-4 px-8">${product.discountPercentage}% OFF</span>` : ""}
                    <h6 class="title text-lg fw-semibold my-16">
                        <a href="product-details.html?id=${id}" class="link text-line-2" tabindex="0">${name}</a>
                    </h6>
                    <div class="flex-align gap-6">
                        <div class="flex-align gap-2">
                            ${generateStarRating(rating)}
                        </div>
                        <span class="text-xs fw-medium text-gray-500">${rating.toFixed(1)}</span>
                        <span class="text-xs fw-medium text-gray-500">(${reviews})</span>
                    </div>
                    <span class="py-2 px-8 text-xs rounded-pill text-main-two-600 bg-main-two-50 mt-16 fw-normal">Fulfilled by ${shopName}</span>
                    <div class="product-card__price mt-16 mb-30">
                        ${product.discountPercentage ? `<span class="text-gray-400 text-md fw-semibold text-decoration-line-through"> ${originalPrice} DT</span>` : ""}
                        <span class="text-heading text-md fw-semibold ">${price} DT <span class="text-gray-500 fw-normal">/Qty</span> </span>
                    </div>
                     <button 
                        class="product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 px-24 rounded-8 flex-center gap-8 fw-medium" 
                        data-product-id="${id}">
                        Add To Cart <i class="ph ph-shopping-cart"></i> 
                    </button>
                </div>
            </div>
        </div>
    `;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = cardHTML.trim(); // Use a temporary div to return the .col element
  return wrapper.firstChild;
}

function fetchAndPopulateTrendingProducts(category = "all") {
  const apiUrl =
    category === "all"
      ? "http://localhost:3000/product/get"
      : `http://localhost:3000/product/category/${encodeURIComponent(category)}`;

  const tabContentContainer = document.getElementById("pills-tabContent");
  if (!tabContentContainer) {
    console.error("Tab content container #pills-tabContent not found");
    return;
  }

  // Sanitize category name for use in IDs
  const sanitizedCategoryForId = category
    .replace(/\s+/g, "-")
    .replace(/&/g, "and");
  const targetPaneId = `pills-${sanitizedCategoryForId}`;
  let currentTabPane = document.getElementById(targetPaneId);

  if (!currentTabPane) {
    currentTabPane = document.createElement("div");
    currentTabPane.className = "tab-pane fade";
    currentTabPane.id = targetPaneId;
    currentTabPane.setAttribute("role", "tabpanel");
    currentTabPane.setAttribute(
      "aria-labelledby",
      `pills-${sanitizedCategoryForId}-tab`
    );
    currentTabPane.innerHTML = '<div class="row g-12"></div>';
    tabContentContainer.appendChild(currentTabPane);
  }

  const productsContainer = currentTabPane.querySelector(".row.g-12");
  if (!productsContainer) {
    console.error(
      "Products container .row.g-12 not found in tab pane:",
      targetPaneId
    );
    return;
  }

  // Afficher un indicateur de chargement
  productsContainer.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading products...</p>
    </div>
  `;

  // Ajouter un timestamp pour éviter la mise en cache
  const timestamp = new Date().getTime();
  const urlWithTimestamp = `${apiUrl}${apiUrl.includes("?") ? "&" : "?"}_=${timestamp}`;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", urlWithTimestamp, true);

  // Ajouter un timeout pour éviter les requêtes bloquées
  xhr.timeout = 10000; // 10 secondes

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const productData = JSON.parse(xhr.responseText);
          let products = [];

          if (productData.data && Array.isArray(productData.data.products)) {
            products = productData.data.products;
          } else if (
            productData.products &&
            Array.isArray(productData.products)
          ) {
            products = productData.products;
          }

          if (!products || products.length === 0) {
            productsContainer.innerHTML = `
              <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                  <i class="ph ph-info me-2"></i>
                  <span>No trending products found for this category.</span>
                </div>
              </div>
            `;
            return;
          }

          productsContainer.innerHTML = "";
          products.forEach((product) => {
            const productCardElement = createProductCardTrending(product);
            productsContainer.appendChild(productCardElement);
          });

          if (typeof AOS !== "undefined") {
            AOS.refresh();
          }

          // Mettre à jour l'état des boutons de liste de souhaits
          checkWishlistStatus();

          console.log(
            `Successfully loaded ${products.length} products for category: ${category}`
          );
        } catch (error) {
          console.error(
            `Error parsing trending products JSON for ${category}:`,
            error,
            xhr.responseText
          );
          productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
              <div class="alert alert-danger">
                <i class="ph ph-x-circle me-2"></i>
                <span>Error loading products. Please try again later.</span>
              </div>
            </div>
          `;
        }
      } else {
        console.error(
          `Could not fetch trending products for ${category}: HTTP error! status: ${xhr.status}`
        );
        productsContainer.innerHTML = `
          <div class="col-12 text-center py-5">
            <div class="alert alert-warning">
              <i class="ph ph-warning me-2"></i>
              <span>Error loading products. Please try again later.</span>
            </div>
          </div>
        `;
      }
    }
  };

  xhr.ontimeout = () => {
    console.error(`Request timed out for category: ${category}`);
    productsContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="alert alert-warning">
          <i class="ph ph-clock me-2"></i>
          <span>Request timed out. Please try again later.</span>
        </div>
      </div>
    `;
  };

  xhr.onerror = () => {
    console.error(
      `Could not fetch trending products for ${category}: Network error`
    );
    productsContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="alert alert-danger">
          <i class="ph ph-wifi-slash me-2"></i>
          <span>Network error. Please check your connection and try again.</span>
        </div>
      </div>
    `;
  };

  xhr.send();
}

function updateButtonAppearance(button, isInWishlist) {
  const icon = button.querySelector("i");

  if (isInWishlist) {
    button.classList.add("active");
    if (icon) {
      icon.className = "ph-fill ph-heart";
    }
  } else {
    button.classList.remove("active");
    if (icon) {
      icon.className = "ph ph-heart fs-4";
    }
  }
}

const style = document.createElement("style");
style.textContent = `
    .wishlist-btn {
        transition: all 0.3s ease;
    }
    
    /* Hover state - only change the heart color */
    .wishlist-btn:hover i {
        color: #3b82f6 !important;
        transition: all 0.3s ease;
    }
    
    /* Active state - make heart even bigger and blue */
    .wishlist-btn.active i {
        color: #3b82f6 !important;
        transform: scale(1.5);
        transition: all 0.3s ease;
    }
`;

document.head.appendChild(style);