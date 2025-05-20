// Use a renamed toast function that checks for the superadmin toast
function shopToast(message, type = "info") {
  // Check if superadmin's toast function exists and use it
  if (window.showSuperAdminToast) {
    window.showSuperAdminToast("Shop Management", message, type);
    return;
  }

  // Otherwise use our own implementation
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className =
      "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }

  const toastId = "toast-" + Date.now();
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.id = toastId;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
    <div class="d-flex">
        <div class="toast-body">
            ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    `;

  toastContainer.appendChild(toast);

  // Initialize and show toast - use window.bootstrap directly
  const bsToast = new window.bootstrap.Toast(toast, {
    autohide: true,
    delay: 3000,
  });
  bsToast.show();

  // Remove toast after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

// Store shops data in a local variable
let shops = {
  pending: [],
  approved: [],
  rejected: [],
  all: [], // Added to store all shops for easier filtering
};

// Current filter and sort settings
let currentFilter = {
  searchTerm: "",
  sortBy: "date-desc", // Default sort: newest first
};

// Pagination settings
let pagination = {
  pending: { currentPage: 1, itemsPerPage: 8 },
  approved: { currentPage: 1, itemsPerPage: 10 },
  rejected: { currentPage: 1, itemsPerPage: 10 },
};

// Fetch all shops
function fetchShops() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/shop/get", true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const allShops = JSON.parse(xhr.responseText);

      // Reset shops
      shops.pending = [];
      shops.approved = [];
      shops.rejected = [];
      shops.all = []; // Reset all shops array

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
          createdAt: new Date(shop.createdAt), // Store actual date object for sorting
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
        };

        // Add to all shops array
        shops.all.push(shopItem);

        // Categorize by status
        if (shop.status === "Pending") {
          shops.pending.push(shopItem);
        } else if (shop.status === "Approved" || shop.status === "Banned") {
          shops.approved.push(shopItem);
        } else if (shop.status === "Rejected") {
          shops.rejected.push(shopItem);
        }
      });

      // Apply default sorting
      applySort(currentFilter.sortBy);

      // Update the dashboard UI
      updateDashboard();
      updateStatistics();
      updatePagination();
    } else {
      shopToast("Error fetching shops data", "danger");
    }
  };

  xhr.onerror = () => {
    shopToast("Network error occurred", "danger");
  };

  xhr.send();
}

// Update dashboard statistics
function updateStatistics() {
  const totalShopsElement = document.querySelector(
    ".stat-card.primary .stat-card-number"
  );
  if (totalShopsElement) {
    totalShopsElement.textContent = shops.all.length;
  }

  const approvedShopsElement = document.querySelector(
    ".stat-card.success .stat-card-number"
  );
  if (approvedShopsElement) {
    approvedShopsElement.textContent = shops.approved.length;
  }

  const pendingShopsElement = document.querySelector(
    ".stat-card.warning .stat-card-number"
  );
  if (pendingShopsElement) {
    pendingShopsElement.textContent = shops.pending.length;
  }

  const rejectedShopsElement = document.querySelector(
    ".stat-card.danger .stat-card-number"
  );
  if (rejectedShopsElement) {
    rejectedShopsElement.textContent = shops.rejected.length;
  }

  const pendingTabBadge = document.querySelector("#pending-tab .badge");
  if (pendingTabBadge) {
    pendingTabBadge.textContent = shops.pending.length;
  }

  const approvedTabBadge = document.querySelector("#approved-tab .badge");
  if (approvedTabBadge) {
    approvedTabBadge.textContent = shops.approved.length;
  }

  const rejectedTabBadge = document.querySelector("#rejected-tab .badge");
  if (rejectedTabBadge) {
    rejectedTabBadge.textContent = shops.rejected.length;
  }
}

// Fetch single shop by ID
function getShopDetails(shopId) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/shop/${shopId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText);
      // Vérifier si la réponse contient un objet shop (la structure de la réponse)
      const shop = response.shop || response;
      displayShopDetails(shop);
    } else {
      shopToast("Error fetching shop details", "danger");
    }
  };

  xhr.onerror = () => {
    shopToast("Network error occurred", "danger");
  };

  xhr.send();
}

// Display shop details in modal
function displayShopDetails(shop) {
  // Create modal if it doesn't exist
  let shopDetailsModal = document.getElementById("shopDetailsModal");
  if (!shopDetailsModal) {
    shopDetailsModal = createShopDetailsModal();
  }

  const modalContent = document.getElementById("shopDetailsContent");
  if (!modalContent) return;

  const shopImage = shop.shopLogo
    ? `/uploads/${shop.shopLogo}`
    : "/assets/images/products/aboutUs.jpg";

  // Déterminer la classe de badge en fonction du statut
  let badgeClass = "success";
  if (shop.status === "Rejected") badgeClass = "danger";
  else if (shop.status === "Pending") badgeClass = "warning";
  else if (shop.status === "Banned") badgeClass = "danger";

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
    `;

  const actionButton = document.getElementById("shopActionButton");
  if (actionButton) {
    if (shop.status === "Pending") {
      actionButton.textContent = "Approve Shop";
      actionButton.className = "btn btn-success";
      actionButton.onclick = () => {
        const modal = document.getElementById("shopDetailsModal");
        // Get the Bootstrap modal instance
        const bsModal = window.bootstrap.Modal.getInstance(modal);
        bsModal.hide();
        approveShop(shop._id);
      };
    } else if (shop.status === "Approved") {
      actionButton.textContent = "Ban Shop";
      actionButton.className = "btn btn-danger";
      actionButton.onclick = () => {
        const reason = prompt("Provide a reason for banning:");
        if (reason) {
          const modal = document.getElementById("shopDetailsModal");
          // Get the Bootstrap modal instance
          const bsModal = window.bootstrap.Modal.getInstance(modal);
          bsModal.hide();
          banShop(shop._id, reason);
        }
      };
    } else if (shop.status === "Banned") {
      actionButton.textContent = "Unban Shop";
      actionButton.className = "btn btn-success";
      actionButton.onclick = () => {
        const modal = document.getElementById("shopDetailsModal");
        // Get the Bootstrap modal instance
        const bsModal = window.bootstrap.Modal.getInstance(modal);
        bsModal.hide();
        unbanShop(shop._id);
      };
    } else {
      actionButton.textContent = "Approve Shop";
      actionButton.className = "btn btn-success";
      actionButton.onclick = () => {
        const modal = document.getElementById("shopDetailsModal");
        // Get the Bootstrap modal instance
        const bsModal = window.bootstrap.Modal.getInstance(modal);
        bsModal.hide();
        approveShop(shop._id);
      };
    }
  }

  // Show the modal
  const shopModal = document.getElementById("shopDetailsModal");
  if (shopModal) {
    const myModal = new window.bootstrap.Modal(shopModal);
    myModal.show();
  } else {
    console.error("Shop details modal not found");
  }
}

