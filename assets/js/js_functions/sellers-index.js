function createSellerCard(seller) {
    // Create a div element for the seller card
    const sellerCard = document.createElement('div');
    sellerCard.className = 'col-md-4 col-lg-3 mb-4';
    
    // Use actual data from the seller object
    sellerCard.innerHTML = `
                    <div class="vendors-two-item rounded-12 overflow-hidden bg-color-three border border-neutral-50 hover-border-main-two-600 transition-2">
                        <div class="vendors-two-item__top bg-overlay style-two position-relative">
                            <div class="vendors-two-item__thumbs h-210">
                                <img src="../assets/images/sellers/background.jpg" alt="cover_image" class="cover-img"> 
                            </div>
                            <div class="position-absolute top-0 inset-inline-start-0 w-100 h-100 p-24 z-1 d-flex flex-column justify-content-between">
                                <div class="d-flex align-items-center justify-content-center">
                                    <span class="w-80 h-80 flex-center bg-white rounded-circle flex-shrink-0">
                                        <img src="${seller.shopLogo || '../assets/images/sellers/fashion_logo.png'}" alt="${seller.shopName} logo">
                                    </span>
                                    
                                </div>
                                <div class="mt-16">
                                    <h6 class="text-white fw-semibold mb-12 text-center">
                                        <a href="vendor-details.html?id=${seller._id}">${seller.shopName}</a>
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
                                    <p class="text-md text-gray-900">${seller.adresse || 'Address not available'}</p>
                                </div>
                                <div class="flex-align gap-8">
                                    <span class="flex-center text-main-two-600 text-2xl flex-shrink-0">
                                        <i class="ph ph-envelope-simple"></i>
                                    </span>
                                    <a href="mailto:${seller.email || '#'}" class="text-md text-gray-900 hover-text-main-60">${seller.email || 'Email not available'}</a>
                                </div>
                                <div class="flex-align gap-8">
                                    <span class="flex-center text-main-two-600 text-2xl flex-shrink-0">
                                        <i class="ph ph-phone"></i>
                                    </span>
                                    <a href="tel:${seller.phone || '#'}" class="text-md text-gray-900 hover-text-main-60">${seller.phone || 'Phone not available'}</a>
                                </div>
                                ${seller.shopdescription ? `
                                <div class="flex-align gap-8 mt-2">
                                    <span class="flex-center text-main-two-600 text-2xl flex-shrink-0">
                                        <i class="ph ph-info"></i>
                                    </span>
                                    <p class="text-md text-gray-900">${seller.shopdescription}</p>
                                </div>` : ''}
                            </div>
                            <a href="vendor-details.html?id=${seller._id}" class="btn bg-neutral-600 hover-bg-neutral-700 text-white py-12 px-24 rounded-8 flex-center gap-8 fw-medium mt-24">
                                Visit Store
                                <span class="text-xl d-flex text-main-two-600"> <i class="ph ph-storefront"></i></span>
                            </a>
                        </div>
                    </div>
    `;
    
    return sellerCard;
}

function fetchAndPopulateSellers() {
    const apiUrl = 'http://localhost:3000/shop/get';
    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const sellers = JSON.parse(xhr.responseText);
                    const sellersContainer = document.getElementById('sellers-container');
                    
                    sellersContainer.innerHTML = '';
                    
                    if (Array.isArray(sellers)) {
                        if (sellers.length === 0) {
                            sellersContainer.innerHTML = '<div class="alert alert-info">No sellers found</div>';
                        } else {
                            // Filter only approved shops if needed
                            const approvedSellers = sellers.filter(seller => seller.status === "Approved");
                            
                            if (approvedSellers.length === 0) {
                                sellersContainer.innerHTML = '<div class="alert alert-info">No approved sellers found</div>';
                            } else {
                                approvedSellers.forEach(seller => {
                                    const sellerCard = createSellerCard(seller);
                                    sellersContainer.appendChild(sellerCard);
                                });
                            }
                        }
                    } else {
                        console.error('API response is not an array:', sellers);
                        sellersContainer.innerHTML = '<div class="alert alert-danger">Error: Invalid data format received from server</div>';
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    document.getElementById('sellers-container').innerHTML = 
                        '<div class="alert alert-danger">Error: Could not parse server response</div>';
                }
            } else {
                console.error('Request failed with status:', xhr.status);
                document.getElementById('sellers-container').innerHTML = 
                    '<div class="alert alert-danger">Error: Failed to fetch sellers data</div>';
            }
        }
    };
    xhr.onerror = function() {
        console.error('Network error occurred');
        document.getElementById('sellers-container').innerHTML = 
            '<div class="alert alert-danger">Error: Network error occurred</div>';
    };
    xhr.send();
}

document.addEventListener('DOMContentLoaded', fetchAndPopulateSellers);