// Global variables
let bannedProducts = []
let totalProducts = 0
let currentPage = 1
let itemsPerPage = 5
let filteredProducts = []
let searchTerm = ""

// DOM elements
const tableBody = document.querySelector("table tbody")
const emptyState = document.querySelector(".empty-state")
const entriesInfo = document.querySelector(".text-muted.small")
const searchInput = document.querySelector(".input-group input")
const searchButton = document.querySelector(".input-group button")
const pagination = document.querySelector(".pagination")

// Import Bootstrap
const bootstrap = window.bootstrap;

// Check if user has admin privileges
function checkAdminPrivileges() {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      return false
    }
    const tokenParts = token.split(".")
    if (tokenParts.length !== 3) {
      return false
    }

    const payload = JSON.parse(atob(tokenParts[1]))

    return payload.role === "admin" || payload.role === "superAdmin"
  } catch (error) {
    console.error("Error checking admin privileges:", error)
    return false
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!checkAdminPrivileges()) {
    tableBody.innerHTML = ""
    tableBody.parentElement.style.display = "none"
    emptyState.style.display = "block"
    emptyState.innerHTML = `
      <i class="bi bi-lock"></i>
      <h5>Access Denied</h5>
      <p>You don't have permission to view banned products. This feature requires admin privileges.</p>
    `
    return
  }

  fetchBannedProducts()
  setupModalListeners()
  setupSearchAndPagination()
})

function setupSearchAndPagination() {
  // Setup search functionality
  if (searchInput && searchButton) {
    // Search on button click
    searchButton.addEventListener("click", () => {
      searchTerm = searchInput.value.trim().toLowerCase()
      currentPage = 1
      applyFiltersAndRender()
    })
    
    // Search on Enter key
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchTerm = searchInput.value.trim().toLowerCase()
        currentPage = 1
        applyFiltersAndRender()
      }
    })
  }

  // Setup pagination
  if (pagination) {
    pagination.addEventListener("click", (e) => {
      e.preventDefault()
      
      if (e.target.tagName === "A" || e.target.parentElement.tagName === "A") {
        const pageItem = e.target.closest(".page-item")
        
        if (pageItem && !pageItem.classList.contains("active") && !pageItem.classList.contains("disabled")) {
          const pageLink = pageItem.querySelector(".page-link")
          const pageText = pageLink.textContent.trim()
          
          if (pageText === "«") {
            // Previous page
            if (currentPage > 1) {
              currentPage--
              applyFiltersAndRender()
            }
          } else if (pageText === "»") {
            // Next page
            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
            if (currentPage < totalPages) {
              currentPage++
              applyFiltersAndRender()
            }
          } else {
            // Specific page number
            const newPage = parseInt(pageText)
            if (!isNaN(newPage) && newPage !== currentPage) {
              currentPage = newPage
              applyFiltersAndRender()
            }
          }
        }
      }
    })
  }
}

function fetchBannedProducts() {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      showError("Authentication required. Please log in.")
      return
    }

    const url = `/product/banned`

    const xhr = new XMLHttpRequest()

    xhr.open("GET", url, true)

    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("Content-Type", "application/json")

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText)

        if (data.status === "success") {
          bannedProducts = data.data.products
          totalProducts = data.results || bannedProducts.length
          
          // Initialize filtered products
          filteredProducts = [...bannedProducts]
          
          applyFiltersAndRender()
        } else {
          showError("Failed to fetch banned products")
        }
      } else if (xhr.status === 403) {
        showError("You don't have permission to access banned products. This feature requires admin privileges.")

        tableBody.innerHTML = ""
        tableBody.parentElement.style.display = "none"
        emptyState.style.display = "block"
        emptyState.innerHTML = `
          <i class="bi bi-lock"></i>
          <h5>Access Denied</h5>
          <p>You don't have permission to view banned products. This feature requires admin privileges.</p>
        `
      } else {
        showError(`HTTP error! Status: ${xhr.status}`)
      }
    }

    xhr.onerror = () => {
      console.error("Network error occurred")
      showError("A network error occurred while fetching banned products")
    }

    xhr.send()
  } catch (error) {
    console.error("Error fetching banned products:", error)
    showError("An error occurred while fetching banned products")
  }
}

function applyFiltersAndRender() {
  // Apply search filter
  if (searchTerm) {
    filteredProducts = bannedProducts.filter(product => {
      return (
        (product.productName && product.productName.toLowerCase().includes(searchTerm)) ||
        (product.shop?.shopName && product.shop.shopName.toLowerCase().includes(searchTerm)) ||
        (product.subCategory?.category?.categoryName && product.subCategory.category.categoryName.toLowerCase().includes(searchTerm)) ||
        (product.bannedReason && product.bannedReason.toLowerCase().includes(searchTerm))
      )
    })
  } else {
    filteredProducts = [...bannedProducts]
  }
  
  // Render the table with current filters and pagination
  renderProductsTable()
  updatePagination()
}

