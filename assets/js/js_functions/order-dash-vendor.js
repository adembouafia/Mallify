// Global variables
let currentPage = 1;
let itemsPerPage = 10;
let totalOrders = 0;
let orders = [];
let searchQuery = "";
let currentOrder = null;

// DOM elements
const ordersTableBody = document.querySelector("table tbody");
const searchInput = document.querySelector('.search-input'); // Mise à jour du sélecteur
const searchButton = document.querySelector(".search-container button"); // Mise à jour du sélecteur
const entriesSelect = document.querySelector(".form-select");
const paginationInfo = document.querySelector(".pagination-info");
const paginationLinks = document.querySelector(".pagination");

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Load orders on page load
  const currentUrl = window.location.href;

  if (currentUrl.includes("detailsOrders.html")) {
    // We're on the order details page
    loadOrderDetails();
  } else {
    // We're on the main orders page
    loadOrders();
  }

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
      loadOrders();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        loadOrders();
      }
    });
  }

  // Change number of entries displayed
  if (entriesSelect) {
    entriesSelect.addEventListener("change", () => {
      itemsPerPage = Number.parseInt(entriesSelect.value);
      currentPage = 1;
      loadOrders();
    });
  }
}

// Function to load order details from URL parameters
function loadOrderDetails() {
  // Get order ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");

  if (!orderId) {
    displayError("No order ID provided in the URL");
    return;
  }

  // Create loading indicator in the page content area
  const contentArea = document.querySelector(".content-wrapper");
  if (contentArea) {
    contentArea.innerHTML =
      '<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  }

  // Get the auth token from localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  // Create XHR request to get order details
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/order/${orderId}`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        console.log("Order details response:", response);
        currentOrder = response.order;
        displayOrderDetails(currentOrder);
      } catch (error) {
        console.error("Error parsing order details:", error);
        displayError("Failed to parse order details");
      }
    } else {
      console.error("Error fetching order details:", xhr.status);
      displayError("Failed to load order details. Status: " + xhr.status);
    }
  };

  xhr.onerror = function () {
    console.error("Network error when fetching order details");
    displayError("Network error. Please check your connection and try again.");
  };

  // Send the request
  xhr.send();
}

// Function to display order details in the UI
function displayOrderDetails(order) {
  const contentArea = document.querySelector(".content-wrapper")
  if (!contentArea) return
  
  console.log("Displaying order details:", order)
  
  // Format order date
  let orderDate = new Date()
  let formattedDate = "N/A"
  try {
    orderDate = new Date(order.createdAt || order.dateCommande)
    if (!isNaN(orderDate.getTime())) {
      formattedDate = orderDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    }
  } catch (e) {
    console.error("Error formatting date:", e)
  }
  
  // Calculate shipping date (3 days after order date)
  const shippingDate = new Date(orderDate)
  shippingDate.setDate(shippingDate.getDate() + 3)
  const formattedShippingDate = shippingDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
  
  // Format customer details from the database
  const firstName = order.idClient?.firstname || ""
  const lastName = order.idClient?.lastname || ""
  const customerName = firstName && lastName ? `${firstName} ${lastName}`.trim() : "Unknown Customer"
  const customerEmail = order.idClient?.email || ""
  const customerPhone = order.idClient?.phoneNumber || ""
  
  // Get shipping details - first check if there's shipping details in the order
  let shippingDetails = order.shippingDetails || {}
  
  // If no shipping details in order, check if client has shipping info
  if (Object.keys(shippingDetails).length === 0 && order.idClient) {
    console.log("Checking client for shipping info:", order.idClient)
    
    // Check for shippingInfo in the client model - THIS IS THE KEY CHANGE
    if (order.idClient.shippingInfo) {
      console.log("Found shipping info in client:", order.idClient.shippingInfo)
      
      const clientShippingInfo = order.idClient.shippingInfo
      shippingDetails = {
        firstname: firstName,
        lastname: lastName,
        address: clientShippingInfo.address,
        city: clientShippingInfo.city,
        governorate: clientShippingInfo.governorate,
        postCode: clientShippingInfo.postCode,
        phone: clientShippingInfo.phone || customerPhone
      }
    }
    // Check for shipping addresses in the client model (as fallback)
    else if (order.idClient.shippingAddresses && order.idClient.shippingAddresses.length > 0) {
      console.log("Found shipping addresses in client:", order.idClient.shippingAddresses)
      
      // Get default shipping address or first one
      const clientAddresses = order.idClient.shippingAddresses
      const defaultAddress = clientAddresses.find(addr => addr.isDefault) || clientAddresses[0]
      
      shippingDetails = {
        firstname: firstName,
        lastname: lastName,
        address: defaultAddress.address,
        city: defaultAddress.city,
        governorate: defaultAddress.governorate,
        postCode: defaultAddress.postCode,
        phone: defaultAddress.phone || customerPhone
      }
    } 
    // If no shipping addresses array, check for defaultShippingInfo
    else if (order.idClient.defaultShippingInfo) {
      console.log("Found default shipping info in client:", order.idClient.defaultShippingInfo)
      
      const defaultInfo = order.idClient.defaultShippingInfo
      shippingDetails = {
        firstname: firstName,
        lastname: lastName,
        address: defaultInfo.address,
        city: defaultInfo.city,
        governorate: defaultInfo.governorate,
        postCode: defaultInfo.postCode,
        phone: defaultInfo.phone || customerPhone
      }
    }
  }
  
  console.log("Final shipping details:", shippingDetails)
  
  // Use shipping details if available, otherwise fall back to client info
  const shippingName = shippingDetails.firstname && shippingDetails.lastname 
    ? `${shippingDetails.firstname} ${shippingDetails.lastname}`.trim() 
    : customerName
    
  const shippingPhone = shippingDetails.phone || customerPhone || "No phone number provided"
  const shippingAddress = shippingDetails.address || "No address provided"
  const shippingCity = shippingDetails.city || "No city provided"
  const shippingGovernorate = shippingDetails.governorate || "No governorate provided"
  const shippingPostCode = shippingDetails.postCode || "No postal code provided"
  
  // Calculate order details
  let subtotal = 0
  let items = []
  
  console.log("Order object:", order);
  
  // Check if cartData is available and use it to display items
  if (order.cartData && order.cartData.items && order.cartData.items.length > 0) {
    console.log("Cart items found:", order.cartData.items);
    
    order.cartData.items.forEach(item => {
      // In the order model, productId is a complete product object
      const product = item.productId;
      console.log("Product data:", product);
      
      const price = Number.parseFloat(product.productPrice) || 0
      const quantity = Number.parseInt(item.quantity) || 0
      const itemTotal = price * quantity
      subtotal += itemTotal
     
      // FIXED: Access the productId field correctly based on your data structure
      let displayProductId = "N/A";
      
      // This is the key fix - product.productId is the field we want
      if (product && product.productId) {
        displayProductId = product.productId;
        console.log("Using product.productId:", displayProductId);
      }
      
      items.push({
        id: displayProductId,
        name: product.productName || "Product Name",
        price: price,
        quantity: quantity,
        total: itemTotal
      })
    })
  } else {
    console.warn("No cart items found in order:", order);
    // Fallback sample data if no items are found
    items = [
      { id: "2541", name: "Product 1", quantity: 1, price: 80, total: 80 }
    ]
    subtotal = 80.00
  }
  
  // Calculate total amount (no discount or tax)
  const deliveryCharge = 15.00
  const totalAmount = (parseFloat(subtotal) + parseFloat(deliveryCharge)).toFixed(2)
  
  // Déterminer les boutons d'action en fonction du statut de la commande
  let actionButtons = '';
  
  if (order.orderStatus === 'pending') {
    actionButtons = `
      <div>
        <a href="#!" class="btn btn-success me-2" id="accept-order-btn">Accepter la commande</a>
        <a href="#!" class="btn btn-warning" id="make-ready-ship-btn">Préparer pour l'expédition</a>
      </div>
    `;
  } else if (order.orderStatus === 'accepted') {
    actionButtons = `
      <div>
        <a href="#!" class="btn btn-warning" id="make-ready-ship-btn">Préparer pour l'expédition</a>
      </div>
    `;
  } else if (order.orderStatus === 'completed') {
    actionButtons = `
      <div>
        <span class="badge bg-success p-2">Commande complétée</span>
      </div>
    `;
  } else if (order.orderStatus === 'cancelled') {
    actionButtons = `
      <div>
        <span class="badge bg-danger p-2">Commande annulée</span>
      </div>
    `;
  }
  
  // Create the order details HTML
  const orderDetailsHTML = `
    <div class="container-xxl p-4">
      <div class="row">
        <div class="col-xl-9 col-lg-8">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-body">
                  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <h4 class="fw-medium text-dark d-flex align-items-center gap-2 p-2">
                        #${order._id ? order._id.substring(0, 8) : "0758267/90"}
                        <span class="border border-warning text-warning fs-7 mx-2 px-2 py-1 rounded">
                          ${order.orderStatus ? order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1) : "In Progress"}
                        </span>
                      </h4>
                      <p class="mb-0">
                        Order / Order Details / #${order._id ? order._id.substring(0, 8) : "0758267/90"} - ${formattedDate}
                      </p>
                    </div>

                  </div>

                  <div class="mt-3">
                    <h4 class="fw-medium text-dark">Progress</h4>
                  </div>
                  <div class="row row-cols-xxl-5 row-cols-md-2 row-cols-1">
                    <!-- Order Confirming -->
                    <div class="col">
                      <div class="progress mt-2" style="height: 10px">
                        <div
                          class="progress-bar progress-bar progress-bar-striped progress-bar-animated bg-success"
                          role="progressbar"
                          style="width: 100%"
                          aria-valuenow="100"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <p class="mb-0 mt-2">Order Confirming</p>
                    </div>
                    
                    <!-- Processing -->
                    <div class="col">
                      <div class="progress mt-2" style="height: 10px">
                        <div
                          class="progress-bar progress-bar progress-bar-striped progress-bar-animated ${order.orderStatus === 'pending' ? 'bg-warning' : 'bg-success'}"
                          role="progressbar"
                          style="width: ${order.orderStatus === 'pending' ? '60%' : '100%'}"
                          aria-valuenow="${order.orderStatus === 'pending' ? '60' : '100'}"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div class="d-flex align-items-center gap-2 mt-2">
                        <p class="mb-0">Processing</p>
                        ${order.orderStatus === 'pending' ? `
                          <div class="spinner-border spinner-border-sm text-warning" role="status">
                            <span class="visually-hidden">Loading...</span>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                    
                    <!-- Shipping -->
                    <div class="col">
                      <div class="progress mt-2" style="height: 10px">
                        <div
                          class="progress-bar progress-bar progress-bar-striped progress-bar-animated ${order.orderStatus === 'completed' ? 'bg-success' : 'bg-primary'}"
                          role="progressbar"
                          style="width: ${order.orderStatus === 'completed' ? '100%' : '0%'}"
                          aria-valuenow="${order.orderStatus === 'completed' ? '100' : '0'}"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <p class="mb-0 mt-2">Shipping</p>
                    </div>
                    
                    <!-- Delivered -->
                    <div class="col">
                      <div class="progress mt-2" style="height: 10px">
                        <div
                          class="progress-bar progress-bar progress-bar-striped progress-bar-animated bg-primary"
                          role="progressbar"
                          style="width: 0%"
                          aria-valuenow="0"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <p class="mb-0 mt-2">Delivered</p>
                    </div>
                  </div>
                </div>
                
                <div class="card-footer d-flex align-items-center justify-content-around">
                  <p class="border rounded mb-0 px-2 py-1 bg-body">
                    <i class="bi bi-box-arrow-in-right fs-4 align-middle"></i>
                    Estimated shipping date :
                    <span class="text-dark fw-medium">${formattedShippingDate}</span>
                  </p>
                  ${actionButtons}
                </div>
              </div>
              
              <br>
              
              <!-- Products Table -->
              <div class="card">
                <div class="card-header">
                  <h4 class="card-title">Product</h4>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table align-middle mb-0 table-hover table-centered text-center">
                      <thead class="bg-light-subtle border-bottom">
                        <tr>
                          <th>Product ID</th>
                          <th>Product Name</th>
                          <th>Quantity</th>
                          <th>Price/Once</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${items.map(item => `
                          <tr>
                            <td>${item.id || 'N/A'}</td>
                            <td>${item.name || 'N/A'}</td>
                            <td>${item.quantity}</td>
                            <td>${item.price.toFixed(2)} DT</td>
                            <td>${item.total.toFixed(2)} DT</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <br>
            </div>
          </div>
        </div>
        
        <!-- Order Summary Column -->
        <div class="col-xl-3 col-lg-4">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Order Summary</h4>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table mb-0">
                  <tbody>
                    <tr>
                      <td class="px-0">
                        <p class="d-flex mb-0 align-items-center gap-1">
                          <i class="bi bi-clipboard-check"></i>
                          Sub Total :
                        </p>
                      </td>
                      <td class="text-end text-dark fw-medium px-0">
                        ${subtotal.toFixed(2)} DT
                      </td>
                    </tr>
                    <tr>
                      <td class="px-0">
                        <p class="d-flex mb-0 align-items-center gap-1">
                          <i class="bi bi-truck"></i>
                          Delivery Charge :
                        </p>
                      </td>
                      <td class="text-end text-dark fw-medium px-0">
                        ${deliveryCharge.toFixed(2)} DT
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card-footer d-flex align-items-center justify-content-between bg-light-subtle">
              <div>
                <p class="fw-medium text-dark mb-0">Total Amount</p>
              </div>
              <div>
                <p class="fw-medium text-dark mb-0">${totalAmount} DT</p>
              </div>
            </div>
          </div>
          
          <br>
          
          <!-- Customer Details Card -->
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">Customer Details</h4>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center gap-2">
                <img
                  src="${order.idClient?.profilePicture ? '/uploads/' + order.idClient.profilePicture : '../../assets/images/team_members/devoloper2.jpg'}"
                  alt=""
                  class="rounded object-fit-cover" width="43" height="45"
                />
                <div>
                  <p class="mb-1">${customerName}</p>
                  <a href="mailto:${customerEmail}" class="link-primary fw-medium">${customerEmail}</a>
                </div>
              </div>
              
              <div class="d-flex justify-content-between mt-3">
                <h5 class="card-title">Contact Number</h5>
                <div>
                  <a href="#!"><i class="bi bi-pencil"></i></a>
                </div>
              </div>
              <p class="mb-1">${customerPhone || shippingPhone || "No phone number provided"}</p>

              <div class="d-flex justify-content-between mt-3">
                <h5 class="card-title">Shipping Address</h5>
                <div>
                  <a href="#!"><i class="bi bi-pencil"></i></a>
                </div>
              </div>

              <div>                
                <p class="m-2"><strong>Governorate:</strong> ${shippingGovernorate}</p>
                <p class="m-2"><strong>City:</strong> ${shippingCity}</p>
                <p class="m-2"><strong>Address:</strong> ${shippingAddress}</p>
                <p class="m-2"><strong>Postal Code:</strong> ${shippingPostCode}</p>
              </div>

            </div>
          </div>
          <br>
        </div>
      </div>
    </div>
  `
  
  // Display the order details in the content area
  contentArea.innerHTML = orderDetailsHTML
  
  // Add event listeners
  setupOrderActionButtons(order._id)
}

// Function to setup event listeners for order action buttons
function setupOrderActionButtons(orderId) {
  // Accept order button
  const acceptOrderBtn = document.getElementById("accept-order-btn");
  if (acceptOrderBtn) {
    acceptOrderBtn.addEventListener("click", function () {
      updateOrderStatus(orderId, "accepted");
    });
  }

  // Make as Ready to Ship button
  const readyToShipBtn = document.getElementById("make-ready-ship-btn");
  if (readyToShipBtn) {
    readyToShipBtn.addEventListener("click", function () {
      updateOrderStatus(orderId, "completed");
    });
  }
}

// Function to update order status via XHR
function updateOrderStatus(orderId, status) {
  // Get the auth token from localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  // Create XHR request to update order status
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/order/${orderId}/status`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        // Refresh the order details to show updated status
        loadOrderDetails();

        // Show success message
        // SweetAlert is assumed to be available globally or imported elsewhere
        Swal.fire({
          title: "Success!",
          text: `Order successfully marked as ${status.replace("_", " ")}`,
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error parsing update response:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to update order status",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } else {
      console.error("Error updating order status:", xhr.status);
      Swal.fire({
        title: "Error!",
        text: "Failed to update order status. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  xhr.onerror = function () {
    console.error("Network error when updating order status");
    Swal.fire({
      title: "Network Error",
      text: "Please check your connection and try again.",
      icon: "error",
      confirmButtonText: "OK",
    });
  };

  // Send the request with status data
  xhr.send(JSON.stringify({ status: status }));
}

// Display error message
function displayError(message) {
  const contentArea = document.querySelector(".content-wrapper");
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="alert alert-danger m-4">
        <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
        <p>${message}</p>
        <a href="orders.html" class="btn btn-primary mt-2">Back to Orders</a>
      </div>
    `;
  }
}

// Function to load orders using XHR instead of fetch
function loadOrders() {
  // Show loading indicator
  if (ordersTableBody) {
    ordersTableBody.innerHTML =
      '<tr><td colspan="8" class="text-center">Loading orders...</td></tr>';
  }

  // Get the authentication token from localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  // Create XHR request to get orders
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/order", true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
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
        console.error("Error parsing orders data:", error);
        if (ordersTableBody) {
          ordersTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error parsing orders data: ${error.message}</td></tr>`;
        }
      }
    } else {
      console.error("Error fetching orders:", xhr.status);
      if (ordersTableBody) {
        ordersTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error loading orders. Status: ${xhr.status}</td></tr>`;
      }
    }
  };

  xhr.onerror = function () {
    console.error("Network error when fetching orders");
    if (ordersTableBody) {
      ordersTableBody.innerHTML =
        '<tr><td colspan="8" class="text-center text-danger">Network error. Please check your connection and try again.</td></tr>';
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

function displayOrders(ordersToDisplay) {
  if (!ordersTableBody) return;

  if (ordersToDisplay.length === 0) {
    ordersTableBody.innerHTML =
      '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
    return;
  }

  ordersTableBody.innerHTML = "";

  ordersToDisplay.forEach((order) => {
    let total = order.orderTotal || 0;
    let itemCount = 0;

    // Use the new cartData field instead of idPanier
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
    let statusClass = "status-pending";
    let statusText = "Pending";
    
    if (order.orderStatus === "accepted") {
      statusClass = "status-shipped";
      statusText = "Accepted";
    } else if (order.orderStatus === "completed") {
      statusClass = "status-shipped";
      statusText = "Completed";
    } else if (order.orderStatus === "cancelled") {
      statusClass = "status-cancelled";
      statusText = "Cancelled";
    }

    // Create table row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="order-id">#${order._id ? order._id.substring(0, 8) : "N/A"}</span></td>
      <td><span class="date-text">${formattedDate}</span></td>
      <td><span class="customer-name">${customerName}</span></td>
      <td><span class="price-amount">${total.toFixed(2)} DT</span></td>
      <td><span class="items-count">${itemCount}</span></td>
      <td><span class="delivery-number">#D-${Math.floor(Math.random() * 10000000)}</span></td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <div class="d-flex">
          <a href="detailsOrders.html?id=${order._id}" class="btn btn-action btn-outline-primary me-1" title="View Details">
            <i class="bi bi-eye"></i>
          </a>
          ${order.orderStatus === 'pending' ? `
          <button class="btn btn-action btn-outline-success me-1 accept-order" data-id="${order._id}" title="Accept Order">
            <i class="bi bi-check"></i>
          </button>
          ` : ''}
          <button class="btn btn-action btn-outline-danger delete-order" data-id="${order._id}" title="Delete Order">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;

    ordersTableBody.appendChild(row);
  });

  // Add event listeners to action buttons
  document.querySelectorAll(".delete-order").forEach((button) => {
    button.addEventListener("click", (e) => {
      const orderId = e.currentTarget.getAttribute("data-id");
      confirmDeleteOrder(orderId);
    });
  });

  // Add event listeners to accept buttons
  document.querySelectorAll(".accept-order").forEach((button) => {
    button.addEventListener("click", (e) => {
      const orderId = e.currentTarget.getAttribute("data-id");
      acceptOrder(orderId);
    });
  });
}

// Function to accept an order
function acceptOrder(orderId) {
  if (confirm("Êtes-vous sûr de vouloir accepter cette commande?")) {
    updateOrderStatus(orderId, "accepted");
  }
}

// Update order counts in the info boxes
function updateOrderCounts() {
  if (!orders) return;

  // Count orders by status
  const pendingOrders = orders.filter(order => order.orderStatus === 'pending').length;
  const acceptedOrders = orders.filter(order => order.orderStatus === 'accepted').length;
  const completedOrders = orders.filter(order => order.orderStatus === 'completed').length;
  const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled').length;

  // Safely update the order count displays
  updateCountDisplay(".info-box:nth-child(1) .info-box-number", orders.length);
  updateCountDisplay(".info-box:nth-child(2) .info-box-number", completedOrders); // Completed/shipped orders
  updateCountDisplay(".info-box:nth-child(3) .info-box-number", cancelledOrders); // Cancelled orders
  updateCountDisplay(".info-box:nth-child(4) .info-box-number", pendingOrders + acceptedOrders); // Payment refund (placeholder)
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

  let html = "";

  // Previous button
  html += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${currentPage - 1}">
        <i class="bi bi-chevron-left"></i>
      </a>
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
      <a class="page-link" href="#" data-page="${currentPage + 1}">
        <i class="bi bi-chevron-right"></i>
      </a>
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
        loadOrders();
      }
    });
  });
}

//delete functions

// Confirm and delete an order
function confirmDeleteOrder(orderId) {
  Swal.fire({
    title: "Êtes-vous sûr?",
    text: "Voulez-vous vraiment supprimer cette commande?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Oui, supprimer",
    cancelButtonText: "Annuler"
  }).then((result) => {
    if (result.isConfirmed) {
      deleteOrder(orderId);
    }
  });
}

// Delete an order via XHR instead of fetch
function deleteOrder(orderId) {
  // Get the authentication token from localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  // Create XHR request to delete order
  const xhr = new XMLHttpRequest();
  xhr.open("DELETE", `http://localhost:3000/order/delete/${orderId}`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    if (xhr.status === 200) {
      // Reload orders after successful deletion
      loadOrders();
      Swal.fire({
        title: "Supprimé!",
        text: "La commande a été supprimée avec succès.",
        icon: "success"
      });
    } else {
      console.error("Error deleting order:", xhr.status);
      Swal.fire({
        title: "Erreur!",
        text: `Erreur lors de la suppression de la commande. Statut: ${xhr.status}`,
        icon: "error"
      });
    }
  };

  xhr.onerror = function () {
    console.error("Network error when deleting order");
    Swal.fire({
      title: "Erreur réseau",
      text: "Veuillez vérifier votre connexion et réessayer.",
      icon: "error"
    });
  };

  // Send the request
  xhr.send();
}

// Fonction pour charger les notifications
function loadNotifications() {
  const token = localStorage.getItem("token")
  const shopId = localStorage.getItem("shopId") // Assurez-vous que le shopId est stocké dans localStorage

  if (!token || !shopId) {
    console.error("Token ou shopId manquant")
    return
  }

  console.log("Loading notifications for shop:", shopId)

  // Get notifications count for the badge display
  const countXhr = new XMLHttpRequest()
  countXhr.open("GET", `http://localhost:3000/notifications/shop/${shopId}/count`, true)
  countXhr.setRequestHeader("Authorization", `Bearer ${token}`)
  countXhr.setRequestHeader("Content-Type", "application/json")

  countXhr.onload = function() {
    if (countXhr.status === 200) {
      try {
        const response = JSON.parse(countXhr.responseText)
        console.log("Notification count response:", response)
        updateNotificationCounter(response.count)
      } catch (error) {
        console.error("Erreur lors du parsing du compteur de notifications:", error)
      }
    } else {
      console.error("Erreur lors du chargement du compteur de notifications:", countXhr.status, countXhr.responseText)
    }
  }
  countXhr.send()

  // Get all notifications for the dropdown
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/notifications/shop/${shopId}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        console.log("Notifications response:", response)
        
        // Check if we have a data property or if the response itself is the array
        const notifications = Array.isArray(response) ? response : 
                             (response.data && Array.isArray(response.data) ? response.data : [])
        
        console.log("Processed notifications:", notifications)
        
        // Afficher les notifications dans un dropdown
        populateNotificationDropdown(notifications)
      } catch (error) {
        console.error("Erreur lors du parsing des notifications:", error)
      }
    } else {
      console.error("Erreur lors du chargement des notifications:", xhr.status, xhr.responseText)
    }
  }

  xhr.onerror = function() {
    console.error("Erreur réseau lors du chargement des notifications")
  }

  xhr.send()
}

