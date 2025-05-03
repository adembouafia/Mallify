let shops = {
  pending: [],
  approved: [],
  rejected: [],
}

// Fetch all shops
function fetchShops() {
  const xhr = new XMLHttpRequest()
  xhr.open("GET", "http://localhost:3000/shop/get", true)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const allShops = JSON.parse(xhr.responseText)

      // Reset shops
      shops.pending = []
      shops.approved = []
      shops.rejected = []

      // Process each shop and categorize by status
      allShops.forEach((shop) => {
        // Map backend fields to frontend fields
        const shopItem = {
          id: shop._id,
          name: shop.shopName,
          image:
            shop.shopLogo && shop.shopLogo.trim() !== ""
              ? `/uploads/${shop.shopLogo}`
              : "/assets/images/products/aboutUs.jpg",
          location: shop.adresse || "No address provided",
          description: shop.shopdescription || "No description provided",
          date: new Date(shop.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          owner: {
            name: shop.vendor ? shop.vendor.vendorName || "Unknown" : "Unknown",
            email: shop.vendor ? shop.vendor.email || "No email" : "No email",
            phone: shop.vendor ? shop.vendor.phone || "No phone" : "No phone",
            avatar: shop.vendor && shop.vendor.profilePicture
              ? `/uploads/${shop.vendor.profilePicture}`
              : '/uploads/admin.jpg'
          },          
          shopId: `#SH${shop._id.slice(-4).toUpperCase()}`,
          status: shop.status,
          reason: shop.rejectionReason || "",
        }

        console.log("Shop ID:", shop._id)
        console.log("Shop Name:", shop.shopName)
        console.log("Vendor data:", shop.vendor)
        if (shop.vendor) {
          console.log("Vendor type:", typeof shop.vendor)
          if (typeof shop.vendor === "object") {
            console.log("Vendor keys:", Object.keys(shop.vendor))
            console.log("Vendor name property:", shop.vendor.vendorName)
            console.log("Vendor name property:", shop.vendor.name)
          }
        }

        // Categorize by status
        if (shop.status === "Pending") shops.pending.push(shopItem)
        else if (shop.status === "Approved") shops.approved.push(shopItem)
        else if (shop.status === "Rejected") shops.rejected.push(shopItem)
      })

      // Update the dashboard UI
      updateDashboard()
      updateStatistics()
    } else {
      showToast("Error fetching shops data", "danger")
    }
  }

  xhr.onerror = () => {
    showToast("Network error occurred", "danger")
  }

  xhr.send()
}

// Update dashboard statistics
function updateStatistics() {
  // Update count displays
  document.querySelector(".stat-card.primary .stat-card-number").textContent =
    shops.pending.length + shops.approved.length + shops.rejected.length

  document.querySelector(".stat-card.success .stat-card-number").textContent = shops.approved.length

  document.querySelector(".stat-card.warning .stat-card-number").textContent = shops.pending.length

  document.querySelector(".stat-card.danger .stat-card-number").textContent = shops.rejected.length

  // Update tab badges
  document.querySelector("#pending-tab .badge").textContent = shops.pending.length
  document.querySelector("#approved-tab .badge").textContent = shops.approved.length
  document.querySelector("#rejected-tab .badge").textContent = shops.rejected.length
}

