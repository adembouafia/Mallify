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
            avatar:
              shop.vendor && shop.vendor.profilePicture
                ? `/uploads/${shop.vendor.profilePicture}`
                : "/uploads/admin.jpg",
          },
          shopId: `#SH${shop._id.slice(-4).toUpperCase()}`,
          status: shop.status,
          reason: shop.rejectionReason || shop.bannedReason || "",
        }

        // Categorize by status
        if (shop.status === "Pending") shops.pending.push(shopItem)
        else if (shop.status === "Approved" || shop.status === "Banned") shops.approved.push(shopItem)
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
  document.querySelector(".stat-card.primary .stat-card-number").textContent =
    shops.pending.length + shops.approved.length + shops.rejected.length

  document.querySelector(".stat-card.success .stat-card-number").textContent = shops.approved.length

  document.querySelector(".stat-card.warning .stat-card-number").textContent = shops.pending.length

  document.querySelector(".stat-card.danger .stat-card-number").textContent = shops.rejected.length

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

  // Déterminer la classe de badge en fonction du statut
  let badgeClass = "success"
  if (shop.status === "Rejected") badgeClass = "danger"
  else if (shop.status === "Pending") badgeClass = "warning"
  else if (shop.status === "Banned") badgeClass = "danger"

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
            <p><span class="badge bg-${badgeClass}">${shop.status}</span></p>
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
          
          ${
            shop.status === "Banned"
              ? `
            <h5>Ban Reason</h5>
            <p>${shop.bannedReason || "No reason provided"}</p>
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
        // Get the Bootstrap modal instance
        const bsModal = bootstrap.Modal.getInstance(modal)
        bsModal.hide()
        approveShop(shop._id)
      }
    } else if (shop.status === "Approved") {
      actionButton.textContent = "Ban Shop"
      actionButton.className = "btn btn-danger"
      actionButton.onclick = () => {
        const reason = prompt("Provide a reason for banning:")
        if (reason) {
          const modal = document.getElementById("shopDetailsModal")
          // Get the Bootstrap modal instance
          const bsModal = bootstrap.Modal.getInstance(modal)
          bsModal.hide()
          banShop(shop._id, reason)
        }
      }
    } else if (shop.status === "Banned") {
      actionButton.textContent = "Unban Shop"
      actionButton.className = "btn btn-success"
      actionButton.onclick = () => {
        const modal = document.getElementById("shopDetailsModal")
        // Get the Bootstrap modal instance
        const bsModal = bootstrap.Modal.getInstance(modal)
        bsModal.hide()
        unbanShop(shop._id)
      }
    } else {
      actionButton.textContent = "Approve Shop"
      actionButton.className = "btn btn-success"
      actionButton.onclick = () => {
        const modal = document.getElementById("shopDetailsModal")
        // Get the Bootstrap modal instance
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

    // Déterminer le statut à afficher et la classe CSS
    const statusClass = shop.status === "Banned" ? "bg-danger" : "bg-success"
    const statusText = shop.status === "Banned" ? "Banned" : "Active"

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
    <td><span class="badge ${statusClass}">${statusText}</span></td>
    <td>${shop.date}</td>
    <td>
      <div class="d-flex justify-content-end">
        <button class="btn btn-sm btn-icon btn-outline-secondary me-1 view-shop" data-shop-id="${shop.id}" data-bs-toggle="tooltip" title="View Details">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-icon btn-outline-primary me-1 edit-shop" data-shop-id="${shop.id}" data-bs-toggle="tooltip" title="${shop.status === "Banned" ? "Unban Shop" : "Edit"}">
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

  // Add authorization header if available
  const token = localStorage.getItem("token")
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const updatedShop = JSON.parse(xhr.responseText)

      updateLocalShopData(updatedShop)

      showToast("Shop approved successfully", "success")
    } else {
      let errorMessage = "Error approving shop"
      try {
        if (xhr.responseText) {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        }
      } catch (e) {
        console.error("Error parsing response:", e)
      }
      showToast(errorMessage, "danger")
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

  // Add authorization header if available
  const token = localStorage.getItem("token")
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const updatedShop = JSON.parse(xhr.responseText)

      updateLocalShopData(updatedShop)

      showToast("Shop rejected successfully", "success")
    } else {
      let errorMessage = "Error rejecting shop"
      try {
        if (xhr.responseText) {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        }
      } catch (e) {
        console.error("Error parsing response:", e)
      }
      showToast(errorMessage, "danger")
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

// Mettre à jour les données localement sans refetch complet
function updateLocalShopData(updatedShop) {
  const shopItem = {
    id: updatedShop._id,
    name: updatedShop.shopName,
    image:
      updatedShop.shopLogo && updatedShop.shopLogo.trim() !== ""
        ? `/uploads/${updatedShop.shopLogo}`
        : "/assets/images/products/aboutUs.jpg",
    location: updatedShop.adresse || "No address provided",
    description: updatedShop.shopdescription || "No description provided",
    date: new Date(updatedShop.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    owner: {
      name: updatedShop.vendor ? updatedShop.vendor.vendorName || "Unknown" : "Unknown",
      email: updatedShop.vendor ? updatedShop.vendor.email || "No email" : "No email",
      phone: updatedShop.vendor ? updatedShop.vendor.phone || "No phone" : "No phone",
      avatar:
        updatedShop.vendor && updatedShop.vendor.profilePicture
          ? `/uploads/${updatedShop.vendor.profilePicture}`
          : "/uploads/admin.jpg",
    },
    shopId: `#SH${updatedShop._id.slice(-4).toUpperCase()}`,
    status: updatedShop.status,
    reason: updatedShop.rejectionReason || updatedShop.bannedReason || "",
  }

  const allCategories = ["pending", "approved", "rejected"]
  allCategories.forEach((category) => {
    const index = shops[category].findIndex((shop) => shop.id === updatedShop._id)
    if (index !== -1) {
      shops[category].splice(index, 1)
    }
  })

  if (updatedShop.status === "Pending") {
    shops.pending.push(shopItem)
  } else if (updatedShop.status === "Approved" || updatedShop.status === "Banned") {
    shops.approved.push(shopItem)
  } else if (updatedShop.status === "Rejected") {
    shops.rejected.push(shopItem)
  }

  updateDashboard()
  updateStatistics()
}