// Fonction pour mettre à jour le compteur de notifications
function updateNotificationCounter(count) {
  const counter = document.querySelector(".notification-counter")
  const headerCount = document.querySelector(".notification-count-header")
  
  if (counter) {
    counter.textContent = count
    counter.style.display = count > 0 ? "inline-block" : "none"
  }
  
  if (headerCount) {
    headerCount.textContent = `${count} Notification${count !== 1 ? 's' : ''}`
  }
  
  console.log(`Updated notification counter: ${count}`)
}

// Fonction pour peupler le dropdown de notifications
function populateNotificationDropdown(notifications) {  
  const notificationList = document.querySelector(".notification-dropdown .notification-list")
  if (!notificationList) {
    console.error("Notification list element not found")
    return
  }

  notificationList.innerHTML = ""

  if (!notifications || notifications.length === 0) {
    notificationList.innerHTML = "<div class='p-3 text-center'>No notifications</div>"
    return
  }

  notifications.forEach(notification => {
    console.log("Processing notification:", notification)
    
    const item = document.createElement("div")
    item.className = `notification-item p-2 border-bottom ${notification.status === "unread" ? "bg-light" : ""}`
    
    // Format the date
    const createdDate = new Date(notification.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now - createdDate)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60)) || 1 // Default to 1 minute if less
    
    let timeDisplay = ""
    if (diffDays > 0) {
      timeDisplay = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      timeDisplay = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      timeDisplay = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    }
    
    // Get notification title - extract it from the message if available
    let title = notification.title || "Notification"
    let message = notification.message || ""
    
    // If there's no title but there's a message, try to extract a title
    if (!notification.title && notification.message) {
      // Try to extract product name from message if it contains one
      const productMatch = message.match(/"([^"]+)"/)
      if (productMatch && productMatch[1]) {
        title = productMatch[1]
      }
    }
    
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <strong>${title}</strong>
        <small class="text-secondary">${timeDisplay}</small>
      </div>
      <p class="mb-1 small">${message}</p>
      <div class="d-flex justify-content-end">
        <button class="btn btn-sm btn-outline-primary mark-read-btn me-1" data-id="${notification._id}">
          ${notification.status === "unread" ? "Mark as Read" : "Read"}
        </button>
        <button class="btn btn-sm btn-outline-danger delete-notification-btn" data-id="${notification._id}">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `
    
    notificationList.appendChild(item)
  })

  // Add event listeners for action buttons
  addNotificationEventListeners()
}

// Add event listeners for notification actions
function addNotificationEventListeners() {
  // Individual notification read buttons
  document.querySelectorAll(".mark-read-btn").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation()
      markNotificationAsRead(this.getAttribute("data-id"))
    })
  })

  // Individual notification delete buttons
  document.querySelectorAll(".delete-notification-btn").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation()
      deleteNotification(this.getAttribute("data-id"))
    })
  })

  // Mark all as read button
  const markAllReadBtn = document.querySelector(".mark-all-read-btn")
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", function(e) {
      e.stopPropagation()
      markAllNotificationsAsRead()
    })
  }
  
  // See all notifications button
  const seeAllBtn = document.querySelector(".see-all-notifications-btn")
  if (seeAllBtn) {
    seeAllBtn.addEventListener("click", function(e) {
      e.stopPropagation()
      // This would typically take you to a notifications page
      // For now, just log a message
      console.log("See all notifications clicked")
      // Here you could add: window.location.href = "notifications.html"
    })
  }
}

// Marquer une notification comme lue
function markNotificationAsRead(notificationId) {
  const token = localStorage.getItem("token")
  
  if (!token || !notificationId) {
    console.error("Token ou ID de notification manquant")
    return
  }
  
  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/notifications/read/${notificationId}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      console.log("Notification marquée comme lue")
      // Reload notifications to update the UI
      loadNotifications()
    } else {
      console.error("Erreur lors du marquage de la notification comme lue:", xhr.status)
    }
  }
  
  xhr.onerror = function() {
    console.error("Erreur réseau lors du marquage de la notification")
  }
  
  xhr.send()
}

// Supprimer une notification
function deleteNotification(notificationId) {
  const token = localStorage.getItem("token")
  
  if (!token || !notificationId) {
    console.error("Token ou ID de notification manquant")
    return
  }
  
  const xhr = new XMLHttpRequest()
  xhr.open("DELETE", `http://localhost:3000/notifications/${notificationId}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      console.log("Notification supprimée avec succès")
      // Reload notifications to update the UI
      loadNotifications()
    } else {
      console.error("Erreur lors de la suppression de la notification:", xhr.status)
    }
  }
  
  xhr.onerror = function() {
    console.error("Erreur réseau lors de la suppression de la notification")
  }
  
  xhr.send()
}

