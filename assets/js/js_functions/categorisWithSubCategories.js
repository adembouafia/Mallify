document.addEventListener("DOMContentLoaded", function () {
    const lists = document.querySelectorAll(".responsive-dropdown__list");
    const selects = document.querySelectorAll("select#categories-list");
    
    console.log("Found categories-list selects:", selects.length);  // Debug log
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/categorieswithsubcategories", true);    xhr.onload = function () {
        console.log("XHR status:", xhr.status);  // Debug log
        if (xhr.status === 200) {
            try {
                console.log("Response received:", xhr.responseText.substring(0, 100) + "...");  // Debug log with limited output
                const data = JSON.parse(xhr.responseText);
                const categories = data?.categories || [];

                console.log("Categories count:", categories.length);  // Debug log
                if (!categories.length) {
                    showError("Aucune catégorie trouvée");
                    return;
                }

                // Handle dropdown lists
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
                });                // Handle select elements
                selects.forEach(select => {
                    console.log("Processing select:", select.id);  // Debug log
                    
                    // Keep the first option (All Categories)
                    const firstOption = select.querySelector('option[selected]') || select.querySelector('option:first-child');
                    const firstOptionClone = firstOption ? firstOption.cloneNode(true) : null;
                    
                    // Clear remaining options
                    select.innerHTML = '';
                    
                    // Add back the first option
                    if (firstOptionClone) {
                        select.appendChild(firstOptionClone);
                    }
                    
                    // Add categories as options
                    categories.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat._id || cat.id || cat.categoryName;
                        option.textContent = cat.categoryName;
                        select.appendChild(option);
                        console.log("Added category:", cat.categoryName);  // Debug log
                    });
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
    };    xhr.onerror = (error) => {
        console.error("Erreur réseau:", error);
        showError("Erreur réseau - vérifiez votre connexion");
        
        // Check if select elements were found at all
        console.log("Select elements found:", selects.length);
        if (selects.length > 0) {
            console.log("Select element example:", selects[0].outerHTML);
        }
    };

    xhr.send();    function showError(msg) {
        console.error("Error:", msg);  // Console log the error
        
        // Show error for lists
        lists.forEach(list => {
            list.innerHTML = `<li class="px-16 py-12 text-red-500"><i class="ph ph-warning mr-2"></i> ${msg}</li>`;
        });
        
        // Show error for selects
        selects.forEach(select => {
            select.innerHTML = `<option disabled selected>${msg}</option>`;
        });
        
        // Check if we found any select elements
        if (selects.length === 0) {
            console.error("No elements with ID 'categories-list' found.");
        }
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
