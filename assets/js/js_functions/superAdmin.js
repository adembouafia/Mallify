//sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const CLASS_NAME_SIDEBAR_COLLAPSE = 'sidebar-collapse';
    const CLASS_NAME_SIDEBAR_OPEN = 'sidebar-open';
    const SELECTOR_SIDEBAR_TOGGLE = '[data-lte-toggle="sidebar"]';
    const SELECTOR_APP_SIDEBAR = '.app-sidebar';
    // PushMenu Class
    class PushMenu {
        constructor(element) {
            this._element = element;
            this._sidebar = document.querySelector(SELECTOR_APP_SIDEBAR);
        }

        // Toggle the sidebar
        toggle() {
            if (document.body.classList.contains(CLASS_NAME_SIDEBAR_COLLAPSE)) {
                this.expand();
            } else {
                this.collapse();
            }
        }

        // Expand the sidebar
        expand() {
            document.body.classList.remove(CLASS_NAME_SIDEBAR_COLLAPSE);
            document.body.classList.add(CLASS_NAME_SIDEBAR_OPEN);
        }

        // Collapse the sidebar
        collapse() {
            document.body.classList.remove(CLASS_NAME_SIDEBAR_OPEN);
            document.body.classList.add(CLASS_NAME_SIDEBAR_COLLAPSE);
        }

    }

    // Initialize PushMenu and add event listeners
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
document.getElementById("adminAvatar").addEventListener("change", function() {
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

adminForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const adminForm = document.getElementById("adminForm");
  const adminTableBody = document.querySelector(".table tbody");
  const avatarPreview = document.getElementById("avatarPreview");
  const avatarInput = document.getElementById("adminAvatar");
  const name = document.getElementById("adminName").value;
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;
  const avatarFile = avatarInput.files[0];

  const formData = new FormData();
  formData.append("firstname", name); // 🟡 adapte si nécessaire
  formData.append("lastname", name); // 🟡 adapte si nécessaire
  formData.append("email", email);
  formData.append("password", password);
  if (avatarFile) formData.append("adminImage", avatarFile); // le nom doit correspondre à .single("adminImage")

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/admin/add", true);

  const token = localStorage.getItem("token");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onload = function () {
    if (xhr.status === 201 || xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      const savedAdmin = response.admin;
      
      // Create a temporary image to check if the URL is valid
      let imageUrl;
      
      if (avatarFile) {
        // If we uploaded a file, use a local object URL temporarily
        // This ensures we see the image immediately without waiting for server processing
        imageUrl = URL.createObjectURL(avatarFile);
      } else if (savedAdmin.adminImage) {
        // If the response has an image URL, use it
        // Check if it's a relative or absolute URL
        if (savedAdmin.adminImage.startsWith('http')) {
          imageUrl = savedAdmin.adminImage;
        } else {
          // If it's a relative path, prepend the base URL
          imageUrl = `http://localhost:3000${savedAdmin.adminImage}`;
        }
      } else {
        // Fallback to default image
        imageUrl = "../../assets/images/dashboard/superadmin.jpg";
      }

      const newRow = document.createElement("tr");
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

      console.log("Admin ajouté avec succès");
    } else {
      alert("Erreur lors de l'ajout de l'admin.");
      console.log(xhr.responseText);
    }
  };

  xhr.onerror = function () {
    alert("Erreur réseau lors de la requête.");
  };

  xhr.send(formData);
});




