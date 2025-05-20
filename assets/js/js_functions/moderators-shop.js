// Global variables for state management
let allModerators = [];
let filteredModerators = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { column: "date", direction: "desc" };
let searchTerm = "";

// DOM elements
const moderatorTableBody = document.querySelector("#moderatorTable tbody");
const paginationInfo = document.getElementById("paginationInfo");
const pagination = document.querySelector(".pagination");
const entriesSelect = document.getElementById("entriesSelect");
const searchInput = document.getElementById("searchModeratorInput");
const searchButton = document.getElementById("searchModeratorBtn");
const filterSelect = document.getElementById("filterSelect");

// Bootstrap instance
const bootstrap = window.bootstrap;

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Create toast container if it doesn't exist
  createToastContainer();
  
  // Initialize password toggles
  initPasswordToggles();
  
  // Fetch moderators
  getModerators();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup other functionality
  setupModeratorForms();
});

// Initialize password toggles
function initPasswordToggles() {
  // Add CSS for password toggle if not already added
  if (!document.getElementById('password-toggle-styles')) {
    const style = document.createElement('style');
    style.id = 'password-toggle-styles';
    style.textContent = `
      .password-toggle-wrapper {
        position: relative;
      }
      
      .password-toggle-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.375rem;
        z-index: 5;
      }
      
      .password-toggle-btn:hover,
      .password-toggle-btn:focus {
        outline: none;
        box-shadow: none;
      }
      
      .password-icon-hidden {
        color: #dc3545;
      }
      
      .password-icon-visible {
        color: #28a745;
      }
      
      .password-toggle-wrapper input[type="password"],
      .password-toggle-wrapper input[type="text"] {
        padding-right: 40px;
      }
      
      /* Fix for validation message positioning */
      .invalid-feedback {
        display: none;
        width: 100%;
        margin-top: 0.25rem;
        position: relative;
        z-index: 4;
      }
    `;
    document.head.appendChild(style);
  }

  // Find all password fields
  const passwordFields = document.querySelectorAll('input[type="password"]');

  passwordFields.forEach(input => {
    // Skip if already processed
    if (input.classList.contains('has-toggle')) return;
    
    // Mark this input as processed
    input.classList.add('has-toggle');
    
    // Create a wrapper if needed
    let wrapper = input.parentElement;
    if (!wrapper.classList.contains('password-toggle-wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'password-toggle-wrapper position-relative';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
    }
    
    // Remove any existing toggle buttons
    const existingToggle = wrapper.querySelector('.password-toggle-btn');
    if (existingToggle) {
      existingToggle.remove();
    }
    
    // Create the toggle button
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'password-toggle-btn';
    toggleButton.innerHTML = '<i class="bi bi-eye-slash password-icon-hidden"></i>';
    toggleButton.setAttribute('aria-label', 'Toggle password visibility');
    
    // Add the toggle button to the wrapper
    wrapper.appendChild(toggleButton);
    
    // Add click event to toggle password visibility
    toggleButton.addEventListener('click', function(e) {
      e.preventDefault();
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      const icon = toggleButton.querySelector('i');
      icon.className = isPassword ? 'bi bi-eye password-icon-visible' : 'bi bi-eye-slash password-icon-hidden';
    });
  });
}

// Create toast container
function createToastContainer() {
  if (!document.getElementById("toastContainer")) {
    const toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
    toastContainer.style.zIndex = "1050";
    document.body.appendChild(toastContainer);
  }
}

// Show toast notification
function showToast(title, message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    createToastContainer();
  }
  
  const toastId = `toast-${Date.now()}`;
  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <strong>${title}</strong>: ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const toastInstance = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 5000
  });
  
  toastInstance.show();
  
  // Remove toast after it's hidden
  toast.addEventListener("hidden.bs.toast", function() {
    toast.remove();
  });
}

