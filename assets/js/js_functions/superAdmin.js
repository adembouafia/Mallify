document.addEventListener('DOMContentLoaded', () => {
    // Initialize user menu as early as possible
    updateUserMenuInfo();
    
    const CLASS_NAME_SIDEBAR_COLLAPSE = 'sidebar-collapse';
    const CLASS_NAME_SIDEBAR_OPEN = 'sidebar-open';
    const SELECTOR_SIDEBAR_TOGGLE = '[data-lte-toggle="sidebar"]';
    const SELECTOR_APP_SIDEBAR = '.app-sidebar';
    class PushMenu {
        constructor(element) {
            this._element = element;
            this._sidebar = document.querySelector(SELECTOR_APP_SIDEBAR);
        }

        toggle() {
            if (document.body.classList.contains(CLASS_NAME_SIDEBAR_COLLAPSE)) {
                this.expand();
            } else {
                this.collapse();
            }
        }

        expand() {
            document.body.classList.remove(CLASS_NAME_SIDEBAR_COLLAPSE);
            document.body.classList.add(CLASS_NAME_SIDEBAR_OPEN);
        }

        collapse() {
            document.body.classList.remove(CLASS_NAME_SIDEBAR_OPEN);
            document.body.classList.add(CLASS_NAME_SIDEBAR_COLLAPSE);
        }
    }

    const sidebarToggle = document.querySelectorAll(SELECTOR_SIDEBAR_TOGGLE);
    sidebarToggle.forEach(btn => {
        const pushMenu = new PushMenu(btn);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            pushMenu.toggle();
        });
    });
});

//report cards toggle
document.addEventListener('DOMContentLoaded', () => {
    const SELECTOR_COLLAPSE = '[data-lte-toggle="card-collapse"]';
    const SELECTOR_REMOVE = '[data-lte-toggle="card-remove"]';
    const SELECTOR_MAXIMIZE = '[data-lte-toggle="card-maximize"]';
    document.querySelectorAll(SELECTOR_COLLAPSE).forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.card');
            card.classList.toggle('collapsed-card');
        });
    });

    document.querySelectorAll(SELECTOR_REMOVE).forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.card');
            card.remove();
        });
    });

    document.querySelectorAll(SELECTOR_MAXIMIZE).forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.card');
            card.classList.toggle('maximized-card');
    
            const html = document.documentElement;
            html.classList.toggle('maximized-card');
        });
    });
});

// add admin form
document.addEventListener('DOMContentLoaded', () => {
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

    const adminForm = document.getElementById("adminForm");
    if (adminForm) {
        adminForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const adminTableBody = document.querySelector(".table tbody");
            const avatarPreview = document.getElementById("avatarPreview");
            const avatarInput = document.getElementById("adminAvatar");
            const name = document.getElementById("adminName").value;
            const email = document.getElementById("adminEmail").value;
            const password = document.getElementById("adminPassword").value;
            const avatarFile = avatarInput.files[0];

            const formData = new FormData();
            formData.append("firstname", name); 
            formData.append("lastname", name); 
            formData.append("email", email);
            formData.append("password", password);
            if (avatarFile) formData.append("adminImage", avatarFile);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:3000/admin/add", true);

            const token = localStorage.getItem("token");
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            xhr.onload = function () {
                if (xhr.status === 201 || xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    const savedAdmin = response.admin;
                    let imageUrl;
                    
                    if (avatarFile) {
                        imageUrl = URL.createObjectURL(avatarFile);
                    } else if (savedAdmin.adminImage) {
                        if (savedAdmin.adminImage.startsWith('http')) {
                            imageUrl = savedAdmin.adminImage;
                        } else {
                            imageUrl = `http://localhost:3000${savedAdmin.adminImage}`;
                        }
                    } else {
                        imageUrl = "../../assets/images/dashboard/superadmin.jpg";
                    }

                    const newRow = document.createElement("tr");
                    // Make sure to set the admin ID as a data attribute
                    newRow.dataset.adminId = savedAdmin._id;
                    newRow.innerHTML = `<td><img src="${imageUrl}" alt="avatar" class="rounded-circle object-fit-cover" width="32" height="32"></td>
                        <td>${savedAdmin.firstname}</td>
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
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        showToast("Erreur", errorResponse.message || "Erreur lors de l'ajout de l'admin", "error");
                    } catch (e) {
                        showToast("Erreur", "Erreur lors de l'ajout de l'admin", "error");
                    }
                    console.log(xhr.responseText);
                }
            };

            xhr.onerror = function () {
                showToast("Erreur de connexion", "Erreur réseau lors de la requête", "error");
            };

            xhr.send(formData);
        });
    }
});

// Delete admin - FIXED
document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-delete")) {
        const row = e.target.closest("tr");
        const adminId = row.dataset.adminId;
        
        if (!adminId) {
            console.error("Admin ID not found");
            showToast("Erreur", "ID d'administrateur non trouvé", "error");
            return;
        }

        // Simple confirmation dialog
        if (confirm("Voulez-vous vraiment supprimer cet administrateur? Cette action ne peut pas être annulée!")) {
            deleteAdmin(adminId, row);
        }
    }
});

// Helper function to delete an admin
function deleteAdmin(adminId, row) {
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", `http://localhost:3000/admin/delete/${adminId}`, true);
    
    const token = localStorage.getItem("token");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    
    xhr.onload = function () {
        if (xhr.status === 200) {
            row.remove();
            showToast("Succès", "Admin supprimé avec succès", "success");
        } else {
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                showToast("Erreur", errorResponse.message || "Erreur lors de la suppression de l'admin", "error");
            } catch (e) {
                showToast("Erreur", "Erreur lors de la suppression de l'admin", "error");
            }
            console.log(xhr.responseText);
        }
    };
    
    xhr.onerror = function () {
        showToast("Erreur de connexion", "Erreur réseau lors de la requête", "error");
    };
    
    xhr.send();
}

// edit admin
let editingRow = null;
let newEditAvatarDataURL = null;

document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-edit")) {
        editingRow = e.target.closest("tr");

        const fullName = editingRow.cells[1].textContent.trim();
        const email = editingRow.cells[2].textContent.trim();
        const avatarImg = editingRow.querySelector("img").src;

        document.getElementById("editName").value = fullName;
        document.getElementById("editEmail").value = email;
        document.getElementById("editAvatarPreview").src = avatarImg;

        // Reset file input and data URL
        document.getElementById("editAvatar").value = "";
        newEditAvatarDataURL = null;
        
        // Log the admin ID for debugging
        console.log("Editing admin with ID:", editingRow.dataset.adminId);
    }
});

