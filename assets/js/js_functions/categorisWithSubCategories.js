// Modified category.js file with improved filtering and redirects

document.addEventListener("DOMContentLoaded", function () {
    // Target both buttons and selects with ID "categories-list"
    const categoryButtons = document.querySelectorAll("button#categories-list");
    const categorySelects = document.querySelectorAll("select#categories-list");
    
    console.log("Found categories-list buttons:", categoryButtons.length);
    console.log("Found categories-list selects:", categorySelects.length);
    
    // Get the dropdown containers
    const dropdownLists = document.querySelectorAll(".on-hover-dropdown ul, .responsive-dropdown ul");
    
    // Handle form search submission with category filtering
    setupSearchForms();
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/categorieswithsubcategories", true);
    
    xhr.onload = function () {
        console.log("XHR status:", xhr.status);
        if (xhr.status === 200) {
            try {
                console.log("Response received:", xhr.responseText.substring(0, 100) + "...");
                const data = JSON.parse(xhr.responseText);
                const categories = data?.categories || [];

                console.log("Categories count:", categories.length);
                if (!categories.length) {
                    showError("No categories found");
                    return;
                }

                // Populate the dropdown menus
                dropdownLists.forEach(list => {
                    list.innerHTML = categories.map(cat => `
                        <li class="has-submenus-submenu">
                            <a href="shop.html?category=${cat._id}" class="category-link text-gray-500 text-15 py-12 px-16 flex-align gap-8 rounded-0" data-category-id="${cat._id}">
                                <span class="text-xl d-flex"><i class="ph ph-dot-outline"></i></span>
                                <span>${cat.categoryName}</span>
                                <span class="icon text-md d-flex ms-auto"><i class="ph ph-caret-right"></i></span>
                            </a>
                            <div class="submenus-submenu py-16">
                                <h6 class="text-lg px-16 submenus-submenu__title">${cat.categoryName}</h6>
                                <ul class="submenus-submenu__list max-h-300 overflow-y-auto scroll-sm">
                                    ${cat.subCategories?.length
                                        ? cat.subCategories.map(sub => `<li><a href="shop.html?subcategory=${sub._id}&category=${cat._id}" class="subcategory-link" data-subcategory-id="${sub._id}" data-category-id="${cat._id}">${sub.name}</a></li>`).join("")
                                        : '<li><a href="#">No subcategories</a></li>'}
                                </ul>
                            </div>
                        </li>
                    `).join('');
                    
                    // Add direct click handlers to category links
                    list.querySelectorAll('.category-link').forEach(link => {
                        link.addEventListener('click', function(e) {
                            // Only do direct navigation in desktop mode
                            if (window.innerWidth >= 992) {
                                e.preventDefault();
                                const categoryId = this.getAttribute('data-category-id');
                                if (categoryId) {
                                    window.location.href = `shop.html?category=${categoryId}`;
                                }
                            }
                        });
                    });
                    
                    // Add direct click handlers to subcategory links
                    list.querySelectorAll('.subcategory-link').forEach(link => {
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            const subcategoryId = this.getAttribute('data-subcategory-id');
                            const categoryId = this.getAttribute('data-category-id');
                            let url = 'shop.html?';
                            
                            if (subcategoryId) {
                                url += `subcategory=${subcategoryId}`;
                                if (categoryId) {
                                    url += `&category=${categoryId}`;
                                }
                            } else if (categoryId) {
                                url += `category=${categoryId}`;
                            }
                            
                            window.location.href = url;
                        });
                    });
                });

                // Handle select elements - populate with categories
                categorySelects.forEach(select => {
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
                    if (firstOptionClone && firstOptionClone.disabled) {
                        newFirstOption.disabled = true;
                    }
                    select.appendChild(newFirstOption);
                    
                    // Add categories as options
                    categories.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat._id || cat.id || cat.categoryName;
                        option.textContent = cat.categoryName;
                        select.appendChild(option);
                        console.log("Added category to select:", cat.categoryName);
                    });
                    
                    // Add change event listener to handle category selection
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

                // Initialize mobile interactions
                initMobileInteractions();
                
                // Setup category button click handlers
                setupCategoryButtons();
                
                // Setup close buttons for responsive dropdowns
                setupCloseButtons();
                
                // If we're on the shop page, apply filters from URL
                if (window.location.pathname.includes('shop.html')) {
                    applyFiltersFromURL();
                }
                
                // Initialize select2 if it exists
                if (typeof $.fn.select2 === 'function') {
                    try {
                        $('.js-example-basic-single').select2();
                    } catch (e) {
                        console.warn("Error initializing select2:", e);
                    }
                }
                
            } catch (e) {
                console.error("JSON Error:", e);
                showError("Error processing data");
            }
        } else {
            console.error("Server Error:", xhr.status);
            showError(`Server Error: ${xhr.status}`);
        }
    };
    
    xhr.onerror = (error) => {
        console.error("Network Error:", error);
        showError("Network error - check your connection");
        
        // Check if elements were found at all
        console.log("Category buttons found:", categoryButtons.length);
        console.log("Category selects found:", categorySelects.length);
        
        if (categorySelects.length > 0) {
            console.log("Select element example:", categorySelects[0].outerHTML);
        }
    };

    xhr.send();
    
    function showError(msg) {
        console.error("Error:", msg);
        
        // Show error in dropdown lists
        dropdownLists.forEach(list => {
            list.innerHTML = `<li class="px-16 py-12 text-red-500"><i class="ph ph-warning mr-2"></i> ${msg}</li>`;
        });
        
        // Show error for selects
        categorySelects.forEach(select => {
            select.innerHTML = `<option disabled selected>${msg}</option>`;
        });
    }
    
    function initMobileInteractions() {
        document.querySelectorAll('.has-submenus-submenu > a').forEach(link => {
            link.addEventListener('click', e => {
                // Only handle navigation for mobile view
                if (window.innerWidth < 992) {
                    e.preventDefault();
                    const parent = link.parentElement;
                    const submenu = parent.querySelector('.submenus-submenu');
                    
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
    
    function setupCategoryButtons() {
        categoryButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Only handle click for mobile view
                if (window.innerWidth < 992) {
                    e.preventDefault();
                    
                    // Find the closest dropdown
                    const container = this.closest('.category, .category-two');
                    const dropdown = container ? container.querySelector('.responsive-dropdown') : null;
                    
                    if (dropdown) {
                        // Toggle the dropdown visibility
                        const isVisible = dropdown.classList.contains('show');
                        
                        // Close all other dropdowns first
                        document.querySelectorAll('.responsive-dropdown.show').forEach(el => {
                            if (el !== dropdown) {
                                el.classList.remove('show');
                            }
                        });
                        
                        // Toggle this dropdown
                        dropdown.classList.toggle('show', !isVisible);
                    }
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.category, .category-two, .responsive-dropdown')) {
                document.querySelectorAll('.responsive-dropdown.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        });
    }
    
    function setupCloseButtons() {
        document.querySelectorAll('.close-responsive-dropdown').forEach(button => {
            button.addEventListener('click', function() {
                const dropdown = this.closest('.responsive-dropdown');
                if (dropdown) {
                    dropdown.classList.remove('show');
                }
            });
        });
    }
    
    // Function to handle search forms with category filtering
    function setupSearchForms() {
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
                    if (selectedCategory && selectedOption && !selectedOption.disabled && 
                        !selectedOption.textContent.includes("All Categories")) {
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
                
                // Also handle Enter key in search input
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        // Trigger the form submission
                        const submitEvent = new Event('submit', {
                            bubbles: true,
                            cancelable: true
                        });
                        form.dispatchEvent(submitEvent);
                    }
                });
            }
        });
        
        // Also handle standalone search inputs (not in forms)
        const standaloneSearchInputs = document.querySelectorAll('input.search-form__input:not(form *)');
        standaloneSearchInputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const searchTerm = this.value.trim();
                    if (searchTerm) {
                        window.location.href = `shop.html?search=${encodeURIComponent(searchTerm)}`;
                    }
                }
            });
            
            // Add any search button next to the input
            const searchButton = input.nextElementSibling?.querySelector('.search-form__button') || 
                                input.nextElementSibling;
            if (searchButton) {
                searchButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    const searchTerm = input.value.trim();
                    if (searchTerm) {
                        window.location.href = `shop.html?search=${encodeURIComponent(searchTerm)}`;
                    }
                });
            }
        });
    }
    
    // Function to apply filters from URL parameters to the shop page
    function applyFiltersFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category');
            const subcategory = urlParams.get('subcategory');
            const searchTerm = urlParams.get('search');
            
            console.log("URL Parameters:", { category, subcategory, searchTerm });
            
            // If we have search parameters, update the filter UI
            if (category || subcategory || searchTerm) {
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
                    
                    // Highlight the category in the dropdown
                    document.querySelectorAll(`.category-link[data-category-id="${category}"]`).forEach(link => {
                        link.classList.add('active', 'text-main-600');
                        link.classList.remove('text-gray-900');
                    });
                }
                
                // Highlight subcategory in the dropdown if specified
                if (subcategory) {
                    document.querySelectorAll(`.subcategory-link[data-subcategory-id="${subcategory}"]`).forEach(link => {
                        link.classList.add('active', 'text-main-600');
                        
                        // Make sure the parent category submenu is visible
                        const categoryItem = link.closest('.has-submenus-submenu');
                        if (categoryItem) {
                            categoryItem.classList.add('active');
                            const submenu = categoryItem.querySelector('.submenus-submenu');
                            if (submenu && window.innerWidth < 992) {
                                submenu.style.display = 'block';
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
            }
        } catch (error) {
            console.error("Error applying filters from URL:", error);
        }
    }
    
    // Add hover functionality for desktop
    function setupHoverInteractions() {
        if (window.innerWidth >= 992) {
            document.querySelectorAll('.has-submenus-submenu').forEach(item => {
                item.addEventListener('mouseenter', function() {
                    const submenu = this.querySelector('.submenus-submenu');
                    if (submenu) {
                        submenu.style.display = 'block';
                    }
                });
                
                item.addEventListener('mouseleave', function() {
                    const submenu = this.querySelector('.submenus-submenu');
                    if (submenu) {
                        submenu.style.display = '';
                    }
                });
            });
        }
    }
    
    // Call hover setup after a short delay to ensure DOM is ready
    setTimeout(setupHoverInteractions, 100);
    
    // Handle window resize to switch between hover and click behaviors
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Reset all submenus
            document.querySelectorAll('.has-submenus-submenu.active').forEach(item => {
                item.classList.remove('active');
                const submenu = item.querySelector('.submenus-submenu');
                if (submenu) {
                    submenu.style.display = '';
                }
            });
            
            // Close all responsive dropdowns
            document.querySelectorAll('.responsive-dropdown.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
            
            // Re-setup hover interactions for desktop
            setupHoverInteractions();
        }, 250);
    });
});