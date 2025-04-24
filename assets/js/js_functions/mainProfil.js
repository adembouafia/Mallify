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



// Edit Profile Info Modal  
document.addEventListener("DOMContentLoaded", function () {
    const fields = [
        { id: "firstName", modalId: "editFirstName" },
        { id: "lastName", modalId: "editLastName" },
        { id: "email", modalId: "editEmail" },
        { id: "phone", modalId: "editPhone" },
        { id: "birthday", modalId: "editBirthday" },
        { id: "gender", modalId: "editGender" },
    ];
    const modalEl = document.getElementById("editProfileModal");
    modalEl.addEventListener("show.bs.modal", function () {
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const modalInput = document.getElementById(field.modalId);
            if (input && modalInput) {
                modalInput.value = input.value;
            }
        });
    });
    document.getElementById("saveChanges").addEventListener("click", function () {
        let firstName = "";
        let lastName = "";
        let email = "";
        fields.forEach(field => {
            const modalInput = document.getElementById(field.modalId);
            const input = document.getElementById(field.id);
            if (input && modalInput) {
                input.value = modalInput.value;
                if (field.id === "lastName") lastName = modalInput.value;
                if (field.id === "firstName") firstName = modalInput.value;
                if (field.id === "email") email = modalInput.value;
            }
        });
        const displayName = document.getElementById("profileName");
        const displayEmail = document.getElementById("profileEmail");
        if (displayName) displayName.textContent = `${lastName} ${firstName} `;
        if (displayEmail) displayEmail.textContent = email;
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    });
}); 


//changer l'image de profile
document.addEventListener("DOMContentLoaded", function () {
    const imageInput = document.getElementById("profileImageInput");
    const profileImage = document.getElementById("profileImage");
    const editBtn = document.getElementById("editImageBtn");

    // Quand on clique sur le bouton crayon, on déclenche le file input
    editBtn.addEventListener("click", function () {
    imageInput.click();
    });

    // Quand une image est choisie, on la met à jour dans la balise <img>
    imageInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
        profileImage.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }
    });
});