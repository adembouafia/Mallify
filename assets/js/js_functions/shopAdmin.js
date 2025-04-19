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

//nav-treeview
document.addEventListener('DOMContentLoaded', () => {
    const treeviewToggles = document.querySelectorAll('.nav-item > .nav-link');
    treeviewToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const parentItem = toggle.closest('.nav-item');
            const submenu = parentItem.querySelector('.nav-treeview');
            if (submenu) {
                e.preventDefault(); 
                submenu.classList.toggle('show');
                parentItem.classList.toggle('menu-open');
                const arrow = toggle.querySelector('.nav-arrow');
                if (arrow) {
                    arrow.classList.toggle('bi-chevron-down');
                }
            }
        });
    });

    const activeSubItems = document.querySelectorAll('.nav-treeview .nav-link.active');
    activeSubItems.forEach(item => {
        const treeview = item.closest('.nav-treeview');
        if (treeview) {
            treeview.classList.add('show');
            const parentItem = treeview.closest('.nav-item');
            if (parentItem) {
                parentItem.classList.add('menu-open');
                const arrow = parentItem.querySelector('.nav-arrow');
                if (arrow) {
                    arrow.classList.add('bi-chevron-down');
                }
            }
        }
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


//Slick
document.addEventListener('DOMContentLoaded', function () {
    jQuery('.slider-for').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      fade: false,
      asNavFor: '.slider-nav'
    });
  
    jQuery('.slider-nav').slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      asNavFor: '.slider-for',
      dots: false,
      focusOnSelect: true
    });
});


//Popup edit product
document.querySelectorAll('.editProductBtn').forEach(button => {
    button.addEventListener('click', function () {
      // Get the row if we are in the table
      const row = button.closest('tr');
  
      // Extract existing data from the row or fallback to default (in case it's in product details)
      const productName = row?.querySelector('a.text-dark')?.innerText || document.querySelector('h2.fw-bold')?.innerText || '';
      const productID = row?.querySelector('td.fw-semibold')?.innerText || document.querySelector('p.text-muted')?.innerText?.split(': ')[1] || '';
      const price = row?.querySelector('td:nth-child(3)')?.innerText?.replace('$', '') || document.querySelector('h4.text-danger')?.innerText?.replace('$', '') || '';
      const category = row?.querySelector('td:nth-child(5) .badge')?.innerText || document.querySelectorAll('p.mb-2')[0]?.innerText?.split(': ')[1] || '';
      const availability = row ? 'In Stock' : document.querySelectorAll('p.mb-2')[1]?.innerText?.split(': ')[1] || '';
      const stock = row?.querySelector('td:nth-child(4) .text-dark')?.innerText || document.querySelectorAll('p.mb-2')[2]?.innerText?.match(/\d+/)?.[0] || '';
      const description = document.querySelector('p:last-of-type')?.innerText || '';
  
      Swal.fire({
        title: 'Edit Product',
        width: '70em',
        html:
          `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div>
              <label>Product Name</label>
              <input type="text" id="productName" class="swal2-input" value="${productName}">
            </div>
            <div>
              <label>Product ID</label>
              <input type="text" id="productID" class="swal2-input" value="${productID}">
            </div>
            <div>
              <label>Price ($)</label>
              <input type="number" id="productPrice" class="swal2-input" value="${price}">
            </div>
            <div>
              <label>Category</label>
              <input type="text" id="productCategory" class="swal2-input" value="${category}">
            </div>
            <div>
              <label>Availability</label>
              <input type="text" id="productAvailability" class="swal2-input" value="${availability}">
            </div>
            <div>
              <label>Stock</label>
              <input type="number" id="productStock" class="swal2-input" value="${stock}">
            </div>
          </div>
          <div style="margin-top: 1rem;">
            <label>Description</label>
            <textarea id="productDescription" class="swal2-textarea" style="width: 80%; min-height: 120px;">${description}</textarea>
          </div>`,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        customClass: {
          popup: 'swal2-edit-product'
        },
        preConfirm: () => {
          const name = document.getElementById('productName').value;
          const id = document.getElementById('productID').value;
          const price = document.getElementById('productPrice').value;
          const category = document.getElementById('productCategory').value;
          const availability = document.getElementById('productAvailability').value;
          const stock = document.getElementById('productStock').value;
          const description = document.getElementById('productDescription').value;
  
          // === Update table row if present ===
          if (row) {
            row.querySelector('a.text-dark').innerText = name;
            row.querySelector('td.fw-semibold').innerText = id;
            row.querySelector('td:nth-child(3)').innerText = `$${price}`;
            row.querySelector('td:nth-child(5) .badge').innerText = category;
            row.querySelector('td:nth-child(4)').innerHTML = `
              <div class="text-muted">
                <span class="fw-semibold text-dark">${stock}</span><br> Item Left<br>
                <span>155 Sold</span>
              </div>`;
          }
  
          // === Update product details if visible ===
          if (document.querySelector('h2.fw-bold')) {
            document.querySelector('h2.fw-bold').innerText = name;
          }
          if (document.querySelector('p.text-muted')) {
            document.querySelector('p.text-muted').innerText = `Product ID: ${id}`;
          }
          if (document.querySelector('h4.text-danger')) {
            document.querySelector('h4.text-danger').innerText = `$${price}`;
          }
          if (document.querySelectorAll('p.mb-2')[0]) {
            document.querySelectorAll('p.mb-2')[0].innerHTML = `<strong>Category:</strong> ${category}`;
          }
          if (document.querySelectorAll('p.mb-2')[1]) {
            document.querySelectorAll('p.mb-2')[1].innerHTML = `<strong>Availability:</strong> ${availability}`;
          }
          if (document.querySelectorAll('p.mb-2')[2]) {
            document.querySelectorAll('p.mb-2')[2].innerHTML = `<strong>Stock:</strong> <span class="badge bg-success">${stock} units</span>`;
          }
          if (document.querySelector('p:last-of-type')) {
            document.querySelector('p:last-of-type').innerText = description;
          }
        }
      });
    });
});