// Marquer toutes les notifications comme lues
function markAllNotificationsAsRead() {
  const token = localStorage.getItem("token")
  const shopId = localStorage.getItem("shopId")
  
  if (!token || !shopId) {
    console.error("Token ou shopId manquant")
    return
  }
  
  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/notifications/shop/${shopId}/read-all`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      console.log("Toutes les notifications marquées comme lues")
      // Reload notifications to update the UI
      loadNotifications()
    } else {
      console.error("Erreur lors du marquage de toutes les notifications comme lues:", xhr.status)
    }
  }
  
  xhr.onerror = function() {
    console.error("Erreur réseau lors du marquage de toutes les notifications")
  }
  
  xhr.send()
}

// Charger les notifications au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  // Load orders on page load
  const currentUrl = window.location.href;
  
  if (currentUrl.includes("detailsOrders.html")) {
    // We're on the order details page
    loadOrderDetails();
  } else if (!currentUrl.includes("login.html")) {
    // We're on the main orders page or another page that might need orders
    loadOrders();
  }

  // Set up event listeners
  setupEventListeners();
  
  // Add notification loading
  const shopId = localStorage.getItem("shopId")
  if (shopId) {
    // Load notifications immediately
    loadNotifications()
    
    // Refresh notifications every 5 minutes
    setInterval(loadNotifications, 5 * 60 * 1000)
  }
})