// Setup all event listeners
function setupEventListeners() {
  // Entries per page selector
  if (entriesSelect) {
    entriesSelect.addEventListener("change", function() {
      itemsPerPage = parseInt(this.value);
      currentPage = 1;
      applyFiltersAndRender();
    });
  }
  
  // Search functionality
  if (searchInput && searchButton) {
    // Search on button click
    searchButton.addEventListener("click", function() {
      searchTerm = searchInput.value.trim().toLowerCase();
      currentPage = 1;
      applyFiltersAndRender();
    });
    
    // Search on Enter key
    searchInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        searchTerm = this.value.trim().toLowerCase();
        currentPage = 1;
        applyFiltersAndRender();
      }
    });
  }
  
  // Filter/Sort selector
  if (filterSelect) {
    filterSelect.addEventListener("change", function() {
      const selected = this.value;
      
      if (selected.includes("-")) {
        const [column, direction] = selected.split("-");
        currentSort = { column, direction };
        applyFiltersAndRender();
      }
    });
  }
  
  // Pagination controls
  if (pagination) {
    pagination.addEventListener("click", function(e) {
      e.preventDefault();
      
      if (e.target.tagName === "A" || e.target.parentElement.tagName === "A") {
        const pageItem = e.target.closest(".page-item");
        
        if (pageItem && !pageItem.classList.contains("active") && !pageItem.classList.contains("disabled")) {
          const pageLink = pageItem.querySelector(".page-link");
          const pageText = pageLink.textContent.trim();
          
          if (pageText === "Previous") {
            if (currentPage > 1) {
              currentPage--;
              renderModerators();
              updatePaginationControls();
            }
          } else if (pageText === "Next") {
            const totalPages = Math.ceil(filteredModerators.length / itemsPerPage);
            if (currentPage < totalPages) {
              currentPage++;
              renderModerators();
              updatePaginationControls();
            }
          } else {
            // Numeric page
            const newPage = parseInt(pageText);
            if (!isNaN(newPage) && newPage !== currentPage) {
              currentPage = newPage;
              renderModerators();
              updatePaginationControls();
            }
          }
        }
      }
    });
  }
}

// Fetch moderators from the API
function getModerators() {
  if (!moderatorTableBody) {
    console.error("Moderator table body not found");
    return;
  }

  moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

  const token = localStorage.getItem("token");
  if (!token) {
    moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Authentication token not found. Please log in again.</td></tr>';
    showToast("Authentication Error", "Please log in again to access this page.", "danger");
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/moderator/shop", true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        allModerators = response.moderators || response;
        
        // Initialize filtered moderators
        filteredModerators = [...allModerators];
        
        // Apply default sorting (date descending)
        applyFiltersAndRender();
        
        showToast("Success", "Moderators loaded successfully", "success");
      } catch (error) {
        console.error("Error parsing moderators response:", error);
        moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error parsing server response</td></tr>';
        showToast("Error", "Failed to parse server response", "danger");
      }
    } else {
      console.error("Error fetching moderators:", xhr.responseText);
      moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading moderators</td></tr>';
      showToast("Error", "Failed to load moderators", "danger");
    }
  };

  xhr.onerror = function () {
    console.error("Network error while fetching moderators");
    moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Network error</td></tr>';
    showToast("Network Error", "Failed to connect to the server", "danger");
  };

  xhr.send();
}

// Apply filters, sorting, and render the table
function applyFiltersAndRender() {
  // Start with all moderators
  filteredModerators = [...allModerators];
  
  // Apply search filter
  if (searchTerm) {
    filteredModerators = filteredModerators.filter(mod => {
      const name = (mod.moderatorName || "").toLowerCase();
      const email = (mod.email || "").toLowerCase();
      
      return name.includes(searchTerm) || email.includes(searchTerm);
    });
  }
  
  // Apply sorting
  filteredModerators.sort((a, b) => {
    let valueA, valueB;
    
    if (currentSort.column === "name") {
      valueA = (a.moderatorName || "").toLowerCase();
      valueB = (b.moderatorName || "").toLowerCase();
    } else if (currentSort.column === "email") {
      valueA = (a.email || "").toLowerCase();
      valueB = (b.email || "").toLowerCase();
    } else if (currentSort.column === "date") {
      valueA = new Date(a.createdAt || 0).getTime();
      valueB = new Date(b.createdAt || 0).getTime();
    }
    
    if (valueA < valueB) return currentSort.direction === "asc" ? -1 : 1;
    if (valueA > valueB) return currentSort.direction === "asc" ? 1 : -1;
    return 0;
  });
  
  // Render the table and update pagination
  renderModerators();
  updatePaginationInfo();
  updatePaginationControls();
}

