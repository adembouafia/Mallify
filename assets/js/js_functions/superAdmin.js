// Import Bootstrap library
const bootstrap = window.bootstrap;

// Toast notification function
function showToast(title, message, type) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastElement = document.createElement('div');
    toastElement.id = toastId;
    toastElement.className = `toast align-items-center text-bg-${type} border-0`;
    toastElement.role = 'alert';
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    // Create toast content
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong>: ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toastElement);
    
    // Initialize and show toast
    const toastInstance = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    toastInstance.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Function to update the user menu with the current admin information
function updateUserMenuInfo() {
    try {
        // Get admin info from localStorage
        const adminDataStr = localStorage.getItem("admin");
        const userDataStr = localStorage.getItem("userData");
        const token = localStorage.getItem("token");
        const userType = localStorage.getItem("userType");
        
        // If no data or token exists, don't update the menu
        if ((!adminDataStr && !userDataStr) || !token) {
            console.log("No admin data found in localStorage");
            return;
        }
        
        // Try to get admin data from either admin or userData storage
        let admin;
        if (adminDataStr) {
            admin = JSON.parse(adminDataStr);
        } else if (userDataStr && userType === "admin") {
            admin = JSON.parse(userDataStr);
        } else {
            return; // Not an admin user
        }
        
        console.log("Admin data:", admin);
        
        if (!admin) return;
        
        // Get all user menu elements that need to be updated
        const userImages = document.querySelectorAll(".user-menu .user-image, .user-header img");
        const userNameSpan = document.querySelector(".user-menu .d-none.d-md-inline");
        const userHeaderText = document.querySelector(".user-header p");
        
        // Update user name
        if (userNameSpan) {
            userNameSpan.textContent = `${admin.firstname || admin.firstName || ''} ${admin.lastname || admin.lastName || ''}`;
        }
        
        // Update header text with name and role
        if (userHeaderText) {
            const firstName = admin.firstname || admin.firstName || '';
            const lastName = admin.lastname || admin.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const role = admin.role === 'superAdmin' ? 'Super Admin' : 'Admin';
            
            userHeaderText.innerHTML = `
                ${fullName}
                <small>${role}</small>
            `;
        }
        
        // Update user image if available
        if (admin.adminImage && userImages.length > 0) {
            const imagePath = admin.adminImage.startsWith('http') 
                ? admin.adminImage 
                : `http://localhost:3000/${admin.adminImage}`;
                
            userImages.forEach(img => {
                img.src = imagePath;
                img.alt = `${admin.firstname || admin.firstName || ''} ${admin.lastname || admin.lastName || ''}`;
            });
        }
        
        // FIXED: Use a flag to ensure we only set up the logout listener once
        if (!window.logoutListenerInitialized) {
            // Set up logout button using event delegation
            document.addEventListener("click", function(e) {
                // Find the logout button by its class and position in the user menu
                if (e.target && (e.target.matches(".user-footer .btn") || 
                    e.target.closest(".user-footer .btn"))) {
                    e.preventDefault();
                    handleLogout();
                }
            });
            window.logoutListenerInitialized = true;
        }
    } catch (error) {
        console.error("Error updating user menu:", error);
    }
}

// Handle logout function
function handleLogout() {
    localStorage.clear();
    showToast("Déconnexion réussie", "Vous avez été déconnecté avec succès.", "success");
    setTimeout(() => {
        window.location.href = "../index.html";
    }, 1000);
}

// Initialize admin forms and event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // Call updateUserMenuInfo to set up the user menu
    updateUserMenuInfo();
    
    // Initialize admin table if it exists
    if (document.querySelector(".table tbody")) {
        getAdmins();
    }
    
    // Initialize add admin form
    initAddAdminForm();
    
    // Initialize edit admin form
    initEditAdminForm();
    
    // Initialize delete admin functionality
    initDeleteAdmin();
});