// Create shop details modal if it doesn't exist
function createShopDetailsModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "shopDetailsModal";
  modal.tabIndex = "-1";
  modal.setAttribute("aria-labelledby", "shopDetailsModalLabel");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="shopDetailsModalLabel">Shop Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="shopDetailsContent"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-success" id="shopActionButton">Approve Shop</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  return modal;
}

// Render pending shops
function renderPendingShops() {
  const container = document.querySelector("#pending .shop-grid .row");
  if (!container) return;

  // Get paginated data
  const { currentPage, itemsPerPage } = pagination.pending;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShops = shops.pending.slice(startIndex, endIndex);

  container.innerHTML = paginatedShops.length
    ? ""
    : '<div class="col-12"><div class="alert alert-info">No pending shops found.</div></div>';

  paginatedShops.forEach((shop) => {
    const shopCard = document.createElement("div");
    shopCard.className = "col-xl-3 col-lg-4 col-md-6";
    shopCard.dataset.shopId = shop.id;
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
                    <img src="${shop.owner.avatar}" alt="${shop.owner.name}" class="shop-card-owner-avatar">
                    <span class="shop-card-owner-name">${shop.owner.name}</span>
                </div>
            </div>
            <div class="shop-card-footer">
                <button class="btn btn-success btn-sm approve-shop" data-shop-id="${shop.id}"><i class="bi bi-check-lg me-1"></i>Approve</button>
                <button class="btn btn-outline-danger btn-sm reject-shop" data-shop-id="${shop.id}"><i class="bi bi-x-lg me-1"></i>Reject</button>
                <button class="btn btn-outline-primary btn-sm ms-auto view-shop" data-shop-id="${shop.id}"><i class="bi bi-eye me-1"></i>Details</button>
            </div>
        </div>
    `;
    container.appendChild(shopCard);
  });

  addShopCardEventListeners();
}

// Render approved shops
function renderApprovedShops() {
  const container = document.querySelector("#approved tbody");
  if (!container) return;

  // Get paginated data
  const { currentPage, itemsPerPage } = pagination.approved;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShops = shops.approved.slice(startIndex, endIndex);

  container.innerHTML = paginatedShops.length
    ? ""
    : '<tr><td colspan="7" class="text-center">No approved shops found.</td></tr>';

  paginatedShops.forEach((shop) => {
    const row = document.createElement("tr");
    row.dataset.shopId = shop.id;

    // Déterminer le statut à afficher et la classe CSS
    const statusClass = shop.status === "Banned" ? "bg-danger" : "bg-success";
    const statusText = shop.status === "Banned" ? "Banned" : "Active";

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
                ${
                  shop.status !== "Banned"
                    ? `
                <button class="btn btn-sm btn-icon btn-outline-warning me-1 reject-approved-shop" data-shop-id="${shop.id}" data-bs-toggle="tooltip" title="Reject Shop">
                    <i class="bi bi-x-circle"></i>
                </button>
                `
                    : ""
                }
                <button class="btn btn-sm btn-icon btn-outline-danger delete-shop" data-shop-id="${shop.id}" data-bs-toggle="tooltip" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;
    container.appendChild(row);
  });

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(
    (tooltipTriggerEl) => new window.bootstrap.Tooltip(tooltipTriggerEl)
  );

  // Add event listeners
  addShopTableEventListeners();
}

// Render rejected shops
function renderRejectedShops() {
  const container = document.querySelector("#rejected tbody");
  if (!container) return;

  // Get paginated data
  const { currentPage, itemsPerPage } = pagination.rejected;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShops = shops.rejected.slice(startIndex, endIndex);

  container.innerHTML = paginatedShops.length
    ? ""
    : '<tr><td colspan="4" class="text-center">No rejected shops found.</td></tr>';

  paginatedShops.forEach((shop) => {
    const row = document.createElement("tr");
    row.dataset.shopId = shop.id;
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
                <span>${shop.owner.name}</span>
            </div>
        </td>
        <td>${shop.reason || "No reason provided"}</td>
        <td>${shop.date}</td>
    `;
    container.appendChild(row);
  });
}

