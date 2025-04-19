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
modal.hide();

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
// invoice JS
document.addEventListener('DOMContentLoaded', function () {
  const invoiceTimeBtn = document.getElementById('invoiceTimeBtn');
  const invoiceTimeOptions = document.getElementById('invoiceTimeOptions');
  const timeBtnText = document.getElementById('timeBtnText');

  invoiceTimeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    invoiceTimeOptions.classList.toggle('show');
  });

  document.addEventListener('click', function () {
    invoiceTimeOptions.classList.remove('show');
  });

  invoiceTimeOptions.addEventListener('click', function (e) {
    e.stopPropagation();
    if (e.target.dataset.period) {
      const period = e.target.dataset.period;
      document.querySelectorAll('#invoiceTimeOptions div').forEach(option => option.classList.remove('active'));
      e.target.classList.add('active');
      timeBtnText.textContent = e.target.textContent;
      updateInvoiceData(period);
      invoiceTimeOptions.classList.remove('show');
    }
  });

  document.getElementById('invoiceDownloadBtn').addEventListener('click', function () {
    window.print();
  });

  const ordersData = {
    '1001': {
      customer: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Cityville, ST 12345'
      },
      items: [
        { name: 'T-Shirt', price: 25.00, quantity: 2 },
        { name: 'Coffee Mug', price: 12.50, quantity: 1 },
        { name: 'Sticker Pack', price: 5.00, quantity: 3 }
      ],
      shipping: 5.00,
      tax: 10.00
    },
    '1002': {
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '(555) 987-6543',
        address: '456 Oak Ave, Townsville, ST 54321'
      },
      items: [
        { name: 'Hoodie', price: 45.00, quantity: 1 },
        { name: 'Keychain', price: 3.50, quantity: 2 }
      ],
      shipping: 5.00,
      tax: 4.60
    },
    '1003': {
      customer: {
        name: 'Mike Brown',
        email: 'mike@example.com',
        phone: '(555) 555-5555',
        address: '789 Pine Rd, Villagetown, ST 67890'
      },
      items: [
        { name: 'Notebook', price: 15.00, quantity: 1 },
        { name: 'Pen Set', price: 8.00, quantity: 2 },
        { name: 'Desk Organizer', price: 32.00, quantity: 1 }
      ],
      shipping: 8.00,
      tax: 12.75
    }
  };

  const orderModal = document.getElementById('orderModal');
  const modalClose = document.getElementById('modalClose');
  const detailBtns = document.querySelectorAll('.detail-btn');

  detailBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const orderId = this.getAttribute('data-order');
      const order = ordersData[orderId];
      if (!order) return;

      document.getElementById('modalOrderTitle').textContent = `Order #${orderId} Details`;
      document.getElementById('customerName').textContent = order.customer.name;
      document.getElementById('customerEmail').textContent = order.customer.email;
      document.getElementById('customerPhone').textContent = order.customer.phone;
      document.getElementById('customerAddress').textContent = order.customer.address;

      const itemsBody = document.getElementById('modalItemsBody');
      itemsBody.innerHTML = '';
      let subtotal = 0;
      order.items.forEach(item => {
        const row = document.createElement('tr');
        const total = item.price * item.quantity;
        subtotal += total;
        row.innerHTML = `
          <td>${item.name}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>${item.quantity}</td>
          <td>$${total.toFixed(2)}</td>
        `;
        itemsBody.appendChild(row);
      });

      document.getElementById('modalSubtotal').textContent = `$${subtotal.toFixed(2)}`;
      document.getElementById('modalShipping').textContent = `$${order.shipping.toFixed(2)}`;
      document.getElementById('modalTax').textContent = `$${order.tax.toFixed(2)}`;
      document.getElementById('modalTotal').textContent = `$${(subtotal + order.shipping + order.tax).toFixed(2)}`;

      orderModal.style.display = 'block';
    });
  });

  modalClose.addEventListener('click', () => orderModal.style.display = 'none');
  window.addEventListener('click', e => { if (e.target === orderModal) orderModal.style.display = 'none'; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') orderModal.style.display = 'none'; });

  function updateInvoiceData(period) {
    const periodLabels = {
      day: new Date().toLocaleDateString(),
      week: 'Week ' + getWeekNumber(new Date()),
      month: new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
      year: new Date().getFullYear(),
      custom: 'Custom Range'
    };
    document.getElementById('invoicePeriodLabel').textContent = periodLabels[period] || period;
  }

  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Initialize
  updateInvoiceData('month');
});
