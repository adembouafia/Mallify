// Shop data structure
let shops = {
  pending: [
    {
      id: 'p1',
      name: 'TechHub Store',
      image: '../../assets/images/products/iphone.png',
      location: 'New York, USA',
      date: 'Apr 20, 2025',
      owner: {
        name: 'Alex Johnson',
        avatar: '../../assets/images/dashboard/devoloper1.jpg'
      }
    },
    {
      id: 'p2',
      name: 'Café Parisien',
      image: '../../assets/images/products/bureau.png',
      location: 'Paris, France',
      date: 'Apr 18, 2025',
      owner: {
        name: 'Marie Dubois',
        avatar: '../../assets/images/dashboard/devoloper2.jpg'
      }
    },
    {
      id: 'p3',
      name: 'Fashion Boutique',
      image: '../../assets/images/products/bureau.png',
      location: 'Milan, Italy',
      date: 'Apr 15, 2025',
      owner: {
        name: 'Sophia Romano',
        avatar: '../../assets/images/dashboard/superadmin.jpg'
      }
    },
    {
      id: 'p4',
      name: 'Organic Market',
      image: '../../assets/images/products/bureau.png',
      location: 'Berlin, Germany',
      date: 'Apr 12, 2025',
      owner: {
        name: 'Hans Mueller',
        avatar: '../../assets/images/dashboard/admin.jpg'
      }
    }
  ],
  approved: [
    {
      id: 'a1',
      name: 'Digital World',
      image: '../../assets/images/products/iphone.png',
      location: 'San Francisco, USA',
      date: 'Apr 5, 2025',
      status: 'Active',
      owner: {
        name: 'John Smith',
        avatar: '../../assets/images/dashboard/devoloper1.jpg'
      },
      shopId: '#SH001'
    },
    {
      id: 'a2',
      name: 'Fashion Hub',
      image: '../../assets/images/products/bureau.png',
      location: 'London, UK',
      date: 'Apr 3, 2025',
      status: 'Active',
      owner: {
        name: 'Emma Wilson',
        avatar: '../../assets/images/dashboard/devoloper2.jpg'
      },
      shopId: '#SH002'
    }
  ],
  rejected: [
    {
      id: 'r1',
      name: 'Budget Electronics',
      image: '../../assets/images/products/bureau.png',
      location: 'Shanghai, China',
      date: 'Apr 2, 2025',
      reason: 'Insufficient product quality documentation',
      owner: {
        name: 'Robert Chen',
        avatar: '../../assets/images/dashboard/admin.jpg'
      },
      shopId: '#SH007'
    },
    {
      id: 'r2',
      name: 'Discount Clothing',
      image: '../../assets/images/products/bureau.png',
      location: 'Toronto, Canada',
      date: 'Mar 28, 2025',
      reason: 'Failed compliance verification',
      owner: {
        name: 'Lisa Johnson',
        avatar: '../../assets/images/dashboard/superadmin.jpg'
      },
      shopId: '#SH008'
    }
  ]
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Update statistics
  updateStats();
  
  // Render all shops
  renderPendingShops();
  renderApprovedShops();
  renderRejectedShops();
  
  // Initialize event listeners
  initEventListeners();
  
  // Initialize tooltips
  initTooltips();
});

// Update dashboard statistics
function updateStats() {
  const totalShops = shops.pending.length + shops.approved.length + shops.rejected.length;
  const pendingCount = shops.pending.length;
  const approvedCount = shops.approved.length;
  const rejectedCount = shops.rejected.length;
  
  // Update stat cards
  document.querySelector('.stat-card.primary .stat-card-number').textContent = totalShops;
  document.querySelector('.stat-card.success .stat-card-number').textContent = approvedCount;
  document.querySelector('.stat-card.warning .stat-card-number').textContent = pendingCount;
  document.querySelector('.stat-card.danger .stat-card-number').textContent = rejectedCount;
  
  // Update progress bars
  const approvedPercentage = Math.round((approvedCount / totalShops) * 100) || 0;
  const pendingPercentage = Math.round((pendingCount / totalShops) * 100) || 0;
  const rejectedPercentage = Math.round((rejectedCount / totalShops) * 100) || 0;
  
  document.querySelector('.stat-card.success .progress-bar').style.width = `${approvedPercentage}%`;
  document.querySelector('.stat-card.success .progress-bar').setAttribute('aria-valuenow', approvedPercentage);
  document.querySelector('.stat-card.success .stat-card-progress').textContent = `${approvedPercentage}% of total shops`;
  
  document.querySelector('.stat-card.warning .progress-bar').style.width = `${pendingPercentage}%`;
  document.querySelector('.stat-card.warning .progress-bar').setAttribute('aria-valuenow', pendingPercentage);
  document.querySelector('.stat-card.warning .stat-card-progress').textContent = `${pendingPercentage}% of total shops`;
  
  document.querySelector('.stat-card.danger .progress-bar').style.width = `${rejectedPercentage}%`;
  document.querySelector('.stat-card.danger .progress-bar').setAttribute('aria-valuenow', rejectedPercentage);
  document.querySelector('.stat-card.danger .stat-card-progress').textContent = `${rejectedPercentage}% of total shops`;
  
  // Update tab badges
  document.querySelector('#pending-tab .badge').textContent = pendingCount;
  document.querySelector('#approved-tab .badge').textContent = approvedCount;
  document.querySelector('#rejected-tab .badge').textContent = rejectedCount;
}

