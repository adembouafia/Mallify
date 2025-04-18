function showContent(sectionId) {
    const menuItems = document.querySelectorAll('.profile-nav__menu li');
    menuItems.forEach(item => item.classList.remove('active'));
    const clickedMenuItem = document.getElementById(sectionId);
    clickedMenuItem.classList.add('active');
    const contentSections = document.querySelectorAll('#content-container > div');
    contentSections.forEach(section => {
    section.style.display = 'none';
    });
    const contentToShow = document.getElementById(`${sectionId}-content`);
    if (contentToShow) {
    contentToShow.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showContent('profile-info');
    const sidebar = document.getElementById("customProfileSidebar");
    const toggleButton = document.getElementById("toggleCustomSidebar");
    document.addEventListener('click', function (event) {
    const clickedInsideSidebar = sidebar.contains(event.target);
    const clickedToggleButton = toggleButton.contains(event.target);
    if (clickedToggleButton) {
        sidebar.classList.toggle("active");
    } else if (!clickedInsideSidebar) {
        sidebar.classList.remove("active");
    }
    });
    document.querySelectorAll('#customProfileSidebar .profile-nav__menu a').forEach(link => {
    link.addEventListener('click', () => {
        sidebar.classList.remove("active");
    });
    });
// change password JS
    document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        this.classList.toggle('ph-eye-slash');
        this.classList.toggle('ph-eye');
    });
    });
// Wishlist JS
    const wishlistContainer = document.getElementById('wishlist-container');
    const products = [
    {
        id: 1,
        title: "iPhone 15 Pro Max",
        description: "256 Go, 5G, 6.7\" Super Retina XDR",
        price: "3 522 DT",
        image: "../assets/images/products/15PROmax.png"
    },
    {
        id: 2,
        title: "'Old Money' Oversized Sweat-shirt - Beige",
        description: "100% Cotton, Unisex",
        price: "79 DT",
        image: "../assets/images/products/oversize.png"
    }
    ];
    function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'wishlist-card';
    card.innerHTML = `
        <div class="product-image">
        <img src="${product.image}" alt="${product.title}" style="width: 100%; height: 200px; object-fit: contain;">
        </div>
        <div class="card-content">
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        <div class="price">${product.price}</div>
        </div>
        <div class="card-actions">
        <a href="cart.html" class="buy-btn"><i class="ph ph-shopping-cart"></i> Acheter</a>
        <button class="delete-btn"><i class="ph ph-trash"></i></button>
        </div>
    `;
    return card;
    }
    products.forEach(product => {
    wishlistContainer.appendChild(createProductCard(product));
    });
    wishlistContainer.addEventListener('click', function (e) {
    if (e.target.closest('.delete-btn')) {
        if (confirm('Are you sure you want to remove this item from your wishlist?')) {
        e.target.closest('.wishlist-card').remove();
        }
    }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const fields = ["firstName", "lastName", "email", "phone", "birthday", "gender"];

    // When modal opens, prefill inputs
    document.getElementById("editProfileModal").addEventListener("show.bs.modal", function () {
        fields.forEach(field => {
            document.getElementById("edit" + capitalize(field)).value = document.getElementById(field).value;
        });
    });

    // Save changes and update the readonly fields
    document.getElementById("saveChanges").addEventListener("click", function () {
        fields.forEach(field => {
            document.getElementById(field).value = document.getElementById("edit" + capitalize(field)).value;
        });
        const modal = bootstrap.Modal.getInstance(document.getElementById("editProfileModal"));
        modal.hide();
    });

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});

