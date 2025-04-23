// Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
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

  const pushMenuInstances = [];

  document.querySelectorAll(SELECTOR_SIDEBAR_TOGGLE).forEach(btn => {
    const pushMenu = new PushMenu(btn);
    pushMenuInstances.push(pushMenu);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      pushMenu.toggle();
    });
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector(SELECTOR_APP_SIDEBAR);
    const toggleBtn = document.querySelector(SELECTOR_SIDEBAR_TOGGLE);

    const isClickInsideSidebar = sidebar.contains(e.target);
    const isClickOnToggle = toggleBtn.contains(e.target);

    if (
      !isClickInsideSidebar &&
      !isClickOnToggle &&
      document.body.classList.contains(CLASS_NAME_SIDEBAR_OPEN)
    ) {
      document.body.classList.remove(CLASS_NAME_SIDEBAR_OPEN);
      document.body.classList.add(CLASS_NAME_SIDEBAR_COLLAPSE);
    }
  });
});


// nav-treeview
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

// report cards toggle
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
          document.documentElement.classList.toggle('maximized-card');
      });
  });
});

// Slick carousel
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

// Popup edit product
document.querySelectorAll('.editProductBtn').forEach(button => {
  button.addEventListener('click', function () {
      const row = button.closest('tr');
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
          html: `
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
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
              </div>
          `,
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

              if (row) {
                  row.querySelector('a.text-dark').innerText = name;
                  row.querySelector('td.fw-semibold').innerText = id;
                  row.querySelector('td:nth-child(3)').innerText = `$${price}`;
                  row.querySelector('td:nth-child(5) .badge').innerText = category;
                  row.querySelector('td:nth-child(4)').innerHTML = `
                      <div class="text-muted">
                          <span class="fw-semibold text-dark">${stock}</span><br> Item Left<br>
                          <span>155 Sold</span>
                      </div>
                  `;
              }

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

// add moderator
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
          <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-bs-toggle="modal" data-bs-target="#editModeratorModal">
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
  if (modal) modal.hide();

  console.log("Liste des mots de passe :", passwordList);
});

let editingRow = null;
let newEditAvatarDataURL = null;
document.addEventListener("click", function (e) {
  if (e.target.closest(".btn-edit")) {
    editingRow = e.target.closest("tr");

    const fullName = editingRow.cells[1].textContent.trim();
    const email = editingRow.cells[2].textContent.trim();
    const avatarImg = editingRow.querySelector("img")?.src || "";

    document.getElementById("editName").value = fullName;
    document.getElementById("editEmail").value = email;
    document.getElementById("editAvatarPreview").src = avatarImg;
    document.getElementById("editAvatar").value = "";
    newEditAvatarDataURL = null;
  }
});
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
    const newName = document.getElementById("editName").value;
    const newEmail = document.getElementById("editEmail").value;

    editingRow.cells[1].textContent = newName;
    editingRow.cells[2].textContent = newEmail;

    if (newEditAvatarDataURL) {
      const avatarImg = editingRow.querySelector("img");
      if (avatarImg) {
        avatarImg.src = newEditAvatarDataURL;
      }
    }
    const editModal = bootstrap.Modal.getInstance(document.getElementById("editModeratorModal"));
    editModal.hide();
  }
});
  // delete admin
  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-delete")) {
      const row = e.target.closest("tr");
      if (confirm("Are you sure you want to delete this Moderator ?")) {
        row.remove();
      }
    }
  });
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

// add product 
document.getElementById("addProductForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const form = e.target;

  // Build product object
  const product = {
    productId: form.productId.value,
    productName: form.productName.value,
    productPrice: parseFloat(form.productPrice.value),
    productCategory: form.productCategory.value,
    Availability: form.Availability.value === "true",
    Stock: parseInt(form.Stock.value, 10),
    description: form.description.value,
    mainImageFile: form.mainImage.files[0],
    otherImageFiles: Array.from(form.otherImages.files),
  };

  // Create a URL for the main image
  const mainImageURL = URL.createObjectURL(product.mainImageFile);

  // Create new row
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td class="fw-semibold">${product.productId}</td>
    <td>
      <div class="d-flex align-items-center gap-3">
        <div class="bg-light rounded">
          <img src="${mainImageURL}" alt="${product.productName}" style="width:70px; height:70px;">
        </div>
        <div>
          <a href="#!" class="text-dark fw-semibold text-decoration-none">
            ${product.productName}
          </a>
          <p class="text-muted mb-0 mt-1 small">${product.description}</p>
        </div>
      </div>
    </td>
    <td>$${product.productPrice.toFixed(2)}</td>
    <td>
      <div class="text-muted">
        <span class="fw-semibold text-dark">${product.Stock}</span><br> Item Left<br>
        <span>0 Sold</span>
      </div>
    </td>
    <td><span class="badge bg-soft-primary text-primary">${product.productCategory}</span></td>
    <td>
      <div class="d-flex align-items-center gap-1">
        <span class="badge bg-light text-warning">
          <i class="bi bi-star-fill me-1"></i> 0.0
        </span>
        <span class="text-muted small">0 Review</span>
      </div>
    </td>
    <td>
      <a href="detailsProduct.html" class="btn btn-sm bg-light text-secondary" title="View Details">
        <i class="bi bi-eye"></i>
      </a>
      <button class="btn btn-sm bg-light text-warning" title="Edit">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm bg-light text-danger" title="Delete">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;

  const tbody = document.getElementById("productTableBody");

  // 🚀 Ajout au début du tbody (TOP of table)
  if (tbody.firstChild) {
    tbody.insertBefore(newRow, tbody.firstChild);
  } 
  // Reset form and close modal
  form.reset();
  bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
});