// Render the moderators table
function renderModerators() {
  if (!moderatorTableBody) return;
  
  moderatorTableBody.innerHTML = "";
  
  if (filteredModerators.length === 0) {
    moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No moderators found</td></tr>';
    return;
  }
  
  // Calculate start and end indices for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredModerators.length);
  
  // Get moderators for current page
  const pageModerators = filteredModerators.slice(startIndex, endIndex);
  
  // Render each moderator
  pageModerators.forEach(mod => {
    const row = document.createElement("tr");
    const modId = mod._id;
    row.dataset.moderatorId = modId;
    
    // Fix image path handling
    let imageUrl = "../../assets/images/dashboard/default-profile.jpg"; // Default image
    
    if (mod.moderatorImage) {
      // Check if it's a full URL or just a filename
      if (mod.moderatorImage.startsWith('http')) {
        imageUrl = mod.moderatorImage;
      } else {
        // Handle different path formats
        const imagePath = mod.moderatorImage.replace(/^uploads\//, '');
        imageUrl = `http://localhost:3000/uploads/${imagePath}`;
      }
    }
    
    const createdAt = new Date(mod.createdAt || Date.now()).toLocaleString();

    row.innerHTML = `
      <td><img src="${imageUrl}" alt="avatar" class="rounded-circle object-fit-cover" width="32" height="32" onerror="this.src='../../assets/images/dashboard/default-profile.jpg'"></td>
      <td>${mod.moderatorName || 'Unknown'}</td>
      <td>${mod.email || 'No email'}</td>
      <td>${createdAt}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-bs-toggle="modal" data-bs-target="#editModeratorModal">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-delete">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    moderatorTableBody.appendChild(row);
  });
}

// Update pagination info text
function updatePaginationInfo() {
  if (!paginationInfo) return;
  
  const startIndex = filteredModerators.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredModerators.length);
  
  paginationInfo.textContent = `Showing ${startIndex} to ${endIndex} of ${filteredModerators.length} entries`;
}

// Update pagination controls
function updatePaginationControls() {
  if (!pagination) return;
  
  const totalPages = Math.ceil(filteredModerators.length / itemsPerPage);
  
  // Clear existing pagination
  pagination.innerHTML = "";
  
  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = '<a class="page-link" href="#" tabindex="-1">Previous</a>';
  pagination.appendChild(prevLi);
  
  // Page numbers
  const maxPagesToShow = 3;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pagination.appendChild(pageLi);
  }
  
  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`;
  nextLi.innerHTML = '<a class="page-link" href="#">Next</a>';
  pagination.appendChild(nextLi);
}

// Setup moderator forms (add, edit, delete)
function setupModeratorForms() {
  setupAddModeratorForm();
  setupEditModeratorForm();
  setupDeleteModeratorHandler();
}

// Setup add moderator form
function setupAddModeratorForm() {
  const moderatorAvatar = document.getElementById("moderatorAvatar");
  if (moderatorAvatar) {
    moderatorAvatar.addEventListener("change", function() {
      const avatarPreview = document.getElementById("avatarPreview");
      const file = this.files[0];
      
      if (file) {
        // Create a URL for the selected image and update the preview
        const imageUrl = URL.createObjectURL(file);
        avatarPreview.src = imageUrl;
      } else {
        // If no file is selected, show the default image
        avatarPreview.src = "../../assets/images/dashboard/supermoderator.jpg";
      }
    });
  }

  // Password validation - Updated to match admin form
  const moderatorPassword = document.getElementById("moderatorPassword");
  const confirmModeratorPassword = document.getElementById("confirmModeratorPassword");
  const passwordMismatch = document.getElementById("passwordMismatch");

  if (confirmModeratorPassword && moderatorPassword && passwordMismatch) {
    confirmModeratorPassword.addEventListener("input", function() {
      if (this.value !== moderatorPassword.value) {
        passwordMismatch.style.display = "block";
      } else {
        passwordMismatch.style.display = "none";
      }
    });
    
    moderatorPassword.addEventListener("input", function() {
      if (confirmModeratorPassword.value && this.value !== confirmModeratorPassword.value) {
        passwordMismatch.style.display = "block";
      } else if (confirmModeratorPassword.value && this.value === confirmModeratorPassword.value) {
        passwordMismatch.style.display = "none";
      }
    });
  }

  const moderatorForm = document.getElementById("moderatorForm");
  if (moderatorForm) {
    moderatorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      
      // Validate passwords match
      const password = document.getElementById("moderatorPassword").value;
      const confirmPassword = document.getElementById("confirmModeratorPassword").value;
      
      if (password !== confirmPassword) {
        if (passwordMismatch) {
          passwordMismatch.style.display = "block";
        }
        showToast("Error", "Passwords do not match", "danger");
        return;
      }
      
      const avatarPreview = document.getElementById("avatarPreview");
      const avatarInput = document.getElementById("moderatorAvatar");
      const name = document.getElementById("moderatorName").value;
      const email = document.getElementById("moderatorEmail").value;
      const avatarFile = avatarInput.files[0];

      const formData = new FormData();
      formData.append("moderatorName", name);
      formData.append("email", email);
      formData.append("moderatorPassword", password);
      if (avatarFile) formData.append("moderatorImage", avatarFile);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:3000/moderator/register", true);

      const token = localStorage.getItem("token");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.onload = function () {
        if (xhr.status === 201 || xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            const savedModerator = response.moderator;
            
            // Add the new moderator to our array
            allModerators.unshift(savedModerator);
            
            // Re-apply filters and render
            applyFiltersAndRender();
            
            moderatorForm.reset(); 
            avatarPreview.src = "../../assets/images/dashboard/superadmin.jpg"; // Reset to default image

            const modal = bootstrap.Modal.getInstance(document.getElementById("addModeratorModal"));
            modal.hide();

            showToast("Success", "Moderator added successfully", "success");
          } catch (error) {
            console.error("Error parsing response:", error);
            showToast("Error", "Failed to add moderator: " + error.message, "danger");
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            showToast("Error", errorResponse.message || "Failed to add moderator", "danger");
          } catch (e) {
            showToast("Error", "Failed to add moderator. Status: " + xhr.status, "danger");
          }
          console.log(xhr.responseText);
        }
      };

      xhr.onerror = function () {
        showToast("Network Error", "Failed to connect to the server", "danger");
      };

      xhr.send(formData);
    });
  }
}

