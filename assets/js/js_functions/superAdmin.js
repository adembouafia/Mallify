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
const adminForm = document.getElementById("adminForm");
  const adminTableBody = document.querySelector(".table tbody");
  const avatarPreview = document.getElementById("avatarPreview");
  const avatarInput = document.getElementById("adminAvatar");
  const passwordList = [];
   avatarInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        avatarPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  adminForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("adminName").value;
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;
    const avatarFile = avatarInput.files[0];
    let avatarUrl = "../../assets/images/dashboard/devoloper1.jpg";
    if (avatarFile) {
      avatarUrl = URL.createObjectURL(avatarFile);
    }
    passwordList.unshift(password);
    const newRow = document.createElement("tr");
    newRow.innerHTML = `<td><img src="${avatarUrl}" alt="avatar" class="rounded-circle object-fit-cover" width="32" height="32"></td>
      <td>${name}</td>
      <td>${email}</td>
      <td>${new Date().toLocaleString()}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;
    adminTableBody.insertBefore(newRow, adminTableBody.firstChild);
    this.reset();
    avatarPreview.src = "../../assets/images/dashboard/superadmin.jpg";

    const modal = bootstrap.Modal.getInstance(document.getElementById("addAdminModal"));
    modal.hide();
    console.log("Liste des mots de passe :", passwordList);
  });

  // delete admin
  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-delete")) {
      const row = e.target.closest("tr");
      if (confirm("Are you sure you want to delete this admin?")) {
        row.remove();
      }
    }
  });

  // edit admin
  let editingRow = null;

document.addEventListener("click", function (e) {
  if (e.target.closest(".btn-edit")) {
    editingRow = e.target.closest("tr");
    const fullName = editingRow.cells[1].textContent.trim();
    const email = editingRow.cells[2].textContent.trim();

    document.getElementById("editName").value = fullName;
    document.getElementById("editEmail").value = email;
  }
});

document.getElementById("editAdminForm").addEventListener("submit", function (e) {
  e.preventDefault();
  if (editingRow) {
    editingRow.cells[1].textContent = document.getElementById("editName").value;
    editingRow.cells[2].textContent = document.getElementById("editEmail").value;

    const editModal = bootstrap.Modal.getInstance(document.getElementById("editAdminModal"));
    editModal.hide();
  }
});


  
