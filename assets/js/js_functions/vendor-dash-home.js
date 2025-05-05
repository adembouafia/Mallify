function updateShopNavigation() {
    // Get the user ID from localStorage
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        console.error("No user ID found in localStorage");
        return;
    }
    
    console.log("Fetching shop data for vendor ID:", userId);
    
    // First, try to get all shops
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:3000/shop/get', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const shops = JSON.parse(xhr.responseText);
                    console.log("All shops received:", shops);
                    
                    // Find the shop where vendor ID matches the user ID
                    let userShop = null;
                    
                    if (Array.isArray(shops)) {
                        // Loop through all shops to find the one with matching vendor ID
                        for (let i = 0; i < shops.length; i++) {
                            const shop = shops[i];
                            console.log(`Comparing shop vendor ${shop.vendor} with userId ${userId}`);
                            
                            // Check if vendor exists and matches userId (either as string or ObjectId)
                            if (shop.vendor && 
                                (shop.vendor === userId || 
                                 (typeof shop.vendor === 'object' && shop.vendor._id === userId) ||
                                 (typeof shop.vendor === 'string' && shop.vendor.includes(userId)))) {
                                userShop = shop;
                                break;
                            }
                        }
                    }
                    
                    if (userShop) {
                        console.log("Found user's shop:", userShop);
                        updateNavWithShopInfo(userShop);
                    } else {
                        console.error("No shop found for this vendor ID");
                    }
                } catch (error) {
                    console.error("Error parsing shop data:", error);
                }
            } else {
                console.error("Request failed with status:", xhr.status);
            }
        }
    };
    
    xhr.onerror = function() {
        console.error("Network error occurred");
    };
    
    xhr.send();
}


function updateNavWithShopInfo(shop) {
    if (!shop) {
        console.error("No shop data provided");
        return;
    }
    
    // Get user role from localStorage
    const userRole = localStorage.getItem('userRole') || 'vendor';
    const userType = localStorage.getItem('userType') || 'vendor';
    
    // Get the shop name or use a default
    const shopName = shop.shopName || 'Shop Name';
    const shopLogoUrl = shop.shopLogo 
        ? `http://localhost:3000/uploads/${shop.shopLogo}` 
        : '../../assets/images/dashboard/shop-logo.jpg';
    

    
    // Determine the role description for the small text
    let roleDescription = '';
    if (userRole === 'vendor' || userType === 'vendor') {
        roleDescription = 'Shop Owner';
    } else if (userRole === 'moderator' || userType === 'moderator') {
        roleDescription = 'Moderator';
    } else {
        roleDescription = 'Founded In ' + (shop.createdAt 
            ? new Date(shop.createdAt).getFullYear() 
            : '2025');
    }
    
    console.log("Updating navigation with:", {
        shopName,
        shopLogoUrl,
        roleDescription
    });
    
    // Update the shop name in the navigation bar
    const navShopNameElement = document.querySelector('.user-menu .d-none.d-md-inline');
    if (navShopNameElement) {
        navShopNameElement.textContent = shopName;
    }
    
    // Update all shop logo images in the navigation
    const shopLogoElements = document.querySelectorAll('.user-image, .user-header img');
    shopLogoElements.forEach(imgElement => {
        imgElement.src = shopLogoUrl;
        imgElement.alt = `${shopName} logo`;
    });
    
    // Update the shop name, role, and role description in the dropdown
    const userHeaderTextElement = document.querySelector('.user-header p');
    if (userHeaderTextElement) {
        // Create the text node for the shop name and role
        const textNode = document.createTextNode(`${shopName}`);
        
        // Create the small element for the role description
        const smallElement = document.createElement('small');
        smallElement.textContent = roleDescription;
        
        // Clear the existing content and append the new content
        userHeaderTextElement.innerHTML = '';
        userHeaderTextElement.appendChild(textNode);
        userHeaderTextElement.appendChild(document.createElement('br'));
        userHeaderTextElement.appendChild(smallElement);
    }
    
    // Update the user header background to use the image
    const userHeaderElement = document.querySelector('.user-header');
    if (userHeaderElement) {
        // Remove the text-bg-secondary class
        userHeaderElement.classList.remove('text-bg-secondary');
        
        // Add custom styling for background image
        userHeaderElement.style.position = 'relative';
        userHeaderElement.style.overflow = 'hidden';
        userHeaderElement.style.zIndex = '1';
        
        // Check if the background image already exists
        let backgroundImg = userHeaderElement.querySelector('.header-background-img');
        
        if (!backgroundImg) {
            // Create a background image element
            backgroundImg = document.createElement('div');
            backgroundImg.className = 'header-background-img';
            backgroundImg.style.position = 'absolute';
            backgroundImg.style.top = '0';
            backgroundImg.style.left = '0';
            backgroundImg.style.width = '100%';
            backgroundImg.style.height = '100%';
            backgroundImg.style.backgroundImage = 'url("../assets/images/sellers/background.jpg")';
            backgroundImg.style.backgroundSize = 'cover';
            backgroundImg.style.backgroundPosition = 'center';
            backgroundImg.style.opacity = '0.85';
            backgroundImg.style.zIndex = '-1';
            
            // Add a dark overlay for better text readability
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            overlay.style.zIndex = '-1';
            
            // Insert the background and overlay at the beginning of the user header
            userHeaderElement.insertBefore(overlay, userHeaderElement.firstChild);
            userHeaderElement.insertBefore(backgroundImg, userHeaderElement.firstChild);
        }
        
        // Ensure text is readable on the background image
        userHeaderElement.style.color = 'white';
        userHeaderElement.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.6)';
        
        // Add padding for better appearance
        userHeaderElement.style.padding = '20px 15px';
    }
    
    // NEW CODE: Update the sidebar brand logo and text
    const sidebarBrandLogo = document.querySelector('.sidebar-brand .brand-image');
    if (sidebarBrandLogo) {
        sidebarBrandLogo.src = shopLogoUrl;
        sidebarBrandLogo.alt = `${shopName} Logo`;
    }
    
    const sidebarBrandText = document.querySelector('.sidebar-brand .brand-text');
    if (sidebarBrandText) {
        sidebarBrandText.textContent = shopName;
    }
}

function addHeaderStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .user-header {
            position: relative;
            overflow: hidden;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
            padding: 20px 15px;
        }
        
        .user-header img.rounded-circle {
            border: 3px solid rgba(255, 255, 255, 0.8);
            position: relative;
            z-index: 2;
        }
        
        .user-header p {
            position: relative;
            z-index: 2;
            margin-top: 10px;
        }
        
        /* Add styles for sidebar brand */
        .sidebar-brand .brand-image {
            max-height: 40px;
            width: auto;
            object-fit: contain;
        }
    `;
    document.head.appendChild(styleElement);
}


document.addEventListener('DOMContentLoaded', function() {
    addHeaderStyles();
    updateShopNavigation();
    
});

