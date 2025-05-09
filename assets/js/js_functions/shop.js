// Shop page functionality script - Rewritten to only show main categories

// Global variables to store data
let allProducts = []
let filteredProducts = []
let categories = []
let minPrice = 0
let maxPrice = 10000
let currentPage = 1
const productsPerPage = 12

// Declare $ and Swal if they are not already declared
if (typeof $ === "undefined") {
  $ = jQuery // Assuming jQuery is available globally
}

if (typeof jQuery === "undefined") {
  jQuery = $ // Ensure jQuery is defined if $ is defined
}

if (typeof Swal === "undefined") {
  // You might need to include SweetAlert2 library if it's not already included
  // For example, by adding a script tag in your HTML:
  // <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  // For this example, we'll just define a basic Swal object
  Swal = {
    fire: (options) => {
      alert(options.title + ": " + options.text)
    },
  }
}

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the shop page
  initShop()
})

/**
 * Initialize the shop page by fetching data and setting up event listeners
 */
function initShop() {
  // Fetch categories first
  fetchCategories()
    .then(() => {
      // Update categories in the sidebar
      updateCategoryUI()

      // Then fetch products
      return fetchProducts()
    })
    .then(() => {
      // Log the product structure for debugging
      if (allProducts.length > 0) {
        const exampleProduct = allProducts[0];
        console.log("Example product structure:", exampleProduct);
        
        // Log specific category/subcategory structure to understand the data model
        console.log("Product Category Structure:", {
          directCategory: exampleProduct.category,
          subCategory: exampleProduct.subCategory,
          subCategoryCategory: exampleProduct.subCategory?.category
        });
      }

      // Apply filters and display products
      updatePriceRange()
      applyAllFilters()
      setupPagination()
      setupEventListeners()
      
      // Check for URL parameters to apply initial filtering
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      
      if (categoryParam) {
        console.log("Found category param in URL:", categoryParam);
        
        // Find the link with matching category ID
        const categoryLinks = document.querySelectorAll(".category-link");
        let categoryFound = false;
        
        categoryLinks.forEach(link => {
          if (link.dataset.id === categoryParam) {
            console.log("Found matching category link for:", categoryParam);
            // Simulate click to activate this category
            link.click();
            categoryFound = true;
          }
        });
        
        if (!categoryFound) {
          console.warn("Category from URL parameter not found in sidebar:", categoryParam);
        }
      }
    })
    .catch((error) => {
      showError("Error initializing shop: " + error.message)
    })
}

/**
 * Fetch categories from the API
 * @returns {Promise} - A promise that resolves when categories are fetched
 */
function fetchCategories() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", "http://localhost:3000/categorieswithsubcategories", true)

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)

          if (response && response.categories) {
            categories = response.categories
            console.log("Categories loaded:", categories)
            resolve()
          } else {
            reject(new Error("Invalid category data format"))
          }
        } catch (error) {
          console.error("Error parsing category data:", error)
          reject(error)
        }
      } else {
        console.error("Failed to fetch categories:", xhr.status)
        reject(new Error("Failed to load categories"))
      }
    }

    xhr.onerror = () => {
      console.error("Network error occurred while fetching categories")
      reject(new Error("Network error"))
    }

    xhr.send()
  })
}

/**
 * Fetch products from the API
 * @returns {Promise} - A promise that resolves when products are fetched
 */
function fetchProducts() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", "http://localhost:3000/product/get", true)

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)

          if (response.status === "success" && response.data && response.data.products) {
            // Filter out banned products and products from banned shops
            allProducts = response.data.products.filter(
              (product) => !product.banned && !(product.shop && product.shop.status === "Banned"),
            )

            // Make a copy for filtered products
            filteredProducts = [...allProducts]
            console.log("Products loaded:", allProducts.length)
            resolve()
          } else {
            reject(new Error("Invalid product data format"))
          }
        } catch (error) {
          console.error("Error parsing product data:", error)
          reject(error)
        }
      } else {
        console.error("Failed to fetch products:", xhr.status)
        reject(new Error("Failed to load products"))
      }
    }

    xhr.onerror = () => {
      console.error("Network error occurred while fetching products")
      reject(new Error("Network error"))
    }

    xhr.send()
  })
}

/**
 * Update categories in the sidebar UI - Only showing main categories
 */