// Delete shop
function deleteShop(shopId) {
  if (!confirm("Are you sure you want to delete this shop?")) return

  const xhr = new XMLHttpRequest()
  xhr.open("DELETE", `http://localhost:3000/shop/delete/${shopId}`, true)

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      // Supprimer le shop des données locales
      removeShopFromLocalData(shopId)

      showToast("Shop deleted successfully", "success")
    } else {
      showToast("Error deleting shop", "danger")
    }
  }

  xhr.onerror = () => {
    showToast("Network error occurred", "danger")
  }

  xhr.send()
}

// Supprimer un shop des données locales
function removeShopFromLocalData(shopId) {
  const allCategories = ["pending", "approved", "rejected"]
  allCategories.forEach((category) => {
    const index = shops[category].findIndex((shop) => shop.id === shopId)
    if (index !== -1) {
      shops[category].splice(index, 1)
    }
  })

  updateDashboard()
  updateStatistics()
}

// Add event listeners to shop cards
function addShopCardEventListeners() {
  document.querySelectorAll(".approve-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      const shopId = this.dataset.shopId
      approveShop(shopId)
    })
  })

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

  document.querySelectorAll(".view-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      const shopId = this.dataset.shopId
      getShopDetails(shopId)
    })
  })

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
  document.querySelectorAll("#approved .view-shop").forEach((button) => {
    button.addEventListener("click", function () {
      const shopId = this.dataset.shopId
      getShopDetails(shopId)
    })
  })

  document.querySelectorAll("#approved .edit-shop").forEach((button) => {
    button.addEventListener("click", function () {
      const shopId = this.dataset.shopId

      // Trouver la boutique dans les données
      const shop = shops.approved.find((s) => s.id === shopId)

      if (shop && shop.status === "Banned") {
        // Si la boutique est bannie, ouvrir un modal pour débannir
        Swal.fire({
          title: "Unban Shop",
          text: `Are you sure you want to unban ${shop.name}?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, unban it!",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            unbanShop(shopId)
          }
        })
      } else {
        // Sinon, afficher les détails de la boutique pour édition
        getShopDetails(shopId)
      }
    })
  })

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
  let toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3"
    document.body.appendChild(toastContainer)
  }

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
  fetchShops()

  const shopTabs = document.querySelectorAll('button[data-bs-toggle="tab"]')
  shopTabs.forEach((tab) => {
    tab.addEventListener("shown.bs.tab", () => {})
  })

  const searchInput = document.querySelector(".dashboard-search input")
  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        const searchTerm = this.value.toLowerCase().trim()
        if (searchTerm) {
          filterShops(searchTerm)
        } else {
          updateDashboard()
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
          updateDashboard()
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

  const originalShops = { ...shops }

  shops.pending = filteredPending
  shops.approved = filteredApproved
  shops.rejected = filteredRejected

  updateDashboard()
  shops = originalShops
}

// Ajouter les fonctions pour bannir et débannir une boutique
function banShop(shopId, reason) {
  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/shop/ban/${shopId}`, true)
  xhr.setRequestHeader("Content-Type", "application/json")

  // Add authorization header if available
  const token = localStorage.getItem("token")
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const updatedShop = JSON.parse(xhr.responseText)

      // Mettre à jour les données locales
      updateLocalShopData(updatedShop)

      showToast("Shop banned successfully", "success")
    } else {
      let errorMessage = "Error banning shop"
      try {
        if (xhr.responseText) {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        }
      } catch (e) {
        console.error("Error parsing response:", e)
      }
      showToast(errorMessage, "danger")
    }
  }

  xhr.onerror = () => {
    showToast("Network error occurred", "danger")
  }

  xhr.send(JSON.stringify({ bannedReason: reason }))
}

function unbanShop(shopId) {
  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/shop/unban/${shopId}`, true)
  xhr.setRequestHeader("Content-Type", "application/json")

  // Add authorization header if available
  const token = localStorage.getItem("token")
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const updatedShop = JSON.parse(xhr.responseText)

      // Mettre à jour les données locales
      updateLocalShopData(updatedShop)

      showToast("Shop unbanned successfully", "success")
    } else {
      let errorMessage = "Error unbanning shop"
      try {
        if (xhr.responseText) {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        }
      } catch (e) {
        console.error("Error parsing response:", e)
      }
      showToast(errorMessage, "danger")
    }
  }

  xhr.onerror = () => {
    showToast("Network error occurred", "danger")
  }

  xhr.send()
}

const bootstrap = window.bootstrap