// Initialize add admin form
function initAddAdminForm() {
    const adminAvatar = document.getElementById("adminAvatar");
    if (adminAvatar) {
        adminAvatar.addEventListener("change", function() {
            const avatarPreview = document.getElementById("avatarPreview");
            const file = this.files[0];
            
            if (file) {
                // Create a URL for the selected image and update the preview
                const imageUrl = URL.createObjectURL(file);
                avatarPreview.src = imageUrl;
            } else {
                // If no file is selected, show the default image
                avatarPreview.src = "../../assets/images/dashboard/superadmin.jpg";
            }
        });
    }

    // Password validation
    const adminPassword = document.getElementById("adminPassword");
    const adminConfirmPassword = document.getElementById("adminConfirmPassword");
    const passwordMismatch = document.getElementById("passwordMismatch");
    
    if (adminConfirmPassword && adminPassword) {
        adminConfirmPassword.addEventListener("input", function() {
            if (this.value !== adminPassword.value) {
                passwordMismatch.style.display = "block";
            } else {
                passwordMismatch.style.display = "none";
            }
        });
        
        adminPassword.addEventListener("input", function() {
            if (adminConfirmPassword.value && this.value !== adminConfirmPassword.value) {
                passwordMismatch.style.display = "block";
            } else if (adminConfirmPassword.value && this.value === adminConfirmPassword.value) {
                passwordMismatch.style.display = "none";
            }
        });
    }

    const adminForm = document.getElementById("adminForm");
    if (adminForm) {
        adminForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            // Get form elements
            const adminFirstName = document.getElementById("adminFirstName");
            const adminLastName = document.getElementById("adminLastName");
            const adminEmail = document.getElementById("adminEmail");
            const adminPassword = document.getElementById("adminPassword");
            const adminConfirmPassword = document.getElementById("adminConfirmPassword");
            
            // Basic validation
            if (!adminFirstName.value.trim()) {
                showToast("Erreur", "Le prénom est requis", "danger");
                adminFirstName.focus();
                return;
            }
            
            if (!adminLastName.value.trim()) {
                showToast("Erreur", "Le nom est requis", "danger");
                adminLastName.focus();
                return;
            }
            
            if (!adminEmail.value.trim()) {
                showToast("Erreur", "L'email est requis", "danger");
                adminEmail.focus();
                return;
            }
            
            if (!adminPassword.value) {
                showToast("Erreur", "Le mot de passe est requis", "danger");
                adminPassword.focus();
                return;
            }
            
            if (adminPassword.value !== adminConfirmPassword.value) {
                passwordMismatch.style.display = "block";
                adminConfirmPassword.focus();
                return;
            }
            
            const adminTableBody = document.querySelector(".table tbody");
            const avatarPreview = document.getElementById("avatarPreview");
            const avatarInput = document.getElementById("adminAvatar");
            const firstName = adminFirstName.value;
            const lastName = adminLastName.value;
            const email = adminEmail.value;
            const password = adminPassword.value;
            const avatarFile = avatarInput.files[0];

            const formData = new FormData();
            formData.append("firstname", firstName); 
            formData.append("lastname", lastName); 
            formData.append("email", email);
            formData.append("password", password);
            if (avatarFile) formData.append("adminImage", avatarFile);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:3000/admin/add", true);

            const token = localStorage.getItem("token");
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            xhr.onload = function() {
                if (xhr.status === 201 || xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const savedAdmin = response.admin;
                        let imageUrl;
                        
                        if (avatarFile) {
                            imageUrl = URL.createObjectURL(avatarFile);
                        } else if (savedAdmin.adminImage) {
                            if (savedAdmin.adminImage.startsWith('http')) {
                                imageUrl = savedAdmin.adminImage;
                            } else {
                                imageUrl = `http://localhost:3000/${savedAdmin.adminImage}`;
                            }
                        } else {
                            imageUrl = "../../assets/images/dashboard/superadmin.jpg";
                        }

                        const newRow = document.createElement("tr");
                        // Make sure to set the admin ID as a data attribute
                        newRow.dataset.adminId = savedAdmin._id;
                        newRow.innerHTML = `<td><img src="${imageUrl}" alt="avatar" class="rounded-circle object-fit-cover" width="32" height="32"></td>
                            <td>${savedAdmin.firstname} ${savedAdmin.lastname}</td>
                            <td>${savedAdmin.email}</td>
                            <td>${new Date().toLocaleString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-bs-toggle="modal" data-bs-target="#editAdminModal">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger btn-delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>`;
                        adminTableBody.insertBefore(newRow, adminTableBody.firstChild);

                        adminForm.reset();
                        avatarPreview.src = "../../assets/images/dashboard/superadmin.jpg";

                        const modal = bootstrap.Modal.getInstance(document.getElementById("addAdminModal"));
                        modal.hide();
                        showToast("Succès", "Admin ajouté avec succès", "success");
                    } catch (error) {
                        console.error("Error parsing response:", error);
                        showToast("Erreur", "Erreur lors de l'ajout de l'admin: " + error.message, "danger");
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        showToast("Erreur", errorResponse.message || "Erreur lors de l'ajout de l'admin", "danger");
                    } catch (e) {
                        showToast("Erreur", "Erreur lors de l'ajout de l'admin", "danger");
                    }
                    console.log(xhr.responseText);
                }
            };

            xhr.onerror = function() {
                showToast("Erreur de connexion", "Erreur réseau lors de la requête", "danger");
            };

            xhr.send(formData);
        });
    }
}