// Fetch single shop by ID
function getShopDetails(shopId) {
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/shop/get/${shopId}`, true)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const shop = JSON.parse(xhr.responseText)
      displayShopDetails(shop)
    } else {
      showToast("Error fetching shop details", "danger")
    }
  }

  xhr.onerror = () => {
    showToast("Network error occurred", "danger")
  }

  xhr.send()
}

// Display shop details in modal
function displayShopDetails(shop) {
  const modalContent = document.getElementById("shopDetailsContent")
  if (!modalContent) return

  const shopImage = shop.shopLogo ? `/uploads/${shop.shopLogo}` : "/assets/images/products/aboutUs.jpg"

  modalContent.innerHTML = `
    <div class="shop-details">
      <div class="shop-details-header">
        <div class="shop-details-image">
          <img src="${shopImage}" alt="${shop.shopName}" onerror="this.src='/assets/images/products/aboutUs.jpg'">
        </div>
        <div class="shop-details-info">
          <h4>${shop.shopName}</h4>
          <p><i class="bi bi-geo-alt"></i> ${shop.adresse || "No address provided"}</p>
          <p><i class="bi bi-calendar3"></i> Created: ${new Date(shop.createdAt).toLocaleDateString()}</p>
          <p><span class="badge bg-${shop.status === "Approved" ? "success" : shop.status === "Pending" ? "warning" : "danger"}">${shop.status}</span></p>
        </div>
      </div>
      <div class="shop-details-body">
        <h5>Description</h5>
        <p>${shop.shopdescription || "No description provided"}</p>

        <h5>Owner Information</h5>
        <div class="shop-owner-info">
          <img src="/assets/images/dashboard/admin.jpg" alt="Owner" class="shop-owner-avatar">
          <div>
            <p><strong>Name:</strong> ${shop.vendor?.vendorName || "Unknown"}</p>
            <p><strong>Email:</strong> ${shop.vendor?.email || "No email provided"}</p>
            <p><strong>Phone:</strong> ${shop.vendor?.phone || "No phone provided"}</p>
          </div>
        </div>

        ${
          shop.status === "Rejected"
            ? `
          <h5>Rejection Reason</h5>
          <p>${shop.rejectionReason || "No reason provided"}</p>
        `
            : ""
        }
      </div>
    </div>
  `

  const actionButton = document.getElementById("shopActionButton")
  if (actionButton) {
    if (shop.status === "Pending") {
      actionButton.textContent = "Approve Shop"
      actionButton.className = "btn btn-success"
      actionButton.onclick = () => {
        const modal = document.getElementById("shopDetailsModal")
        const bsModal = bootstrap.Modal.getInstance(modal)
        bsModal.hide()
        approveShop(shop._id)
      }
    } else if (shop.status === "Approved") {
      actionButton.textContent = "Reject Shop"
      actionButton.className = "btn btn-warning"
      actionButton.onclick = () => {
        const reason = prompt("Provide a reason for rejection:")
        if (reason) {
          const modal = document.getElementById("shopDetailsModal")
          const bsModal = bootstrap.Modal.getInstance(modal)
          bsModal.hide()
          rejectShop(shop._id, reason)
        }
      }
    } else {
      actionButton.textContent = "Approve Shop"
      actionButton.className = "btn btn-success"
      actionButton.onclick = () => {
        const modal = document.getElementById("shopDetailsModal")
        const bsModal = bootstrap.Modal.getInstance(modal)
        bsModal.hide()
        approveShop(shop._id)
      }
    }
  }

  // Show the modal
  const shopModal = document.getElementById("shopDetailsModal")
  if (shopModal) {
    const myModal = new bootstrap.Modal(shopModal)
    myModal.show()
  } else {
    console.error("Shop details modal not found")
  }
}

// Render pending shops
function renderPendingShops() {
  const container = document.querySelector("#pending .shop-grid .row")
  if (!container) return

  container.innerHTML = shops.pending.length
    ? ""
    : '<div class="col-12"><div class="alert alert-info">No pending shops found.</div></div>'

  shops.pending.forEach((shop) => {
    const shopCard = document.createElement("div")
    shopCard.className = "col-xl-3 col-lg-4 col-md-6"
    shopCard.dataset.shopId = shop.id
    shopCard.innerHTML = `
      <div class="shop-card">
        <div class="shop-card-header">
          <div class="shop-card-actions">
            <div class="dropdown">
              <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item approve-shop" href="#" data-shop-id="${shop.id}"><i class="bi bi-check-lg me-2"></i>Approve</a></li>
                <li><a class="dropdown-item reject-shop" href="#" data-shop-id="${shop.id}"><i class="bi bi-x-lg me-2"></i>Reject</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger delete-shop" href="#" data-shop-id="${shop.id}"><i class="bi bi-trash me-2"></i>Delete</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="shop-card-image">
          <img src="${shop.image}" alt="${shop.name}" onerror="this.src='/assets/images/products/aboutUs.jpg'">
        </div>
        <div class="shop-card-body">
          <h5 class="shop-card-title">${shop.name}</h5>
          <div class="shop-card-info">
            <div class="shop-card-location">
              <i class="bi bi-geo-alt"></i> ${shop.location}
            </div>
            <div class="shop-card-date">
              <i class="bi bi-calendar3"></i> ${shop.date}
            </div>
          </div>
          <div class="shop-card-owner">
            <img src="${shop.owner.avatar}" alt="${shop.owner.name}" class="shop-card-owner-avatar" onerror="this.src='/assets/images/dashboard/admin.jpg'">
            <span class="shop-card-owner-name">${shop.owner.name}</span>
          </div>
        </div>
        <div class="shop-card-footer">
          <button class="btn btn-success btn-sm approve-shop" data-shop-id="${shop.id}"><i class="bi bi-check-lg me-1"></i>Approve</button>
          <button class="btn btn-outline-danger btn-sm reject-shop" data-shop-id="${shop.id}"><i class="bi bi-x-lg me-1"></i>Reject</button>
          <button class="btn btn-outline-primary btn-sm ms-auto view-shop" data-shop-id="${shop.id}"><i class="bi bi-eye me-1"></i>Details</button>
        </div>
      </div>
    `
    container.appendChild(shopCard)
  })

  // Add event listeners to the newly created buttons
  addShopCardEventListeners()
}

// Render approved shops
function renderApprovedShops() {
  const container = document.querySelector("#approved tbody")
  if (!container) return

  container.innerHTML = shops.approved.length
    ? ""
    : '<tr><td colspan="7" class="text-center">No approved shops found.</td></tr>'

  shops.approved.forEach((shop) => {
    const row = document.createElement("tr")
    row.dataset.shopId = shop.id
    row.innerHTML = `
      <td>
        <div class="form-check">
          <input class="form-check-input" type="checkbox">
          <label class="form-check-label"></label>
        </div>
      </td>
      <td>
        <div class="d-flex align-items-center">
          <div class="shop-table-image me-3">
            <img src="${shop.image}" alt="${shop.name}" onerror="this.src='/assets/images/products/aboutUs.jpg'">
          </div>
          <div>
            <h6 class="mb-0">${shop.name}</h6>
            <small class="text-muted">${shop.shopId}</small>
          </div>
        </div>
      </td>
      <td>
        <div class="d-flex align-items-center">
          <img src="${shop.owner.avatar}" alt="${shop.owner.name}" class="shop-owner-avatar me-2" onerror="this.src='/assets/images/dashboard/admin.jpg'">
          <span>${shop.owner.name}</span>
        </div>
      </td>
      <td>${shop.location}</td>
      <td><span class="badge bg-success">Active</span></td>
      <td>${shop.date}</td>
      <td>
        <div class="d-flex justify-content-end">
          <button class="btn btn-sm btn-icon btn-outline-secondary me-1 view-shop" data-shop-id="${shop.id}" data-bs-toggle="tooltip" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-icon btn-outline-primary me-1 edit-shop" data-shop-id="${shop.id}" data-bs-toggle="tooltip" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-icon btn-outline-danger delete-shop" data-shop-id="${shop.id}" data-bs-toggle="tooltip" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `
    container.appendChild(row)
  })

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))

  // Add event listeners
  addShopTableEventListeners()
}

// Render rejected shops
function renderRejectedShops() {
  const container = document.querySelector("#rejected tbody")
  if (!container) return

  container.innerHTML = shops.rejected.length
    ? ""
    : '<tr><td colspan="4" class="text-center">No rejected shops found.</td></tr>'

  shops.rejected.forEach((shop) => {
    const row = document.createElement("tr")
    row.dataset.shopId = shop.id
    row.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <div class="shop-table-image me-3">
            <img src="${shop.image}" alt="${shop.name}" onerror="this.src='/assets/images/products/aboutUs.jpg'">
          </div>
          <div>
            <h6 class="mb-0">${shop.name}</h6>
            <small class="text-muted">${shop.shopId}</small>
          </div>
        </div>
      </td>
      <td>
        <div class="d-flex align-items-center">
          <img src="${shop.owner.avatar}" alt="${shop.owner.name}" class="shop-owner-avatar me-2" onerror="this.src='/assets/images/dashboard/admin.jpg'">
          <span>${shop.owner.name}</span>
        </div>
      </td>
      <td>${shop.reason || "No reason provided"}</td>
      <td>${shop.date}</td>
    `
    container.appendChild(row)
  })
}

