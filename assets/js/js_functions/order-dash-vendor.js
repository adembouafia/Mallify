// Global variables
let currentPage = 1
let itemsPerPage = 10
let totalOrders = 0
let orders = []
let searchQuery = ""
let currentOrder = null

// DOM elements
const ordersTableBody = document.querySelector("table tbody")
const searchInput = document.querySelector('input[placeholder="Search..."]')
const searchButton = document.querySelector(".input-group button")
const entriesSelect = document.querySelector(".form-select")
const paginationInfo = document.querySelector(".pagination-info")
const paginationLinks = document.querySelector(".pagination")

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Load orders on page load
  const currentUrl = window.location.href
  
  if (currentUrl.includes("detailsOrders.html")) {
    // We're on the order details page
    loadOrderDetails()
  } else {
    // We're on the main orders page
    loadOrders()
  }

  // Set up event listeners
  setupEventListeners()
})

// Set up event listeners for interactive elements
function setupEventListeners() {
  // Search functionality
  if (searchButton) {
    searchButton.addEventListener("click", () => {
      searchQuery = searchInput.value.trim()
      currentPage = 1
      loadOrders()
    })
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchQuery = searchInput.value.trim()
        currentPage = 1
        loadOrders()
      }
    })
  }

  // Change number of entries displayed
  if (entriesSelect) {
    entriesSelect.addEventListener("change", () => {
      itemsPerPage = Number.parseInt(entriesSelect.value)
      currentPage = 1
      loadOrders()
    })
  }
}

// Function to load order details from URL parameters
function loadOrderDetails() {
  // Get order ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const orderId = urlParams.get("id")
  
  if (!orderId) {
    displayError("No order ID provided in the URL")
    return
  }
  
  // Create loading indicator in the page content area
  const contentArea = document.querySelector(".content-wrapper")
  if (contentArea) {
    contentArea.innerHTML = '<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>'
  }
  
  // Get the auth token from localStorage
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "../login.html"
    return
  }
  
  // Create XHR request to get order details
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `/order/${orderId}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        currentOrder = response.order
        displayOrderDetails(currentOrder)
      } catch (error) {
        console.error("Error parsing order details:", error)
        displayError("Failed to parse order details")
      }
    } else {
      console.error("Error fetching order details:", xhr.status)
      displayError("Failed to load order details. Status: " + xhr.status)
    }
  }
  
  xhr.onerror = function() {
    console.error("Network error when fetching order details")
    displayError("Network error. Please check your connection and try again.")
  }
  
  // Send the request
  xhr.send()
}

// Function to display order details in the UI
function displayOrderDetails(order) {
  const contentArea = document.querySelector(".content-wrapper")
  if (!contentArea) return
  
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
     
      let displayProductId = "N/A";
      
      // Try different ways to get the productId
      if (typeof product === 'object' && product !== null) {
        if (product.productId) {
          displayProductId = product.productId;
        } else if (product._id) {
          displayProductId = product._id.toString().substring(0, 8);
        }
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
    // Fallback sample data if no items are found
    items = [
      { id: "2541", quantity: 1, price: 80, total: 80 },
      { id: "2541", quantity: 4, price: 80, total: 320 },
      { id: "2541", quantity: 2, price: 80, total: 160 },
      { id: "2541", quantity: 5, price: 10, total: 50 },
      { id: "2541", quantity: 1, price: 80, total: 80 }
    ]
    subtotal = 690.00
  }
  
  // Calculate total amount (no discount or tax)
  const deliveryCharge = 0.00
  const totalAmount = (parseFloat(subtotal) + parseFloat(deliveryCharge)).toFixed(2)
  
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
                    <div style="margin-right: 30px;">
                      <a href="#!" class="btn btn-warning" id="edit-order-btn">Edit Order</a>
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
                          class="progress-bar progress-bar progress-bar-striped progress-bar-animated bg-warning"
                          role="progressbar"
                          style="width: 60%"
                          aria-valuenow="60"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div class="d-flex align-items-center gap-2 mt-2">
                        <p class="mb-0">Processing</p>
                        <div class="spinner-border spinner-border-sm text-warning" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Shipping -->
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
                  <div>
                    <a href="#!" class="btn btn-warning" id="make-ready-ship-btn">Make As Ready To Ship</a>
                  </div>
                </div>
              </div
              
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
                          <th>Quantity</th>
                          <th>Price/Once</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${items.map(item => `
                          <tr>
                            <td>${item.id}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>$${item.total.toFixed(2)}</td>
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
        </div
        
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
                          <iconify-icon icon="solar:clipboard-text-broken"></iconify-icon>
                          Sub Total :
                        </p>
                      </td>
                      <td class="text-end text-dark fw-medium px-0">
                        $${subtotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td class="px-0">
                        <p class="d-flex mb-0 align-items-center gap-1">
                          <iconify-icon icon="solar:kick-scooter-broken" class="align-middle"></iconify-icon>
                          Delivery Charge :
                        </p>
                      </td>
                      <td class="text-end text-dark fw-medium px-0">
                        $${deliveryCharge.toFixed(2)}
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
                <p class="fw-medium text-dark mb-0">$${totalAmount}</p>
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
                  <a href="#!"><i class="bx bx-edit-alt fs-18"></i></a>
                </div>
              </div>
              <p class="mb-1">${customerPhone || "No phone number provided"}</p>

              <div class="d-flex justify-content-between mt-3">
                <h5 class="card-title">Shipping Address</h5>
                <div>
                  <a href="#!"><i class="bx bx-edit-alt fs-18"></i></a>
                </div>
              </div>

              <div>
                <p class="mb-1">${customerName}</p>
                <p class="mb-1">1344 Hershell Hollow Road ,</p>
                <p class="mb-1">Tukwila, WA 98168 ,</p>
                <p class="mb-1">United States</p>
                <p class="">${customerPhone || "No phone number provided"}</p>
              </div>

              <div class="d-flex justify-content-between mt-3">
                <h5 class="card-title">Billing Address</h5>
                <div>
                  <a href="#!"><i class="bx bx-edit-alt fs-18"></i></a>
                </div>
              </div>

              <p class="mb-1">Same as shipping address</p>
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
  // Edit Order button
  const editBtn = document.getElementById("edit-order-btn")
  if (editBtn) {
    editBtn.addEventListener("click", function() {
      alert("Edit order functionality will be implemented here")
    })
  }
  
  // Make as Ready to Ship button
  const readyToShipBtn = document.getElementById("make-ready-ship-btn")
  if (readyToShipBtn) {
    readyToShipBtn.addEventListener("click", function() {
      updateOrderStatus(orderId, "ready_for_shipping")
    })
  }
}

