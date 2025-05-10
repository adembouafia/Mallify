function createshopCard(shop) {
    const shopName = shop.shopName || 'Shop Name not available';
    const shopLogo = shop.shopLogo ? `http://localhost:3000/uploads/${shop.shopLogo}` : '../assets/images/shops/fashion_logo.png';
    const shopId = shop._id || 'Shop ID not available';
    const shopDescription = shop.shopdescription || 'Shop description not available';
    const shopAddress = shop.adresse || 'Shop address not available';
    const shopEmail = shop.vendor?.email || 'Shop email not available';
    const shopPhone = shop.vendor?.phone || 'Shop phone not available';
    
    // Create column element to hold the shop card - changed from col-lg-4 to col-lg-3 for 4 cards per row
    const colDiv = document.createElement('div');
    colDiv.className = 'col-lg-3 col-md-6 col-sm-12 mb-4';

    const shopCard = document.createElement('div');    
    shopCard.className = 'vendors-two-item rounded-12 overflow-hidden bg-color-three border border-neutral-50 hover-border-main-two-600 transition-2 justify-content-between h-100';
    
    shopCard.innerHTML = `
        <div class="vendors-two-item__top bg-overlay style-two position-relative">
            <div class="vendors-two-item__thumbs h-210">
                <img src="../assets/images/sellers/background.jpg" alt="cover_image" class="cover-img"> 
            </div>
            <div class="position-absolute top-0 inset-inline-start-0 w-100 h-100 p-24 z-1 d-flex flex-column mt-16">
                <div class="d-flex align-items-center justify-content-center">
                    <span class="w-80 h-80 flex-center bg-white rounded-circle flex-shrink-0 overflow-hidden">
                        <img src="${shopLogo || '../assets/images/sellers/fashion_logo.png'}" alt="${shopName} logo" class="w-100 h-100 object-fit-cover rounded-circle">
                    </span>
                </div>

                <div class="mt-16">
                    <h6 class="text-white fw-semibold mb-12 text-center">
                        <a href="vendor-details.html?id=${shopId}">${shopName}</a>
                    </h6>
                </div>
            </div>
        </div>
        <div class="vendors-two-item__content p-24 flex-grow-1">
            <div class="d-flex flex-column gap-14">
                <div class="flex-align gap-8">
                    <span class="flex-center text-main-two-600 text-2xl flex-shrink-0">
                        <i class="ph ph-map-pin-line"></i>
                    </span>
                    <p class="text-md text-gray-900">${shopAddress || 'Address not available'}</p>
                </div>
                <div class="flex-align gap-8">
                    <span class="flex-center text-main-two-600 text-2xl flex-shrink-0">
                        <i class="ph ph-envelope-simple"></i>
                    </span>
                    <a href="mailto:${shopEmail || '#'}" class="text-md text-gray-900 hover-text-main-60">${shopEmail || 'Email not available'}</a>
                </div>
                <div class="flex-align gap-8">
                    <span class="flex-center text-main-two-600 text-2xl flex-shrink-0">
                        <i class="ph ph-phone"></i>
                    </span>
                    <a href="tel:${shopPhone || '#'}" class="text-md text-gray-900 hover-text-main-60">${shopPhone || 'Phone not available'}</a>
                </div>
                ${shopDescription ? `
                <div class="flex-align gap-8 mt-2">
                    <span class="flex-center text-main-two-600 text-2xl flex-shrink-0">
                        <i class="ph ph-info"></i>
                    </span>
                    <p class="text-md text-gray-900">${shopDescription}</p>
                </div>` : ''}
            </div>
            <a href="vendor-details.html?id=${shopId}" class="btn bg-neutral-600 hover-bg-neutral-700 text-white py-12 px-24 rounded-8 flex-center gap-8 fw-medium mt-24">
                Visit Store
                <span class="text-xl d-flex text-main-two-600"> <i class="ph ph-storefront"></i></span>
            </a>
        </div>
    `;
    
    colDiv.appendChild(shopCard);
    return colDiv;
}

// Global variables for pagination
let currentPage = 1;
let shopsPerPage = 12;
let allApprovedShops = [];