// Setup edit moderator form
function setupEditModeratorForm() {
  let editingRow = null;
  let newEditAvatarDataURL = null;
  
  // Preview avatar for edit form
  const editAvatarInput = document.getElementById("editAvatar");
  if (editAvatarInput) {
    editAvatarInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          document.getElementById("editAvatarPreview").src = e.target.result;
          newEditAvatarDataURL = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Handle edit button clicks
  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-edit")) {
      editingRow = e.target.closest("tr");
      const moderatorId = editingRow.dataset.moderatorId;
      
      if (!moderatorId) {
        console.error("Moderator ID not found");
        showToast("Error", "Moderator ID not found", "danger");
        return;
      }
  
      const fullName = editingRow.cells[1].textContent.trim();
      const email = editingRow.cells[2].textContent.trim();
      const avatarImg = editingRow.querySelector("img").src;
  
      document.getElementById("editName").value = fullName;
      document.getElementById("editEmail").value = email;
      document.getElementById("editAvatarPreview").src = avatarImg;
  
      // Reset file input and data URL
      document.getElementById("editAvatar").value = "";
      newEditAvatarDataURL = null;
      
      // Log the moderator ID for debugging
      console.log("Editing moderator with ID:", moderatorId);
    }
  });
  
  // Handle edit form submission
  const editModeratorForm = document.getElementById("editModeratorForm");
  if (editModeratorForm) {
    editModeratorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (editingRow) {
        const moderatorId = editingRow.dataset.moderatorId;
        
        if (!moderatorId) {
          console.error("Moderator ID is missing or null");
          showToast("Error", "Moderator ID is missing. Cannot update.", "danger");
          return;
        }
        
        const updatedName = document.getElementById("editName").value;
        const updatedEmail = document.getElementById("editEmail").value;
        
        if (newEditAvatarDataURL && newEditAvatarDataURL.startsWith('data:image')) {
          const formData = new FormData();
          formData.append("moderatorName", updatedName);
          formData.append("email", updatedEmail);
          
          // Convert data URL to File object
          if (document.getElementById("editAvatar").files.length > 0) {
            formData.append("moderatorImage", document.getElementById("editAvatar").files[0]);
          }
          
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", `http://localhost:3000/moderator/update/${moderatorId}`, true);
          
          const token = localStorage.getItem("token");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
          
          xhr.onload = function () {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                
                // Update the moderator in our array
                const modIndex = allModerators.findIndex(m => m._id === moderatorId);
                if (modIndex !== -1) {
                  allModerators[modIndex].moderatorName = updatedName;
                  allModerators[modIndex].email = updatedEmail;
                  
                  // If a new avatar was uploaded, update it in memory
                  if (newEditAvatarDataURL) {
                    allModerators[modIndex].moderatorImage = newEditAvatarDataURL;
                  }
                }
                
                // Re-apply filters and render
                applyFiltersAndRender();
                
                // Close the modal
                const editModal = bootstrap.Modal.getInstance(document.getElementById("editModeratorModal"));
                editModal.hide();
                
                showToast("Success", "Moderator updated successfully", "success");
              } catch (error) {
                console.error("Error parsing response:", error);
                showToast("Error", "Error updating moderator: " + error.message, "danger");
              }
            } else {
              console.error("Error updating moderator:", xhr.status, xhr.responseText);
              showToast("Error", "Error updating moderator. Status: " + xhr.status, "danger");
            }
          };
          
          xhr.onerror = function () {
            console.error("Network error during update");
            showToast("Network Error", "Failed to connect to the server", "danger");
          };
          
          xhr.send(formData);
        } else {
          // No new image, can use JSON
          const updateData = JSON.stringify({
            moderatorName: updatedName,
            email: updatedEmail
          });
          
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", `http://localhost:3000/moderator/update/${moderatorId}`, true);
          xhr.setRequestHeader("Content-Type", "application/json");
          
          const token = localStorage.getItem("token");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
          
          xhr.onload = function () {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                
                // Update the moderator in our array
                const modIndex = allModerators.findIndex(m => m._id === moderatorId);
                if (modIndex !== -1) {
                  allModerators[modIndex].moderatorName = updatedName;
                  allModerators[modIndex].email = updatedEmail;
                }
                
                // Re-apply filters and render
                applyFiltersAndRender();
                
                // Close the modal
                const editModal = bootstrap.Modal.getInstance(document.getElementById("editModeratorModal"));
                editModal.hide();
                
                showToast("Success", "Moderator updated successfully", "success");
              } catch (error) {
                console.error("Error parsing response:", error);
                showToast("Error", "Error updating moderator: " + error.message, "danger");
              }
            } else {
              console.error("Error updating moderator:", xhr.status, xhr.responseText);
              showToast("Error", "Error updating moderator. Status: " + xhr.status, "danger");
            }
          };
          
          xhr.onerror = function () {
            console.error("Network error during update");
            showToast("Network Error", "Failed to connect to the server", "danger");
          };
          
          xhr.send(updateData);
        }
      }
    });
  }
}

