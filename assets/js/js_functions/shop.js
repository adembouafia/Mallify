let allProducts = []
let filteredProducts = []
let categories = []
let minPrice = 0
let maxPrice = 10000
let currentPage = 1
const productsPerPage = 12

let priceRangeSlider
let minPriceInput
let maxPriceInput

if (typeof $ === "undefined") {
  $ = jQuery 
}

if (typeof jQuery === "undefined") {
  jQuery = $ 
}

if (typeof Swal === "undefined") {
  Swal = {
    fire: (options) => {
      alert(options.title + ": " + options.text)
    },
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initShop()
})

function initShop() {  
  fetchCategories()
    .then(() => {
      return fetchProducts()
    })
    .then(() => {
      updateCategoryUI()
      
      initModernPriceFilter()
      
      initRatingFilter()
      
      if (allProducts.length > 0) {
        const exampleProduct = allProducts[0];
        console.log("Example product structure:", exampleProduct);
        
        console.log("Product Category Structure:", {
          directCategory: exampleProduct.category,
          subCategory: exampleProduct.subCategory,
          subCategoryCategory: exampleProduct.subCategory?.category
        });
      }

      updatePriceRange()
      applyAllFilters()
      setupPagination()
      setupEventListeners()
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      
      if (categoryParam) {
        console.log("Found category param in URL:", categoryParam);
        
        const categoryLinks = document.querySelectorAll(".category-link");
        let categoryFound = false;
        
        setTimeout(() => {
          categoryLinks.forEach(link => {
            if (link.dataset.id === categoryParam) {
              console.log("Found matching category link for:", categoryParam);
              link.classList.add("active", "text-main-600");
              link.classList.remove("text-gray-900");
              categoryFound = true;
              
              const categoryId = link.dataset.id;
              const categoryName = link.dataset.category;
              
              console.log(`Filtering by category from URL: ${categoryName} (ID: ${categoryId})`);
              
              applyAllFilters();
            }
          });
          
          if (!categoryFound) {
            console.warn("Category from URL parameter not found in sidebar:", categoryParam);
          }
        }, 100); 
      }
    })
    .catch((error) => {
      showError("Error initializing shop: " + error.message)
    })
}

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