function updateCategoryUI() {
  const categoryContainer = document.querySelector(".shop-sidebar__box ul")

  if (!categoryContainer) {
    console.error("Category container not found")
    return
  }

  // Clear existing categories
  categoryContainer.innerHTML = ""

  // Create a link for "All Categories" option
  const allCategoriesItem = document.createElement("li")
  allCategoriesItem.className = "mb-24"

  const allCategoriesLink = document.createElement("a")
  allCategoriesLink.href = "javascript:void(0)"
  allCategoriesLink.className = "text-gray-900 hover-text-main-600 category-link"
  allCategoriesLink.dataset.category = "all"
  allCategoriesLink.textContent = `All Categories (${allProducts.length})`

  allCategoriesItem.appendChild(allCategoriesLink)
  categoryContainer.appendChild(allCategoriesItem)

  // Add each main category to sidebar
  categories.forEach((category) => {
    const categoryItem = document.createElement("li")
    categoryItem.className = "mb-24"

    const categoryLink = document.createElement("a")
    categoryLink.href = "javascript:void(0)"
    categoryLink.className = "text-gray-900 hover-text-main-600 category-link"
    categoryLink.dataset.id = category._id
    categoryLink.dataset.category = category.categoryName

    // Count products in this category - check multiple paths where category can be stored
    const productsInCategory = allProducts.filter((product) => {
      // Check direct category match (product.category can be an ID string or object)
      const directCategory = typeof product.category === "object" 
        ? product.category?._id 
        : product.category;
        
      if (directCategory === category._id) {
        return true;
      }
      
      // Check if product belongs to a subcategory of this category
      if (product.subCategory) {
        // subCategory.category can be either a string ID or an object with _id
        if (typeof product.subCategory.category === "string") {
          return product.subCategory.category === category._id;
        } 
        else if (product.subCategory.category && product.subCategory.category._id) {
          return product.subCategory.category._id === category._id;
        }
      }
      
      return false;
    });

    categoryLink.textContent = `${category.categoryName} (${productsInCategory.length})`
    console.log(`Category ${category.categoryName} has ${productsInCategory.length} products`);

    categoryItem.appendChild(categoryLink)
    categoryContainer.appendChild(categoryItem)
  })
}

/**
 * Update price range filter based on available products
 */
function updatePriceRange() {
  if (allProducts.length === 0) return

  // Find min and max product prices
  minPrice = Math.min(...allProducts.map((product) => product.productPrice))
  maxPrice = Math.max(...allProducts.map((product) => product.productPrice))

  // Round to nearest whole numbers
  minPrice = Math.floor(minPrice)
  maxPrice = Math.ceil(maxPrice)

  // Initialize jQuery UI slider if available
  if ($.fn.slider && $("#slider-range").length) {
    $("#slider-range").slider({
      range: true,
      min: minPrice,
      max: maxPrice,
      values: [minPrice, maxPrice],
      slide: (event, ui) => {
        $("#amount").val(ui.values[0] + " DT - " + ui.values[1] + " DT")
      },
    })

    $("#amount").val($("#slider-range").slider("values", 0) + " DT - " + $("#slider-range").slider("values", 1) + " DT")
  }
}

/**
 * Apply all filters (category, price, rating) to the products
 */
function applyAllFilters() {
  // Start with all products
  filteredProducts = [...allProducts]

  // Get selected category from active links
  const activeCategoryLink = document.querySelector(".category-link.active")
  
  // Filter by category if selected
  if (activeCategoryLink && activeCategoryLink.dataset.category !== "all") {
    // Filter by main category
    const categoryId = activeCategoryLink.dataset.id
    const categoryName = activeCategoryLink.dataset.category
    
    console.log(`Filtering by category: ${categoryName} (ID: ${categoryId})`)
    
    filteredProducts = filteredProducts.filter((product) => {
      // Check direct category match first (supporting both string ID and object formats)
      const directCategory = typeof product.category === "object" 
        ? product.category?._id 
        : product.category;
        
      if (directCategory === categoryId) {
        return true;
      }
      
      // Check if product belongs to a subcategory of this category
      if (product.subCategory) {
        // subCategory.category can be either a string ID or an object with _id
        const subCategoryParent = product.subCategory.category;
        
        if (typeof subCategoryParent === "string") {
          return subCategoryParent === categoryId;
        } 
        else if (subCategoryParent && subCategoryParent._id) {
          return subCategoryParent._id === categoryId;
        }
      }
      
      return false;
    })
    
    console.log(`Filtered ${filteredProducts.length} products for category: ${categoryName}`)
  }

  // Filter by price range
  if ($.fn.slider && $("#slider-range").length) {
    const priceValues = $("#slider-range").slider("values")
    const minSelectedPrice = priceValues[0]
    const maxSelectedPrice = priceValues[1]

    filteredProducts = filteredProducts.filter(
      (product) => product.productPrice >= minSelectedPrice && product.productPrice <= maxSelectedPrice,
    )
  }

  // Filter by rating if a rating option is selected
  const selectedRating = document.querySelector('.common-radio input[type="radio"]:checked')
  if (selectedRating) {
    const ratingValue = Number.parseInt(selectedRating.id.replace("rating", ""))
    filteredProducts = filteredProducts.filter((product) => {
      const avgRating = product.averageRating || 0
      return avgRating >= ratingValue - 1 && avgRating <= ratingValue
    })
  }

  // Apply sorting if selected
  const sortingSelect = document.getElementById("sorting")
  if (sortingSelect) {
    const sortValue = sortingSelect.value
    sortProducts(sortValue)
  }

  // Reset to first page and display
  currentPage = 1
  displayProducts(currentPage)
  setupPagination()
  updateResultCount()
}