// Render pending shops
function renderPendingShops() {
  const container = document.querySelector('#pending .shop-grid .row');
  container.innerHTML = '';
  
  if (shops.pending.length === 0) {
    container.innerHTML = '<div class="col-12"><div class="alert alert-info">No pending shops found.</div></div>';
    return;
  }
  
  shops.pending.forEach(shop => {
    const shopCard = document.createElement('div');
    shopCard.className = 'col-xl-3 col-lg-4 col-md-6';
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
          <img src="${shop.image}" alt="${shop.name}">
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
}

// Render approved shops
function renderApprovedShops() {
  const container = document.querySelector('#approved .table tbody');
  container.innerHTML = '';
  
  if (shops.approved.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="7" class="text-center">No approved shops found.</td>';
    container.appendChild(emptyRow);
    return;
  }
  
  shops.approved.forEach(shop => {
    const row = document.createElement('tr');
    row.dataset.shopId = shop.id;
    
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
            <img src="${shop.image}" alt="${shop.name}">
          </div>
          <div>
            <h6 class="mb-0">${shop.name}</h6>
            <small class="text-muted">${shop.shopId}</small>
          </div>
        </div>
      </td>
      <td>
        <div class="d-flex align-items-center">
          <img src="${shop.owner.avatar}" alt="${shop.owner.name}" class="shop-owner-avatar me-2">
          <span>${shop.owner.name}</span>
        </div>
      </td>
      <td>${shop.location}</td>
      <td><span class="badge bg-success">${shop.status}</span></td>
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
    `;
    
    container.appendChild(row);
  });
}

// Render rejected shops
function renderRejectedShops() {
  const container = document.querySelector('#rejected .table tbody');
  container.innerHTML = '';
  
  if (shops.rejected.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="4" class="text-center">No rejected shops found.</td>';
    container.appendChild(emptyRow);
    return;
  }
  
  shops.rejected.forEach(shop => {
    const row = document.createElement('tr');
    row.dataset.shopId = shop.id;
    
    row.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <div class="shop-table-image me-3">
            <img src="${shop.image}" alt="${shop.name}">
          </div>
          <div>
            <h6 class="mb-0">${shop.name}</h6>
            <small class="text-muted">${shop.shopId}</small>
          </div>
        </div>
      </td>
      <td>
        <div class="d-flex align-items-center">
          <img src="${shop.owner.avatar}" alt="${shop.owner.name}" class="shop-owner-avatar me-2">
          <span>${shop.owner.name}</span>
        </div>
      </td>
      <td>${shop.reason}</td>
      <td>${shop.date}</td>
    `;
    
    container.appendChild(row);
  });
}

// Initialize event listeners
function initEventListeners() {
  // Approve shop
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('approve-shop') || e.target.closest('.approve-shop')) {
      e.preventDefault();
      const element = e.target.classList.contains('approve-shop') ? e.target : e.target.closest('.approve-shop');
      const shopId = element.dataset.shopId;
      approveShop(shopId);
    }
  });
  
  // Reject shop
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('reject-shop') || e.target.closest('.reject-shop')) {
      e.preventDefault();
      const element = e.target.classList.contains('reject-shop') ? e.target : e.target.closest('.reject-shop');
      const shopId = element.dataset.shopId;
      rejectShop(shopId);
    }
  });
  
  // Delete shop
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-shop') || e.target.closest('.delete-shop')) {
      e.preventDefault();
      const element = e.target.classList.contains('delete-shop') ? e.target : e.target.closest('.delete-shop');
      const shopId = element.dataset.shopId;
      deleteShop(shopId);
    }
  });
  
  // View shop details
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('view-shop') || e.target.closest('.view-shop')) {
      e.preventDefault();
      const element = e.target.classList.contains('view-shop') ? e.target : e.target.closest('.view-shop');
      const shopId = element.dataset.shopId;
      viewShopDetails(shopId);
    }
  });
  
  // Edit shop
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-shop') || e.target.closest('.edit-shop')) {
      e.preventDefault();
      const element = e.target.classList.contains('edit-shop') ? e.target : e.target.closest('.edit-shop');
      const shopId = element.dataset.shopId;
      editShop(shopId);
    }
  });
  
  // Select all approved shops
  document.querySelector('#selectAllApproved').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#approved .table tbody input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
    });
  });
  
  // Search functionality
  document.querySelector('.dashboard-search input').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      searchShops(this.value);
    }
  });
  
  document.querySelector('.dashboard-search button').addEventListener('click', function() {
    const searchTerm = document.querySelector('.dashboard-search input').value;
    searchShops(searchTerm);
  });
  
  // Sort functionality
  document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const sortOption = this.textContent.trim();
      sortShops(sortOption);
    });
  });
}