// Update shop status (approve)
function approveShop(shopId) {
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/shop/status/${shopId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // Add authorization header if available
  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const updatedShop = JSON.parse(xhr.responseText);

      updateLocalShopData(updatedShop);

      shopToast("Shop approved successfully", "success");
    } else {
      let errorMessage = "Error approving shop";
      try {
        if (xhr.responseText) {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing response:", e);
      }
      shopToast(errorMessage, "danger");
    }
  };

  xhr.onerror = () => {
    shopToast("Network error occurred", "danger");
  };

  xhr.send(JSON.stringify({ status: "Approved" }));
}

// Update shop status (reject)
function rejectShop(shopId, reason) {
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/shop/status/${shopId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // Add authorization header if available
  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const updatedShop = JSON.parse(xhr.responseText);

      updateLocalShopData(updatedShop);

      shopToast("Shop rejected successfully", "success");
    } else {
      let errorMessage = "Error rejecting shop";
      try {
        if (xhr.responseText) {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing response:", e);
      }
      shopToast(errorMessage, "danger");
    }
  };

  xhr.onerror = () => {
    shopToast("Network error occurred", "danger");
  };

  xhr.send(
    JSON.stringify({
      status: "Rejected",
      rejectionReason: reason,
    })
  );
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
    createdAt: new Date(updatedShop.createdAt), // Store actual date object for sorting
    owner: {
      name: updatedShop.vendor
        ? updatedShop.vendor.vendorName || "Unknown"
        : "Unknown",
      email: updatedShop.vendor
        ? updatedShop.vendor.email || "No email"
        : "No email",
      phone: updatedShop.vendor
        ? updatedShop.vendor.phone || "No phone"
        : "No phone",
      avatar:
        updatedShop.vendor && updatedShop.vendor.profilePicture
          ? `/uploads/${updatedShop.vendor.profilePicture}`
          : "/uploads/admin.jpg",
    },
    shopId: `#SH${updatedShop._id.slice(-4).toUpperCase()}`,
    status: updatedShop.status,
    reason: updatedShop.rejectionReason || updatedShop.bannedReason || "",
  };

  // Update in all shops array
  const allIndex = shops.all.findIndex((shop) => shop.id === updatedShop._id);
  if (allIndex !== -1) {
    shops.all[allIndex] = shopItem;
  } else {
    shops.all.push(shopItem);
  }

  // Remove from all category arrays
  const allCategories = ["pending", "approved", "rejected"];
  allCategories.forEach((category) => {
    const index = shops[category].findIndex(
      (shop) => shop.id === updatedShop._id
    );
    if (index !== -1) {
      shops[category].splice(index, 1);
    }
  });

  // Add to appropriate category array
  if (updatedShop.status === "Pending") {
    shops.pending.push(shopItem);
  } else if (
    updatedShop.status === "Approved" ||
    updatedShop.status === "Banned"
  ) {
    shops.approved.push(shopItem);
  } else if (updatedShop.status === "Rejected") {
    shops.rejected.push(shopItem);
  }

  // Apply current sort
  applySort(currentFilter.sortBy);

  // Update the dashboard UI
  updateDashboard();
  updateStatistics();
  updatePagination();
}