// Initialize edit admin form
function initEditAdminForm() {
    // Preview avatar for edit form
    const editAvatarInput = document.getElementById("editAvatar");
    if (editAvatarInput) {
        editAvatarInput.addEventListener("change", function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById("editAvatarPreview").src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle edit button clicks
    document.addEventListener("click", function(e) {
        if (e.target.closest(".btn-edit")) {
            const editingRow = e.target.closest("tr");
            window.editingRow = editingRow; // Store in global variable for form submission

            const fullName = editingRow.cells[1].textContent.trim();
            // Split the full name into first and last name
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            const email = editingRow.cells[2].textContent.trim();
            const avatarImg = editingRow.querySelector("img").src;

            document.getElementById("editFirstName").value = firstName;
            document.getElementById("editLastName").value = lastName;
            document.getElementById("editEmail").value = email;
            document.getElementById("editAvatarPreview").src = avatarImg;

            // Reset file input
            document.getElementById("editAvatar").value = "";
            
            // Log the admin ID for debugging
            console.log("Editing admin with ID:", editingRow.dataset.adminId);
        }
    });

    // Handle edit form submission
    const editAdminForm = document.getElementById("editAdminForm");
    if (editAdminForm) {
        editAdminForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            if (!window.editingRow) {
                showToast("Erreur", "Aucun admin sélectionné pour modification", "danger");
                return;
            }
            
            const adminId = window.editingRow.dataset.adminId;
            if (!adminId) {
                console.error("Admin ID is missing or null");
                showToast("Erreur", "ID Admin manquant. Impossible de mettre à jour.", "danger");
                return;
            }
            
            const updatedFirstName = document.getElementById("editFirstName").value;
            const updatedLastName = document.getElementById("editLastName").value;
            const updatedEmail = document.getElementById("editEmail").value;
            const editAvatar = document.getElementById("editAvatar");
            
            // Basic validation
            if (!updatedFirstName.trim()) {
                showToast("Erreur", "Le prénom est requis", "danger");
                return;
            }
            
            if (!updatedLastName.trim()) {
                showToast("Erreur", "Le nom est requis", "danger");
                return;
            }
            
            if (!updatedEmail.trim()) {
                showToast("Erreur", "L'email est requis", "danger");
                return;
            }
            
            const formData = new FormData();
            formData.append("firstname", updatedFirstName);
            formData.append("lastname", updatedLastName);
            formData.append("email", updatedEmail);
            
            // Add avatar if selected
            if (editAvatar.files.length > 0) {
                formData.append("adminImage", editAvatar.files[0]);
            }
            
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", `http://localhost:3000/admin/update/${adminId}`, true);
            
            const token = localStorage.getItem("token");
            if (token) {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        
                        // Update the row in the table
                        window.editingRow.cells[1].textContent = `${updatedFirstName} ${updatedLastName}`;
                        window.editingRow.cells[2].textContent = updatedEmail;
                        
                        // Update the avatar if we have a new one
                        if (editAvatar.files.length > 0) {
                            window.editingRow.querySelector("img").src = URL.createObjectURL(editAvatar.files[0]);
                        }
                        
                        // Close the modal
                        const editModal = bootstrap.Modal.getInstance(document.getElementById("editAdminModal"));
                        editModal.hide();
                        
                        showToast("Succès", "Admin modifié avec succès", "success");
                    } catch (error) {
                        console.error("Error parsing response:", error);
                        showToast("Erreur", "Erreur de mise à jour: " + error.message, "danger");
                    }
                } else {
                    console.error("Error updating admin:", xhr.status, xhr.responseText);
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        showToast("Erreur", errorResponse.message || "Erreur de mise à jour", "danger");
                    } catch (e) {
                        showToast("Erreur", "Erreur de mise à jour. Statut: " + xhr.status, "danger");
                    }
                }
            };
            
            xhr.onerror = function() {
                console.error("Network error during update");
                showToast("Erreur réseau", "Erreur de connexion lors de la mise à jour! Vérifiez votre connexion internet.", "danger");
            };
            
            xhr.send(formData);
        });
    }
}

// Initialize delete admin functionality
function initDeleteAdmin() {
    // Handle delete button clicks
    document.addEventListener("click", function(e) {
        if (e.target.closest(".btn-delete")) {
            const row = e.target.closest("tr");
            const adminId = row.dataset.adminId;
            const adminName = row.cells[1].textContent;
            
            if (!adminId) {
                showToast("Erreur", "ID Admin manquant. Impossible de supprimer.", "danger");
                return;
            }
            
            // Confirm deletion
            if (confirm(`Êtes-vous sûr de vouloir supprimer l'admin "${adminName}" ?`)) {
                deleteAdmin(adminId, row);
            }
        }
    });
}

