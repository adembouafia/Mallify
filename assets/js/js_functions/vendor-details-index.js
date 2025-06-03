document.addEventListener("DOMContentLoaded", () => {
  // Get the shop ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const shopId = urlParams.get("id")

  if (!shopId) {
    console.error("No shop ID provided in URL")
    showErrorMessage("Shop ID not found in URL")
    return
  }

  // Global variables
  let allProducts = []
  let categories = []
  let currentPage = 1
  const productsPerPage = 8
  let filteredProducts = []
  let selectedCategory = null
  let shopData = null

  // Price filter variables
  let minPrice = 0
  let maxPrice = Number.POSITIVE_INFINITY

  // Initialize
  fetchShopDetails(shopId)
  fetchShopProducts(shopId)
  setupEventListeners()

  // Setup event listeners for search, pagination, and view toggle
  function setupEventListeners() {
    // Search form submission event
    const searchForm = document.querySelector(".vendor-two-details__contents .input-group")
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const searchInput = searchForm.querySelector('input[type="text"]')
        const searchTerm = searchInput.value.trim().toLowerCase()
        filterProducts(searchTerm)
      })
    }

    // Grid/List view toggle
    const gridButton = document.querySelector(".grid-btn")
    const listButton = document.querySelector(".list-btn")

    if (gridButton && listButton) {
      gridButton.addEventListener("click", () => {
        gridButton.classList.add("border-main-600", "text-white", "bg-main-600")
        listButton.classList.remove("border-main-600", "text-white", "bg-main-600")
        document.querySelector(".list-grid-wrapper").classList.remove("list-view")
      })

      listButton.addEventListener("click", () => {
        listButton.classList.add("border-main-600", "text-white", "bg-main-600")
        gridButton.classList.remove("border-main-600", "text-white", "bg-main-600")
        document.querySelector(".list-grid-wrapper").classList.add("list-view")
      })
    }

    // Category sidebar links
    document.addEventListener("click", (e) => {
      if (e.target.matches(".shop-sidebar ul li a") || e.target.closest(".shop-sidebar ul li a")) {
        e.preventDefault()

        const link = e.target.closest(".shop-sidebar ul li a")
        const categoryName = link.textContent.split("(")[0].trim()

        // Highlight selected category
        document.querySelectorAll(".shop-sidebar ul li a").forEach((a) => {
          a.classList.remove("text-main-600")
          a.classList.add("text-gray-900", "hover-text-main-600")
        })
        link.classList.add("text-main-600")
        link.classList.remove("text-gray-900", "hover-text-main-600")

        // Filter products by category
        selectedCategory = categoryName
        applyAllFilters()
      }
    })

    // Sidebar toggle for mobile
    const sidebarBtn = document.querySelector(".sidebar-btn")
    if (sidebarBtn) {
      sidebarBtn.addEventListener("click", () => {
        const sidebar = document.querySelector(".shop-sidebar")
        sidebar.classList.toggle("active")
      })
    }

    // Sorting change
    const sortSelect = document.querySelector(".form-select")
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        sortProducts(this.value)
      })
    }

    // Price filter form
    const priceFilterForm = document.getElementById("price-filter-form")
    if (priceFilterForm) {
      priceFilterForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const minPriceInput = document.getElementById("min-price")
        const maxPriceInput = document.getElementById("max-price")

        minPrice = minPriceInput.value ? Number.parseFloat(minPriceInput.value) : 0
        maxPrice = maxPriceInput.value ? Number.parseFloat(maxPriceInput.value) : Number.POSITIVE_INFINITY

        applyAllFilters()
      })
    }

    // Contact shop via email button
    const contactBtn = document.querySelector(".contact-shop-btn")
    if (contactBtn) {
      contactBtn.addEventListener("click", () => {
        if (shopData && shopData.vendor && shopData.vendor.email) {
          window.location.href = `mailto:${shopData.vendor.email}?subject=Inquiry about ${shopData.shopName}`
        } else {
          alert("Shop email not available")
        }
      })
    }
  }

  // Fetch shop details using XHR
  function fetchShopDetails(shopId) {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/shop/${shopId}`, true)
    xhr.setRequestHeader("Content-Type", "application/json")

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            // The shop data is nested inside a 'shop' property in the response
            const shop = response.shop
            shopData = shop // Store shop data globally
            updateShopUI(shop)
            console.log("Shop data loaded:", shop) // Add logging for debugging
          } catch (error) {
            console.error("Error parsing shop details:", error)
            showErrorMessage("Error loading shop details")
          }
        } else {
          console.error("Failed to fetch shop details:", xhr.status)
          showErrorMessage("Failed to load shop details")
        }
      }
    }

    xhr.onerror = () => {
      console.error("Network error occurred while fetching shop details")
      showErrorMessage("Network error occurred")
    }

    xhr.send()
  }

  // Update UI with shop details
  function updateShopUI(shop) {
    // Update shop logo
    const shopLogo = document.querySelector(".bg-neutral-600 .w-80.h-80 img")
    if (shopLogo && shop.shopLogo) {
      shopLogo.src = `../uploads/${shop.shopLogo}`
    }

    // Update shop name
    const shopNameElements = document.querySelectorAll(".bg-neutral-600 h6 a")
    shopNameElements.forEach((element) => {
      element.textContent = shop.shopName || "Shop"
    })

    // Update contact button if vendor data is available
    const contactBtn = document.querySelector(".contact-shop-btn")
    if (contactBtn && shop.vendor && shop.vendor.email) {
      contactBtn.setAttribute("data-email", shop.vendor.email)
    }

    // Add shop address to UI if available
    const shopAddressElement = document.querySelector(".shop-address")
    if (shopAddressElement && shop.adresse) {
      shopAddressElement.textContent = shop.adresse
    }
  }

  // Fetch products for the current shop
  function fetchShopProducts(shopId) {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/product/get`, true)

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)

            if (response.status === "success" && response.data && response.data.products) {
              // Filter to get only products from this shop
              allProducts = response.data.products.filter((product) => product.shop && product.shop._id === shopId)

              // Deep copy to filteredProducts
              filteredProducts = JSON.parse(JSON.stringify(allProducts))

              // Calculate price range for the filter
              updatePriceRange()

              // Extract categories from products
              extractCategories()
              updateCategoryUI()

              // Display first page of products
              displayProducts(1)

              // Set up pagination
              setupPagination()
            } else {
              console.error("Invalid product data format")
              showErrorMessage("Failed to load products")
            }
          } catch (error) {
            console.error("Error parsing product data:", error)
            showErrorMessage("Error processing product data")
          }
        } else {
          console.error("Failed to fetch products:", xhr.status)
          showErrorMessage("Failed to load products")
        }
      }
    }

    xhr.onerror = () => {
      console.error("Network error occurred while fetching products")
      showErrorMessage("Network error occurred")
    }

    xhr.send()
  }

  // Update price range filter based on available products
  function updatePriceRange() {
    if (allProducts.length === 0) return

    let min = Number.POSITIVE_INFINITY
    let max = 0

    allProducts.forEach((product) => {
      if (product.productPrice) {
        min = Math.min(min, product.productPrice)
        max = Math.max(max, product.productPrice)
      }
    })

    // Update min-max price filter
    const minPriceInput = document.getElementById("min-price")
    const maxPriceInput = document.getElementById("max-price")

    if (minPriceInput) {
      minPriceInput.placeholder = `Min (${Math.floor(min)} TND)`
    }

    if (maxPriceInput) {
      maxPriceInput.placeholder = `Max (${Math.ceil(max)} TND)`
    }
  }

  // Extract unique categories from products
  function extractCategories() {
    const categoryMap = new Map()

    allProducts.forEach((product) => {
      if (product.subCategory && product.subCategory.name) {
        const categoryName = product.subCategory.name

        if (categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, categoryMap.get(categoryName) + 1)
        } else {
          categoryMap.set(categoryName, 1)
        }
      }
    })

    categories = Array.from(categoryMap).map(([name, count]) => ({ name, count }))
  }

  // Update the category UI
  function updateCategoryUI() {
    const categoryList = document.querySelector(".shop-sidebar ul.max-h-540")
    if (categoryList) {
      categoryList.innerHTML = ""

      // Add "All categories" option
      const allLi = document.createElement("li")
      allLi.className = "mb-24"
      allLi.innerHTML = `<a href="#" class="text-main-600 hover-text-main-600">All Categories (${allProducts.length})</a>`
      categoryList.appendChild(allLi)

      // Add other categories
      categories.forEach((category) => {
        const li = document.createElement("li")
        li.className = "mb-24"
        li.innerHTML = `<a href="#" class="text-gray-900 hover-text-main-600">${category.name} (${category.count})</a>`
        categoryList.appendChild(li)
      })
    }
  }

  // Apply all filters (search, category, price)
  function applyAllFilters(searchTerm = "") {
    // Start with all products
    filteredProducts = [...allProducts]

    // Apply search filter if provided
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          (product.productName && product.productName.toLowerCase().includes(searchTerm)) ||
          (product.productDescription && product.productDescription.toLowerCase().includes(searchTerm)),
      )
    }

    // Apply category filter if selected
    if (selectedCategory && selectedCategory !== "All Categories") {
      filteredProducts = filteredProducts.filter(
        (product) => product.subCategory && product.subCategory.name === selectedCategory,
      )
    }

    // Apply price filter
    filteredProducts = filteredProducts.filter(
      (product) => product.productPrice >= minPrice && product.productPrice <= maxPrice,
    )

    // Update UI
    currentPage = 1
    displayProducts(currentPage)
    setupPagination()
    updateResultCount()
  }

  // Filter products based on search term
  function filterProducts(searchTerm = "") {
    applyAllFilters(searchTerm)
  }

  // Sort products by selected criteria
  function sortProducts(sortValue) {
    switch (sortValue) {
      case "latest":
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case "oldest":
        filteredProducts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case "price-low":
        filteredProducts.sort((a, b) => a.productPrice - b.productPrice)
        break
      case "price-high":
        filteredProducts.sort((a, b) => b.productPrice - a.productPrice)
        break
      case "name-asc":
        filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName))
        break
      case "name-desc":
        filteredProducts.sort((a, b) => b.productName.localeCompare(a.productName))
        break
      case "rating-high":
        filteredProducts.sort((a, b) => b.averageRating - a.averageRating)
        break
      default:
        // Default is latest
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    displayProducts(currentPage)
  }

  // Display products for the current page
  function displayProducts(page) {
    currentPage = page
    const startIndex = (page - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    const productsToDisplay = filteredProducts.slice(startIndex, endIndex)

    const productsContainer = document.querySelector(".list-grid-wrapper")
    if (productsContainer) {
      productsContainer.innerHTML = ""

      if (productsToDisplay.length === 0) {
        productsContainer.innerHTML = '<div class="col-12 text-center py-5"><p>No products found</p></div>'
        return
      }

      productsToDisplay.forEach((product) => {
        productsContainer.appendChild(createProductCard(product))
      })
    }

    updateResultCount()
  }

  // Generate star rating HTML based on rating value
  function generateStarRating(rating) {
    // Round rating to nearest half
    const roundedRating = Math.round(rating * 2) / 2
    let starsHtml = ""

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        starsHtml += '<span class="text-15 fw-medium text-warning-600 d-flex"><i class="ph-fill ph-star"></i></span>'
      } else if (i - 0.5 === roundedRating) {
        starsHtml +=
          '<span class="text-15 fw-medium text-warning-600 d-flex"><i class="ph-fill ph-star-half"></i></span>'
      } else {
        starsHtml += '<span class="text-15 fw-medium text-gray-300 d-flex"><i class="ph-fill ph-star"></i></span>'
      }
    }

    return starsHtml
  }

  // Create a product card element
  function createProductCard(product) {
    const cardDiv = document.createElement("div")
    cardDiv.className =
      "product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2"
    cardDiv.id = "product-card"

    const discount =
      product.productoldPrice && product.productPrice
        ? Math.round((1 - product.productPrice / product.productoldPrice) * 100)
        : 0

    const productImage = product.mainImage
      ? `../uploads/${product.mainImage}`
      : "../assets/images/products/oversize.png"

    // Get average rating and review count (safely) for individual products
    const averageRating = product.averageRating || 0
    const formattedRating = averageRating.toFixed(1)
    const reviewCount = product.reviewCount || 0

    cardDiv.innerHTML = `
            <div class="product-card__thumb rounded-8 position-relative">
                <a href="product-details.html?id=${product._id}" class="w-100 h-100 flex-center">
                    <img src="${productImage}" alt="${product.productName}" class="w-100 max-w-auto">
                </a>
                ${
                  discount > 0
                    ? `
                <div class="position-absolute inset-block-start-0 inset-inline-start-0 mt-16 ms-16 z-1 d-flex flex-column gap-8">
                    <span class="text-main-two-600 w-40 h-40 d-flex justify-content-center align-items-center bg-white rounded-circle shadow-sm text-xs fw-semibold">-${discount}%</span>
                </div>`
                    : ""
                }
                
                <div class="bg-white p-2 rounded-pill z-1 position-absolute inset-inline-end-0 inset-block-start-0 me-16 mt-16 shadow-sm">
                    <button type="button" class="wishlist-btn w-40 h-40 text-md d-flex justify-content-center align-items-center rounded-circle hover-bg-main-two-600 hover-text-white">
                        <i class="ph ph-heart fs-4"></i>
                    </button>
                </div>
            </div>
            <div class="product-card__content mt-16 w-100">
                <h6 class="title text-lg fw-semibold my-16">
                    <a href="product-details.html?id=${product._id}" class="link text-line-2" tabindex="0">${product.productName}</a>
                </h6>
                <div class="flex-align gap-6">
                    <div class="flex-align gap-8">
                        ${generateStarRating(averageRating)}
                    </div>
                    <span class="text-xs fw-medium text-gray-500">${formattedRating}</span>
                    <span class="text-xs fw-medium text-gray-500">(${reviewCount})</span>
                </div>

                <div class="product-card__price mt-16 mb-30">
                    ${product.productoldPrice ? `<span class="text-gray-400 text-md fw-semibold text-decoration-line-through">${product.productoldPrice} TND</span>` : ""}
                    <span class="text-heading text-md fw-semibold ">${product.productPrice} TND<span class="text-gray-500 fw-normal">/Qty</span></span>
                </div>
                <a href="product-details.html?id=${product._id}" class="product-card__cart btn text-heading hover-bg-main-600 hover-text-white py-11 px-24 rounded-8 flex-center gap-8 fw-medium" tabindex="0">
                    View Details <i class="ph ph-arrow-right"></i> 
                </a>
            </div>
        `

    return cardDiv
  }

  // Set up pagination
  function setupPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
    const paginationEl = document.createElement("nav")
    paginationEl.className = "mt-32"
    paginationEl.innerHTML = `
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="#" aria-label="Previous">
                        <i class="ph ph-caret-left"></i>
                    </a>
                </li>
                ${generatePaginationItems(totalPages)}
                <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="#" aria-label="Next">
                        <i class="ph ph-caret-right"></i>
                    </a>
                </li>
            </ul>
        `

    // Remove existing pagination
    const existingPagination = document.querySelector(".vendor-two-details__contents nav")
    if (existingPagination) {
      existingPagination.remove()
    }

    // Append new pagination
    const containerEl = document.querySelector(".vendor-two-details__contents")
    if (containerEl) {
      containerEl.appendChild(paginationEl)
    }

    // Add click event listeners to pagination items
    paginationEl.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault()

        if (this.getAttribute("aria-label") === "Previous" && currentPage > 1) {
          displayProducts(currentPage - 1)
          setupPagination()
        } else if (this.getAttribute("aria-label") === "Next" && currentPage < totalPages) {
          displayProducts(currentPage + 1)
          setupPagination()
        } else if (!this.getAttribute("aria-label")) {
          const page = Number.parseInt(this.textContent)
          displayProducts(page)
          setupPagination()
        }
      })
    })
  }

  // Generate pagination items HTML
  function generatePaginationItems(totalPages) {
    let items = ""
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        items += `<li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100 ${i === currentPage ? "bg-main-600 text-white" : ""}" href="#">${i}</a>
                </li>`
      }
    } else {
      // Show limited pages with ellipsis
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      // First page
      if (startPage > 1) {
        items += `<li class="page-item">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="#">1</a>
                </li>`

        if (startPage > 2) {
          items += `<li class="page-item disabled">
                        <span class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100">...</span>
                    </li>`
        }
      }

      // Pages
      for (let i = startPage; i <= endPage; i++) {
        items += `<li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100 ${i === currentPage ? "bg-main-600 text-white" : ""}" href="#">${i}</a>
                </li>`
      }

      // Last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          items += `<li class="page-item disabled">
                        <span class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100">...</span>
                    </li>`
        }

        items += `<li class="page-item">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="#">${totalPages}</a>
                </li>`
      }
    }

    return items
  }

  // Update result count display
  function updateResultCount() {
    const resultCountEl = document.querySelector(
      ".vendor-two-details__contents .d-flex.align-items-center span.text-gray-900",
    )
    if (resultCountEl) {
      const startItem = (currentPage - 1) * productsPerPage + 1
      const endItem = Math.min(currentPage * productsPerPage, filteredProducts.length)
      resultCountEl.textContent = `Showing ${startItem}-${endItem} of ${filteredProducts.length} result${filteredProducts.length !== 1 ? "s" : ""}`
    }
  }

  // Show error message
  function showErrorMessage(message) {
    const errorMessage = `
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        `

    const containerEl = document.querySelector(".vendor-two-details__contents")
    if (containerEl) {
      containerEl.innerHTML = errorMessage
    }
  }
})