/**
 * Sort products based on selected criteria
 * @param {string} sortValue - The sort option value
 */
function sortProducts(sortValue) {
  switch (sortValue) {
    case "1": // Popular (by rating)
      filteredProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      break
    case "2": // Latest (assumes newer products have higher IDs)
      filteredProducts.sort((a, b) => b._id.localeCompare(a._id))
      break
    case "3": // Price: Low to High
      filteredProducts.sort((a, b) => a.productPrice - b.productPrice)
      break
    case "4": // Price: High to Low
      filteredProducts.sort((a, b) => b.productPrice - a.productPrice)
      break
    default:
      // Default sort by popularity (rating)
      filteredProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
  }
}

/**
 * Display products for the current page
 * @param {number} page - The page number to display
 */
function displayProducts(page) {
  currentPage = page
  const startIndex = (page - 1) * productsPerPage
  const endIndex = Math.min(startIndex + productsPerPage, filteredProducts.length)
  const productsToDisplay = filteredProducts.slice(startIndex, endIndex)

  const productsContainer = document.querySelector(".list-grid-wrapper")
  if (!productsContainer) {
    console.error("Products container not found")
    return
  }

  // Clear existing products
  productsContainer.innerHTML = ""

  // If no products to display
  if (productsToDisplay.length === 0) {
    productsContainer.innerHTML = '<div class="col-12 text-center py-5"><p>No products found</p></div>'
    return
  }

  // Display products
  productsToDisplay.forEach((product) => {
    const productCard = createProductCard(product)
    productsContainer.appendChild(productCard)
  })
}

/**
 * Create a product card element
 * @param {Object} product - The product data
 * @returns {HTMLElement} - The product card element
 */
function createProductCard(product) {
  const productCard = document.createElement("div")
  productCard.className =
    "product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2"

  // Create product badge if needed
  let badgeHtml = ""
  if (product.stock <= 5 && product.stock > 0) {
    badgeHtml = `<span class="product-card__badge bg-warning-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">Limited</span>`
  } else if (product.stock === 0) {
    badgeHtml = `<span class="product-card__badge bg-danger-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">Out of Stock</span>`
  }

  // Generate star rating HTML
  const ratingHtml = generateStarRating(product.averageRating || 0)

  // Create the image URL
  const imageUrl = product.mainImage ? `../uploads/${product.mainImage}` : "../assets/images/products/default.png"

  productCard.innerHTML = `
        <a href="product-details.html?id=${product._id}" class="product-card__thumb flex-center rounded-8 bg-gray-50 position-relative">
            ${badgeHtml}
            <img src="${imageUrl}" alt="${product.productName}" class="w-auto max-w-100 " />
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
                <div class="progress w-100 bg-color-three rounded-pill h-4" role="progressbar" 
                     aria-label="Stock" aria-valuenow="${product.stock}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar bg-main-two-600 rounded-pill" 
                         style="width: ${(product.stock / 50) * 100}%"></div>
                </div>
                <span class="text-gray-900 text-xs fw-medium mt-8">Stock: ${product.stock}</span>
            </div>

            <div class="product-card__price my-20">
                <span class="text-heading text-md fw-semibold">
                    ${product.productPrice} DT
                    <span class="text-gray-500 fw-normal">/Qty</span>
                </span>
            </div>

            <button 
                class="product-card__cart btn ${product.stock > 0 ? "bg-gray-50 text-heading hover-bg-main-600 hover-text-white" : "bg-gray-100 text-gray-500"} py-11 px-24 rounded-8 flex-center gap-8 fw-medium add-to-cart-btn"
                data-product-id="${product._id}" 
                ${product.stock === 0 ? "disabled" : ""}>
                ${product.stock > 0 ? 'Add To Cart <i class="ph ph-shopping-cart"></i>' : "Out of Stock"}
            </button>
        </div>
    `

  // Add event listener to the Add to Cart button
  const addToCartBtn = productCard.querySelector(".add-to-cart-btn")
  if (addToCartBtn && product.stock > 0) {
    addToCartBtn.addEventListener("click", () => {
      addToCart(product._id)
    })
  }

  return productCard
}