// Initialize Bootstrap tooltips
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Approve a shop
function approveShop(shopId) {
  // Find the shop in pending list
  const shopIndex = shops.pending.findIndex(shop => shop.id === shopId);
  if (shopIndex === -1) return;
  
  const shop = shops.pending[shopIndex];
  
  // Create a new approved shop object
  const approvedShop = {
    id: shop.id,
    name: shop.name,
    image: shop.image,
    location: shop.location,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Active',
    owner: shop.owner,
    shopId: `#SH${Math.floor(1000 + Math.random() * 9000)}`
  };
  
  // Remove from pending and add to approved
  shops.pending.splice(shopIndex, 1);
  shops.approved.push(approvedShop);
  
  // Show success message
  showToast(`${shop.name} has been approved successfully!`, 'success');
  
  // Update UI
  updateStats();
  renderPendingShops();
  renderApprovedShops();
}

// Reject a shop
function rejectShop(shopId) {
  // Find the shop in pending list
  const shopIndex = shops.pending.findIndex(shop => shop.id === shopId);
  if (shopIndex === -1) return;
  
  const shop = shops.pending[shopIndex];
  
  // Prompt for rejection reason
  const reason = prompt('Please provide a reason for rejection:', 'Failed to meet quality standards');
  if (reason === null) return; // User cancelled
  
  // Create a new rejected shop object
  const rejectedShop = {
    id: shop.id,
    name: shop.name,
    image: shop.image,
    location: shop.location,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    reason: reason,
    owner: shop.owner,
    shopId: `#SH${Math.floor(1000 + Math.random() * 9000)}`
  };
  
  // Remove from pending and add to rejected
  shops.pending.splice(shopIndex, 1);
  shops.rejected.push(rejectedShop);
  
  // Show success message
  showToast(`${shop.name} has been rejected.`, 'warning');
  
  // Update UI
  updateStats();
  renderPendingShops();
  renderRejectedShops();
}