// Update shop status (approve)
function approveShop(shopId) {
  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/shop/update/${shopId}`, true)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      showToast("Shop approved successfully", "success")
      fetchShops() // Refresh data
    } else {
      showToast("Error approving shop", "danger")
    }
  }

  xhr.onerror = () => {
    showToast("Network error occurred", "danger")
  }

  xhr.send(JSON.stringify({ status: "Approved" }))
}

// Update shop status (reject)
function rejectShop(shopId, reason) {
  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/shop/update/${shopId}`, true)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      showToast("Shop rejected successfully", "success")
      fetchShops()
    } else {
      showToast("Error rejecting shop", "danger")
    }
  }

  xhr.onerror = () => {
    showToast("Network error occurred", "danger")
  }

  xhr.send(
    JSON.stringify({
      status: "Rejected",
      rejectionReason: reason,
    }),
  )
}

// Delete shop
function deleteShop(shopId) {
  if (!confirm("Are you sure you want to delete this shop?")) return

  const xhr = new XMLHttpRequest()
  xhr.open("DELETE", `http://localhost:3000/shop/delete/${shopId}`, true)

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      showToast("Shop deleted successfully", "success")
      fetchShops() // Refresh data
    } else {
      showToast("Error deleting shop", "danger")
    }
  }

  xhr.onerror = () => {
    showToast("Network error occurred", "danger")
  }

  xhr.send()
}