function renderProductsTable() {
  tableBody.innerHTML = ""

  if (filteredProducts.length === 0) {
    tableBody.parentElement.style.display = "none"
    emptyState.style.display = "block"
    
    // Update empty state message for search results
    if (searchTerm) {
      emptyState.innerHTML = `
        <i class="bi bi-search"></i>
        <h5>No results found</h5>
        <p>No banned products match your search criteria "${searchTerm}".</p>
      `
    } else {
      emptyState.innerHTML = `
        <i class="bi bi-inbox"></i>
        <h5>No banned products found</h5>
        <p>There are currently no banned products in the system.</p>
      `
    }
    
    // Update entries info
    if (entriesInfo) {
      entriesInfo.textContent = `Showing 0 to 0 of 0 entries`
    }
    
    return
  }

  tableBody.parentElement.style.display = "table"
  emptyState.style.display = "none"

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length)
  const displayedProducts = filteredProducts.slice(startIndex, endIndex)

  // Update entries info
  if (entriesInfo) {
    entriesInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${filteredProducts.length} entries`
  }

  // Render the products for current page
  displayedProducts.forEach((product) => {
    const row = document.createElement("tr")

    const banDate = new Date(product.updatedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    const categoryName = product.subCategory?.category?.categoryName;

    const bannedReason = product.bannedReason || "Counterfeit"

    row.innerHTML = `
      <td>
        <img src="../../uploads/${product.mainImage}" alt="${product.productName}" class="img-size-50 rounded">
      </td>
      <td>${product.productName}</td>
      <td>
        <span class="badge bg-primary">${product.shop?.shopName || "Unknown"}</span>
      </td>
      <td>${categoryName}</td>
      <td>
        <span class="badge bg-danger">${bannedReason}</span>
      </td>
      <td>${banDate}</td>
      <td>
        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-outline-secondary view-details" data-product-id="${product._id}" data-bs-toggle="tooltip" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-success unban-product" data-product-id="${product._id}" data-bs-toggle="tooltip" title="Unban Product">
            <i class="bi bi-check-circle"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger delete-product" data-product-id="${product._id}" data-bs-toggle="tooltip" title="Delete Permanently">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `

    tableBody.appendChild(row)
  })

  addActionButtonListeners()
}