// Delete shop
function deleteShop(shopId) {
  if (!confirm("Are you sure you want to delete this shop?")) return;

  const xhr = new XMLHttpRequest();
  xhr.open("DELETE", `http://localhost:3000/shop/delete/${shopId}`, true);

  // Add the Authorization header with the token
  const token = localStorage.getItem("token");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      // Supprimer le shop des données locales
      removeShopFromLocalData(shopId);

      shopToast("Shop deleted successfully", "success");
    } else {
      shopToast(
        `Error deleting shop: ${xhr.status} ${xhr.statusText}`,
        "danger"
      );
      console.error("Delete shop error:", xhr.responseText);
    }
  };

  xhr.onerror = () => {
    shopToast("Network error occurred", "danger");
    console.error("Network error in deleteShop");
  };

  xhr.send();
}

// Supprimer un shop des données locales
function removeShopFromLocalData(shopId) {
  // Remove from all shops array
  const allIndex = shops.all.findIndex((shop) => shop.id === shopId);
  if (allIndex !== -1) {
    shops.all.splice(allIndex, 1);
  }

  // Remove from category arrays
  const allCategories = ["pending", "approved", "rejected"];
  allCategories.forEach((category) => {
    const index = shops[category].findIndex((shop) => shop.id === shopId);
    if (index !== -1) {
      shops[category].splice(index, 1);
    }
  });

  // Update the dashboard UI
  updateDashboard();
  updateStatistics();
  updatePagination();
}

// Add event listeners to shop cards
function addShopCardEventListeners() {
  document.querySelectorAll(".approve-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const shopId = this.dataset.shopId;
      approveShop(shopId);
    });
  });

  document.querySelectorAll(".reject-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const shopId = this.dataset.shopId;
      const reason = prompt("Provide a reason for rejection:");
      if (reason) {
        rejectShop(shopId, reason);
      }
    });
  });

  document.querySelectorAll(".view-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const shopId = this.dataset.shopId;
      getShopDetails(shopId);
    });
  });

  document.querySelectorAll(".delete-shop").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const shopId = this.dataset.shopId;
      deleteShop(shopId);
    });
  });
}