// Delete admin 
document.addEventListener("click", function (e) {
  if (e.target.closest(".btn-delete")) {
    const row = e.target.closest("tr");
    const adminId = row.dataset.adminId;
    
    if (!adminId) {
      console.error("Admin ID not found");
      return;
    }
    
    if (confirm("Are you sure you want to delete this admin?")) {
      const xhr = new XMLHttpRequest();
      xhr.open("DELETE", `http://localhost:3000/admin/delete/${adminId}`, true);
      
      const token = localStorage.getItem("token");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", "application/json");
      
      xhr.onload = function () {
        if (xhr.status === 200) {
          row.remove();
          console.log("Admin supprimé avec succès");
        } else {
          alert("Erreur lors de la suppression de l'admin.");
          console.log(xhr.responseText);
        }
      };
      
      xhr.onerror = function () {
        alert("Erreur réseau lors de la requête.");
      };
      
      xhr.send();
    }
  }
});




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
document.getElementById("editAvatar").addEventListener("change", function () {
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

document.getElementById("editAdminForm").addEventListener("submit", function (e) {
  e.preventDefault();
  if (editingRow) {
    const adminId = editingRow.dataset.adminId;
    
    if (!adminId) {
      console.error("Admin ID is missing or null");
      alert("Error: Admin ID is missing. Cannot update.");
      return;
    }
    
    const updatedName = document.getElementById("editName").value;
    const updatedEmail = document.getElementById("editEmail").value;
    
    if (newEditAvatarDataURL && newEditAvatarDataURL.startsWith('data:image')) {
      const formData = new FormData();
      formData.append("firstname", updatedName);
      formData.append("lastname", updatedName);
      
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
            
            console.log("Admin updated successfully:", response);
          } catch (error) {
            console.error("Error parsing response:", error);
            alert("Error updating admin: " + error.message);
          }
        } else {
          console.error("Error updating admin:", xhr.status, xhr.responseText);
          alert("Error updating admin. Status: " + xhr.status);
        }
      };
      
      xhr.onerror = function () {
        console.error("Network error during update");
        alert("Network error during update!");
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
          } catch (error) {
            console.error("Error parsing response:", error);
            alert("Error updating admin: " + error.message);
          }
        } else {
          console.error("Error updating admin:", xhr.status, xhr.responseText);
          alert("Error updating admin. Status: " + xhr.status);
        }
      };
      
      xhr.onerror = function () {
        console.error("Network error during update");
        alert("Network error during update!");
      };
      
      xhr.send(updateData);
    }
  }
});




//search admin 
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchAdminInput");
    const searchButton = document.getElementById("searchAdminBtn");
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
});
// filtrer par number of row "pagination "
const entriesSelect = document.getElementById('entriesSelect');
const table = document.getElementById('adminTable');
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
  paginationInfo.textContent = `Showing 1 to ${visibleEnd} of ${totalRows} entries`;
}
entriesSelect.addEventListener('change', updatePagination);
window.addEventListener('load', updatePagination);


// filtrer les admins 
function sortAdminTable(type, direction) {
  const table = document.getElementById('adminTable');
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

  filterSelect.addEventListener('change', () => {
    const selected = filterSelect.value;

    if (selected === 'name-asc') sortAdminTable('name', 'asc');
    else if (selected === 'name-desc') sortAdminTable('name', 'desc');
    else if (selected === 'email-asc') sortAdminTable('email', 'asc');
    else if (selected === 'email-desc') sortAdminTable('email', 'desc');
    else if (selected === 'date-asc') sortAdminTable('date', 'asc');
    else if (selected === 'date-desc') sortAdminTable('date', 'desc');
  });
});


//get admins
function getAdmins() {
  const adminTableBody = document.querySelector(".table tbody");
  adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

  const token = localStorage.getItem("token");
  if (!token) {
    adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Authentication token not found. Please log in again.</td></tr>';
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/admin/getAll", true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.onload = function () {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      const admins = response.admins || response;

      adminTableBody.innerHTML = '';

      if (Array.isArray(admins) && admins.length > 0) {
        admins.forEach(admin => {
          const row = document.createElement("tr");
          const adminId = admin._id;
          const imgId = `admin-img-${adminId}`;
          const imagePath = admin.adminImage ? (admin.adminImage.startsWith('/') ? admin.adminImage : `/${admin.adminImage}`) : null;
          const createdAt = new Date(admin.createdAt || Date.now()).toLocaleString();

          row.dataset.adminId = adminId;
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
    } else {
      console.error("Error fetching admins:", xhr.responseText);
      adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading admins</td></tr>';
    }
  };

  xhr.onerror = function () {
    console.error("Network error while fetching admins");
    adminTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Network error</td></tr>';
  };

  xhr.send();
}

document.addEventListener("DOMContentLoaded", function() {
  getAdmins();
});