// Preview avatar
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

const editAdminForm = document.getElementById("editAdminForm");
if (editAdminForm) {
    editAdminForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (editingRow) {
            const adminId = editingRow.dataset.adminId;
            if (!adminId) {
                console.error("Admin ID is missing or null");
                showToast("Erreur", "ID Admin manquant. Impossible de mettre à jour.", "error");
                return;
            }
            
            const updatedName = document.getElementById("editName").value;
            const updatedEmail = document.getElementById("editEmail").value;
            
            if (newEditAvatarDataURL && newEditAvatarDataURL.startsWith('data:image')) {
                const formData = new FormData();
                formData.append("firstname", updatedName);
                formData.append("lastname", updatedName);
                formData.append("email", updatedEmail);
                
                // Convert data URL to File object
                if (document.getElementById("editAvatar").files.length > 0) {
                    formData.append("adminImage", document.getElementById("editAvatar").files[0]);
                }
                
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", `http://localhost:3000/admin/update/${adminId}`, true);
                
                const token = localStorage.getItem("token");
                if (token) {
                    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                }
                
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            // Update the row in the table
                            editingRow.cells[1].textContent = updatedName;
                            editingRow.cells[2].textContent = updatedEmail;
                            
                            // Update the avatar if we have a new one
                            if (newEditAvatarDataURL) {
                                editingRow.querySelector("img").src = newEditAvatarDataURL;
                            }
                            
                            // Close the modal
                            const editModal = bootstrap.Modal.getInstance(document.getElementById("editAdminModal"));
                            editModal.hide();
                            
                            showToast("Succès", "Admin modifié avec succès", "success");
                        } catch (error) {
                            console.error("Error parsing response:", error);
                            showToast("Erreur", "Erreur de mise à jour: " + error.message, "error");
                        }
                    } else {
                        console.error("Error updating admin:", xhr.status, xhr.responseText);
                        showToast("Erreur", "Erreur de mise à jour. Statut: " + xhr.status, "error");
                    }
                };
                
                xhr.onerror = function () {
                    console.error("Network error during update");
                    showToast("Erreur réseau", "Erreur de connexion lors de la mise à jour! Vérifiez votre connexion internet.", "error");
                };
                
                xhr.send(formData);
            } else {
                // No new image, can use JSON
                const updateData = JSON.stringify({
                    firstname: updatedName,
                    lastname: updatedName,
                    email: updatedEmail,
                });
                
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", `http://localhost:3000/admin/update/${adminId}`, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                
                const token = localStorage.getItem("token");
                if (token) {
                    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                }
                
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            
                            // Update the row in the table
                            editingRow.cells[1].textContent = updatedName;
                            editingRow.cells[2].textContent = updatedEmail;
                            
                            // Close the modal
                            const editModal = bootstrap.Modal.getInstance(document.getElementById("editAdminModal"));
                            editModal.hide();
                            
                            console.log("Admin updated successfully:", response);
                            showToast("Succès", "Admin modifié avec succès", "success");
                        } catch (error) {
                            console.error("Error parsing response:", error);
                            showToast("Erreur", "Erreur de mise à jour: " + error.message, "error");
                        }
                    } else {
                        console.error("Error updating admin:", xhr.status, xhr.responseText);
                        showToast("Erreur", "Erreur de mise à jour. Statut: " + xhr.status, "error");
                    }
                };
                
                xhr.onerror = function () {
                    console.error("Network error during update");
                    showToast("Erreur réseau", "Erreur de connexion lors de la mise à jour! Vérifiez votre connexion internet.", "error");
                };
                
                xhr.send(updateData);
            }
        }
    });
}