// Add event listeners to shop cards
function addShopCardEventListeners() {
  // Approve buttons
  document.querySelectorAll(".approve-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      const shopId = this.dataset.shopId
      approveShop(shopId)
    })
  })

  // Reject buttons
  document.querySelectorAll(".reject-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      const shopId = this.dataset.shopId
      const reason = prompt("Provide a reason for rejection:")
      if (reason) {
        rejectShop(shopId, reason)
      }
    })
  })

  // View buttons
  document.querySelectorAll(".view-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      const shopId = this.dataset.shopId
      getShopDetails(shopId)
    })
  })

  // Delete buttons
  document.querySelectorAll(".delete-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      const shopId = this.dataset.shopId
      deleteShop(shopId)
    })
  })
}

// Add event listeners to shop table rows
function addShopTableEventListeners() {
  // View buttons
  document.querySelectorAll("#approved .view-shop").forEach((button) => {
    button.addEventListener("click", function () {
      const shopId = this.dataset.shopId
      getShopDetails(shopId)
    })
  })

  // Edit buttons
  document.querySelectorAll("#approved .edit-shop").forEach((button) => {
    button.addEventListener("click", function () {
      const shopId = this.dataset.shopId
      // Implement edit functionality if needed
      console.log("Edit shop:", shopId)
    })
  })

  // Delete buttons
  document.querySelectorAll("#approved .delete-shop").forEach((button) => {
    button.addEventListener("click", function () {
      const shopId = this.dataset.shopId
      deleteShop(shopId)
    })
  })
}

// Update dashboard with fetched data
function updateDashboard() {
  renderPendingShops()
  renderApprovedShops()
  renderRejectedShops()
}