function fetchProducts() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", "http://localhost:3000/product/get", true)

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)

          if (response.status === "success" && response.data && response.data.products) {
            allProducts = response.data.products.filter(
              (product) => !product.banned && !(product.shop && product.shop.status === "Banned"),
            )
            
            const subcategoryToCategoryMap = new Map();
              categories.forEach(category => {
              if (category.subCategories && Array.isArray(category.subCategories)) {
                category.subCategories.forEach(subCat => {
                  subcategoryToCategoryMap.set(subCat._id, {
                    categoryId: category._id,
                    categoryName: category.categoryName
                  });
                });
              }
            });
            
            console.log("Subcategory to Category Map created with", subcategoryToCategoryMap.size, "mappings");
            
            for (let product of allProducts) {
              if (product.subCategory) {
                const subCategoryId = typeof product.subCategory === 'string' 
                  ? product.subCategory 
                  : product.subCategory._id;
                
                if (subCategoryId) {
                  const parentCategory = subcategoryToCategoryMap.get(subCategoryId);
                  if (parentCategory) {
                    if (typeof product.subCategory === 'string') {
                      product.subCategory = {
                        _id: subCategoryId,
                        category: parentCategory.categoryId
                      };
                    } else {
                      product.subCategory.category = parentCategory.categoryId;
                    }
                    
                    product.parentCategory = parentCategory.categoryId;
                    product.parentCategoryName = parentCategory.categoryName;
                  }
                }
              }
            }
            
            console.log("Products processed with category information:", allProducts.length);
            console.log("Sample product with category info:", allProducts[0]);

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

function updateCategoryUI() {
  const categoryContainer = document.querySelector(".shop-sidebar__box ul")

  if (!categoryContainer) {
    console.error("Category container not found")
    return
  }

  categoryContainer.innerHTML = ""
  const allCategoriesItem = document.createElement("li")
  allCategoriesItem.className = "mb-24"

  const allCategoriesLink = document.createElement("a")
  allCategoriesLink.href = "javascript:void(0)"
  allCategoriesLink.className = "text-gray-900 hover-text-main-600 category-link active" 
  allCategoriesLink.dataset.category = "all"
  allCategoriesLink.textContent = `All Categories (${allProducts.length})`

  allCategoriesItem.appendChild(allCategoriesLink)
  categoryContainer.appendChild(allCategoriesItem)
  const categoryCounts = new Map();
  
  categories.forEach(category => {
    categoryCounts.set(category._id, 0);
  });
  const countedProducts = new Set();
  
  allProducts.forEach(product => {
    if (product.parentCategory) {
      categoryCounts.set(product.parentCategory, (categoryCounts.get(product.parentCategory) || 0) + 1);
      countedProducts.add(product._id);
    }
  });
  
  allProducts.forEach(product => {
    if (countedProducts.has(product._id)) {
      return;
    }
    
    let categoryId = null;
    
    if (product.subCategory && product.subCategory.category) {
      if (typeof product.subCategory.category === 'string') {
        categoryId = product.subCategory.category;
      } else if (product.subCategory.category && product.subCategory.category._id) {
        categoryId = product.subCategory.category._id;
      }
    }
    
    if (!categoryId && product.category) {
      categoryId = typeof product.category === 'object' ? product.category._id : product.category;
    }
    
    // If we found a valid category, increment its count
    if (categoryId && categoryCounts.has(categoryId)) {
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
      countedProducts.add(product._id);
    }
  });
  
  console.log('Category counts:', Object.fromEntries(categoryCounts));

  categories.forEach((category) => {
    const categoryItem = document.createElement("li")
    categoryItem.className = "mb-24"

    const categoryLink = document.createElement("a")
    categoryLink.href = "javascript:void(0)"
    categoryLink.className = "text-gray-900 hover-text-main-600 category-link"
    categoryLink.dataset.id = category._id
    categoryLink.dataset.category = category.categoryName

    const count = categoryCounts.get(category._id) || 0;

    categoryLink.textContent = `${category.categoryName} (${count})`
    console.log(`Category ${category.categoryName} has ${count} products`);

    categoryItem.appendChild(categoryLink)
    categoryContainer.appendChild(categoryItem)
  })
}

function initModernPriceFilter() {
  const priceRangeElement = document.getElementById('price-range')
  
  if (window.noUiSlider && priceRangeElement) {
    priceRangeSlider = noUiSlider.create(priceRangeElement, {
      start: [minPrice, maxPrice],
      connect: true,
      step: 10,
      range: {
        'min': minPrice,
        'max': maxPrice
      },
      format: {
        to: function (value) {
          return Math.round(value)
        },
        from: function (value) {
          return Number(value)
        }
      },
      tooltips: [
        {
          to: function(value) {
            return value + ' DT';
          }
        },
        {
          to: function(value) {
            return value + ' DT';
          }
        }
      ]
    })
    minPriceInput = document.getElementById('min-price')
    maxPriceInput = document.getElementById('max-price')    
    
    let sliderBeingDragged = false
    
    priceRangeSlider.on('start', function() {
      sliderBeingDragged = true
    })
    
    priceRangeSlider.on('end', function() {
      sliderBeingDragged = false
    })
    
    priceRangeSlider.on('update', function (values, handle) {
      if (sliderBeingDragged) {
        if (handle === 0) {
          minPriceInput.value = values[0]
        } else {
          maxPriceInput.value = values[1]
        }
      }
    })
    
    minPriceInput.addEventListener('input', function () {
      const value = Number(this.value)
      if (!isNaN(value)) {
        priceRangeSlider.set([value, null])
      }
    })
    
    maxPriceInput.addEventListener('input', function () {
      const value = Number(this.value)
      if (!isNaN(value)) {
        priceRangeSlider.set([null, value])
      }
    })
      const priceFilterBtn = document.getElementById('price-filter-btn')
    if (priceFilterBtn) {
      priceFilterBtn.addEventListener('click', function() {
        applyAllFilters()
      })
    }
  }
}

function initRatingFilter() {
  const ratingItems = document.querySelectorAll('.rating-filter-item')
  
  ratingItems.forEach(item => {
    item.addEventListener('click', function() {
      const radio = this.querySelector('input[type="radio"]')
      if (radio) {
        radio.checked = true
        ratingItems.forEach(i => i.classList.remove('active'))
        this.classList.add('active')
        this.style.transform = 'scale(1.01)'
        setTimeout(() => {
          this.style.transform = 'scale(1)'
        }, 150)
        

        applyAllFilters()
      }
    })
    

    const radioInput = item.querySelector('input[type="radio"]')
    if (radioInput) {
      radioInput.addEventListener('change', function() {

        ratingItems.forEach(i => i.classList.remove('active'))
        
        this.closest('.rating-filter-item').classList.add('active')
            applyAllFilters()
      })
    }
  })
}


function updatePriceRange() {
  if (allProducts.length === 0) return

  minPrice = Math.min(...allProducts.map((product) => product.productPrice))
  maxPrice = Math.max(...allProducts.map((product) => product.productPrice))

  minPrice = Math.floor(minPrice)
  maxPrice = Math.ceil(maxPrice)

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

function applyAllFilters() {
  filteredProducts = [...allProducts]

  // Handle category filtering
  const activeCategoryLink = document.querySelector(".category-link.active")
  
  // Check if we have an active category and it's not "all"
  if (activeCategoryLink && activeCategoryLink.dataset.category !== "all") {
    const categoryId = activeCategoryLink.dataset.id
    const categoryName = activeCategoryLink.dataset.category
    
    console.log(`Filtering by category: ${categoryName} (ID: ${categoryId})`)
    filteredProducts = filteredProducts.filter((product) => {
      if (product.parentCategory && product.parentCategory === categoryId) {
        console.log(`Product ${product.productName} matches by parentCategory property (${product.parentCategoryName})`);
        return true;
      }
      
      if (product.category) {
        const directCategory = typeof product.category === "object" 
          ? product.category?._id 
          : product.category;
          
        if (directCategory === categoryId) {
          console.log(`Product ${product.productName} matches by direct category`);
          return true;
        }
      }
      
      if (product.subCategory) {
        if (typeof product.subCategory === 'string') {
          return false;
        }
        
        let subCategoryParent = product.subCategory.category;
        
        if (typeof subCategoryParent === "string" && subCategoryParent === categoryId) {
          console.log(`Product ${product.productName} matches by subcategory.category (string ID)`);
          return true;
        } 
        else if (subCategoryParent && subCategoryParent._id && subCategoryParent._id === categoryId) {
          console.log(`Product ${product.productName} matches by subcategory.category (object ID)`);
          return true;
        }
      }
      
      return false;
    })
    
    console.log(`Filtered ${filteredProducts.length} products for category: ${categoryName}`)
  } else {
    // This is for "All Categories" - no filtering by category needed
    console.log("No category filtering applied - showing all products")
  }
  
  // Price filter
  if (minPriceInput && maxPriceInput) {
    const minSelectedPrice = minPriceInput.value ? Number(minPriceInput.value) : minPrice
    const maxSelectedPrice = maxPriceInput.value ? Number(maxPriceInput.value) : maxPrice

    filteredProducts = filteredProducts.filter(
      (product) => product.productPrice >= minSelectedPrice && product.productPrice <= maxSelectedPrice,
    )
  }
  const selectedRating = document.querySelector('.rating-filter-item input[type="radio"]:checked')
  if (selectedRating && selectedRating.id !== "ratingAll") {
    const ratingValue = Number.parseInt(selectedRating.id.replace("rating", ""))
    filteredProducts = filteredProducts.filter((product) => {
      const avgRating = product.averageRating || 0
      return avgRating >= ratingValue
    })
  }
  const sortingSelect = document.getElementById("sorting")
  if (sortingSelect) {
    const sortValue = sortingSelect.value
    sortProducts(sortValue)
  }
  currentPage = 1
  displayProducts(currentPage)
  setupPagination()
  updateResultCount()
}


function sortProducts(sortValue) {
  switch (sortValue) {
    case "1": 
      filteredProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      break
    case "2": 
      filteredProducts.sort((a, b) => b._id.localeCompare(a._id))
      break
    case "3": 
      filteredProducts.sort((a, b) => a.productPrice - b.productPrice)
      break
    case "4": 
      filteredProducts.sort((a, b) => b.productPrice - a.productPrice)
      break
    default:
      filteredProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
  }
}

function displayProducts(page) {
  currentPage = page
  const startIndex = (page - 1) * productsPerPage
  const endIndex = Math.min(startIndex + productsPerPage, filteredProducts.length)
  const productsToDisplay = filteredProducts.slice(startIndex, endIndex)
  
  console.log(`Displaying products ${startIndex+1} to ${endIndex} of ${filteredProducts.length}`);

  const productsContainer = document.querySelector(".list-grid-wrapper")
  if (!productsContainer) {
    console.error("Products container not found")
    return
  }
  productsContainer.innerHTML = ""

  if (productsToDisplay.length === 0) {
    productsContainer.innerHTML = '<div class="col-12 text-center py-5"><p>No products found for the selected filters</p></div>'
    return
  }
  const activeCategoryLink = document.querySelector(".category-link.active");
  if (activeCategoryLink && activeCategoryLink.dataset.category !== "all") {
    console.log(`Displaying ${productsToDisplay.length} products for category: ${activeCategoryLink.dataset.category}`);
  }
  productsToDisplay.forEach((product) => {
    const productCard = createProductCard(product)
    productsContainer.appendChild(productCard)
  })
}




function generateStarRating(rating) {
  let stars = ""
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5
  for (let i = 0; i < fullStars; i++) {
    stars += '<span class="text-15 fw-medium text-warning-600 d-flex"><i class="ph-fill ph-star"></i></span>'
  }
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
        setupPagination() 
      }
    })
  }
  const pageLinks = paginationEl.querySelectorAll(".page-link[data-page]")
  pageLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const page = Number.parseInt(this.dataset.page)
      displayProducts(page)
      setupPagination() 
    })
  })
}