function updatePagination() {
  if (!pagination) return
  
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  
  // Clear existing pagination
  pagination.innerHTML = ""
  
  // Previous button
  const prevLi = document.createElement("li")
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`
  prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`
  pagination.appendChild(prevLi)
  
  // Page numbers
  const maxPagesToShow = 3
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  
  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement("li")
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`
    pagination.appendChild(pageLi)
  }
  
  // Next button
  const nextLi = document.createElement("li")
  nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`
  nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`
  pagination.appendChild(nextLi)
}

function addActionButtonListeners() {
  document.querySelectorAll(".view-details").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id")
      viewProductDetails(productId)
    })
  })

  document.querySelectorAll(".unban-product").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id")
      unbanProduct(productId)
    })
  })

  document.querySelectorAll(".delete-product").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id")
      deleteProduct(productId)
    })
  })
}

function viewProductDetails(productId) {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      showError("Authentication required. Please log in.")
      return
    }

    const xhr = new XMLHttpRequest()

    xhr.open("GET", `/product/get/${productId}`, true)

    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("Content-Type", "application/json")

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Parse the JSON response
        const data = JSON.parse(xhr.responseText)

        if (data.status === "success") {
          const product = data.data.product

          document.getElementById("productDetailsModalLabel").textContent = `Product Details: ${product.productName}`

          const productImage = document.querySelector("#productDetailsModal .img-fluid")
          productImage.src = `../../uploads/${product.mainImage}`
          productImage.alt = product.productName

          document.querySelector("#productDetailsModal h4").textContent = product.productName;

          const tableRows = document.querySelectorAll("#productDetailsModal table tr")
          tableRows[0].querySelector("td:last-child").textContent = product.productId
          tableRows[1].querySelector("td:last-child").textContent = product.shop?.shopName || "Unknown"
          tableRows[2].querySelector("td:last-child").textContent =
            product.subCategory?.category?.categoryName || "Unknown"
          tableRows[3].querySelector("td:last-child").textContent = `${product.productPrice.toFixed(2)} TND`

          const banDate = new Date(product.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
          tableRows[4].querySelector("td:last-child").textContent = banDate


          const unbanButton = document.querySelector("#productDetailsModal .btn-success")
          unbanButton.setAttribute("data-product-id", product._id)
          unbanButton.removeEventListener("click", unbanProductFromModal) 
          unbanButton.addEventListener("click", unbanProductFromModal)

          const modal = new bootstrap.Modal(document.getElementById("productDetailsModal"))
          modal.show()
        } else {
          showError("Failed to fetch product details")
        }
      } else {
        showError(`HTTP error! Status: ${xhr.status}`)
      }
    }

    xhr.onerror = () => {
      console.error("Network error occurred")
      showError("A network error occurred while fetching product details")
    }

    // Send the request
    xhr.send()
  } catch (error) {
    console.error("Error fetching product details:", error)
    showError("An error occurred while fetching product details")
  }
}

// Function to unban product from modal
function unbanProductFromModal() {
  const productId = document.querySelector("#productDetailsModal .btn-success").getAttribute("data-product-id")

  // Close the modal
  const modalElement = document.getElementById("productDetailsModal")
  const modal = bootstrap.Modal.getInstance(modalElement)

  if (modal) {
    modal.hide()
  }

  // Unban the product
  unbanProduct(productId)
}

// Unban a product using XMLHttpRequest
function unbanProduct(productId) {
  try {
    // Get the JWT token from localStorage
    const token = localStorage.getItem("token")

    if (!token) {
      showError("Authentication required. Please log in.")
      return
    }

    // Confirm the unban action
    if (!confirm("Are you sure you want to unban this product? This will make it visible to customers again.")) {
      return
    }

    // Create a new XMLHttpRequest
    const xhr = new XMLHttpRequest()

    // Configure it: PUT-request for the URL
    xhr.open("PUT", `/product/unban/${productId}`, true)

    // Set request headers
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("Content-Type", "application/json")

    // Set up what happens on successful data submission
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Parse the JSON response
        const data = JSON.parse(xhr.responseText)

        if (data.status === "success") {
          // Show success message
          showSuccess("Product unbanned successfully")

          // Refresh the banned products list
          fetchBannedProducts()
        } else {
          showError("Failed to unban product")
        }
      } else {
        showError(`HTTP error! Status: ${xhr.status}`)
      }
    }

    // Set up what happens in case of error
    xhr.onerror = () => {
      console.error("Network error occurred")
      showError("A network error occurred while unbanning the product")
    }

    // Send the request
    xhr.send()
  } catch (error) {
    console.error("Error unbanning product:", error)
    showError("An error occurred while unbanning the product")
  }
}

// Delete a product permanently using XMLHttpRequest
function deleteProduct(productId) {
  try {
    // Get the JWT token from localStorage
    const token = localStorage.getItem("token")

    if (!token) {
      showError("Authentication required. Please log in.")
      return
    }

    // Confirm the delete action
    if (!confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) {
      return
    }

    // Create a new XMLHttpRequest
    const xhr = new XMLHttpRequest()

    // Configure it: DELETE-request for the URL
    xhr.open("DELETE", `/product/delete/${productId}`, true)

    // Set request headers
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("Content-Type", "application/json")

    // Set up what happens on successful data submission
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Parse the JSON response
        const data = JSON.parse(xhr.responseText)

        if (data.status === "success") {
          // Show success message
          showSuccess("Product deleted successfully")

          // Refresh the banned products list
          fetchBannedProducts()
        } else {
          showError("Failed to delete product")
        }
      } else {
        showError(`HTTP error! Status: ${xhr.status}`)
      }
    }

    // Set up what happens in case of error
    xhr.onerror = () => {
      console.error("Network error occurred")
      showError("A network error occurred while deleting the product")
    }

    // Send the request
    xhr.send()
  } catch (error) {
    console.error("Error deleting product:", error)
    showError("An error occurred while deleting the product")
  }
}

// Setup modal event listeners
function setupModalListeners() {
  // Product details modal
  const productDetailsModal = document.getElementById("productDetailsModal")
  if (productDetailsModal) {
    productDetailsModal.addEventListener("hidden.bs.modal", () => {
      // Clean up event listeners when the modal is closed
      const unbanButton = document.querySelector("#productDetailsModal .btn-success")
      if (unbanButton) {
        unbanButton.removeEventListener("click", unbanProductFromModal)
      }
    })
  }

  // Bulk unban modal
  const bulkUnbanModal = document.getElementById("bulkUnbanModal")
  if (bulkUnbanModal) {
    const confirmButton = bulkUnbanModal.querySelector(".btn-success")
    confirmButton.addEventListener("click", () => {
      // Close the modal
      const modal = bootstrap.Modal.getInstance(bulkUnbanModal)
      modal.hide()

      // Show success message
      showSuccess("Selected products have been unbanned successfully")

      // Refresh the banned products list
      fetchBannedProducts()
    })
  }
}

// Show success message
function showSuccess(message) {
  // You can implement a toast or alert system here
  alert(message)
}

// Show error message
function showError(message) {
  // You can implement a toast or alert system here
  alert("Error: " + message)
}