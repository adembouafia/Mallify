function createshopCard(shop) {
    const shopName = shop.shopName || 'Shop Name not available';
    const shopLogo = shop.shopLogo ? `http://localhost:3000/uploads/${shop.shopLogo}` : '../assets/images/shops/fashion_logo.png';
    const shopId = shop._id || 'Shop ID not available';
    const shopDescription = shop.shopdescription || 'Shop description not available';
    const shopAddress = shop.adresse || 'Shop address not available';
    const shopEmail = shop.vendor?.email || 'Shop email not available';
    const shopPhone = shop.vendor?.phone || 'Shop phone not available';
    const shopCard = document.createElement('div');    
    shopCard.innerHTML = `
        <div class="vendors-two-item rounded-12 overflow-hidden bg-color-three border border-neutral-50 hover-border-main-two-600 transition-2">
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
        </div>
    `;
    
    return shopCard;
}

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
                    const shopsContainer = document.getElementById('shops-container');
                    
                    shopsContainer.innerHTML = '';
                    
                    if (Array.isArray(shops)) {
                        if (shops.length === 0) {
                            shopsContainer.innerHTML = '<div class="alert alert-info">No shops found</div>';
                        } else {
                            const approvedshops = shops.filter(shop => shop.status === "Approved");
                            
                            if (approvedshops.length === 0) {
                                shopsContainer.innerHTML = '<div class="alert alert-info">No approved shops found</div>';
                            } else {
                                approvedshops.forEach(shop => {
                                    const shopCard = createshopCard(shop);
                                    shopsContainer.appendChild(shopCard);
                                });
                            }
                        }
                    } else {
                        console.error('API response is not an array:', shops);
                        shopsContainer.innerHTML = '<div class="alert alert-danger">Error: Invalid data format received from server</div>';
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    document.getElementById('shops-container').innerHTML = 
                        '<div class="alert alert-danger">Error: Could not parse server response</div>';
                }
            } else {
                console.error('Request failed with status:', xhr.status);
                document.getElementById('shops-container').innerHTML = 
                    '<div class="alert alert-danger">Error: Failed to fetch shops data</div>';
            }
        }
    };
    xhr.onerror = function() {
        console.error('Network error occurred');
        document.getElementById('shops-container').innerHTML = 
            '<div class="alert alert-danger">Error: Network error occurred</div>';
    };
    xhr.send();
}

document.addEventListener('DOMContentLoaded', fetchAndPopulateshops);