//add moderator 
const moderatorForm = document.getElementById("moderatorForm");
const moderatorTableBody = document.querySelector(".table tbody");
const avatarPreview = document.getElementById("avatarPreview");
const avatarInput = document.getElementById("moderatorAvatar");
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

moderatorForm.addEventListener("submit", function (e) {
e.preventDefault();

const name = document.getElementById("moderatorName").value;
const email = document.getElementById("moderatorEmail").value;
const password = document.getElementById("moderatorPassword").value;
const avatarFile = avatarInput.files[0];

let avatarUrl = "../../assets/images/dashboard/superadmin.jpg";
if (avatarFile) {
    avatarUrl = URL.createObjectURL(avatarFile);
}

passwordList.unshift(password);

const newRow = document.createElement("tr");
newRow.innerHTML = `
    <td><img src="${avatarUrl}" alt="avatar" class="rounded-circle object-fit-cover" width="32" height="32"></td>
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
    </td>
`;

moderatorTableBody.insertBefore(newRow, moderatorTableBody.firstChild);
this.reset();
avatarPreview.src = "../../assets/images/dashboard/superadmin.jpg";

const modal = bootstrap.Modal.getInstance(document.getElementById("addModeratorModal"));
modal.hide();

console.log("Liste des mots de passe :", passwordList);
});


//edit moderator
let editingRow = null;

document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-edit")) {
        editingRow = e.target.closest("tr");

        const fullName = editingRow.cells[1].textContent.trim();
        const email = editingRow.cells[2].textContent.trim();
        const avatarImg = editingRow.querySelector("img");  // Assuming the avatar is an <img> element

        document.getElementById("editName").value = fullName;
        document.getElementById("editEmail").value = email;

        // If there's an avatar image in the row, show it in the modal
        if (avatarImg) {
            document.getElementById("avatarPreview").src = avatarImg.src;
        } else {
            document.getElementById("avatarPreview").src = "";  // Clear avatar preview if no avatar exists
        }

        const editModal = new bootstrap.Modal(document.getElementById("editModeratorModal"));
        editModal.show();
    }
});

// Preview the avatar image when a new one is selected
document.getElementById("editAvatar").addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("avatarPreview").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Submit the form and update the row with new details and avatar
document.getElementById("editModeratorForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (editingRow) {
        // Update name and email
        editingRow.cells[1].textContent = document.getElementById("editName").value;
        editingRow.cells[2].textContent = document.getElementById("editEmail").value;

        // If a new avatar has been selected, update it
        const newAvatarSrc = document.getElementById("avatarPreview").src;
        const avatarImgInRow = editingRow.querySelector("img");

        if (avatarImgInRow) {
            avatarImgInRow.src = newAvatarSrc;  // Update existing avatar image
        } else {
            // If there's no avatar, create a new img tag in the row
            const newAvatarImg = document.createElement("img");
            newAvatarImg.src = newAvatarSrc;
            newAvatarImg.classList.add("rounded-circle");  // Add any classes you need
            editingRow.cells[0].appendChild(newAvatarImg);  // Assuming the avatar is in the first cell
        }

        // Hide the modal after submission
        const editModal = bootstrap.Modal.getInstance(document.getElementById("editModeratorModal"));
        editModal.hide();
    }
});