// Add event listeners to shop table
function addShopTableEventListeners() {
  document.querySelectorAll("#approved .view-shop").forEach((button) => {
    button.addEventListener("click", function () {
      const shopId = this.dataset.shopId;
      getShopDetails(shopId);
    });
  });

  document.querySelectorAll("#approved .edit-shop").forEach((button) => {
    button.addEventListener("click", function () {
      const shopId = this.dataset.shopId;

      // Trouver la boutique dans les données
      const shop = shops.approved.find((s) => s.id === shopId);

      if (shop && shop.status === "Banned") {
        // Si la boutique est bannie, ouvrir un modal pour débannir
        const confirmModal =
          document.getElementById("confirmUnbanModal") ||
          createConfirmUnbanModal();

        // Mettre à jour le contenu du modal
        const shopNameElement = confirmModal.querySelector(".shop-name");
        if (shopNameElement) {
          shopNameElement.textContent = shop.name;
        }

        // Configurer le bouton de confirmation
        const confirmButton = confirmModal.querySelector(".confirm-unban");
        if (confirmButton) {
          confirmButton.onclick = () => {
            // Fermer le modal
            const bsModal = window.bootstrap.Modal.getInstance(confirmModal);
            bsModal.hide();
            // Débannir la boutique
            unbanShop(shopId);
          };
        }

        // Afficher le modal
        const bsModal = new window.bootstrap.Modal(confirmModal);
        bsModal.show();
      } else {
        // Sinon, afficher les détails de la boutique pour édition
        getShopDetails(shopId);
      }
    });
  });

  document.querySelectorAll("#approved .delete-shop").forEach((button) => {
    button.addEventListener("click", function () {
      const shopId = this.dataset.shopId;
      deleteShop(shopId);
    });
  });

  document
    .querySelectorAll("#approved .reject-approved-shop")
    .forEach((button) => {
      button.addEventListener("click", function () {
        const shopId = this.dataset.shopId;

        // Trouver la boutique dans les données
        const shop = shops.approved.find((s) => s.id === shopId);

        if (shop) {
          // Ouvrir un modal pour demander la raison du rejet
          const confirmModal =
            document.getElementById("confirmRejectModal") ||
            createConfirmRejectModal();

          // Mettre à jour le contenu du modal
          const shopNameElement = confirmModal.querySelector(".shop-name");
          if (shopNameElement) {
            shopNameElement.textContent = shop.name;
          }

          // Configurer le bouton de confirmation
          const confirmButton = confirmModal.querySelector(".confirm-reject");
          const reasonInput = confirmModal.querySelector("#rejectReason");

          if (confirmButton) {
            confirmButton.onclick = () => {
              const reason = reasonInput.value.trim();
              if (!reason) {
                // Afficher un message d'erreur si aucune raison n'est fournie
                const errorMessage =
                  confirmModal.querySelector(".error-message");
                if (errorMessage) {
                  errorMessage.style.display = "block";
                }
                return;
              }

              // Cacher le message d'erreur s'il était affiché
              const errorMessage = confirmModal.querySelector(".error-message");
              if (errorMessage) {
                errorMessage.style.display = "none";
              }

              // Fermer le modal
              const bsModal = window.bootstrap.Modal.getInstance(confirmModal);
              bsModal.hide();

              // Rejeter la boutique
              rejectShop(shopId, reason);
            };
          }

          // Réinitialiser le champ de saisie
          if (reasonInput) {
            reasonInput.value = "";
          }

          // Afficher le modal
          const bsModal = new window.bootstrap.Modal(confirmModal);
          bsModal.show();
        }
      });
    });
}

// Create unban confirmation modal
function createConfirmUnbanModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "confirmUnbanModal";
  modal.tabIndex = "-1";
  modal.setAttribute("aria-labelledby", "confirmUnbanModalLabel");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="confirmUnbanModalLabel">Confirm Unban</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    Are you sure you want to unban <strong class="shop-name"></strong>?
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-success confirm-unban">Yes, unban it!</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  return modal;
}