//search admin 
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchAdminInput");
    const searchButton = document.getElementById("searchAdminBtn");
    
    if (searchInput && searchButton) {
        const adminTableRows = document.querySelectorAll("#adminTable tbody tr");

        searchButton.addEventListener("click", () => {
            const searchText = searchInput.value.toLowerCase().trim();

            adminTableRows.forEach((row) => {
                const rowText = row.textContent.toLowerCase();
                row.style.display = rowText.includes(searchText) ? "" : "none";
            });
        });

        searchInput.addEventListener("input", () => {
            const searchText = searchInput.value.toLowerCase().trim();

            adminTableRows.forEach((row) => {
                const rowText = row.textContent.toLowerCase();
                row.style.display = rowText.includes(searchText) ? "" : "none";
            });
        });
    }
});

// filtrer par number of row "pagination "
document.addEventListener("DOMContentLoaded", () => {
    const entriesSelect = document.getElementById('entriesSelect');
    const table = document.getElementById('adminTable');
    
    if (entriesSelect && table) {
        const tbody = table.querySelector('tbody');
        const paginationInfo = document.getElementById('paginationInfo');

        function updatePagination() {
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const selectedCount = parseInt(entriesSelect.value);
            const totalRows = rows.length;
            rows.forEach((row, index) => {
                row.style.display = index < selectedCount ? '' : 'none';
            });
            const visibleEnd = Math.min(selectedCount, totalRows);
            if (paginationInfo) {
                paginationInfo.textContent = `Showing 1 to ${visibleEnd} of ${totalRows} entries`;
            }
        }
        
        entriesSelect.addEventListener('change', updatePagination);
        
        // Call updatePagination after the table is populated
        if (tbody.querySelectorAll('tr').length > 0) {
            updatePagination();
        }
    }
});

// filtrer les admins 
function sortAdminTable(type, direction) {
    const table = document.getElementById('adminTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    let colIndex;
    if (type === 'name') colIndex = 1;
    else if (type === 'email') colIndex = 2;
    else if (type === 'date') colIndex = 3;

    rows.sort((a, b) => {
        const textA = a.cells[colIndex].textContent.trim().toLowerCase();
        const textB = b.cells[colIndex].textContent.trim().toLowerCase();

        if (type === 'date') {
            const dateA = new Date(textA);
            const dateB = new Date(textB);
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (textA < textB) return direction === 'asc' ? -1 : 1;
        if (textA > textB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    rows.forEach(row => tbody.appendChild(row));
}

document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const selected = filterSelect.value;

            if (selected === 'name-asc') sortAdminTable('name', 'asc');
            else if (selected === 'name-desc') sortAdminTable('name', 'desc');
            else if (selected === 'email-asc') sortAdminTable('email', 'asc');
            else if (selected === 'email-desc') sortAdminTable('email', 'desc');
            else if (selected === 'date-asc') sortAdminTable('date', 'asc');
            else if (selected === 'date-desc') sortAdminTable('date', 'desc');
        });
    }
});