// Function to update order status via XHR
function updateOrderStatus(orderId, status) {
  // Get the auth token from localStorage
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "../login.html"
    return
  }
  
  // Create XHR request to update order status
  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `/order/status/${orderId}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        // Refresh the order details to show updated status
        loadOrderDetails()
        
        // Show success message
        Swal.fire({
          title: "Success!",
          text: `Order successfully marked as ${status.replace("_", " ")}`,
          icon: "success",
          confirmButtonText: "OK"
        })
      } catch (error) {
        console.error("Error parsing update response:", error)
        Swal.fire({
          title: "Error!",
          text: "Failed to update order status",
          icon: "error",
          confirmButtonText: "OK"
        })
      }
    } else {
      console.error("Error updating order status:", xhr.status)
      Swal.fire({
        title: "Error!",
        text: "Failed to update order status. Please try again.",
        icon: "error",
        confirmButtonText: "OK"
      })
    }
  }
  
  xhr.onerror = function() {
    console.error("Network error when updating order status")
    Swal.fire({
      title: "Network Error",
      text: "Please check your connection and try again.",
      icon: "error",
      confirmButtonText: "OK"
    })
  }
  
  // Send the request with status data
  xhr.send(JSON.stringify({ status: status }))
}

// Display error message
function displayError(message) {
  const contentArea = document.querySelector(".content-wrapper")
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="alert alert-danger m-4">
        <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
        <p>${message}</p>
        <a href="orders.html" class="btn btn-primary mt-2">Back to Orders</a>
      </div>
    `
  }
}