function generatePaginationItems(totalPages) {
  let items = ""

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || 
      i === totalPages || 
      (i >= currentPage - 1 && i <= currentPage + 1) 
    ) {
      items += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium ${i === currentPage ? "bg-main-600 text-white" : "text-neutral-600 border border-gray-100"}" 
                      href="javascript:void(0)" data-page="${i}">${i}</a>
                </li>
            `
    } else if (
      (i === 2 && currentPage > 3) 
      || (i === totalPages - 1 && currentPage < totalPages - 2) 
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

function updateResultCount() {
  const resultCountEl = document.querySelector(".flex-between.gap-16.flex-wrap.mb-40 span")

  if (resultCountEl) {
    const start = (currentPage - 1) * productsPerPage + 1
    const end = Math.min(start + productsPerPage - 1, filteredProducts.length)

    resultCountEl.textContent = `Showing ${start}-${end} of ${filteredProducts.length} result${filteredProducts.length !== 1 ? "s" : ""}`
  }
}

function setupEventListeners() { 
  document.querySelectorAll(".category-link").forEach((link) => {
    link.addEventListener("click", function () {
      document.querySelectorAll(".category-link").forEach((el) => {
        el.classList.remove("active")
        el.classList.remove("text-main-600")
        el.classList.add("text-gray-900")
      })
      this.classList.add("active", "text-main-600")
      this.classList.remove("text-gray-900")
      
      const categoryId = this.dataset.id;
      const categoryName = this.dataset.category;

      if (categoryName !== 'all') {
        console.log(`Selected category: ${categoryName} (ID: ${categoryId})`);
        const matchingProducts = allProducts.filter(product => {
          if (product.category && (product.category === categoryId || product.category?._id === categoryId)) {
            return true;
          }
          if (product.subCategory && product.subCategory.category) {
            const subCatParent = typeof product.subCategory.category === 'string' 
              ? product.subCategory.category
              : product.subCategory.category._id;
              
            return subCatParent === categoryId;
          }
          
          return false;
        });
        
        console.log(`Found ${matchingProducts.length} products in category ${categoryName}`);
        if (matchingProducts.length > 0) {
          console.log('Sample products:', matchingProducts.slice(0, 2).map(p => p.productName));
        }
      }
      if (this.dataset.category !== "all" && this.dataset.id) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('category', this.dataset.id);
        window.history.replaceState({}, '', newUrl);
        console.log("Updated URL with category parameter:", this.dataset.id);
      } else {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('category');
        window.history.replaceState({}, '', newUrl);
        console.log("Removed category parameter from URL");
      }
      applyAllFilters()
    })
  })

  const filterPriceBtn = document.querySelector(".custom--range .btn-main")
  if (filterPriceBtn) {
    filterPriceBtn.addEventListener("click", () => {
      applyAllFilters()
    })
  }
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
      const productsContainer = document.querySelector(".list-grid-wrapper");
      productsContainer.classList.add("list-view")
      listBtn.classList.add("bg-main-600", "text-white", "border-main-600")
      listBtn.classList.remove("border-gray-100")

      gridBtn.classList.remove("bg-main-600", "text-white", "border-main-600")
      gridBtn.classList.add("border-gray-100")
      
      // Adjust single product layout in list view
      if (productsContainer.childElementCount === 1) {
        const singleCard = productsContainer.querySelector('.product-card');
        if (singleCard) {
          // First clear any existing inline styles
          singleCard.style.cssText = '';
          
          // Use consistent styling for list view
          singleCard.style.maxWidth = "100%";
          singleCard.style.margin = "0";
          singleCard.style.width = "100%";
          singleCard.style.display = "flex";
          singleCard.style.flexDirection = "row";
          singleCard.style.alignItems = "center";
          singleCard.style.justifyContent = "flex-start";
          singleCard.style.padding = "20px";
          
          // Adjust the thumb and content for better layout in list view
          const thumb = singleCard.querySelector('.product-card__thumb');
          const content = singleCard.querySelector('.product-card__content');
          
          if (thumb) {
            thumb.style.cssText = '';
            thumb.style.maxWidth = "200px";
            thumb.style.width = "30%";
            thumb.style.marginRight = "20px";
            thumb.style.flexShrink = "0";
          }
          
          if (content) {
            content.style.cssText = '';
            content.style.marginTop = "0";
            content.style.width = "60%";
            content.style.flexGrow = "1";
            content.style.textAlign = "left";
          }
        }
      }
    })
      gridBtn.addEventListener("click", () => {
      const productsContainer = document.querySelector(".list-grid-wrapper");
      productsContainer.classList.remove("list-view")
      gridBtn.classList.add("bg-main-600", "text-white", "border-main-600")
      gridBtn.classList.remove("border-gray-100")

      listBtn.classList.remove("bg-main-600", "text-white", "border-main-600")
      listBtn.classList.add("border-gray-100")
      
      // Adjust single product layout in grid view
      if (productsContainer.childElementCount === 1) {
        const singleCard = productsContainer.querySelector('.product-card');
        if (singleCard) {
          // First clear all inline styles with a clean slate
          singleCard.style.cssText = '';
          
          // Use consistent styling for grid view with single product
          singleCard.style.maxWidth = "350px";
          singleCard.style.margin = "0 auto";
          
          // Reset the thumb and content styles
          const thumb = singleCard.querySelector('.product-card__thumb');
          const content = singleCard.querySelector('.product-card__content');
          
          if (thumb) {
            thumb.style.cssText = '';
          }
          
          if (content) {
            content.style.cssText = '';
          }
        }
      }
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
function showError(message) {
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
function showMessage(message, type = "info") {
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

function addToWishlist(productId) {
  const token = localStorage.getItem("token")
  const clientId = localStorage.getItem("userId")
  
  if (!token || !clientId) {
    showError("Please log in to add products to your wishlist")
    return
  }
  
  const xhr = new XMLHttpRequest()
  xhr.open("POST", "http://localhost:3000/favoris/add", true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  
  xhr.onload = () => {
    if (xhr.status === 200) {
      console.log("Product added to wishlist")
      // Update counter if mallifyCounters is available
      if (window.mallifyCounters && typeof window.mallifyCounters.incrementWishlistCount === 'function') {
        window.mallifyCounters.incrementWishlistCount()
      }
    } else if (xhr.status === 400) {
      // Product already in wishlist
      console.log("Product already in wishlist")
    } else {
      showError("Error adding product to wishlist")
    }
  }
  
  xhr.onerror = () => {
    showError("Network error occurred")
  }
  
  xhr.send(JSON.stringify({ clientId, productId }))
}

function removeFromWishlist(productId) {
  const token = localStorage.getItem("token")
  const clientId = localStorage.getItem("userId")
  
  if (!token || !clientId) {
    showError("Please log in to remove products from your wishlist")
    return
  }
  
  const xhr = new XMLHttpRequest()
  xhr.open("DELETE", "http://localhost:3000/favoris/remove", true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  
  xhr.onload = () => {
    if (xhr.status === 200) {
      console.log("Product removed from wishlist")
      // Update counter if mallifyCounters is available
      if (window.mallifyCounters && typeof window.mallifyCounters.decrementWishlistCount === 'function') {
        window.mallifyCounters.decrementWishlistCount()
      }
    } else {
      showError("Error removing product from wishlist")
    }
  }
  
  xhr.onerror = () => {
    showError("Network error occurred")
  }
  
  xhr.send(JSON.stringify({ clientId, productId }))
}

// Add this function to check if a product is in the user's wishlist
function isProductInWishlist(productId, callback) {
  const token = localStorage.getItem("token")
  const clientId = localStorage.getItem("userId")
  
  if (!token || !clientId) {
    callback(false)
    return
  }
  
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/favoris/${clientId}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  
  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        const favorites = response.favorites || []
        const isInWishlist = favorites.some(item => 
          item.productId === productId || 
          (item.productId && item.productId._id === productId)
        )
        callback(isInWishlist)
      } catch (error) {
        console.error("Error parsing wishlist data:", error)
        callback(false)
      }
    } else {
      console.error("Failed to fetch wishlist data:", xhr.status)
      callback(false)
    }
  }
  
  xhr.onerror = () => {
    console.error("Network error occurred")
    callback(false)
  }
  
  xhr.send()
}

//need more work on this function
function createProductCard(product) {    const productCard = document.createElement("div")  
  productCard.className = "product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2"

  let badgeHtml = ""
  if (product.stock <= 5 && product.stock > 0) {
    badgeHtml = `<span class="product-card__badge bg-warning-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">Limited</span>`
  } else if (product.stock === 0) {
    badgeHtml = `<span class="product-card__badge bg-danger-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">Out of Stock</span>`
  }
  const ratingHtml = generateStarRating(product.averageRating || 0)

  // Create the image URL
  const imageUrl = product.mainImage ? `../uploads/${product.mainImage}` : "../assets/images/products/default.png"

  productCard.innerHTML = `
  <div class="bg-white p-2 rounded-pill z-1 position-absolute inset-inline-end-0 inset-block-start-0 me-16 mt-16 shadow-sm">
                    <button type="button" class="wishlist-btn w-40 h-40 text-md d-flex justify-content-center align-items-center rounded-circle hover-bg-main-two-600 hover-text-white" data-product-id="${product._id}">
                        <i class="ph ph-heart fs-4"></i>
                    </button>
                </div>        <a href="product-details.html?id=${product._id}" class="product-card__thumb flex-center rounded-8 position-relative">
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
  
  // Add event listener to the Wishlist button
  const wishlistBtn = productCard.querySelector(".wishlist-btn")
  if (wishlistBtn) {
    // Check if user is logged in and product is in wishlist
    const token = localStorage.getItem("token")
    const userId = localStorage.getItem("userId")
    
    if (token && userId) {
      // Check if the product is already in the wishlist
      isProductInWishlist(product._id, (isInWishlist) => {
        if (isInWishlist) {
          const icon = wishlistBtn.querySelector("i")
          wishlistBtn.classList.add("active")
          icon.classList.remove("ph", "ph-heart")
          icon.classList.add("ph-fill", "ph-heart", "text-main-two-600")
        }
      })
    }
    
    wishlistBtn.addEventListener("click", () => {
      if (!token || !userId) {
        showError("Please log in to add products to your wishlist")
        return
      }
      
      // Toggle active class for visual feedback
      wishlistBtn.classList.toggle("active")
      const icon = wishlistBtn.querySelector("i")
      
      if (wishlistBtn.classList.contains("active")) {
        icon.classList.remove("ph", "ph-heart")
        icon.classList.add("ph-fill", "ph-heart", "text-main-two-600")
        
        // Call the API to add to wishlist
        addToWishlist(product._id)
      } else {
        icon.classList.remove("ph-fill", "ph-heart", "text-main-two-600")
        icon.classList.add("ph", "ph-heart")
        
        // Call the API to remove from wishlist
        removeFromWishlist(product._id)
      }
    })
  }

  return productCard
}