function fetchAndPopulateshops() {
    const apiUrl = 'http://localhost:3000/shop/get';
    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const shops = JSON.parse(xhr.responseText);
                    
                    if (Array.isArray(shops)) {
                        if (shops.length === 0) {
                            displayNoShopsMessage('No shops found');
                        } else {
                            allApprovedShops = shops.filter(shop => shop.status === "Approved");
                            
                            // Update result count
                            document.querySelector('.text-gray-600.text-md.flex-shrink-0 .text-neutral-900.fw-semibold').textContent = allApprovedShops.length;
                            
                            if (allApprovedShops.length === 0) {
                                displayNoShopsMessage('No approved shops found');
                            } else {
                                setupPagination();
                                displayShopsByPage(currentPage);
                            }
                        }
                    } else {
                        console.error('API response is not an array:', shops);
                        displayNoShopsMessage('Error: Invalid data format received from server');
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    displayNoShopsMessage('Error: Could not parse server response');
                }
            } else {
                console.error('Request failed with status:', xhr.status);
                displayNoShopsMessage('Error: Failed to fetch shops data');
            }
        }
    };
    xhr.onerror = function() {
        console.error('Network error occurred');
        displayNoShopsMessage('Error: Network error occurred');
    };
    xhr.send();
}

// Display shops for the current page
function displayShopsByPage(page) {
    const startIndex = (page - 1) * shopsPerPage;
    const endIndex = startIndex + shopsPerPage;
    const shopsToDisplay = allApprovedShops.slice(startIndex, endIndex);
    
    const shopsContainer = document.getElementById('shops-container');
    const oldRow = document.querySelector('#shops-container .row');
    const isListView = oldRow && oldRow.classList.contains('list-view');
    
    shopsContainer.innerHTML = '';
    
    // Create a row div to hold the shop cards
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    
    // Preserve list view class if it was active
    if (isListView) {
        rowDiv.classList.add('list-view');
    }
    
    shopsToDisplay.forEach(shop => {
        const shopCard = createshopCard(shop);
        
        if (isListView) {
            shopCard.className = shopCard.className.replace('col-lg-3', 'col-lg-6');
        }
        
        rowDiv.appendChild(shopCard);
    });
    
    shopsContainer.appendChild(rowDiv);
}