// Create reject confirmation modal
function createConfirmRejectModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "confirmRejectModal";
  modal.tabIndex = "-1";
  modal.setAttribute("aria-labelledby", "confirmRejectModalLabel");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="confirmRejectModalLabel">Reject Shop</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to reject <strong class="shop-name"></strong>?</p>
                    <div class="mb-3">
                        <label for="rejectReason" class="form-label">Rejection Reason (required)</label>
                        <textarea class="form-control" id="rejectReason" rows="3" placeholder="Please provide a reason for rejection"></textarea>
                        <div class="error-message text-danger mt-2" style="display: none;">Please provide a reason for rejection.</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-warning confirm-reject">Reject Shop</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  return modal;
}

// Update dashboard with fetched data
function updateDashboard() {
  renderPendingShops();
  renderApprovedShops();
  renderRejectedShops();
}

// Update pagination controls
function updatePagination() {
  // Update pending shops pagination
  updateTabPagination("pending", shops.pending.length, pagination.pending);

  // Update approved shops pagination
  updateTabPagination("approved", shops.approved.length, pagination.approved);

  // Update rejected shops pagination
  updateTabPagination("rejected", shops.rejected.length, pagination.rejected);
}

// Update pagination for a specific tab
function updateTabPagination(tabId, totalItems, paginationSettings) {
  const paginationWrapper = document.querySelector(
    `#${tabId} .pagination-wrapper .pagination`
  );
  if (!paginationWrapper) return;

  const { currentPage, itemsPerPage } = paginationSettings;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Clear existing pagination
  paginationWrapper.innerHTML = "";

  // Don't show pagination if there's only one page or no items
  if (totalPages <= 1) {
    paginationWrapper.parentElement.style.display = "none";
    return;
  } else {
    paginationWrapper.parentElement.style.display = "block";
  }

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#" data-page="prev" aria-label="Previous"><i class="bi bi-chevron-left"></i></a>`;
  paginationWrapper.appendChild(prevLi);

  // Page numbers
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
    paginationWrapper.appendChild(pageLi);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  nextLi.innerHTML = `<a class="page-link" href="#" data-page="next" aria-label="Next"><i class="bi bi-chevron-right"></i></a>`;
  paginationWrapper.appendChild(nextLi);

  // Add event listeners to pagination links
  paginationWrapper.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.dataset.page;

      if (page === "prev" && currentPage > 1) {
        paginationSettings.currentPage--;
      } else if (page === "next" && currentPage < totalPages) {
        paginationSettings.currentPage++;
      } else if (page !== "prev" && page !== "next") {
        paginationSettings.currentPage = parseInt(page);
      }

      // Update UI
      updateDashboard();
      updatePagination();
    });
  });
}

// Apply search filter to shops
function applySearch(searchTerm) {
  if (!searchTerm) {
    // If search term is empty, reset to original data
    fetchShops();
    return;
  }

  searchTerm = searchTerm.toLowerCase();
  currentFilter.searchTerm = searchTerm;

  // Filter all shops first
  const filteredShops = shops.all.filter((shop) => {
    return (
      shop.name.toLowerCase().includes(searchTerm) ||
      shop.owner.name.toLowerCase().includes(searchTerm) ||
      shop.location.toLowerCase().includes(searchTerm) ||
      shop.shopId.toLowerCase().includes(searchTerm)
    );
  });

  // Reset category arrays
  shops.pending = [];
  shops.approved = [];
  shops.rejected = [];

  // Categorize filtered shops
  filteredShops.forEach((shop) => {
    if (shop.status === "Pending") {
      shops.pending.push(shop);
    } else if (shop.status === "Approved" || shop.status === "Banned") {
      shops.approved.push(shop);
    } else if (shop.status === "Rejected") {
      shops.rejected.push(shop);
    }
  });

  // Apply current sort
  applySort(currentFilter.sortBy);

  // Reset pagination to first page
  pagination.pending.currentPage = 1;
  pagination.approved.currentPage = 1;
  pagination.rejected.currentPage = 1;

  // Update UI
  updateDashboard();
  updateStatistics();
  updatePagination();
}

// Apply sort to shops
function applySort(sortBy) {
  currentFilter.sortBy = sortBy;

  const sortFunction = getSortFunction(sortBy);

  // Apply sort to all categories
  shops.pending.sort(sortFunction);
  shops.approved.sort(sortFunction);
  shops.rejected.sort(sortFunction);

  // Update UI
  updateDashboard();
}

