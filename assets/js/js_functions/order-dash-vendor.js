// Global variables
let currentPage = 1;
let itemsPerPage = 10;
let totalOrders = 0;
let orders = [];
let searchQuery = '';

// DOM elements
const ordersTableBody = document.querySelector('table tbody');
const searchInput = document.querySelector('input[placeholder="Search..."]');
const searchButton = document.querySelector('.input-group button');
const entriesSelect = document.querySelector('.form-select');
const paginationInfo = document.querySelector('.pagination-info');
const paginationLinks = document.querySelector('.pagination');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load orders on page load
    loadOrders();
    
    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners for interactive elements
function setupEventListeners() {
    // Search functionality
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            loadOrders();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchQuery = searchInput.value.trim();
                currentPage = 1;
                loadOrders();
            }
        });
    }
    
    // Change number of entries displayed
    if (entriesSelect) {
        entriesSelect.addEventListener('change', () => {
            itemsPerPage = parseInt(entriesSelect.value);
            currentPage = 1;
            loadOrders();
        });
    }
}

async function loadOrders() {
    try {
        if (ordersTableBody) {
            ordersTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Loading orders...</td></tr>';
        }
        
        // Get the authentication token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../login.html';
            return;
        }
        
        // Fetch orders from the API
        const response = await fetch('/order', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        orders = data.orders;
        
        // Update order counts
        updateOrderCounts();
        
        // Filter orders if search query exists
        if (searchQuery) {
            orders = filterOrders(orders, searchQuery);
        }
        
        // Update total orders count
        totalOrders = orders.length;
        
        // Calculate pagination
        const totalPages = Math.ceil(totalOrders / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalOrders);
        
        // Display orders for current page
        displayOrders(orders.slice(startIndex, endIndex));
        
        // Update pagination info
        updatePaginationInfo(startIndex, endIndex, totalOrders);
        
        // Update pagination links
        updatePaginationLinks(currentPage, totalPages);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        if (ordersTableBody) {
            ordersTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error loading orders: ${error.message}</td></tr>`;
        }
    }
}

function filterOrders(orders, query) {
    query = query.toLowerCase();
    return orders.filter(order => {
        // Search in order ID
        if (order._id && order._id.toLowerCase().includes(query)) return true;
        
        // Search in customer name
        if (order.idClient && order.idClient.name && order.idClient.name.toLowerCase().includes(query)) return true;
        
        // Add more fields to search as needed
        
        return false;
    });
}

function displayOrders(ordersToDisplay) {
    if (!ordersTableBody) return;
    
    if (ordersToDisplay.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
        return;
    }
    
    ordersTableBody.innerHTML = '';
    
    ordersToDisplay.forEach(order => {
        let total = 0;
        let itemCount = 0;
        
        if (order.idPanier && order.idPanier.items) {
            itemCount = order.idPanier.items.length;
            order.idPanier.items.forEach(item => {
                // Add a check to ensure productPrice and quantity exist and are numbers
                const price = parseFloat(item.productPrice) || 0;
                const quantity = parseInt(item.quantity) || 0;
                total += price * quantity;
            });
        }
        
        // Use a try-catch block for date formatting to handle invalid dates
        let formattedDate = 'Invalid Date';
        try {
            const orderDate = new Date(order.dateCommande);
            if (!isNaN(orderDate.getTime())) {
                formattedDate = orderDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
            }
        } catch (e) {
            console.error('Error formatting date:', e);
        }
        
        // Format customer name with proper checks
        const firstName = order.idClient && order.idClient.firstname ? order.idClient.firstname : '';
        const lastName = order.idClient && order.idClient.lastname ? order.idClient.lastname : '';
        const customerName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown';
        
        // Create table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order._id ? order._id.substring(0, 8) : 'N/A'}</td>
            <td>${formattedDate}</td>
            <td>${customerName}</td>
            <td>$${total.toFixed(2)}</td>
            <td>${itemCount}</td>
            <td>#D-${Math.floor(Math.random() * 10000000)}</td>
            <td>Pending</td>
            <td>
                <a href="detailsOrders.html?id=${order._id}" class="btn btn-sm btn-outline-secondary me-1" title="View Details">
                    <i class="bi bi-eye"></i>
                </a>
                <button class="btn btn-sm btn-outline-danger delete-order" data-id="${order._id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        ordersTableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-order').forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            confirmDeleteOrder(orderId);
        });
    });
}

// Update order counts in the info boxes
function updateOrderCounts() {
    if (!orders) return;
    
    // Safely update the order count displays
    updateCountDisplay('.info-box:nth-child(1) .info-box-number', orders.length);
    updateCountDisplay('.info-box:nth-child(2) .info-box-number', '0'); // Shipped orders
    updateCountDisplay('.info-box:nth-child(3) .info-box-number', '0'); // Cancelled orders
    updateCountDisplay('.info-box:nth-child(4) .info-box-number', '0'); // Refunded orders
}

// Helper function to safely update count displays
function updateCountDisplay(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

// Update pagination information text
function updatePaginationInfo(start, end, total) {
    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${start + 1} to ${end} of ${total} entries`;
    }
}

// Update pagination links
function updatePaginationLinks(currentPage, totalPages) {
    if (!paginationLinks) return;
    
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
        </li>
    `;
    
    paginationLinks.innerHTML = html;
    
    // Add event listeners to pagination links
    document.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.currentTarget.getAttribute('data-page'));
            if (page && page !== currentPage && page > 0 && page <= totalPages) {
                currentPage = page;
                loadOrders();
            }
        });
    });
}





//delete functions

// Confirm and delete an order
function confirmDeleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        deleteOrder(orderId);
    }
}

// Delete an order via API
async function deleteOrder(orderId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../login.html';
            return;
        }
        
        const response = await fetch(`/order/delete/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete order');
        }
        
        loadOrders();
                alert('Order deleted successfully');
        
    } catch (error) {
        console.error('Error deleting order:', error);
        alert(`Error deleting order: ${error.message}`);
    }
}

//end delete functions