// Setup delete moderator handler
function setupDeleteModeratorHandler() {
  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-delete")) {
      const row = e.target.closest("tr");
      const moderatorId = row.dataset.moderatorId;
      
      if (!moderatorId) {
        console.error("Moderator ID not found");
        showToast("Error", "Moderator ID not found", "danger");
        return;
      }
      
      if (confirm("Are you sure you want to delete this moderator?")) {
        const xhr = new XMLHttpRequest();
        xhr.open("DELETE", `http://localhost:3000/moderator/delete/${moderatorId}`, true);
        
        const token = localStorage.getItem("token");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        
        xhr.onload = function () {
          if (xhr.status === 200) {
            // Remove the moderator from our array
            allModerators = allModerators.filter(mod => mod._id !== moderatorId);
            
            // Re-apply filters and render
            applyFiltersAndRender();
            
            showToast("Success", "Moderator deleted successfully", "success");
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              showToast("Error", errorResponse.message || "Failed to delete moderator", "danger");
            } catch (e) {
              showToast("Error", "Failed to delete moderator. Status: " + xhr.status, "danger");
            }
            console.log(xhr.responseText);
          }
        };
        
        xhr.onerror = function () {
          showToast("Network Error", "Failed to connect to the server", "danger");
        };
        
        xhr.send();
      }
    }
  });
}