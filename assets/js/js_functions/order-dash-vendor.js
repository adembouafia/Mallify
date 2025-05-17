// Global variables
let currentPage = 1;
let itemsPerPage = 10;
let totalOrders = 0;
let orders = [];
let filteredOrders = [];
let searchQuery = "";
let currentOrder = null;
let currentSort = "newest"; // Default sort order

// DOM elements
const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");
const itemsPerPageSelect = document.querySelector(".items-per-page");
const paginationInfo = document.querySelector(".pagination-info");
const paginationLinks = document.querySelector(".pagination");
const sortOptions = document.querySelectorAll(".sort-option");

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

  // Add notification loading
  const shopId = localStorage.getItem("shopId");
  if (shopId) {
    // Load notifications immediately
    loadNotifications();

    // Refresh notifications every 5 minutes
    setInterval(loadNotifications, 5 * 60 * 1000);
  }
});

// Mettre à jour la fonction setupEventListeners pour gérer l'onglet "postponed"
function setupEventListeners() {
  // Search functionality
  if (searchButton) {
    searchButton.addEventListener("click", () => {
      searchQuery = searchInput.value.trim();
      currentPage = 1;
      filterAndDisplayOrders();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        filterAndDisplayOrders();
      }
    });
  }

  // Change number of entries displayed
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", () => {
      itemsPerPage = Number.parseInt(itemsPerPageSelect.value);
      currentPage = 1;
      filterAndDisplayOrders();
    });
  }

  // Tab change event listeners
  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach((tab) => {
    tab.addEventListener("shown.bs.tab", (e) => {
      const targetId = e.target.getAttribute("aria-controls");
      if (targetId === "all") {
        filterAndDisplayOrders();
      } else if (targetId === "pending") {
        displayFilteredOrders("pending");
      } else if (targetId === "accepted") {
        displayFilteredOrders("accepted");
      } else if (targetId === "completed") {
        displayFilteredOrders("completed");
      } else if (targetId === "cancelled") {
        displayFilteredOrders("cancelled");
      } else if (targetId === "shipped") {
        displayFilteredOrders("shipped");
      } else if (targetId === "postponed") {
        displayFilteredOrders("postponed");
      }
    });
  });

  // Sort options
  if (sortOptions) {
    sortOptions.forEach((option) => {
      option.addEventListener("click", function (e) {
        e.preventDefault();
        currentSort = this.getAttribute("data-sort");
        document.querySelector(".sort-dropdown").textContent = this.textContent;
        filterAndDisplayOrders();
      });
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
  const contentArea = document.querySelector(".app-main");
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

  xhr.onload = () => {
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

  xhr.onerror = () => {
    console.error("Network error when fetching order details");
    displayError("Network error. Please check your connection and try again.");
  };

  // Send the request
  xhr.send();
}

// Mettre à jour la fonction displayOrderDetails pour gérer le statut "postponed"
function displayOrderDetails(order) {
  const contentArea = document.querySelector(".app-main");
  if (!contentArea) return;

  console.log("Displaying order details:", order);

  // Format order date
  let orderDate = new Date();
  let formattedDate = "N/A";
  try {
    orderDate = new Date(order.createdAt || order.dateCommande);
    if (!isNaN(orderDate.getTime())) {
      formattedDate = orderDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }

  // Calculate shipping date (3 days after order date)
  const shippingDate = new Date(orderDate);
  shippingDate.setDate(shippingDate.getDate());
  const formattedShippingDate = shippingDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Format customer details from the database
  const firstName = order.idClient?.firstname || "";
  const lastName = order.idClient?.lastname || "";
  const customerName =
    firstName && lastName
      ? `${firstName} ${lastName}`.trim()
      : "Unknown Customer";
  const customerEmail = order.idClient?.email || "";
  const customerPhone = order.idClient?.phoneNumber || "";

  // Get shipping details - first check if there's shipping details in the order
  let shippingDetails = order.shippingDetails || {};

  // If no shipping details in order, check if client has shipping info
  if (Object.keys(shippingDetails).length === 0 && order.idClient) {
    console.log("Checking client for shipping info:", order.idClient);

    // Check for shippingInfo in the client model
    if (order.idClient.shippingInfo) {
      console.log(
        "Found shipping info in client:",
        order.idClient.shippingInfo
      );

      const clientShippingInfo = order.idClient.shippingInfo;
      shippingDetails = {
        firstname: firstName,
        lastname: lastName,
        address: clientShippingInfo.address,
        city: clientShippingInfo.city,
        governorate: clientShippingInfo.governorate,
        postCode: clientShippingInfo.postCode,
        phone: clientShippingInfo.phone || customerPhone,
      };
    }
    // Check for shipping addresses in the client model (as fallback)
    else if (
      order.idClient.shippingAddresses &&
      order.idClient.shippingAddresses.length > 0
    ) {
      console.log(
        "Found shipping addresses in client:",
        order.idClient.shippingAddresses
      );

      // Get default shipping address or first one
      const clientAddresses = order.idClient.shippingAddresses;
      const defaultAddress =
        clientAddresses.find((addr) => addr.isDefault) || clientAddresses[0];

      shippingDetails = {
        firstname: firstName,
        lastname: lastName,
        address: defaultAddress.address,
        city: defaultAddress.city,
        governorate: defaultAddress.governorate,
        postCode: defaultAddress.postCode,
        phone: defaultAddress.phone || customerPhone,
      };
    }
    // If no shipping addresses array, check for defaultShippingInfo
    else if (order.idClient.defaultShippingInfo) {
      console.log(
        "Found default shipping info in client:",
        order.idClient.defaultShippingInfo
      );

      const defaultInfo = order.idClient.defaultShippingInfo;
      shippingDetails = {
        firstname: firstName,
        lastname: lastName,
        address: defaultInfo.address,
        city: defaultInfo.city,
        governorate: defaultInfo.governorate,
        postCode: defaultInfo.postCode,
        phone: defaultInfo.phone || customerPhone,
      };
    }
  }

  console.log("Final shipping details:", shippingDetails);

  // Use shipping details if available, otherwise fall back to client info
  const shippingName =
    shippingDetails.firstname && shippingDetails.lastname
      ? `${shippingDetails.firstname} ${shippingDetails.lastname}`.trim()
      : customerName;

  const shippingPhone =
    shippingDetails.phone || customerPhone || "No phone number provided";
  const shippingAddress = shippingDetails.address || "No address provided";
  const shippingCity = shippingDetails.city || "No city provided";
  const shippingGovernorate =
    shippingDetails.governorate || "No governorate provided";
  const shippingPostCode =
    shippingDetails.postCode || "No postal code provided";

  // Calculate order details
  let subtotal = 0;
  let items = [];

  console.log("Order object:", order);

  // Check if cartData is available and use it to display items
  if (
    order.cartData &&
    order.cartData.items &&
    order.cartData.items.length > 0
  ) {
    console.log("Cart items found:", order.cartData.items);

    order.cartData.items.forEach((item) => {
      // In the order model, productId is a complete product object
      const product = item.productId;
      console.log("Product data:", product);

      const price = Number.parseFloat(product.productPrice) || 0;
      const quantity = Number.parseInt(item.quantity) || 0;
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      // Access the productId field correctly based on your data structure
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
        total: itemTotal,
      });
    });
  } else {
    console.warn("No cart items found in order:", order);
    // Fallback sample data if no items are found
    items = [
      { id: "2541", name: "Product 1", quantity: 1, price: 80, total: 80 },
    ];
    subtotal = 80.0;
  }

  // Calculate total amount (no discount or tax)
  const deliveryCharge = 15.0;
  const totalAmount = (
    Number.parseFloat(subtotal) + Number.parseFloat(deliveryCharge)
  ).toFixed(2);

  // Déterminer les boutons d'action en fonction du statut de la commande
  let actionButtons = "";

  if (order.orderStatus === "pending") {
    actionButtons = `
      <div>
        <a href="#!" class="btn btn-success me-2" id="accept-order-btn">Accepter la commande</a>
        <a href="#!" class="btn btn-warning me-2" id="postpone-order-btn">Reporter la commande</a>
        <a href="#!" class="btn btn-danger me-2" id="cancel-order-btn">Annuler la commande</a>
      </div>
    `;
  } else if (order.orderStatus === "accepted") {
    actionButtons = `
      <div>
        <a href="#!" class="btn btn-primary me-2" id="make-to-ship-btn">Expédier la commande</a>
        <a href="#!" class="btn btn-warning me-2" id="postpone-order-btn">Reporter la commande</a>
        <a href="#!" class="btn btn-success me-2" id="complete-order-btn">Compléter la commande</a>
        <a href="#!" class="btn btn-danger me-2" id="cancel-order-btn">Annuler la commande</a>
      </div>
    `;
  } else if (order.orderStatus === "shipped") {
    actionButtons = `
      <div>
        <a href="#!" class="btn btn-success me-2" id="complete-order-btn">Compléter la commande</a>
        <a href="#!" class="btn btn-danger me-2" id="cancel-order-btn">Annuler la commande</a>
      </div>
    `;
  } else if (order.orderStatus === "postponed") {
    actionButtons = `
      <div>
        <a href="#!" class="btn btn-primary me-2" id="reschedule-order-btn">Reprogrammer</a>
        <a href="#!" class="btn btn-danger me-2" id="cancel-order-btn">Annuler la commande</a>
      </div>
    `;
  } else if (order.orderStatus === "completed") {
    actionButtons = `
      <div>
        <span class="badge bg-success p-2 me-2">Commande complétée</span>
        <a href="#!" class="btn btn-danger" id="delete-order-btn">Supprimer</a>
      </div>
    `;
  } else if (order.orderStatus === "cancelled") {
    actionButtons = `
      <div>
        <span class="badge bg-danger p-2 me-2">Commande annulée</span>
        <a href="#!" class="btn btn-danger" id="delete-order-btn">Supprimer</a>
      </div>
    `;
  }
  // Afficher les informations de report si la commande est reportée
  let postponedInfo = "";
  if (order.orderStatus === "postponed" && order.postponeInfo) {
    const postponeDate = new Date(order.postponeInfo.newDeliveryDate);
    const formattedPostponeDate = postponeDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    postponedInfo = `
      <div class="alert alert-purple mt-3">
        <h5><i class="bi bi-calendar2-plus"></i> Informations de report</h5>
        <p><strong>Nouvelle date de livraison:</strong> ${formattedPostponeDate}</p>
        ${order.postponeInfo.notes ? `<p><strong>Notes:</strong> ${order.postponeInfo.notes}</p>` : ""}
      </div>
    `;
  }

  // Afficher la raison d'annulation si la commande est annulée
  let cancelInfo = "";
  if (order.orderStatus === "cancelled" && order.refusalReason) {
    cancelInfo = `
      <div class="alert alert-danger mt-3">
        <h5><i class="bi bi-x-circle"></i> Informations d'annulation</h5>
        <p><strong>Raison:</strong> ${order.refusalReason}</p>
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
                  </div>                  ${postponedInfo}
                  ${cancelInfo}

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
                          class="progress-bar progress-bar progress-bar-striped progress-bar-animated ${order.orderStatus === "pending" ? "bg-warning" : "bg-success"}"
                          role="progressbar"
                          style="width: ${order.orderStatus === "pending" ? "60%" : "100%"}"
                          aria-valuenow="${order.orderStatus === "pending" ? "60" : "100"}"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div class="d-flex align-items-center gap-2 mt-2">
                        <p class="mb-0">Processing</p>
                        ${
                          order.orderStatus === "pending"
                            ? `
                          <div class="spinner-border spinner-border-sm text-warning" role="status">
                            <span class="visually-hidden">Loading...</span>
                          </div>
                        `
                            : ""
                        }
                      </div>
                    </div>
                    
                    <!-- Shipping -->
                    <div class="col">
                      <div class="progress mt-2" style="height: 10px">
                        <div
                          class="progress-bar progress-bar progress-bar-striped progress-bar-animated ${order.orderStatus === "completed" || order.orderStatus === "shipped" ? "bg-success" : order.orderStatus === "postponed" ? "bg-purple" : "bg-primary"}"
                          role="progressbar"
                          style="width: ${order.orderStatus === "completed" || order.orderStatus === "shipped" || order.orderStatus === "postponed" ? "100%" : "0%"}"
                          aria-valuenow="${order.orderStatus === "completed" || order.orderStatus === "shipped" || order.orderStatus === "postponed" ? "100" : "0"}"
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
                        ${items
                          .map(
                            (item) => `
                          <tr>
                            <td>${item.id || "N/A"}</td>
                            <td>${item.name || "N/A"}</td>
                            <td>${item.quantity}</td>
                            <td>${item.price.toFixed(2)} DT</td>
                            <td>${item.total.toFixed(2)} DT</td>
                          </tr>
                        `
                          )
                          .join("")}
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
                  src="${order.idClient?.profilePicture ? "/uploads/" + order.idClient.profilePicture : "../../assets/images/team_members/devoloper2.jpg"}"
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
              </div>
              <p class="mb-1">${customerPhone || shippingPhone || "No phone number provided"}</p>

              <div class="d-flex justify-content-between mt-3">
                <h5 class="card-title">Shipping Address</h5>
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
  `;

  // Display the order details in the content area
  contentArea.innerHTML = orderDetailsHTML;

  // Add event listeners
  setupOrderActionButtons(order._id);
}

// Mettre à jour la fonction setupOrderActionButtons pour gérer les boutons d'action pour les commandes reportées
function setupOrderActionButtons(orderId) {
  // Accept order button
  const acceptOrderBtn = document.getElementById("accept-order-btn");
  if (acceptOrderBtn) {
    acceptOrderBtn.addEventListener("click", () => {
      acceptOrder(orderId);
    });
  }

  // Make to Ship button
  const makeToShipBtn = document.getElementById("make-to-ship-btn");
  if (makeToShipBtn) {
    makeToShipBtn.addEventListener("click", () => {
      // Call the makeToShip function from delivery.js
      if (typeof window.makeToShip === "function") {
        window.makeToShip(orderId);
      } else {
        makeToShipFallback(orderId);
      }
    });
  }

  // Complete order button
  const completeOrderBtn = document.getElementById("complete-order-btn");
  if (completeOrderBtn) {
    completeOrderBtn.addEventListener("click", () => {
      completeOrder(orderId);
    });
  }

  // Cancel order button
  const cancelOrderBtn = document.getElementById("cancel-order-btn");
  if (cancelOrderBtn) {
    cancelOrderBtn.addEventListener("click", () => {
      cancelOrder(orderId);
    });
  }

  // Delete order button
  const deleteOrderBtn = document.getElementById("delete-order-btn");
  if (deleteOrderBtn) {
    deleteOrderBtn.addEventListener("click", () => {
      confirmDeleteOrder(orderId);
    });
  }

  // Postpone order button
  const postponeOrderBtn = document.getElementById("postpone-order-btn");
  if (postponeOrderBtn) {
    postponeOrderBtn.addEventListener("click", () => {
      postponeOrder(orderId);
    });
  }

  // Reschedule order button
  const rescheduleOrderBtn = document.getElementById("reschedule-order-btn");
  if (rescheduleOrderBtn) {
    rescheduleOrderBtn.addEventListener("click", () => {
      rescheduleOrder(orderId);
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

  // Create loading indicator
  Swal.fire({
    title: "Traitement en cours...",
    text: "Mise à jour du statut de la commande",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // Create XHR request to update order status
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/order/${orderId}/status`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        // Check which page we're on and refresh accordingly
        const currentUrl = window.location.href;
        if (currentUrl.includes("detailsOrders.html")) {
          // Refresh the order details to show updated status
          loadOrderDetails();
        } else {
          // Reload orders list
          loadOrders();
        }

        // Show success message
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

  xhr.onerror = () => {
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

// Function to update order status with reason via XHR
function updateOrderStatusWithReason(orderId, status, refusalReason) {
  // Get the auth token from localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  // Create loading indicator
  Swal.fire({
    title: "Traitement en cours...",
    text: "Mise à jour du statut de la commande",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // Log the order info for debugging
  console.log(
    `Updating order ${orderId} to status: ${status} with reason: ${refusalReason}`
  );

  // Create XHR request to update order status
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/order/${orderId}/status`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    console.log(
      `Response status: ${xhr.status}, Response text:`,
      xhr.responseText
    );

    if (xhr.status === 200) {
      try {
        // Parse the response to check for any errors from server
        const response = JSON.parse(xhr.responseText);

        // Check which page we're on and refresh accordingly
        const currentUrl = window.location.href;
        if (currentUrl.includes("detailsOrders.html")) {
          // Refresh the order details to show updated status
          loadOrderDetails();
        } else {
          // Reload orders list
          loadOrders();
        }

        // Show success message
        Swal.fire({
          title: "Success!",
          text: `Order successfully marked as ${status.replace("_", " ")}`,
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error(
          "Error parsing update response:",
          error,
          xhr.responseText
        );
        Swal.fire({
          title: "Error!",
          text: "Failed to parse server response. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } else {
      // Try to parse error message from server
      let errorMessage = "Failed to update order status. Please try again.";
      try {
        const errorResponse = JSON.parse(xhr.responseText);
        if (errorResponse && errorResponse.message) {
          errorMessage = errorResponse.message;
        }
      } catch (e) {
        console.error("Could not parse error response:", e);
      }

      console.error("Error updating order status:", xhr.status, errorMessage);
      Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  xhr.onerror = () => {
    console.error("Network error when updating order status");
    Swal.fire({
      title: "Network Error",
      text: "Please check your connection and try again.",
      icon: "error",
      confirmButtonText: "OK",
    });
  };

  // Send the request with status data and refusal reason
  const requestData = {
    status: status,
    refusalReason: refusalReason,
  };
  console.log("Sending request data:", requestData);
  xhr.send(JSON.stringify(requestData));
}

// Display error message
function displayError(message) {
  const contentArea = document.querySelector(".app-main");
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

// Mettre à jour la fonction loadOrders pour inclure le tableau des commandes reportées
function loadOrders() {
  // Show loading indicator in all tables
  const allOrdersTable = document.getElementById("all-orders-table");
  const pendingOrdersTable = document.getElementById("pending-orders-table");
  const completedOrdersTable = document.getElementById(
    "completed-orders-table"
  );
  const cancelledOrdersTable = document.getElementById(
    "cancelled-orders-table"
  );
  const shippedOrdersTable = document.getElementById("shipped-orders-table");
  const postponedOrdersTable = document.getElementById(
    "postponed-orders-table"
  );

  if (allOrdersTable) {
    allOrdersTable.innerHTML =
      '<tr><td colspan="8" class="text-center">Loading orders...</td></tr>';
  }
  if (pendingOrdersTable) {
    pendingOrdersTable.innerHTML =
      '<tr><td colspan="8" class="text-center">Loading pending orders...</td></tr>';
  }
  if (completedOrdersTable) {
    completedOrdersTable.innerHTML =
      '<tr><td colspan="8" class="text-center">Loading completed orders...</td></tr>';
  }
  if (cancelledOrdersTable) {
    cancelledOrdersTable.innerHTML =
      '<tr><td colspan="8" class="text-center">Loading cancelled orders...</td></tr>';
  }
  if (shippedOrdersTable) {
    shippedOrdersTable.innerHTML =
      '<tr><td colspan="8" class="text-center">Loading shipped orders...</td></tr>';
  }
  if (postponedOrdersTable) {
    postponedOrdersTable.innerHTML =
      '<tr><td colspan="8" class="text-center">Loading postponed orders...</td></tr>';
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

  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        orders = data.orders || [];
        console.log("Loaded orders:", orders);

        // Update order counts
        updateOrderCounts(orders);

        // Filter and display orders
        filterAndDisplayOrders();
      } catch (error) {
        console.error("Error parsing orders data:", error);
        displayErrorInTables("Error parsing orders data: " + error.message);
      }
    } else {
      console.error("Error fetching orders:", xhr.status);
      displayErrorInTables("Error loading orders. Status: " + xhr.status);
    }
  };

  xhr.onerror = () => {
    console.error("Network error when fetching orders");
    displayErrorInTables(
      "Network error. Please check your connection and try again."
    );
  };

  // Send the request
  xhr.send();
}

// Mettre à jour la fonction displayErrorInTables pour inclure le tableau des commandes reportées
function displayErrorInTables(message) {
  const tables = [
    document.getElementById("all-orders-table"),
    document.getElementById("pending-orders-table"),
    document.getElementById("accepted-orders-table"),
    document.getElementById("completed-orders-table"),
    document.getElementById("cancelled-orders-table"),
    document.getElementById("shipped-orders-table"),
    document.getElementById("postponed-orders-table"),
  ];

  tables.forEach((table) => {
    if (table) {
      table.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${message}</td></tr>`;
    }
  });
}

// Mettre à jour la fonction filterAndDisplayOrders pour inclure les commandes reportées
function filterAndDisplayOrders() {
  if (!orders || orders.length === 0) {
    displayNoOrdersMessage();
    return;
  }

  // Filter orders by search query
  filteredOrders = searchQuery
    ? filterOrdersBySearch(orders, searchQuery)
    : [...orders];

  // Sort filtered orders
  sortOrders(filteredOrders, currentSort);

  // Update total orders count
  totalOrders = filteredOrders.length;

  // Calculate pagination
  const totalPages = Math.ceil(totalOrders / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalOrders);

  // Display orders for current page in the "All" tab
  displayOrdersInTable(
    filteredOrders.slice(startIndex, endIndex),
    "all-orders-table"
  );

  // Update pagination info
  updatePaginationInfo(startIndex, endIndex, totalOrders);

  // Update pagination links
  updatePaginationLinks(currentPage, totalPages);

  // Also update the filtered tabs
  displayFilteredOrders("pending");
  displayFilteredOrders("completed");
  displayFilteredOrders("cancelled");
  displayFilteredOrders("accepted");
  displayFilteredOrders("shipped");
  displayFilteredOrders("postponed");
}

// Display orders filtered by status
function displayFilteredOrders(status) {
  const statusOrders = orders.filter((order) => order.orderStatus === status);
  const tableId = `${status}-orders-table`;

  if (statusOrders.length === 0) {
    const table = document.getElementById(tableId);
    if (table) {
      table.innerHTML = `<tr><td colspan="8" class="text-center">No ${status} orders found</td></tr>`;
    }
    return;
  }

  // Sort the status-filtered orders
  sortOrders(statusOrders, currentSort);

  // Display in the appropriate table
  displayOrdersInTable(statusOrders, tableId);

  // Update the badge count
  const badge = document.querySelector(`.${status}-orders-badge`);
  if (badge) {
    badge.textContent = statusOrders.length;
  }
}

// Filter orders by search query
function filterOrdersBySearch(orders, query) {
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
    if (
      order.idClient &&
      order.idClient.lastname &&
      order.idClient.lastname.toLowerCase().includes(query)
    )
      return true;

    // Search in email
    if (
      order.idClient &&
      order.idClient.email &&
      order.idClient.email.toLowerCase().includes(query)
    )
      return true;

    // Search in product names
    if (order.cartData && order.cartData.items) {
      for (const item of order.cartData.items) {
        if (
          item.productId &&
          item.productId.productName &&
          item.productId.productName.toLowerCase().includes(query)
        ) {
          return true;
        }
      }
    }

    return false;
  });
}

// Sort orders based on sort option
function sortOrders(ordersToSort, sortOption) {
  switch (sortOption) {
    case "newest":
      ordersToSort.sort(
        (a, b) => new Date(b.dateCommande) - new Date(a.dateCommande)
      );
      break;
    case "oldest":
      ordersToSort.sort(
        (a, b) => new Date(a.dateCommande) - new Date(b.dateCommande)
      );
      break;
    case "high":
      ordersToSort.sort((a, b) => (b.orderTotal || 0) - (a.orderTotal || 0));
      break;
    case "low":
      ordersToSort.sort((a, b) => (a.orderTotal || 0) - (b.orderTotal || 0));
      break;
    default:
      // Default to newest
      ordersToSort.sort(
        (a, b) => new Date(b.dateCommande) - new Date(a.dateCommande)
      );
  }
}

// Mettre à jour la fonction displayNoOrdersMessage pour inclure le tableau des commandes reportées
function displayNoOrdersMessage() {
  const tables = [
    document.getElementById("all-orders-table"),
    document.getElementById("pending-orders-table"),
    document.getElementById("accepted-orders-table"),
    document.getElementById("completed-orders-table"),
    document.getElementById("cancelled-orders-table"),
    document.getElementById("shipped-orders-table"),
    document.getElementById("postponed-orders-table"),
  ];

  tables.forEach((table) => {
    if (table) {
      table.innerHTML =
        '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
    }
  });

  // Update pagination info
  if (paginationInfo) {
    paginationInfo.textContent = "Showing 0 to 0 of 0 entries";
  }

  // Update pagination links
  if (paginationLinks) {
    paginationLinks.innerHTML = "";
  }
}

// Mettre à jour la fonction displayOrdersInTable pour gérer le statut "postponed"
function displayOrdersInTable(ordersToDisplay, tableId) {
  const tableBody = document.getElementById(tableId);
  if (!tableBody) return;

  if (ordersToDisplay.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
    return;
  }

  tableBody.innerHTML = "";

  ordersToDisplay.forEach((order) => {
    let total = order.orderTotal || 0;
    let itemCount = 0;

    // Use the cartData field for item count and total calculation
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

    // Format date
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

    // Format customer name
    const firstName =
      order.idClient && order.idClient.firstname
        ? order.idClient.firstname
        : "";
    const lastName =
      order.idClient && order.idClient.lastname ? order.idClient.lastname : "";
    const customerName =
      firstName || lastName ? `${firstName} ${lastName}`.trim() : "Unknown";

    // Determine status class and text
    let statusClass = "status-pending";
    let statusText = "Pending";

    if (order.orderStatus === "accepted") {
      statusClass = "status-accepted";
      statusText = "Accepted";
    } else if (order.orderStatus === "completed") {
      statusClass = "status-shipped";
      statusText = "Completed";
    } else if (order.orderStatus === "cancelled") {
      statusClass = "status-cancelled";
      statusText = "Cancelled";
    } else if (order.orderStatus === "shipped") {
      statusClass = "status-shipped";
      statusText = "Shipped";
    } else if (order.orderStatus === "postponed") {
      statusClass = "status-postponed";
      statusText = "Postponed";
    }

    // Déterminer les actions en fonction du statut de la commande
    let actionButtons = "";

    // Toujours afficher le bouton "View Details"
    actionButtons += `
      <a href="detailsOrders.html?id=${order._id}" class="btn btn-action btn-outline-primary me-1" title="View Details">
        <i class="bi bi-eye"></i>
      </a>
    `;

    // Actions spécifiques selon le statut
    if (order.orderStatus === "pending") {
      // Pour les commandes en attente: view details, accepte order, cancel order
      actionButtons += `
        <button class="btn btn-action btn-outline-success me-1 accept-order" data-id="${order._id}" title="Accept Order">
          <i class="bi bi-check"></i>
        </button>
        <button class="btn btn-action btn-outline-danger cancel-order" data-id="${order._id}" title="Cancel Order">
          <i class="bi bi-x-circle"></i>
        </button>
      `;
    } else if (order.orderStatus === "accepted") {
      // Pour les commandes acceptées: view details, make to ship, complete order, cancel order
      actionButtons += `
        <button class="btn btn-action btn-outline-primary me-1 make-to-ship" data-id="${order._id}" title="Make to Ship">
          <i class="bi bi-truck"></i>
        </button>
        <button class="btn btn-action btn-outline-success me-1 complete-order" data-id="${order._id}" title="Complete Order">
          <i class="bi bi-check-all"></i>
        </button>
        <button class="btn btn-action btn-outline-danger cancel-order" data-id="${order._id}" title="Cancel Order">
          <i class="bi bi-x-circle"></i>
        </button>
      `;
    } else if (order.orderStatus === "shipped") {
      // Pour les commandes expédiées: view details, complete order, cancel order
      actionButtons += `
        <button class="btn btn-action btn-outline-success me-1 complete-order" data-id="${order._id}" title="Complete Order">
          <i class="bi bi-check-all"></i>
        </button>
        <button class="btn btn-action btn-outline-danger cancel-order" data-id="${order._id}" title="Cancel Order">
          <i class="bi bi-x-circle"></i>
        </button>
      `;
    } else if (order.orderStatus === "postponed") {
      // Pour les commandes reportées: view details, reschedule, cancel order
      actionButtons += `
        <button class="btn btn-action btn-outline-primary me-1 reschedule-order" data-id="${order._id}" title="Reschedule Order">
          <i class="bi bi-calendar-check"></i>
        </button>
        <button class="btn btn-action btn-outline-success me-1 accept-order" data-id="${order._id}" title="Accept Order">
          <i class="bi bi-check"></i>
        </button>
        <button class="btn btn-action btn-outline-danger cancel-order" data-id="${order._id}" title="Cancel Order">
          <i class="bi bi-x-circle"></i>
        </button>
      `;
    } else if (
      order.orderStatus === "completed" ||
      order.orderStatus === "cancelled"
    ) {
      // Pour les commandes complétées ou annulées: view details, supprimer
      actionButtons += `
        <button class="btn btn-action btn-outline-danger delete-order" data-id="${order._id}" title="Delete Order">
          <i class="bi bi-trash"></i>
        </button>
      `;
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
          ${actionButtons}
        </div>
      </td>
    `;

    tableBody.appendChild(row);
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

  // Add event listeners to cancel buttons
  document.querySelectorAll(".cancel-order").forEach((button) => {
    button.addEventListener("click", (e) => {
      const orderId = e.currentTarget.getAttribute("data-id");
      cancelOrder(orderId);
    });
  });

  // Add event listeners to complete buttons
  document.querySelectorAll(".complete-order").forEach((button) => {
    button.addEventListener("click", (e) => {
      const orderId = e.currentTarget.getAttribute("data-id");
      completeOrder(orderId);
    });
  });

  // Add event listeners to make-to-ship buttons
  document.querySelectorAll(".make-to-ship").forEach((button) => {
    button.addEventListener("click", (e) => {
      const orderId = e.currentTarget.getAttribute("data-id");
      if (typeof window.makeToShip === "function") {
        window.makeToShip(orderId);
      } else {
        makeToShipFallback(orderId);
      }
    });
  });

  // Add event listeners to reschedule buttons
  document.querySelectorAll(".reschedule-order").forEach((button) => {
    button.addEventListener("click", (e) => {
      const orderId = e.currentTarget.getAttribute("data-id");
      rescheduleOrder(orderId);
    });
  });
}

// Ajouter une fonction pour compléter une commande
function completeOrder(orderId) {
  Swal.fire({
    title: "Compléter la commande",
    text: "Êtes-vous sûr de vouloir marquer cette commande comme complétée?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Oui, compléter",
    cancelButtonText: "Annuler",
  }).then((result) => {
    if (result.isConfirmed) {
      updateOrderStatus(orderId, "completed");
    }
  });
}

// Ajouter une fonction pour annuler une commande
function cancelOrder(orderId) {
  Swal.fire({
    title: "Annuler la commande",
    text: "Êtes-vous sûr de vouloir annuler cette commande?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Oui, annuler",
    cancelButtonText: "Non, garder",
    input: "text",
    inputLabel: "Raison d'annulation (obligatoire)",
    inputPlaceholder: "Veuillez saisir la raison de l'annulation",
    inputValidator: (value) => {
      if (!value) {
        return "Vous devez saisir une raison d'annulation!";
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const refusalReason = result.value;
      updateOrderStatusWithReason(orderId, "cancelled", refusalReason);
    }
  });
}

// Function to accept an order
function acceptOrder(orderId) {
  // Afficher un indicateur de chargement
  Swal.fire({
    title: "Vérification du stock...",
    text: "Nous vérifions la disponibilité des produits",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // Récupérer les détails de la commande pour vérifier le stock
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  // Créer une requête XHR pour obtenir les détails de la commande
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/order/${orderId}`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        const order = response.order;

        // Vérifier si la commande a des produits
        if (
          !order.cartData ||
          !order.cartData.items ||
          order.cartData.items.length === 0
        ) {
          Swal.fire({
            title: "Erreur!",
            text: "Impossible de vérifier le stock: aucun produit trouvé dans la commande",
            icon: "error",
          });
          return;
        }

        // Vérifier le stock pour chaque produit
        checkStockForAllProducts(order, token);
      } catch (error) {
        console.error(
          "Erreur lors de l'analyse des détails de la commande:",
          error
        );
        Swal.fire({
          title: "Erreur!",
          text: "Erreur lors de la vérification du stock",
          icon: "error",
        });
      }
    } else {
      console.error(
        "Erreur lors de la récupération des détails de la commande:",
        xhr.status
      );
      Swal.fire({
        title: "Erreur!",
        text: "Erreur lors de la récupération des détails de la commande",
        icon: "error",
      });
    }
  };

  xhr.onerror = () => {
    console.error(
      "Erreur réseau lors de la récupération des détails de la commande"
    );
    Swal.fire({
      title: "Erreur réseau",
      text: "Veuillez vérifier votre connexion et réessayer",
      icon: "error",
    });
  };

  // Envoyer la requête
  xhr.send();
}

// Modifier la fonction checkStockForAllProducts pour mieux gérer les IDs de produits et les erreurs
function checkStockForAllProducts(order, token) {
  // Tableau pour stocker les produits avec stock insuffisant
  const productsWithInsufficientStock = [];
  let pendingRequests = 0;
  let failedRequests = 0;

  // Pour chaque produit dans la commande
  order.cartData.items.forEach((item) => {
    const product = item.productId;
    const quantityOrdered = item.quantity;

    // Déterminer l'ID du produit à utiliser
    let productId = null;

    // Essayer différentes propriétés pour trouver un ID valide
    if (product._id) {
      productId = product._id;
    } else if (product.productId) {
      productId = product.productId;
    } else if (product.id) {
      productId = product.id;
    }

    // Si aucun ID valide n'est trouvé, ajouter à la liste des produits avec stock insuffisant
    if (!productId) {
      console.error("Impossible de déterminer l'ID du produit:", product);
      productsWithInsufficientStock.push({
        name: product.productName || "Produit inconnu",
        ordered: quantityOrdered,
        available: 0,
        error: "ID de produit invalide",
      });
      return; // Passer au produit suivant
    }

    // Incrémenter le compteur de requêtes en attente
    pendingRequests++; // Vérifier le stock actuel du produit
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
      pendingRequests--;
      if (xhr.status === 200) {
        try {
          const productData = JSON.parse(xhr.responseText);
          let currentStock = 0;
          let productName = "Produit inconnu";

          // Accéder correctement aux données du produit dans la réponse API
          if (productData.data && productData.data.product) {
            if (productData.data.product.stock !== undefined) {
              currentStock = productData.data.product.stock;
            }
            if (productData.data.product.productName) {
              productName = productData.data.product.productName;
            }
          }
          console.log(
            `Produit ${productName}: Stock disponible = ${currentStock}, Quantité commandée = ${quantityOrdered}`
          );

          if (currentStock < quantityOrdered) {
            productsWithInsufficientStock.push({
              name: productName,
              ordered: quantityOrdered,
              available: currentStock,
            });
          }
        } catch (error) {
          console.error(
            "Erreur lors de l'analyse des données du produit:",
            error
          );
          failedRequests++;
          productsWithInsufficientStock.push({
            name: product.productName || "Produit inconnu",
            ordered: quantityOrdered,
            available: "Erreur",
            error: "Erreur lors de l'analyse des données",
          });
        }
      } else {
        console.error(
          `Erreur lors de la récupération des données du produit ${productId}:`,
          xhr.status
        );
        failedRequests++;
        productsWithInsufficientStock.push({
          name: product.productName || "Produit inconnu",
          ordered: quantityOrdered,
          available: "Erreur",
          error: `Erreur ${xhr.status} lors de la récupération des données`,
        });
      }

      if (pendingRequests === 0) {
        processStockCheckResults(
          order._id,
          productsWithInsufficientStock,
          failedRequests
        );
      }
    };

    xhr.ontimeout = () => {
      pendingRequests--;
      failedRequests++;
      console.error(
        `Timeout lors de la récupération des données du produit ${productId}`
      );
      productsWithInsufficientStock.push({
        name: product.productName || "Produit inconnu",
        ordered: quantityOrdered,
        available: "Timeout",
        error: "La requête a expiré",
      });

      if (pendingRequests === 0) {
        processStockCheckResults(
          order._id,
          productsWithInsufficientStock,
          failedRequests
        );
      }
    };

    xhr.onerror = () => {
      pendingRequests--;
      failedRequests++;
      console.error(
        `Erreur réseau lors de la récupération des données du produit ${productId}`
      );
      productsWithInsufficientStock.push({
        name: product.productName || "Produit inconnu",
        ordered: quantityOrdered,
        available: "Erreur",
        error: "Erreur réseau",
      });

      if (pendingRequests === 0) {
        processStockCheckResults(
          order._id,
          productsWithInsufficientStock,
          failedRequests
        );
      }
    };

    xhr.send();
  });

  if (pendingRequests === 0) {
    processStockCheckResults(
      order._id,
      productsWithInsufficientStock,
      failedRequests
    );
  }
}

// Mettre à jour la fonction processStockCheckResults pour gérer les erreurs
function processStockCheckResults(
  orderId,
  productsWithInsufficientStock,
  failedRequests
) {
  // Fermer l'indicateur de chargement
  Swal.close();

  // Si des requêtes ont échoué mais qu'il n'y a pas de problème de stock identifié
  if (
    failedRequests > 0 &&
    productsWithInsufficientStock.length === failedRequests
  ) {
    // Construire le message d'erreur
    let errorMessage =
      "Impossible de vérifier le stock pour certains produits:<br><br>";
    errorMessage += "<ul>";
    productsWithInsufficientStock.forEach((product) => {
      errorMessage += `<li><strong>${product.name}</strong>: ${product.error || "Erreur inconnue"}</li>`;
    });
    errorMessage += "</ul>";
    errorMessage += "<br>Voulez-vous quand même accepter la commande?";

    // Afficher l'erreur avec option de continuer
    Swal.fire({
      title: "Erreur de vérification du stock",
      html: errorMessage,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, accepter quand même",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus(orderId, "accepted");
      }
    });
    return;
  }

  // Si des produits ont un stock insuffisant
  if (productsWithInsufficientStock.length > 0) {
    // Filtrer pour ne garder que les produits avec un vrai problème de stock (pas les erreurs)
    const realStockIssues = productsWithInsufficientStock.filter(
      (p) => !p.error
    );

    if (realStockIssues.length > 0) {
      // Construire le message d'erreur pour les problèmes de stock
      let errorMessage =
        "Les produits suivants n'ont pas de stock suffisant:<br><br>";
      errorMessage += "<ul>";
      realStockIssues.forEach((product) => {
        errorMessage += `<li><strong>${product.name}</strong>: Commandé: ${product.ordered}, Disponible: ${product.available}</li>`;
      });
      errorMessage += "</ul>";

      // Afficher l'erreur
      Swal.fire({
        title: "Stock insuffisant!",
        html: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
      });
    } else if (failedRequests > 0) {
      // S'il n'y a que des erreurs techniques, proposer de continuer
      let errorMessage =
        "Impossible de vérifier le stock pour certains produits:<br><br>";
      errorMessage += "<ul>";
      productsWithInsufficientStock.forEach((product) => {
        errorMessage += `<li><strong>${product.name}</strong>: ${product.error || "Erreur inconnue"}</li>`;
      });
      errorMessage += "</ul>";
      errorMessage += "<br>Voulez-vous quand même accepter la commande?";

      Swal.fire({
        title: "Erreur de vérification du stock",
        html: errorMessage,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, accepter quand même",
        cancelButtonText: "Annuler",
      }).then((result) => {
        if (result.isConfirmed) {
          updateOrderStatus(orderId, "accepted");
        }
      });
    }
  } else {
    // Si tous les produits ont un stock suffisant, demander confirmation pour accepter la commande
    Swal.fire({
      title: "Stock vérifié avec succès",
      text: "Tous les produits sont disponibles en stock. Voulez-vous accepter cette commande?",
      icon: "success",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, accepter",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        updateOrderStatus(orderId, "accepted");
      }
    });
  }
}

// Mettre à jour la fonction updateOrderCounts pour inclure les commandes reportées
function updateOrderCounts(orders) {
  // Count orders by status
  const totalCount = orders.length;
  const pendingOrders = orders.filter(
    (order) => order.orderStatus === "pending"
  ).length;
  const acceptedOrders = orders.filter(
    (order) => order.orderStatus === "accepted"
  ).length;
  const completedOrders = orders.filter(
    (order) => order.orderStatus === "completed"
  ).length;
  const cancelledOrders = orders.filter(
    (order) => order.orderStatus === "cancelled"
  ).length;
  const shippedOrders = orders.filter(
    (order) => order.orderStatus === "shipped"
  ).length;
  const postponedOrders = orders.filter(
    (order) => order.orderStatus === "postponed"
  ).length;

  // Update stat cards
  updateCountDisplay(".total-orders-count", totalCount);
  updateCountDisplay(".completed-orders-count", completedOrders);
  updateCountDisplay(".accepted-orders-count", acceptedOrders);
  updateCountDisplay(".pending-orders-count", pendingOrders);
  updateCountDisplay(".cancelled-orders-count", cancelledOrders);
  updateCountDisplay(".shipped-orders-count", shippedOrders);
  updateCountDisplay(".postponed-orders-count", postponedOrders);

  // Update tab badges
  updateCountDisplay(".all-orders-badge", totalCount);
  updateCountDisplay(".pending-orders-badge", pendingOrders);
  updateCountDisplay(".accepted-orders-badge", acceptedOrders);
  updateCountDisplay(".completed-orders-badge", completedOrders);
  updateCountDisplay(".cancelled-orders-badge", cancelledOrders);
  updateCountDisplay(".shipped-orders-badge", shippedOrders);
  updateCountDisplay(".postponed-orders-badge", postponedOrders);
}

// Helper function to safely update count displays
function updateCountDisplay(selector, value) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    if (element) {
      element.textContent = value;
    }
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
        filterAndDisplayOrders();
      }
    });
  });
}

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
    cancelButtonText: "Annuler",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteOrder(orderId);
    }
  });
}

// Delete an order via XHR
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

  xhr.onload = () => {
    if (xhr.status === 200) {
      // Reload orders after successful deletion
      loadOrders();
      Swal.fire({
        title: "Supprimé!",
        text: "La commande a été supprimée avec succès.",
        icon: "success",
      });
    } else {
      console.error("Error deleting order:", xhr.status);
      Swal.fire({
        title: "Erreur!",
        text: `Erreur lors de la suppression de la commande. Statut: ${xhr.status}`,
        icon: "error",
      });
    }
  };

  xhr.onerror = () => {
    console.error("Network error when deleting order");
    Swal.fire({
      title: "Erreur réseau",
      text: "Veuillez vérifier votre connexion et réessayer.",
      icon: "error",
    });
  };

  // Send the request
  xhr.send();
}

// Ajouter une fonction pour reporter une commande
function postponeOrder(orderId) {
  Swal.fire({
    title: "Reporter la commande",
    text: "Êtes-vous sûr de vouloir reporter cette commande?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Oui, reporter",
    cancelButtonText: "Annuler",
  }).then((result) => {
    if (result.isConfirmed) {
      updateOrderStatus(orderId, "postponed");
    }
  });
}

// Ajouter une fonction pour reprogrammer une commande reportée
function rescheduleOrder(orderId) {
  // Créer un calendrier pour sélectionner une nouvelle date
  Swal.fire({
    title: "Reprogrammer la commande",
    html: `
      <div class="mb-3">
        <label for="reschedule-date" class="form-label">Nouvelle date de livraison</label>
        <input type="date" id="reschedule-date" class="form-control" min="${new Date().toISOString().split("T")[0]}">
      </div>
      <div class="mb-3">
        <label for="reschedule-notes" class="form-label">Notes (optionnel)</label>
        <textarea id="reschedule-notes" class="form-control" rows="3" placeholder="Ajouter des notes concernant la reprogrammation..."></textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Confirmer",
    cancelButtonText: "Annuler",
    preConfirm: () => {
      const date = document.getElementById("reschedule-date").value;
      const notes = document.getElementById("reschedule-notes").value;

      if (!date) {
        Swal.showValidationMessage("Veuillez sélectionner une date");
        return false;
      }

      return { date, notes };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      // Mettre à jour le statut de la commande avec les nouvelles informations
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "../login.html";
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open(
        "PUT",
        `http://localhost:3000/order/${orderId}/reschedule`,
        true
      );
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = () => {
        if (xhr.status === 200) {
          // Recharger les commandes après la reprogrammation réussie
          loadOrders();
          Swal.fire({
            title: "Succès!",
            text: "La commande a été reprogrammée avec succès.",
            icon: "success",
          });
        } else {
          console.error(
            "Erreur lors de la reprogrammation de la commande:",
            xhr.status
          );
          Swal.fire({
            title: "Erreur!",
            text: `Erreur lors de la reprogrammation de la commande. Statut: ${xhr.status}`,
            icon: "error",
          });
        }
      };

      xhr.onerror = () => {
        console.error(
          "Erreur réseau lors de la reprogrammation de la commande"
        );
        Swal.fire({
          title: "Erreur réseau",
          text: "Veuillez vérifier votre connexion et réessayer.",
          icon: "error",
        });
      };

      // Envoyer la requête avec les données de reprogrammation
      xhr.send(
        JSON.stringify({
          newDeliveryDate: result.value.date,
          notes: result.value.notes,
        })
      );
    }
  });
}

// Function to handle shipping an order if the delivery.js makeToShip function isn't available
function makeToShipFallback(orderId) {
  Swal.fire({
    title: "Confirmer l'expédition",
    text: "Êtes-vous sûr de vouloir expédier cette commande ? Une livraison sera créée et une facture générée.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Oui, expédier",
    cancelButtonText: "Annuler",
  }).then((result) => {
    if (result.isConfirmed) {
      // Mettre à jour le statut de la commande vers "shipped"
      updateOrderStatus(orderId, "shipped");

      // Ensuite, créer la livraison et la facture
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `/order/${orderId}/ship`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${localStorage.getItem("token")}`
      );

      xhr.onload = () => {
        if (xhr.status === 200) {
          Swal.fire({
            title: "Succès!",
            text: "La commande a été expédiée, une livraison créée et une facture générée",
            icon: "success",
            confirmButtonText: "OK",
          }).then(() => {
            // Reload the page or update UI
            window.location.reload();
          });
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            showErrorMessage(
              response.message || "Erreur lors de l'expédition de la commande"
            );
          } catch (e) {
            showErrorMessage("Erreur lors de l'expédition de la commande");
          }
        }
      };

      xhr.onerror = () => {
        showErrorMessage("Erreur de connexion au serveur");
      };

      xhr.send();
    }
  });
}

function showErrorMessage(message) {
  Swal.fire({
    title: "Erreur!",
    text: message,
    icon: "error",
    confirmButtonText: "OK",
  });
}