// Show toast notification
function showToast(message, type = "info") {
  // Check if toast container exists, if not create it
  let toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3"
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toastId = "toast-" + Date.now()
  const toast = document.createElement("div")
  toast.className = `toast align-items-center text-white bg-${type} border-0`
  toast.id = toastId
  toast.setAttribute("role", "alert")
  toast.setAttribute("aria-live", "assertive")
  toast.setAttribute("aria-atomic", "true")

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `

  toastContainer.appendChild(toast)

  // Initialize and show toast
  const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 })
  bsToast.show()

  // Remove toast after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove()
  })
}

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Fetch shops data when page loads
  fetchShops()

  // Add event listener for tab changes to refresh data
  const shopTabs = document.querySelectorAll('button[data-bs-toggle="tab"]')
  shopTabs.forEach((tab) => {
    tab.addEventListener("shown.bs.tab", () => {
      // You could refresh data for the specific tab if needed
    })
  })

  // Add event listener for search
  const searchInput = document.querySelector(".dashboard-search input")
  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        const searchTerm = this.value.toLowerCase().trim()
        if (searchTerm) {
          filterShops(searchTerm)
        } else {
          updateDashboard() // Reset to show all shops
        }
      }
    })

    const searchButton = document.querySelector(".dashboard-search button")
    if (searchButton) {
      searchButton.addEventListener("click", () => {
        const searchTerm = searchInput.value.toLowerCase().trim()
        if (searchTerm) {
          filterShops(searchTerm)
        } else {
          updateDashboard() // Reset to show all shops
        }
      })
    }
  }
})

// Filter shops by search term
function filterShops(searchTerm) {
  const filteredPending = shops.pending.filter(
    (shop) =>
      shop.name.toLowerCase().includes(searchTerm) ||
      shop.owner.name.toLowerCase().includes(searchTerm) ||
      shop.location.toLowerCase().includes(searchTerm),
  )

  const filteredApproved = shops.approved.filter(
    (shop) =>
      shop.name.toLowerCase().includes(searchTerm) ||
      shop.owner.name.toLowerCase().includes(searchTerm) ||
      shop.location.toLowerCase().includes(searchTerm),
  )

  const filteredRejected = shops.rejected.filter(
    (shop) =>
      shop.name.toLowerCase().includes(searchTerm) ||
      shop.owner.name.toLowerCase().includes(searchTerm) ||
      shop.location.toLowerCase().includes(searchTerm),
  )

  // Store original shops
  const originalShops = { ...shops }

  // Replace with filtered shops
  shops.pending = filteredPending
  shops.approved = filteredApproved
  shops.rejected = filteredRejected

  // Update UI
  updateDashboard()

  // Restore original shops
  shops = originalShops
}



//progress bar

function showProgressBar() {
  // Check if progress bar container exists, if not create it
  let progressContainer = document.querySelector(".progress-container")
  if (!progressContainer) {
    progressContainer = document.createElement("div")
    progressContainer.className = "progress-container position-fixed top-0 start-0 end-0"
    progressContainer.style.zIndex = "1050"
    
    const progressBar = document.createElement("div")
    progressBar.className = "progress"
    progressBar.style.height = "4px"
    progressBar.style.borderRadius = "0"
    
    const progressIndicator = document.createElement("div")
    progressIndicator.className = "progress-bar bg-primary"
    progressIndicator.id = "main-progress-bar"
    progressIndicator.setAttribute("role", "progressbar")
    progressIndicator.setAttribute("aria-valuenow", "0")
    progressIndicator.setAttribute("aria-valuemin", "0")
    progressIndicator.setAttribute("aria-valuemax", "100")
    
    progressBar.appendChild(progressIndicator)
    progressContainer.appendChild(progressBar)
    document.body.appendChild(progressContainer)
  }
  
  // Reset progress bar
  const progressBar = document.getElementById("main-progress-bar")
  if (progressBar) {
    progressBar.style.width = "0%"
    progressBar.style.transition = "width 0.2s ease"
    
    // Start progress animation
    setTimeout(() => {
      progressBar.style.width = "30%"
    }, 100)
    
    setTimeout(() => {
      progressBar.style.width = "70%"
    }, 300)
  }
}

function hideProgressBar(success = true) {
  const progressBar = document.getElementById("main-progress-bar")
  if (progressBar) {
    // Complete the progress bar
    progressBar.style.width = "100%"
    
    // Change color based on success/failure
    if (success) {
      progressBar.className = "progress-bar bg-success"
    } else {
      progressBar.className = "progress-bar bg-danger"
    }
    
    // Hide after completion
    setTimeout(() => {
      const container = document.querySelector(".progress-container")
      if (container) {
        container.style.opacity = "0"
        container.style.transition = "opacity 0.3s ease"
        
        setTimeout(() => {
          if (container.parentNode) {
            container.parentNode.removeChild(container)
          }
        }, 300)
      }
    }, 500)
  }
}