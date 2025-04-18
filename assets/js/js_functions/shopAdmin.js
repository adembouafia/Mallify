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
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".editProductBtn").forEach(button => {
    button.addEventListener("click", function () {
        let name = "", id = "", price = "", stock = "", category = "", description = "", availability = "";

        const row = this.closest("tr");
        const card = this.closest(".card");

        if (row) {
        // Extract from row in Page 1
        id = row.querySelector("td:nth-child(1)")?.innerText.trim() || "";
        name = row.querySelector("td:nth-child(2) a")?.innerText.trim() || "";
        description = row.querySelector("td:nth-child(2) p")?.innerText.replace("Size: ", "").trim() || "No description";
        price = row.querySelector("td:nth-child(3)")?.innerText.replace("$", "").trim() || "";
        stock = row.querySelector("td:nth-child(4) .fw-semibold")?.innerText.trim() || "";
        category = row.querySelector("td:nth-child(5) span")?.innerText.trim() || "";
        availability = "In Stock"; // Default if not present
        } 
        else if (card) {
        // Extract from product card in Page 2
        name = card.querySelector("h2.fw-bold")?.innerText.trim() || "";
        id = card.querySelector(".text-muted")?.innerText.replace("Product ID: ", "").trim() || "";
        price = card.querySelector("h4.text-danger")?.innerText.replace("$", "").trim() || "";
        category = card.querySelector("p.mb-2:nth-of-type(1)")?.innerText.replace("Category:", "").trim() || "";
        availability = card.querySelector("p.mb-2:nth-of-type(2)")?.innerText.replace("Availability:", "").trim() || "";
        stock = card.querySelector("p.mb-2:nth-of-type(3) .badge")?.innerText.replace(" units", "").trim() || "";
        description = card.querySelector("p:last-of-type")?.innerText.trim() || "";
        }

        // Prefill modal
        document.getElementById("editProductName").value = name;
        document.getElementById("editProductID").value = id;
        document.getElementById("editPrice").value = price;
        document.getElementById("editStock").value = stock;
        document.getElementById("editCategory").value = category;
        document.getElementById("editAvailability").value = availability;
        document.getElementById("editDescription").value = description;

        // Show modal
        const modal = new bootstrap.Modal(document.querySelector(".editProductModal"));
        modal.show();
    });
    });

    document.getElementById("saveProductChanges").addEventListener("click", function () {
    const modal = bootstrap.Modal.getInstance(document.querySelector(".editProductModal"));
    modal.hide();
    });
});