// Get sort function based on sort type
function getSortFunction(sortBy) {
  switch (sortBy) {
    case "date-desc": // Newest first
      return (a, b) => b.createdAt - a.createdAt;
    case "date-asc": // Oldest first
      return (a, b) => a.createdAt - b.createdAt;
    case "name-asc": // Alphabetical (A-Z)
      return (a, b) => a.name.localeCompare(b.name);
    case "name-desc": // Alphabetical (Z-A)
      return (a, b) => b.name.localeCompare(a.name);
    default:
      return (a, b) => b.createdAt - a.createdAt; // Default to newest first
  }
}

// Ban shop
function banShop(shopId, reason) {
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/shop/ban/${shopId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // Add authorization header if available
  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const updatedShop = JSON.parse(xhr.responseText);

      // Mettre à jour les données locales
      updateLocalShopData(updatedShop);

      shopToast("Shop banned successfully", "success");
    } else {
      let errorMessage = "Error banning shop";
      try {
        if (xhr.responseText) {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing response:", e);
      }
      shopToast(errorMessage, "danger");
    }
  };

  xhr.onerror = () => {
    shopToast("Network error occurred", "danger");
  };

  xhr.send(JSON.stringify({ bannedReason: reason }));
}

// Unban shop
function unbanShop(shopId) {
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/shop/unban/${shopId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // Add authorization header if available
  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const updatedShop = JSON.parse(xhr.responseText);

      // Mettre à jour les données locales
      updateLocalShopData(updatedShop);

      shopToast("Shop unbanned successfully", "success");
    } else {
      let errorMessage = "Error unbanning shop";
      try {
        if (xhr.responseText) {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing response:", e);
      }
      shopToast(errorMessage, "danger");
    }
  };

  xhr.onerror = () => {
    shopToast("Network error occurred", "danger");
  };

  xhr.send();
}

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", () => {
  console.log("Shop JS loaded");

  // Check if we're on the shop management page
  if (
    document.querySelector("#pending") ||
    document.querySelector("#approved") ||
    document.querySelector("#rejected")
  ) {
    fetchShops();

    // Initialize tab switching
    const shopTabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
    shopTabs.forEach((tab) => {
      tab.addEventListener("shown.bs.tab", () => {
        // Update pagination when tab changes
        updatePagination();
      });
    });

    // Initialize search functionality
    const searchInput = document.querySelector(".dashboard-search input");
    const searchButton = document.querySelector(".dashboard-search button");

    if (searchInput && searchButton) {
      // Search on button click
      searchButton.addEventListener("click", () => {
        const searchTerm = searchInput.value.trim();
        applySearch(searchTerm);
      });

      // Search on Enter key
      searchInput.addEventListener("keyup", function (e) {
        if (e.key === "Enter") {
          const searchTerm = this.value.trim();
          applySearch(searchTerm);
        }
      });
    }

    // Initialize sort dropdown
    const sortDropdownItems = document.querySelectorAll(
      ".tab-actions .dropdown-item"
    );
    sortDropdownItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();

        // Update active state
        sortDropdownItems.forEach((i) => i.classList.remove("active"));
        this.classList.add("active");

        // Get sort type
        const sortText = this.textContent.trim();
        let sortBy;

        switch (sortText) {
          case "Newest First":
            sortBy = "date-desc";
            break;
          case "Oldest First":
            sortBy = "date-asc";
            break;
          case "Alphabetical (A-Z)":
            sortBy = "name-asc";
            break;
          default:
            sortBy = "date-desc"; // Default to newest first
            break;
        }

        // Apply sort
        applySort(sortBy);
        updatePagination();
      });
    });

    // Initialize "Select All" checkbox for approved shops
    const selectAllCheckbox = document.getElementById("selectAllApproved");
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", function () {
        const isChecked = this.checked;
        const checkboxes = document.querySelectorAll(
          "#approved tbody .form-check-input"
        );
        checkboxes.forEach((checkbox) => {
          checkbox.checked = isChecked;
        });
      });
    }
  }
});