/**
 * Generate star rating HTML
 * @param {number} rating - The product rating (0-5)
 * @returns {string} - HTML string for star rating
 */
function generateStarRating(rating) {
  let stars = ""
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars += '<span class="text-15 fw-medium text-warning-600 d-flex"><i class="ph-fill ph-star"></i></span>'
  }

  // Add half star if needed
  if (hasHalfStar) {
    stars += '<span class="text-15 fw-medium text-warning-600 d-flex"><i class="ph-fill ph-star-half"></i></span>'
  }

  // Add empty stars to complete 5 stars
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
  for (let i = 0; i < emptyStars; i++) {
    stars += '<span class="text-15 fw-medium text-gray-400 d-flex"><i class="ph-fill ph-star"></i></span>'
  }

  return stars
}

/**
 * Add a product to the shopping cart
 * @param {string} productId - The product ID to add to cart
 */
function addToCart(productId) {
  const token = localStorage.getItem("token")
  const clientId = localStorage.getItem("userId")

  if (!token || !clientId) {
    showError("Please log in to add products to your cart.")
    return
  }

  const xhr = new XMLHttpRequest()
  xhr.open("POST", "http://localhost:3000/cart/add", true)
  xhr.setRequestHeader("Content-Type", "application/json")

  const data = {
    clientId: clientId,
    productId: productId,
    quantity: 1,
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText)
        showMessage("Product added to cart successfully!", "success")

        // Update cart count in the header if available
        const cartCountElement = document.querySelector(".ph-shopping-cart-simple + span")
        if (cartCountElement && response.cart && response.cart.items) {
          cartCountElement.textContent = response.cart.items.length
        }
      } catch (error) {
        console.error("Error parsing cart response:", error)
        showError("Error adding product to cart")
      }
    } else {
      console.error("Failed to add product to cart:", xhr.status)
      showError("Failed to add product to cart")
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred while adding to cart")
    showError("Network error occurred")
  }

  xhr.send(JSON.stringify(data))
}

/**
 * Set up pagination for the products
 */
function setupPagination() {
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const paginationEl = document.querySelector(".pagination")

  if (!paginationEl) return

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
    `

  // Add event listeners to pagination items
  const prevBtn = paginationEl.querySelector(".page-item:first-child .page-link")
  const nextBtn = paginationEl.querySelector(".page-item:last-child .page-link")

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        displayProducts(currentPage - 1)
        setupPagination() // Refresh pagination after changing page
      }
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        displayProducts(currentPage + 1)
        setupPagination() // Refresh pagination after changing page
      }
    })
  }

  // Add event listeners to page numbers
  const pageLinks = paginationEl.querySelectorAll(".page-link[data-page]")
  pageLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const page = Number.parseInt(this.dataset.page)
      displayProducts(page)
      setupPagination() // Refresh pagination after changing page
    })
  })
}

/**
 * Generate HTML for pagination items
 * @param {number} totalPages - The total number of pages
 * @returns {string} - HTML string for pagination items
 */
function generatePaginationItems(totalPages) {
  let items = ""

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // First page
      i === totalPages || // Last page
      (i >= currentPage - 1 && i <= currentPage + 1) // Pages around current page
    ) {
      items += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium ${i === currentPage ? "bg-main-600 text-white" : "text-neutral-600 border border-gray-100"}" 
                       href="javascript:void(0)" data-page="${i}">${i}</a>
                </li>
            `
    } else if (
      (i === 2 && currentPage > 3) // Show ellipsis after first page
      || (i === totalPages - 1 && currentPage < totalPages - 2) // Show ellipsis before last page
    ) {
      items += `
                <li class="page-item disabled">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="javascript:void(0)">...</a>
                </li>
            `
    }
  }

  return items
}

