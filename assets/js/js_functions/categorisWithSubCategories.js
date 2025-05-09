document.addEventListener("DOMContentLoaded", function () {
    const lists = document.querySelectorAll(".responsive-dropdown__list");
    const selects = document.querySelectorAll("select#categories-list");
    
    console.log("Found categories-list selects:", selects.length);  // Debug log
    
    // Handle form search submission with category filtering
    setupSearchForms();
    
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
                    
                    // Store the original value and text (usually "All Categories")
                    const firstOptionValue = firstOptionClone ? firstOptionClone.value : "all";
                    const firstOptionText = firstOptionClone ? firstOptionClone.textContent : "All Categories";
                    
                    // Clear remaining options
                    select.innerHTML = '';
                    
                    // Add back the first option - ensure it's properly set up
                    const newFirstOption = document.createElement('option');
                    newFirstOption.value = firstOptionValue;
                    newFirstOption.textContent = firstOptionText;
                    newFirstOption.selected = true;
                    select.appendChild(newFirstOption);
                      // Add categories as options
                    categories.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat._id || cat.id || cat.categoryName;
                        option.textContent = cat.categoryName;
                        select.appendChild(option);
                        console.log("Added category:", cat.categoryName);  // Debug log
                    });                    // Add change event listener to handle category selection
                    select.addEventListener('change', function() {
                        const selectedValue = this.value;
                        const selectedOption = this.options[this.selectedIndex];
                        const selectedIndex = this.selectedIndex;
                        
                        console.log("Selected option:", selectedOption.textContent, "Value:", selectedValue);
                        
                        // Find closest search form
                        const form = select.closest('form');
                        
                        // If inside a form with search box, don't navigate automatically
                        if (form && form.querySelector('input.search-form__input')) {
                            console.log("Category selected in search form - will filter on search submit");
                            // Focus on the search input to encourage the user to search
                            const searchInput = form.querySelector('input.search-form__input');
                            if (searchInput) {
                                searchInput.focus();
                            }
                        } 
                        // Otherwise navigate directly to shop page with category filter
                        else {
                            if (selectedOption.disabled) {
                                return; // Do nothing for disabled options
                            }
                            
                            // Handle special case for All Categories or first option
                            if (selectedIndex === 0 || selectedOption.textContent.includes("All Categories")) {
                                window.location.href = 'shop.html'; // Navigate to shop without parameters
                            } 
                            // Handle normal category selection
                            else if (selectedValue) {
                                window.location.href = `shop.html?category=${selectedValue}`;
                            }
                        }
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
    }    function initMobileInteractions() {
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
      // Function to handle search forms with category filtering
    function setupSearchForms() {
        // Check if we're on the shop page and should apply filters from URL
        if (window.location.pathname.includes('shop.html')) {
            applyFiltersFromURL();
        }
        
        const searchForms = document.querySelectorAll('form.form-location-wrapper');
        
        searchForms.forEach(form => {
            // Get the category select and search input elements
            const categorySelect = form.querySelector('select#categories-list');
            const searchInput = form.querySelector('input.search-form__input');
            
            if (categorySelect && searchInput) {
                console.log("Setting up search form with category:", form);
                
                // Override the form submit behavior
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const selectedCategory = categorySelect.value;
                    const searchTerm = searchInput.value.trim();
                    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
                    
                    // Log the search parameters
                    console.log("Search form submitted:", { 
                        category: selectedOption.textContent, 
                        categoryId: selectedCategory, 
                        searchTerm 
                    });
                    
                    // Build the search URL
                    let searchUrl = 'shop.html';
                    const params = [];
                    
                    // Add category parameter if not "All Categories"
                    if (selectedCategory && selectedOption && !selectedOption.disabled) {
                        params.push(`category=${encodeURIComponent(selectedCategory)}`);
                    }
                    
                    // Add search term parameter if provided
                    if (searchTerm) {
                        params.push(`search=${encodeURIComponent(searchTerm)}`);
                    }
                    
                    // Add parameters to URL
                    if (params.length > 0) {
                        searchUrl += '?' + params.join('&');
                    }
                    
                    // Navigate to shop page with filters
                    console.log("Redirecting to:", searchUrl);
                    window.location.href = searchUrl;
                });
            }
        });
    }
    
    // Function to apply filters from URL parameters to the shop page
    function applyFiltersFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category');
            const searchTerm = urlParams.get('search');
            
            console.log("URL Parameters:", { category, searchTerm });
            
            // If we have search parameters, update the filter UI
            if (category || searchTerm) {
                // Set category dropdown if a category is specified
                if (category) {
                    const categorySelects = document.querySelectorAll('select#categories-list');
                    categorySelects.forEach(select => {
                        // Find the option matching the category ID
                        for (let i = 0; i < select.options.length; i++) {
                            if (select.options[i].value === category) {
                                select.selectedIndex = i;
                                break;
                            }
                        }
                    });
                }
                
                // Set search input if a search term is specified
                if (searchTerm) {
                    const searchInputs = document.querySelectorAll('input.search-form__input');
                    searchInputs.forEach(input => {
                        input.value = decodeURIComponent(searchTerm);
                    });
                }
                
                // Call function to filter products based on these parameters
                // This would typically be implemented as part of the shop.html page
                if (typeof filterProducts === 'function') {
                    filterProducts(category, searchTerm);
                } else {
                    console.log("filterProducts function not available - server-side filtering will be used");
                }
            }
        } catch (error) {
            console.error("Error applying filters from URL:", error);
        }
    }
});
