

  
// Search moderators
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchModeratorInput");
    const searchButton = document.getElementById("searchModeratorBtn");
    const moderatorTableRows = document.querySelectorAll("#moderatorTable tbody tr");
  
    function filterRows() {
        const searchText = searchInput.value.toLowerCase().trim();
  
        moderatorTableRows.forEach((row) => {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(searchText) ? "" : "none";
        });
    }
  
    searchButton.addEventListener("click", filterRows);
    searchInput.addEventListener("input", filterRows);
  });
  // filtrer par number of row "pagination "
  const entriesSelect = document.getElementById('entriesSelect');
  const table = document.getElementById('moderatorTable');
  const tbody = table.querySelector('tbody');
  const paginationInfo = document.getElementById('paginationInfo');
  
  function updatePagination() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const selectedCount = parseInt(entriesSelect.value);
    const totalRows = rows.length;
  
    // Hide/show rows
    rows.forEach((row, index) => {
      row.style.display = index < selectedCount ? '' : 'none';
    });
  
    // Update info text
    const visibleEnd = Math.min(selectedCount, totalRows);
    paginationInfo.textContent = `Showing 1 to ${visibleEnd} of ${totalRows} entries`;
  }
  
  // Event when select changes
  entriesSelect.addEventListener('change', updatePagination);
  
  // Call on page load
  window.addEventListener('load', updatePagination);
  
  // filtrer les Moderators
  function sortTable(type, direction) {
    const table = document.getElementById('moderatorTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
  
    let colIndex;
    if (type === 'name') colIndex = 1;
    else if (type === 'email') colIndex = 2;
    else if (type === 'date') colIndex = 3;
  
    rows.sort((a, b) => {
      const textA = a.cells[colIndex].textContent.trim();
      const textB = b.cells[colIndex].textContent.trim();
  
      if (type === 'date') {
        const dateA = parseDate(textA);
        const dateB = parseDate(textB);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const valA = textA.toLowerCase();
        const valB = textB.toLowerCase();
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      }
    });
  
    rows.forEach(row => tbody.appendChild(row));
  }
  
  // Date parser that works with "YYYY-MM-DD HH:mm" or "DD/MM/YYYY HH:mm"
  function parseDate(dateStr) {
    const [datePart] = dateStr.trim().split(" ");
    const parts = datePart.includes('/') ? datePart.split('/') : datePart.split('-');
  
    if (parts[0].length === 4) {
      // format: YYYY-MM-DD
      return new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      // format: DD/MM/YYYY
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  
  // Handle filter dropdown
  document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('filterSelect');
  
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        const selected = filterSelect.value;
        if (selected === 'name-asc') sortTable('name', 'asc');
        else if (selected === 'name-desc') sortTable('name', 'desc');
        else if (selected === 'email-asc') sortTable('email', 'asc');
        else if (selected === 'email-desc') sortTable('email', 'desc');
        else if (selected === 'date-asc') sortTable('date', 'asc');
        else if (selected === 'date-desc') sortTable('date', 'desc');
      });
    }
  });
  
  
  
  
  
  // add moderator
  document.getElementById("moderatorAvatar").addEventListener("change", function() {
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
  
  document.getElementById("moderatorForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const moderatorForm = document.getElementById("moderatorForm");
    const moderatorTableBody = document.querySelector(".table tbody");
    const avatarPreview = document.getElementById("avatarPreview");
    const avatarInput = document.getElementById("moderatorAvatar");
    const name = document.getElementById("moderatorName").value;
    const email = document.getElementById("moderatorEmail").value;
    const password = document.getElementById("moderatorPassword").value;
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
        const response = JSON.parse(xhr.responseText);
        const savedModerator = response.moderator;
        
        // Create a temporary image to check if the URL is valid
        let imageUrl;
        
        if (avatarFile) {
          // If we uploaded a file, use a local object URL temporarily
          imageUrl = URL.createObjectURL(avatarFile);
        } else if (savedModerator.moderatorImage) {
          // If the response has an image URL, use it
          if (savedModerator.moderatorImage.startsWith('http')) {
            imageUrl = savedModerator.moderatorImage;
          } else {
            // If it's a relative path, prepend the base URL
            imageUrl = `http://localhost:3000/${savedModerator.moderatorImage}`;
          }
        } else {
          // Fallback to default image
          imageUrl = "../../assets/images/dashboard/supermoderator.jpg";
        }
  
        const newRow = document.createElement("tr");
        // Add the moderator ID as a data attribute
        newRow.dataset.moderatorId = savedModerator._id;
        newRow.innerHTML = `<td><img src="${imageUrl}" alt="avatar" class="rounded-circle object-fit-cover" width="32" height="32"></td>
          <td>${savedModerator.moderatorName}</td>
          <td>${savedModerator.email}</td>
          <td>${new Date().toLocaleString()}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-bs-toggle="modal" data-bs-target="#editModeratorModal">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-delete">
                <i class="bi bi-trash"></i>
            </button>
          </td>`;
        moderatorTableBody.insertBefore(newRow, moderatorTableBody.firstChild);
        
        moderatorForm.reset(); 
        avatarPreview.src = "../../assets/images/dashboard/superadmin.jpg"; // Reset to default image
  
        const modal = bootstrap.Modal.getInstance(document.getElementById("addModeratorModal"));
        modal.hide();
  
        console.log("Moderator added successfully");
      } else {
        alert("Error adding moderator.");
        console.log(xhr.responseText);
      }
    };
  
    xhr.onerror = function () {
      alert("Network error during request.");
    };
  
    xhr.send(formData);
  });
  // end add moderator
  
  
  // Delete moderator 
  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-delete")) {
      const row = e.target.closest("tr");
      const moderatorId = row.dataset.moderatorId;
      
      if (!moderatorId) {
        console.error("Moderator ID not found");
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
            row.remove();
            console.log("Moderator deleted successfully");
          } else {
            alert("Error deleting moderator.");
            console.log(xhr.responseText);
          }
        };
        
        xhr.onerror = function () {
          alert("Network error during request.");
        };
        
        xhr.send();
      }
    }
  });
  // end delete moderator
  
  
  // edit moderator
  let editingRow = null;
  let newEditAvatarDataURL = null;
  
  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-edit")) {
      editingRow = e.target.closest("tr");
      const moderatorId = editingRow.dataset.moderatorId;
      
      if (!moderatorId) {
        console.error("Moderator ID not found");
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
  
  document.getElementById("editModeratorForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (editingRow) {
      const moderatorId = editingRow.dataset.moderatorId;
      
      if (!moderatorId) {
        console.error("Moderator ID is missing or null");
        alert("Error: Moderator ID is missing. Cannot update.");
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
              
              // Update the row in the table
              editingRow.cells[1].textContent = updatedName;
              editingRow.cells[2].textContent = updatedEmail;
              
              // Update the avatar if we have a new one
              if (newEditAvatarDataURL) {
                editingRow.querySelector("img").src = newEditAvatarDataURL;
              }
              
              // Close the modal
              const editModal = bootstrap.Modal.getInstance(document.getElementById("editModeratorModal"));
              editModal.hide();
              
              console.log("Moderator updated successfully:", response);
            } catch (error) {
              console.error("Error parsing response:", error);
              alert("Error updating moderator: " + error.message);
            }
          } else {
            console.error("Error updating moderator:", xhr.status, xhr.responseText);
            alert("Error updating moderator. Status: " + xhr.status);
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
              
              // Update the row in the table
              editingRow.cells[1].textContent = updatedName;
              editingRow.cells[2].textContent = updatedEmail;
              
              // Close the modal
              const editModal = bootstrap.Modal.getInstance(document.getElementById("editModeratorModal"));
              editModal.hide();
              
              console.log("Moderator updated successfully:", response);
            } catch (error) {
              console.error("Error parsing response:", error);
              alert("Error updating moderator: " + error.message);
            }
          } else {
            console.error("Error updating moderator:", xhr.status, xhr.responseText);
            alert("Error updating moderator. Status: " + xhr.status);
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
  //end edit moderator
  
  
  
  //get moderators
  function getModerators() {
    const moderatorTableBody = document.querySelector(".table tbody");
    moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';
  
    const token = localStorage.getItem("token");
    if (!token) {
      moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Authentication token not found. Please log in again.</td></tr>';
      return;
    }
  
    const xhr = new XMLHttpRequest();
    // Updated endpoint from /moderator/all to /moderator/shop
    xhr.open("GET", "http://localhost:3000/moderator/shop", true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const moderators = response.moderators || response;
  
        moderatorTableBody.innerHTML = '';
  
        if (Array.isArray(moderators) && moderators.length > 0) {
          moderators.forEach(mod => {
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
        } else {
          moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No moderators found</td></tr>';
        }
      } else {
        console.error("Error fetching moderators:", xhr.responseText);
        moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading moderators</td></tr>';
      }
    };
  
    xhr.onerror = function () {
      console.error("Network error while fetching moderators");
      moderatorTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Network error</td></tr>';
    };
  
    xhr.send();
  }
  document.addEventListener("DOMContentLoaded", function() {
    getModerators(); 
  });
  //end get moderators