/**
 * Update the result count display
 */
function updateResultCount() {
  const resultCountEl = document.querySelector(".flex-between.gap-16.flex-wrap.mb-40 span")

  if (resultCountEl) {
    const start = (currentPage - 1) * productsPerPage + 1
    const end = Math.min(start + productsPerPage - 1, filteredProducts.length)

    resultCountEl.textContent = `Showing ${start}-${end} of ${filteredProducts.length} result${filteredProducts.length !== 1 ? "s" : ""}`
  }
}

/**
 * Set up event listeners for the shop page
 */
function setupEventListeners() {
  // Category filter links
  document.querySelectorAll(".category-link").forEach((link) => {
    link.addEventListener("click", function () {
      // Remove active class from all links
      document.querySelectorAll(".category-link").forEach((el) => {
        el.classList.remove("active")
        el.classList.remove("text-main-600")
        el.classList.add("text-gray-900")
      })

      // Add active class to clicked link
      this.classList.add("active", "text-main-600")
      this.classList.remove("text-gray-900")
      
      // If this is a specific category, update the URL parameter
      if (this.dataset.category !== "all" && this.dataset.id) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('category', this.dataset.id);
        window.history.replaceState({}, '', newUrl);
        console.log("Updated URL with category parameter:", this.dataset.id);
      } else {
        // If "All Categories" is selected, remove the category parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('category');
        window.history.replaceState({}, '', newUrl);
        console.log("Removed category parameter from URL");
      }

      // Apply filters
      applyAllFilters()
    })
  })

  // Price filter button
  const filterPriceBtn = document.querySelector(".custom--range .btn-main")
  if (filterPriceBtn) {
    filterPriceBtn.addEventListener("click", () => {
      applyAllFilters()
    })
  }

  // Rating filter
  document.querySelectorAll('.common-radio input[type="radio"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      applyAllFilters()
    })
  })

  // Sorting
  const sortingSelect = document.getElementById("sorting")
  if (sortingSelect) {
    sortingSelect.addEventListener("change", () => {
      applyAllFilters()
    })

    // Add additional options for sorting if they don't exist already
    if (!sortingSelect.querySelector('option[value="3"]')) {
      const priceOptions = `
              <option value="3">Price: Low to High</option>
              <option value="4">Price: High to Low</option>
          `
      sortingSelect.innerHTML += priceOptions
    }
  }

  // List/Grid view toggle
  const listBtn = document.querySelector(".list-btn")
  const gridBtn = document.querySelector(".grid-btn")

  if (listBtn && gridBtn) {
    listBtn.addEventListener("click", () => {
      document.querySelector(".list-grid-wrapper").classList.add("list-view")
      listBtn.classList.add("bg-main-600", "text-white", "border-main-600")
      listBtn.classList.remove("border-gray-100")

      gridBtn.classList.remove("bg-main-600", "text-white", "border-main-600")
      gridBtn.classList.add("border-gray-100")
    })

    gridBtn.addEventListener("click", () => {
      document.querySelector(".list-grid-wrapper").classList.remove("list-view")
      gridBtn.classList.add("bg-main-600", "text-white", "border-main-600")
      gridBtn.classList.remove("border-gray-100")

      listBtn.classList.remove("bg-main-600", "text-white", "border-main-600")
      listBtn.classList.add("border-gray-100")
    })
  }

  // Mobile sidebar toggle
  const sidebarBtn = document.querySelector(".sidebar-btn")
  const sidebar = document.querySelector(".shop-sidebar")
  const sidebarClose = document.querySelector(".shop-sidebar__close")

  if (sidebarBtn && sidebar && sidebarClose) {
    sidebarBtn.addEventListener("click", () => {
      sidebar.classList.add("show")
    })

    sidebarClose.addEventListener("click", () => {
      sidebar.classList.remove("show")
    })
  }
}

/**
 * Show an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
  // Check if SweetAlert2 is available
  if (typeof Swal !== "undefined") {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
    })
  } else {
    alert(message)
  }
}

/**
 * Show a message
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, error, warning, info)
 */
function showMessage(message, type = "info") {
  // Check if SweetAlert2 is available
  if (typeof Swal !== "undefined") {
    Swal.fire({
      icon: type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      text: message,
    })
  } else {
    alert(message)
  }
}