//get admins - FIXED
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

    // Use the correct API URL without the /api prefix
    const apiUrl = "http://localhost:3000/admin/getAll";
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", apiUrl, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    
    console.log("Sending request to:", apiUrl); // Debug: URL
    console.log("With Authorization header:", `Bearer ${token.substring(0, 15)}...`); // Debug: Show part of token for security
    
    xhr.onload = function () {
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
                        
                        const imgId = `admin-img-${adminId}`;
                        const imagePath = admin.adminImage ? (admin.adminImage.startsWith('/') ? admin.adminImage : `/${admin.adminImage}`) : null;
                        const createdAt = new Date(admin.createdAt || Date.now()).toLocaleString();

                        row.innerHTML = `
                            <td><img id="${imgId}" src="../../assets/images/dashboard/superadmin.jpg" alt="avatar" class="rounded-circle object-fit-cover" width="32" height="32"></td>
                            <td>${admin.firstname || 'Unknown'}</td>
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

                        // Load admin image if exists
                        if (imagePath) {
                            const imgXhr = new XMLHttpRequest();
                            imgXhr.open("GET", `http://localhost:3000${imagePath}`, true);
                            imgXhr.responseType = "blob";
                            imgXhr.setRequestHeader("Authorization", `Bearer ${token}`);
                            imgXhr.onload = function () {
                                if (imgXhr.status === 200) {
                                    const blob = imgXhr.response;
                                    const imgElement = document.getElementById(imgId);
                                    if (imgElement) {
                                        const reader = new FileReader();
                                        reader.onloadend = function () {
                                            imgElement.src = reader.result;
                                        };
                                        reader.readAsDataURL(blob);
                                    }
                                } else {
                                    console.error(`Failed to load image for admin ${adminId}`);
                                }
                            };
                            imgXhr.onerror = () => {
                                console.error(`Error loading image for admin ${adminId}`);
                            };
                            imgXhr.send();
                        }
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

    xhr.onerror = function (e) {
        console.error("Network error while fetching admins:", e); // Debug: Network error details
        adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Network error. Please check your connection and try again.</td></tr>';
        
        // Show an error toast
        if (typeof showToast === 'function') {
            showToast("Connection Error", "Failed to connect to the server. Please check your connection.", "error");
        }
    };

    xhr.send();
}

document.addEventListener("DOMContentLoaded", function() {
    getAdmins();
    updateUserMenuInfo();
    
    // Monitor network connectivity
    window.addEventListener('online', function() {
        showToast("Connexion rétablie", "Votre connexion Internet a été rétablie.", "success");
    });
    
    window.addEventListener('offline', function() {
        showToast("Connexion perdue", "Votre connexion Internet a été perdue. Certaines fonctionnalités peuvent ne pas être disponibles.", "warning");
    });
});

/**
 * Show a simple toast notification without external dependencies
 * @param {string} title - The toast title
 * @param {string} message - The toast message content
 * @param {string} type - Type of toast: 'success', 'error', 'warning', or 'info'
 */
function showToast(title, message, type) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    
    // Set background color based on type
    let bgColor;
    let textColor = '#fff';
    let icon = '';
    
    switch(type) {
        case 'success':
            bgColor = '#28a745';
            icon = '<i class="bi bi-check-circle-fill" style="margin-right: 10px;"></i>';
            break;
        case 'error':
            bgColor = '#dc3545';
            icon = '<i class="bi bi-x-circle-fill" style="margin-right: 10px;"></i>';
            break;
        case 'warning':
            bgColor = '#ffc107';
            textColor = '#212529';
            icon = '<i class="bi bi-exclamation-triangle-fill" style="margin-right: 10px;"></i>';
            break;
        case 'info':
        default:
            bgColor = '#17a2b8';
            icon = '<i class="bi bi-info-circle-fill" style="margin-right: 10px;"></i>';
            break;
    }
    
    // Style the toast
    toast.style.cssText = `
        background-color: ${bgColor};
        color: ${textColor};
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 10px;
        min-width: 250px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        opacity: 0;
        transition: opacity 0.3s ease-in;
        display: flex;
        flex-direction: column;
    `;
    
    // Create toast content
    toast.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
            ${icon}<span style="font-weight: bold;">${title}</span>
        </div>
        <div style="padding-left: ${icon ? '25px' : '0'};">${message}</div>
    `;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        background: transparent;
        border: none;
        color: ${textColor};
        font-size: 20px;
        cursor: pointer;
        opacity: 0.7;
    `;
    closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
    toast.appendChild(closeBtn);
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Make toast position relative for close button
    toast.style.position = 'relative';
    
    // Trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showAlert(options) {
    if (options.icon && options.title) {
        showToast(options.title, options.text || "", options.icon);
    } else {
        alert(options.text || options.title);
    }
    
    if (options.then) {
        setTimeout(() => {
            options.then();
        }, 2000);
    }
    
    return Promise.resolve();
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

function handleLogout() {
    localStorage.clear();

    showToast("Déconnexion réussie", "Vous avez été déconnecté avec succès.", "success");
    setTimeout(() => {
        window.location.href = "../index.html";
    }, 1000);
}

// Expose the toast functions globally
window.showToast = showToast;

// Declare bootstrap as a global variable
const bootstrap = window.bootstrap;