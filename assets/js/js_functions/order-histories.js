// Global variables
let currentPage = 1;
let itemsPerPage = 10;
let totalOrders = 0;
let orders = [];
let searchQuery = "";

// DOM elements
const ordersTableBody = document.querySelector("table tbody");
const searchInput = document.querySelector('input[placeholder="Search..."]');
const searchButton = document.querySelector(".input-group button");
const entriesSelect = document.querySelector(".form-select");
const paginationInfo = document.querySelector(".pagination-info");
const paginationLinks = document.querySelector(".pagination");

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Load order histories on page load
  loadOrderHistories();

  // Set up event listeners
  setupEventListeners();
});

// Set up event listeners for interactive elements
function setupEventListeners() {
  // Search functionality
  if (searchButton) {
    searchButton.addEventListener("click", () => {
      searchQuery = searchInput.value.trim();
      currentPage = 1;
      loadOrderHistories();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        loadOrderHistories();
      }
    });
  }

  // Change number of entries displayed
  if (entriesSelect) {
    entriesSelect.addEventListener("change", () => {
      itemsPerPage = Number.parseInt(entriesSelect.value);
      currentPage = 1;
      loadOrderHistories();
    });
  }
}

// Function to load order histories using XHR
function loadOrderHistories() {
  // Show loading indicator
  if (ordersTableBody) {
    ordersTableBody.innerHTML =
      '<tr><td colspan="9" class="text-center">Loading order histories...</td></tr>';
  }

  // Get the authentication token from localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  // Create XHR request to get order histories
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/order/histories", true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        orders = data.orders;

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
        displayOrderHistories(orders.slice(startIndex, endIndex));

        // Update pagination info
        updatePaginationInfo(startIndex, endIndex, totalOrders);

        // Update pagination links
        updatePaginationLinks(currentPage, totalPages);
      } catch (error) {
        console.error("Error parsing order histories data:", error);
        if (ordersTableBody) {
          ordersTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error parsing order histories data: ${error.message}</td></tr>`;
        }
      }
    } else {
      console.error("Error fetching order histories:", xhr.status);
      if (ordersTableBody) {
        ordersTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading order histories. Status: ${xhr.status}</td></tr>`;
      }
    }
  };

  xhr.onerror = function () {
    console.error("Network error when fetching order histories");
    if (ordersTableBody) {
      ordersTableBody.innerHTML =
        '<tr><td colspan="9" class="text-center text-danger">Network error. Please check your connection and try again.</td></tr>';
    }
  };

  // Send the request
  xhr.send();
}

function filterOrders(orders, query) {
  query = query.toLowerCase();
  return orders.filter((order) => {
    // Search in order ID
    if (order._id && order._id.toLowerCase().includes(query)) return true;

    // Search in customer name
    if (
      order.idClient &&
      order.idClient.firstname &&
      order.idClient.firstname.toLowerCase().includes(query)
    )
      return true;
    if (
      order.idClient &&
      order.idClient.lastname &&
      order.idClient.lastname.toLowerCase().includes(query)
    )
      return true;

    // Add more fields to search as needed

    return false;
  });
}

function displayOrderHistories(ordersToDisplay) {
  if (!ordersTableBody) return;

  if (ordersToDisplay.length === 0) {
    ordersTableBody.innerHTML =
      '<tr><td colspan="9" class="text-center">No order histories found</td></tr>';
    return;
  }

  ordersTableBody.innerHTML = "";

  ordersToDisplay.forEach((order) => {
    let total = order.orderTotal || 0;
    let itemCount = 0;

    // Use the cartData field
    if (order.cartData && order.cartData.items) {
      itemCount = order.cartData.items.length;

      // If orderTotal is not set, calculate it from cartData
      if (!order.orderTotal) {
        total = 0;
        order.cartData.items.forEach((item) => {
          const price = Number.parseFloat(item.productId.productPrice) || 0;
          const quantity = Number.parseInt(item.quantity) || 0;
          total += price * quantity;
        });
      }
    }

    // Use a try-catch block for date formatting to handle invalid dates
    let formattedDate = "Invalid Date";
    try {
      const orderDate = new Date(order.dateCommande);
      if (!isNaN(orderDate.getTime())) {
        formattedDate = orderDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }

    // Format customer name with proper checks
    const firstName =
      order.idClient && order.idClient.firstname
        ? order.idClient.firstname
        : "";
    const lastName =
      order.idClient && order.idClient.lastname ? order.idClient.lastname : "";
    const customerName =
      firstName || lastName ? `${firstName} ${lastName}`.trim() : "Unknown";

    // Déterminer la classe de statut et le texte
    let statusClass = "bg-warning";
    let statusText = "Pending";
    
    if (order.orderStatus === "accepted") {
      statusClass = "bg-info";
      statusText = "Accepted";
    } else if (order.orderStatus === "completed") {
      statusClass = "bg-success";
      statusText = "Completed";
    } else if (order.orderStatus === "cancelled") {
      statusClass = "bg-danger";
      statusText = "Cancelled";
    }

    // Create table row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="../../assets/images/dashboard/devoloper1.jpg" alt="avatar" class="rounded-circle object-fit-cover" width="37" height="37"></td>
      <td>Delivery Agent</td>
      <td>#D-${Math.floor(Math.random() * 10000000)}</td>
      <td>#${order._id ? order._id.substring(0, 8) : "N/A"}</td>
      <td>${customerName}</td>
      <td>${itemCount}</td>
      <td>Location</td>
      <td>${total.toFixed(2)} DT</td>
      <td>
        <a href="detailsOrders.html?id=${order._id}" class="btn btn-sm btn-outline-secondary me-1 action-btn" title="View Details">
          <i class="bi bi-eye"></i>
        </a>
      </td>
    `;

    ordersTableBody.appendChild(row);
  });
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

  let html = "";

  // Previous button
  html += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }

  // Next button
  html += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
    </li>
  `;

  paginationLinks.innerHTML = html;

  // Add event listeners to pagination links
  document.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = Number.parseInt(e.currentTarget.getAttribute("data-page"));
      if (page && page !== currentPage && page > 0 && page <= totalPages) {
        currentPage = page;
        loadOrderHistories();
      }
    });
  });
}