// Delete a shop
function deleteShop(shopId) {
  // Check which list the shop is in
  let shopList = null;
  let shopIndex = -1;
  
  // Check pending list
  shopIndex = shops.pending.findIndex(shop => shop.id === shopId);
  if (shopIndex !== -1) {
    shopList = 'pending';
  } else {
    // Check approved list
    shopIndex = shops.approved.findIndex(shop => shop.id === shopId);
    if (shopIndex !== -1) {
      shopList = 'approved';
    } else {
      // Check rejected list
      shopIndex = shops.rejected.findIndex(shop => shop.id === shopId);
      if (shopIndex !== -1) {
        shopList = 'rejected';
      }
    }
  }
  
  if (!shopList || shopIndex === -1) return;
  
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete this shop?`)) return;
  
  // Get shop name before deletion
  const shopName = shops[shopList][shopIndex].name;
  
  // Remove the shop
  shops[shopList].splice(shopIndex, 1);
  
  // Show success message
  showToast(`${shopName} has been deleted.`, 'danger');
  
  // Update UI
  updateStats();
  renderPendingShops();
  renderApprovedShops();
  renderRejectedShops();
}

// View shop details
function viewShopDetails(shopId) {
  // Find the shop in any list
  let shop = shops.pending.find(s => s.id === shopId) || 
             shops.approved.find(s => s.id === shopId) || 
             shops.rejected.find(s => s.id === shopId);
  
  if (!shop) return;
  
  // In a real application, you would show a modal with shop details
  alert(`Shop Details:\nName: ${shop.name}\nLocation: ${shop.location}\nOwner: ${shop.owner.name}`);
  
  // For a complete implementation, you would create a modal with all shop details
}

// Edit shop
function editShop(shopId) {
  // Find the shop in any list
  let shopList = null;
  let shop = null;
  
  if (shops.pending.some(s => s.id === shopId)) {
    shopList = 'pending';
    shop = shops.pending.find(s => s.id === shopId);
  } else if (shops.approved.some(s => s.id === shopId)) {
    shopList = 'approved';
    shop = shops.approved.find(s => s.id === shopId);
  } else if (shops.rejected.some(s => s.id === shopId)) {
    shopList = 'rejected';
    shop = shops.rejected.find(s => s.id === shopId);
  }
  
  if (!shop) return;
  
  // In a real application, you would show a modal with form to edit shop details
  const newName = prompt('Edit shop name:', shop.name);
  if (newName === null) return; // User cancelled
  
  // Update shop name
  shop.name = newName;
  
  // Show success message
  showToast(`Shop details updated successfully!`, 'success');
  
  // Update UI based on which list the shop is in
  if (shopList === 'pending') {
    renderPendingShops();
  } else if (shopList === 'approved') {
    renderApprovedShops();
  } else if (shopList === 'rejected') {
    renderRejectedShops();
  }
}

// Search shops
function searchShops(term) {
  if (!term) {
    // Reset to show all shops
    renderPendingShops();
    renderApprovedShops();
    renderRejectedShops();
    return;
  }
  
  term = term.toLowerCase();
  
  // Filter pending shops
  const filteredPending = shops.pending.filter(shop => 
    shop.name.toLowerCase().includes(term) || 
    shop.location.toLowerCase().includes(term) ||
    shop.owner.name.toLowerCase().includes(term)
  );
  
  // Filter approved shops
  const filteredApproved = shops.approved.filter(shop => 
    shop.name.toLowerCase().includes(term) || 
    shop.location.toLowerCase().includes(term) ||
    shop.owner.name.toLowerCase().includes(term)
  );
  
  // Filter rejected shops
  const filteredRejected = shops.rejected.filter(shop => 
    shop.name.toLowerCase().includes(term) || 
    shop.location.toLowerCase().includes(term) ||
    shop.owner.name.toLowerCase().includes(term)
  );
  
  // Temporarily replace shops data with filtered data
  const originalShops = { ...shops };
  shops.pending = filteredPending;
  shops.approved = filteredApproved;
  shops.rejected = filteredRejected;
  
  // Render filtered shops
  renderPendingShops();
  renderApprovedShops();
  renderRejectedShops();
  
  // Restore original data
  shops = originalShops;
  
  // Show search results message
  const totalResults = filteredPending.length + filteredApproved.length + filteredRejected.length;
  showToast(`Found ${totalResults} shops matching "${term}"`, 'info');
}

// Sort shops
function sortShops(option) {
  let sortFunction;
  
  switch(option) {
    case 'Newest First':
      sortFunction = (a, b) => new Date(b.date) - new Date(a.date);
      break;
    case 'Oldest First':
      sortFunction = (a, b) => new Date(a.date) - new Date(b.date);
      break;
    case 'Alphabetical (A-Z)':
      sortFunction = (a, b) => a.name.localeCompare(b.name);
      break;
    default:
      return;
  }
  
  // Sort all shop lists
  shops.pending.sort(sortFunction);
  shops.approved.sort(sortFunction);
  shops.rejected.sort(sortFunction);
  
  // Update UI
  renderPendingShops();
  renderApprovedShops();
  renderRejectedShops();
  
  // Show sort message
  showToast(`Shops sorted by ${option}`, 'info');
}

// Show toast notification
function showToast(message, type = 'info') {
  // Check if toast container exists, if not create it
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastId = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.id = toastId;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Initialize and show the toast
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove toast after it's hidden
  toast.addEventListener('hidden.bs.toast', function() {
    toast.remove();
  });
}

// Add shop modal
function createShopModal() {
  // Create modal element if it doesn't exist
  if (!document.getElementById('shopDetailsModal')) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'shopDetailsModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'shopDetailsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
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
            <button type="button" class="btn btn-primary" id="shopActionButton">Action</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
}

// Call this function to create the modal when the page loads
document.addEventListener('DOMContentLoaded', createShopModal);