// Function to delete an admin
function deleteAdmin(adminId, row) {
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", `http://localhost:3000/admin/delete/${adminId}`, true);
    
    const token = localStorage.getItem("token");
    if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                
                // Remove the row from the table
                row.remove();
                
                showToast("Succès", "Admin supprimé avec succès", "success");
            } catch (error) {
                console.error("Error parsing response:", error);
                showToast("Erreur", "Erreur lors de la suppression: " + error.message, "danger");
            }
        } else {
            console.error("Error deleting admin:", xhr.status, xhr.responseText);
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                showToast("Erreur", errorResponse.message || "Erreur lors de la suppression", "danger");
            } catch (e) {
                showToast("Erreur", "Erreur lors de la suppression. Statut: " + xhr.status, "danger");
            }
        }
    };
    
    xhr.onerror = function() {
        console.error("Network error during delete");
        showToast("Erreur réseau", "Erreur de connexion lors de la suppression! Vérifiez votre connexion internet.", "danger");
    };
    
    xhr.send();
}

// Function to get all admins
function getAdmins() {
    const adminTableBody = document.querySelector(".table tbody");
    if (!adminTableBody) {
        console.error("Admin table body not found");
        return;
    }
    
    adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token); // Debug: Check if token exists
    
    if (!token) {
        adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Authentication token not found. Please log in again.</td></tr>';
        return;
    }

    // Use the correct API URL
    const apiUrl = "http://localhost:3000/admin/getAll";
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", apiUrl, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    
    console.log("Sending request to:", apiUrl); // Debug: URL
    
    xhr.onload = function() {
        console.log("Response status:", xhr.status); // Debug: Response status
        
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                console.log("Response received:", response); // Debug: Response data
                const admins = response.admins || response;

                adminTableBody.innerHTML = '';

                if (Array.isArray(admins) && admins.length > 0) {
                    admins.forEach(admin => {
                        const row = document.createElement("tr");
                        const adminId = admin._id;
                        // Make sure to set the admin ID as a data attribute
                        row.dataset.adminId = adminId;
                        
                        // Determine image path
                        let imagePath = "../../assets/images/dashboard/superadmin.jpg"; // Default image
                        if (admin.adminImage) {
                            if (admin.adminImage.startsWith('http')) {
                                imagePath = admin.adminImage;
                            } else {
                                imagePath = `http://localhost:3000/${admin.adminImage.replace(/^\//, '')}`;
                            }
                        }
                        
                        const createdAt = new Date(admin.createdAt || Date.now()).toLocaleString();
                        
                        // Combine first and last name for display
                        const fullName = `${admin.firstname || ''} ${admin.lastname || ''}`.trim();

                        row.innerHTML = `
                            <td><img src="${imagePath}" alt="avatar" class="rounded-circle object-fit-cover" width="32" height="32"></td>
                            <td>${fullName || 'Unknown'}</td>
                            <td>${admin.email || 'No email'}</td>
                            <td>${createdAt}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-bs-toggle="modal" data-bs-target="#editAdminModal">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger btn-delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        `;
                        adminTableBody.appendChild(row);
                    });
                } else {
                    adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No admins found</td></tr>';
                }
            } catch (error) {
                console.error("Error parsing response:", error);
                adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error parsing server response</td></tr>';
            }
        } else {
            let errorMsg = "Error loading admins";
            try {
                console.log("Error response:", xhr.responseText); // Debug: Full error response
                const errorResponse = JSON.parse(xhr.responseText);
                errorMsg = errorResponse.message || errorMsg;
            } catch (e) {
                // If not JSON, use the raw response text
                errorMsg = xhr.responseText || errorMsg;
            }
            console.error("Error fetching admins:", errorMsg);
            adminTableBody.innerHTML = `<tr><td colspan="5" class="text-center">${errorMsg}</td></tr>`;
        }
    };

    xhr.onerror = function(e) {
        console.error("Network error while fetching admins:", e); // Debug: Network error details
        adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Network error. Please check your connection and try again.</td></tr>';
        
        // Show an error toast
        showToast("Connection Error", "Failed to connect to the server. Please check your connection.", "danger");
    };

    xhr.send();
}

// Function to refresh the admin table
function refreshAdminTable() {
    getAdmins();
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to check if an element exists in the DOM
function elementExists(selector) {
    return document.querySelector(selector) !== null;
}

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM loaded - initializing page");
        updateUserMenuInfo();
        
        // Initialize admin table if it exists
        if (elementExists(".table tbody")) {
            getAdmins();
        }
    });
} else {
    // DOM already loaded
    console.log("DOM already loaded - initializing page");
    updateUserMenuInfo();
    
    // Initialize admin table if it exists
    if (elementExists(".table tbody")) {
        getAdmins();
    }
}