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
    Swal.fire({
        title: 'Edit Product',
        width: '70em',
        html: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div>
            <label>Product Name</label>
            <input type="text" id="productName" class="swal2-input" value="Modern Office Desk">
            </div>
            <div>
            <label>Product ID</label>
            <input type="text" id="productID" class="swal2-input" value="#123456">
            </div>
            <div>
            <label>Price ($)</label>
            <input type="number" id="productPrice" class="swal2-input" value="80.00">
            </div>
            <div>
            <label>Category</label>
            <input type="text" id="productCategory" class="swal2-input" value="Office Furniture">
            </div>
            <div>
            <label>Availability</label>
            <input type="text" id="productAvailability" class="swal2-input" value="In Stock">
            </div>
            <div>
            <label>Stock</label>
            <input type="number" id="productStock" class="swal2-input" value="12">
            </div>
        </div>
        <div style="margin-top: 1rem;">
            <label>Description</label>
            <textarea id="productDescription" class="swal2-textarea" style="width: 80%; min-height: 120px;">
            High quality wooden office desk with metal legs, perfect for home or workplace setups.
            </textarea>
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

        document.querySelector('h2.fw-bold').innerText = name;
        document.querySelector('.text-muted').innerText = `Product ID: ${id}`;
        document.querySelector('h4.text-danger').innerText = `$${price}`;
        document.querySelectorAll('p.mb-2')[0].innerHTML = `<strong>Category:</strong> ${category}`;
        document.querySelectorAll('p.mb-2')[1].innerHTML = `<strong>Availability:</strong> ${availability}`;
        document.querySelectorAll('p.mb-2')[2].innerHTML = `<strong>Stock:</strong> <span class="badge bg-success">${stock} units</span>`;
        document.querySelector('p:last-of-type').innerText = description;
        }
    });
    });
});