async function loadOrders() {
  try {
    if (ordersTableBody) {
      ordersTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Loading orders...</td></tr>'
    }

    // Get the authentication token from localStorage
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "../login.html"
      return
    }

    // Fetch orders from the API
    const response = await fetch("/order", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch orders")
    }

    const data = await response.json()
    orders = data.orders

    // Update order counts
    updateOrderCounts()

    // Filter orders if search query exists
    if (searchQuery) {
      orders = filterOrders(orders, searchQuery)
    }

    // Update total orders count
    totalOrders = orders.length

    // Calculate pagination
    const totalPages = Math.ceil(totalOrders / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalOrders)

    // Display orders for current page
    displayOrders(orders.slice(startIndex, endIndex))

    // Update pagination info
    updatePaginationInfo(startIndex, endIndex, totalOrders)

    // Update pagination links
    updatePaginationLinks(currentPage, totalPages)
  } catch (error) {
    console.error("Error loading orders:", error)
    if (ordersTableBody) {
      ordersTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error loading orders: ${error.message}</td></tr>`
    }
  }
}

function filterOrders(orders, query) {
  query = query.toLowerCase()
  return orders.filter((order) => {
    // Search in order ID
    if (order._id && order._id.toLowerCase().includes(query)) return true

    // Search in customer name
    if (order.idClient && order.idClient.name && order.idClient.name.toLowerCase().includes(query)) return true

    // Add more fields to search as needed

    return false
  })
}

function displayOrders(ordersToDisplay) {
  if (!ordersTableBody) return

  if (ordersToDisplay.length === 0) {
    ordersTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No orders found</td></tr>'
    return
  }

  ordersTableBody.innerHTML = ""

  ordersToDisplay.forEach((order) => {
    let total = order.orderTotal || 0
    let itemCount = 0

    // Use the new cartData field instead of idPanier
    if (order.cartData && order.cartData.items) {
      itemCount = order.cartData.items.length

      // If orderTotal is not set, calculate it from cartData
      if (!order.orderTotal) {
        total = 0
        order.cartData.items.forEach((item) => {
          const price = Number.parseFloat(item.productId.productPrice) || 0
          const quantity = Number.parseInt(item.quantity) || 0
          total += price * quantity
        })
      }
    }

    // Use a try-catch block for date formatting to handle invalid dates
    let formattedDate = "Invalid Date"
    try {
      const orderDate = new Date(order.dateCommande)
      if (!isNaN(orderDate.getTime())) {
        formattedDate = orderDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }
    } catch (e) {
      console.error("Error formatting date:", e)
    }

    // Format customer name with proper checks
    const firstName = order.idClient && order.idClient.firstname ? order.idClient.firstname : ""
    const lastName = order.idClient && order.idClient.lastname ? order.idClient.lastname : ""
    const customerName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "Unknown"

    // Create table row
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>#${order._id ? order._id.substring(0, 8) : "N/A"}</td>
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
        `

    ordersTableBody.appendChild(row)
  })

  // Add event listeners to delete buttons
  document.querySelectorAll(".delete-order").forEach((button) => {
    button.addEventListener("click", (e) => {
      const orderId = e.currentTarget.getAttribute("data-id")
      confirmDeleteOrder(orderId)
    })
  })
}

// Update order counts in the info boxes
function updateOrderCounts() {
  if (!orders) return

  // Safely update the order count displays
  updateCountDisplay(".info-box:nth-child(1) .info-box-number", orders.length)
  updateCountDisplay(".info-box:nth-child(2) .info-box-number", "0") // Shipped orders
  updateCountDisplay(".info-box:nth-child(3) .info-box-number", "0") // Cancelled orders
  updateCountDisplay(".info-box:nth-child(4) .info-box-number", "0") // Refunded orders
}

// Helper function to safely update count displays
function updateCountDisplay(selector, value) {
  const element = document.querySelector(selector)
  if (element) {
    element.textContent = value
  }
}

// Update pagination information text
function updatePaginationInfo(start, end, total) {
  if (paginationInfo) {
    paginationInfo.textContent = `Showing ${start + 1} to ${end} of ${total} entries`
  }
}

// Update pagination links
function updatePaginationLinks(currentPage, totalPages) {
  if (!paginationLinks) return

  let html = ""

  // Previous button
  html += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>
    `

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `
  }

  // Next button
  html += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
        </li>
    `

  paginationLinks.innerHTML = html

  // Add event listeners to pagination links
  document.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const page = Number.parseInt(e.currentTarget.getAttribute("data-page"))
      if (page && page !== currentPage && page > 0 && page <= totalPages) {
        currentPage = page
        loadOrders()
      }
    })
  })
}

//delete functions

// Confirm and delete an order
function confirmDeleteOrder(orderId) {
  if (confirm("Are you sure you want to delete this order?")) {
    deleteOrder(orderId)
  }
}

// Delete an order via API
async function deleteOrder(orderId) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "../login.html"
      return
    }

    const response = await fetch(`/order/delete/${orderId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete order")
    }

    loadOrders()
    alert("Order deleted successfully")
  } catch (error) {
    console.error("Error deleting order:", error)
    alert(`Error deleting order: ${error.message}`)
  }
}

//end delete functions