// Setup pagination based on total shops
function setupPagination() {
    const paginationContainer = document.querySelector('.pagination');
    const totalPages = Math.ceil(allApprovedShops.length / shopsPerPage);
    
    // Initialize prev/next buttons
    let prevButton = paginationContainer.querySelector('li:first-child');
    let nextButton = paginationContainer.querySelector('li:last-child');
    
    if (!prevButton) {
        prevButton = document.createElement('li');
        prevButton.className = 'page-item';
        prevButton.innerHTML = `
            <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="#">
                <i class="bi bi-chevron-left"></i>
            </a>
        `;
    }
    
    if (!nextButton) {
        nextButton = document.createElement('li');
        nextButton.className = 'page-item';
        nextButton.innerHTML = `
            <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="#">
                <i class="bi bi-chevron-right"></i>
            </a>
        `;
    }
    
    // Clear existing pagination
    paginationContainer.innerHTML = '';
    
    // Set initial state of prev/next buttons
    if (currentPage === 1) {
        prevButton.classList.add('disabled');
    } else {
        prevButton.classList.remove('disabled');
    }
    
    if (currentPage === totalPages || totalPages === 0) {
        nextButton.classList.add('disabled');
    } else {
        nextButton.classList.remove('disabled');
    }
    
    paginationContainer.appendChild(prevButton);
    
    // Create page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `
            <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="#">${String(i).padStart(2, '0')}</a>
        `;
        
        pageItem.addEventListener('click', function(e) {
            e.preventDefault();
            currentPage = i;
            updateActivePage();
            updateNavigationButtons(i, totalPages);
            displayShopsByPage(currentPage);
        });
        
        paginationContainer.appendChild(pageItem);
    }
    
    paginationContainer.appendChild(nextButton);
    
    // Add event listeners to prev/next buttons
    prevButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            updateActivePage();
            updateNavigationButtons(currentPage, totalPages);
            displayShopsByPage(currentPage);
        }
    });
    
    nextButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            updateActivePage();
            updateNavigationButtons(currentPage, totalPages);
            displayShopsByPage(currentPage);
        }
    });
}

// Helper function to update prev/next button states
function updateNavigationButtons(currentPage, totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    const prevButton = paginationContainer.querySelector('li:first-child');
    const nextButton = paginationContainer.querySelector('li:last-child');
    
    if (currentPage === 1) {
        prevButton.classList.add('disabled');
    } else {
        prevButton.classList.remove('disabled');
    }
    
    if (currentPage === totalPages || totalPages === 0) {
        nextButton.classList.add('disabled');
    } else {
        nextButton.classList.remove('disabled');
    }
}

// Update active page in pagination
function updateActivePage() {
    const paginationItems = document.querySelectorAll('.pagination .page-item');
    paginationItems.forEach((item, index) => {
        // Skip first and last items (prev/next buttons)
        if (index === 0 || index === paginationItems.length - 1) return;
        
        // Check if this is the current page
        const pageNum = index;
        if (pageNum === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Display error message when no shops are found
function displayNoShopsMessage(message) {
    const shopsContainer = document.getElementById('shops-container');
    shopsContainer.innerHTML = `<div class="col-12"><div class="alert alert-info">${message}</div></div>`;
    
    // Update result count to 0
    document.querySelector('.text-gray-600.text-md.flex-shrink-0 .text-neutral-900.fw-semibold').textContent = '0';
}

// Search functionality
function setupSearch() {
    const searchForm = document.querySelector('.vendor-two .input-group');
    const searchInput = searchForm.querySelector('input[type="text"]');
    
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            // If empty search, show all shops
            displayShopsByPage(currentPage);
            return;
        }
        
        // Filter shops based on search term
        const filteredShops = allApprovedShops.filter(shop => 
            (shop.shopName && shop.shopName.toLowerCase().includes(searchTerm)) ||
            (shop.shopdescription && shop.shopdescription.toLowerCase().includes(searchTerm)) ||
            (shop.adresse && shop.adresse.toLowerCase().includes(searchTerm)) ||
            (shop.vendor && shop.vendor.email && shop.vendor.email.toLowerCase().includes(searchTerm))
        );
        
        // Update result count
        document.querySelector('.text-gray-600.text-md.flex-shrink-0 .text-neutral-900.fw-semibold').textContent = filteredShops.length;
        
        if (filteredShops.length === 0) {
            displayNoShopsMessage('No shops match your search criteria');
        } else {
            const shopsContainer = document.getElementById('shops-container');
            shopsContainer.innerHTML = '';
            
            // Create a row div to hold the shop cards
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            
            filteredShops.forEach(shop => {
                const shopCard = createshopCard(shop);
                rowDiv.appendChild(shopCard);
            });
            
            shopsContainer.appendChild(rowDiv);
        }
    });
    
    // Add reset functionality when search input is cleared
    searchInput.addEventListener('input', function() {
        if (this.value === '') {
            // Reset to show all shops and update pagination
            currentPage = 1;
            displayShopsByPage(currentPage);
            setupPagination();
            document.querySelector('.text-gray-600.text-md.flex-shrink-0 .text-neutral-900.fw-semibold').textContent = allApprovedShops.length;
        }
    });
}

// Grid/List view toggle functionality
function setupViewToggle() {
    const gridButton = document.querySelector('.grid-btn');
    const listButton = document.querySelector('.list-btn');
    const shopsContainer = document.getElementById('shops-container');
    
    // Function to update shop cards layout
    function updateShopCardsLayout(isList) {
        const shopCards = shopsContainer.querySelectorAll('.row > div');
        shopCards.forEach(card => {
            // For list view: change to col-lg-6 (2 per row)
            // For grid view: change to col-lg-3 (4 per row)
            if (isList) {
                card.className = card.className.replace('col-lg-3', 'col-lg-6');
            } else {
                card.className = card.className.replace('col-lg-6', 'col-lg-3');
            }
        });
    }
    
    gridButton.addEventListener('click', function() {
        const rowElement = document.querySelector('#shops-container .row');
        rowElement.classList.remove('list-view');
        updateShopCardsLayout(false); // Switch to grid (4 per row)
        
        gridButton.classList.add('border-main-600', 'text-white', 'bg-main-600');
        listButton.classList.remove('border-main-600', 'text-white', 'bg-main-600');
    });
      listButton.addEventListener('click', function() {
        const rowElement = document.querySelector('#shops-container .row');
        rowElement.classList.add('list-view');
        updateShopCardsLayout(true); // Switch to list (2 per row)
        
        listButton.classList.add('border-main-600', 'text-white', 'bg-main-600');
        gridButton.classList.remove('border-main-600', 'text-white', 'bg-main-600');
        
        // Make sure the width adjustment is applied in list view too
        document.querySelectorAll('.vendors-two-item').forEach(item => {
            item.style.width = 'calc(100% + 20px)';
        });
    });
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchAndPopulateshops();
    setupSearch();
    setupViewToggle();
});