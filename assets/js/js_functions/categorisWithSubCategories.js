document.addEventListener("DOMContentLoaded", function () {
    const lists = document.querySelectorAll("#categories-list, .responsive-dropdown__list");

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/categorieswithsubcategories", true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                const categories = data?.categories || [];

                if (!categories.length) return showError("Aucune catégorie trouvée");

                lists.forEach(list => {
                    list.innerHTML = categories.map(cat => `
                        <li class="has-submenus-submenu">
                            <a href="#" class="text-gray-500 text-15 py-12 px-16 flex-align gap-8 rounded-0">
                                <span>${cat.categoryName}</span>
                                <span class="icon text-md d-flex ms-auto"><i class="ph ph-caret-right"></i></span>
                            </a>
                            <div class="submenus-submenu py-16">
                                <h6 class="text-lg px-16 submenus-submenu__title">${cat.categoryName}</h6>
                                <ul class="submenus-submenu__list max-h-300 overflow-y-auto scroll-sm">
                                    ${cat.subCategories?.length
                                        ? cat.subCategories.map(sub => `<li><a href="shop.html?subcategory=${sub._id}">${sub.name}</a></li>`).join("")
                                        : '<li><a href="#">Aucune sous-catégorie</a></li>'}
                                </ul>
                            </div>
                        </li>
                    `).join('');
                });

                initMobileInteractions();
            } catch (e) {
                console.error("Erreur JSON:", e);
                showError("Erreur lors du traitement des données");
            }
        } else {
            console.error("Erreur serveur:", xhr.status);
            showError(`Erreur serveur : ${xhr.status}`);
        }
    };

    xhr.onerror = () => {
        console.error("Erreur réseau");
        showError("Erreur réseau - vérifiez votre connexion");
    };

    xhr.send();

    function showError(msg) {
        lists.forEach(list => {
            list.innerHTML = `<li class="px-16 py-12 text-red-500"><i class="ph ph-warning mr-2"></i> ${msg}</li>`;
        });
    }

    function initMobileInteractions() {
        document.querySelectorAll('.has-submenus-submenu > a').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const parent = link.parentElement;
                const submenu = parent.querySelector('.submenus-submenu');

                if (window.innerWidth < 992) {
                    document.querySelectorAll('.has-submenus-submenu.active').forEach(active => {
                        if (active !== parent) {
                            active.classList.remove('active');
                            active.querySelector('.submenus-submenu').style.display = 'none';
                        }
                    });

                    const isOpen = parent.classList.toggle('active');
                    submenu.style.display = isOpen ? 'block' : 'none';
                }
            });
        });
    }
});
