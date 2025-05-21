document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('token') !== null;
    const userRole = localStorage.getItem('userRole');
    
    const accountLink = document.getElementById('footer-my-account');
    const orderHistoryLink = document.getElementById('footer-order-history');
    
    if (!accountLink || !orderHistoryLink) {
        console.error('Account or Order History links not found');
        return;
    }
    
    // Information section modals functionality
    setupInformationModals();
    
    // Account and order history links
    if (isLoggedIn) {
        switch(userRole) {
            case 'client':
                accountLink.href = 'profil.html';
                orderHistoryLink.href = 'profil.html';
                break;
                
            case 'vendor':
            case 'moderator':
                accountLink.href = 'dashbordBout_pages/index.html';
                orderHistoryLink.href = 'dashbordBout_pages/orders.html';
                break;
                
            case 'admin':
            case 'superAdmin':
                accountLink.href = 'dashbordA_pages/index.html';
                orderHistoryLink.parentElement.style.display = 'none'; // Hide the entire list item
                break;
                
            default:
                accountLink.href = 'account.html';
                orderHistoryLink.href = 'account.html';
        }
    } else {
        accountLink.href = 'account.html';
        orderHistoryLink.href = 'account.html';
    }
    
    accountLink.addEventListener('click', function(e) {
        if (!isLoggedIn) {
            console.log("User not logged in, redirecting to login page");
        }
    });
    
    orderHistoryLink.addEventListener('click', function(e) {
        if (!isLoggedIn) {
            console.log("User not logged in, redirecting to login page");
        }
    });
});

// Function to setup information modals
function setupInformationModals() {
    // Create modals container if it doesn't exist
    if (!document.getElementById('info-modals-container')) {
        const modalsContainer = document.createElement('div');
        modalsContainer.id = 'info-modals-container';
        document.body.appendChild(modalsContainer);
        
        // Add modal HTML
        modalsContainer.innerHTML = `
            <!-- Extended Plan Modal -->
            <div id="extended-plan-modal" class="modal-overlay" style="display:none">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Extended Plan</h3>
                        <span class="modal-close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p>We're excited to announce our upcoming extended features for Mallify:</p>
                        <ul>
                            <li><strong>Mobile Application</strong> - Shop on the go with our dedicated mobile apps for iOS and Android</li>
                            <li><strong>AI-Powered Features</strong> - Personalized shopping recommendations and smart inventory management</li>
                            <li><strong>Advanced Analytics</strong> - Detailed insights for vendors to optimize their business</li>
                            <li><strong>International Shipping</strong> - Expanding our reach to serve customers worldwide</li>
                        </ul>
                        <p>Stay tuned for these exciting updates coming soon!</p>
                    </div>
                </div>
            </div>
            
            <!-- How Mallify Works Modal -->
            <div id="how-mallify-works-modal" class="modal-overlay" style="display:none">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>How Mallify Works</h3>
                        <span class="modal-close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p>Mallify is a virtual mall where anyone can access and open a shop to sell products.</p>
                        <h4>For Shoppers:</h4>
                        <ul>
                            <li>Browse a wide range of products from various vendors</li>
                            <li>Compare prices and options all in one place</li>
                            <li>Enjoy a secure shopping experience</li>
                            <li>Track your orders easily</li>
                        </ul>
                        <h4>For Vendors:</h4>
                        <ul>
                            <li>Set up your online shop quickly</li>
                            <li>Manage your inventory through our user-friendly dashboard</li>
                            <li>Access a ready customer base</li>
                            <li>Focus on your products while we handle the platform</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Payment Methods Modal -->
            <div id="payment-methods-modal" class="modal-overlay" style="display:none">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Payment Methods</h3>
                        <span class="modal-close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p><strong>Currently Available:</strong></p>
                        <ul>
                            <li>Cash on Delivery - Pay when your order arrives at your doorstep</li>
                        </ul>
                        <p><strong>Coming Soon:</strong></p>
                        <ul>
                            <li>Credit/Debit Cards</li>
                            <li>Mobile Payment Solutions</li>
                            <li>Digital Wallets</li>
                            <li>Bank Transfers</li>
                        </ul>
                        <p>We're working on expanding our payment options to provide you with more convenience and flexibility for your shopping experience.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS for modals
        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-content {
                background-color: white;
                border-radius: 8px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .modal-header h3 {
                margin: 0;
                color: #333;
            }
            
            .modal-close {
                font-size: 24px;
                cursor: pointer;
                color: #999;
                transition: color 0.3s ease;
            }
            
            .modal-close:hover {
                color: #333;
            }
            
            .modal-body {
                padding: 20px;
                color: #666;
                line-height: 1.6;
            }
            
            .modal-body h4 {
                margin: 15px 0 10px;
                color: #444;
            }
            
            .modal-body ul {
                margin-left: 20px;
                margin-bottom: 15px;
            }
            
            .modal-body li {
                margin-bottom: 8px;
            }
        `;
        document.head.appendChild(modalStyle);
    }
      // Add IDs to the footer links if they don't have them already
    const footerLinks = document.querySelectorAll('.footer-menu a[href="#"]');
    footerLinks.forEach(link => {
        const linkText = link.textContent.trim();
        if (linkText === 'Extended Plan' && !link.id) {
            link.id = 'footer-extended-plan';
        } else if (linkText === 'How Mallify Works' && !link.id) {
            link.id = 'footer-how-mallify-works';
        } else if (linkText === 'Payment Methods' && !link.id) {
            link.id = 'footer-payment-methods';
        }
    });
    
    // Setup Extended Plan link
    const extendedPlanLink = document.getElementById('footer-extended-plan');
    if (extendedPlanLink) {
        const extendedPlanModal = document.getElementById('extended-plan-modal');
        setupModal(extendedPlanLink, extendedPlanModal);
    }
    
    // Setup How Mallify Works link
    const howMallifyWorksLink = document.getElementById('footer-how-mallify-works');
    if (howMallifyWorksLink) {
        const howMallifyWorksModal = document.getElementById('how-mallify-works-modal');        setupModal(howMallifyWorksLink, howMallifyWorksModal);
    }
    
    // Setup Payment Methods link
    const paymentMethodsLink = document.getElementById('footer-payment-methods');
    if (paymentMethodsLink) {
        const paymentMethodsModal = document.getElementById('payment-methods-modal');
        setupModal(paymentMethodsLink, paymentMethodsModal);
    }
}

// Helper function to setup modal functionality
function setupModal(linkElement, modalElement) {
    if (!linkElement || !modalElement) return;
    
    linkElement.addEventListener('click', function(e) {
        e.preventDefault();
        modalElement.style.display = 'flex';
    });
    
    const closeButton = modalElement.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            modalElement.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    modalElement.addEventListener('click', function(e) {
        if (e.target === modalElement) {
            modalElement.style.display = 'none';
        }
    });
}
