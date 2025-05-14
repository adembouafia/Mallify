document.addEventListener("DOMContentLoaded", () => {
  // Initialize the invoice system
  initInvoiceSystem()
})

function initInvoiceSystem() {
  // Set up event listeners
  setupEventListeners()

  // Set default time period to Today (changed from Last Month)
  filterByTimePeriod("day")

  // Update the time button text to "Today"
  document.getElementById("timeBtnText").textContent = "Today"
}

function setupEventListeners() {
  // Time period dropdown
  const timeBtn = document.getElementById("timeBtn")
  const timeOptions = document.getElementById("timeOptions")

  timeBtn.addEventListener("click", () => {
    timeOptions.style.display = timeOptions.style.display === "block" ? "none" : "block"
  })

  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".time-selector-container")) {
      timeOptions.style.display = "none"
    }
  })

  // Time period options
  const timeOptionElements = document.querySelectorAll(".time-option")
  timeOptionElements.forEach((option) => {
    option.addEventListener("click", function () {
      const period = this.getAttribute("data-period")

      if (period) {
        document.getElementById("timeBtnText").textContent = this.textContent
        filterByTimePeriod(period)
      }

      timeOptions.style.display = "none"
    })
  })

  // Custom range option
  const customRangeOption = document.getElementById("customRangeOption")
  const dateRangeModal = document.getElementById("dateRangeModal")
  const dateRangeClose = document.getElementById("dateRangeClose")

  customRangeOption.addEventListener("click", () => {
    dateRangeModal.style.display = "flex"
    timeOptions.style.display = "none"

    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    document.getElementById("startDate").valueAsDate = thirtyDaysAgo
    document.getElementById("endDate").valueAsDate = today
  })

  dateRangeClose.addEventListener("click", () => {
    dateRangeModal.style.display = "none"
  })

  // Apply custom date range
  const applyDateRange = document.getElementById("applyDateRange")
  applyDateRange.addEventListener("click", () => {
    const startDate = new Date(document.getElementById("startDate").value)
    const endDate = new Date(document.getElementById("endDate").value)

    if (startDate && endDate) {
      filterByCustomDateRange(startDate, endDate)

      // Format dates for display
      const startFormatted = formatDate(startDate)
      const endFormatted = formatDate(endDate)
      document.getElementById("timeBtnText").textContent = "Custom Range"
      document.getElementById("periodText").textContent = `${startFormatted} - ${endFormatted}`

      dateRangeModal.style.display = "none"
    } else {
      alert("Please select valid start and end dates")
    }
  })

  // Order details modal
  const orderModal = document.getElementById("orderModal")
  const modalClose = document.getElementById("modalClose")

  modalClose.addEventListener("click", () => {
    orderModal.style.display = "none"
  })

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === orderModal) {
      orderModal.style.display = "none"
    }
    if (event.target === dateRangeModal) {
      dateRangeModal.style.display = "none"
    }
  })

  // Download PDF button
  const downloadBtn = document.getElementById("downloadBtn")
  downloadBtn.addEventListener("click", () => {
    generateCustomPDF()
  })
}

function filterByTimePeriod(period) {
  const today = new Date()
  let startDate, periodText
  
  // Show loading state
  const tableBody = document.getElementById("invoiceTableBody")
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px;">
          <div style="display: flex; justify-content: center; align-items: center;">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span style="margin-left: 10px;">Loading invoices...</span>
          </div>
        </td>
      </tr>
    `
  }

  // End date is always today (present) as requested
  const endDate = new Date(today.setHours(23, 59, 59, 999))

  switch (period) {
    case "day":
      startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)
      periodText = "Today"
      break
    case "week":
      // Start of current week (Sunday)
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 7) // Changed to show last 7 days to present
      startDate.setHours(0, 0, 0, 0)

      periodText = `${formatDate(startDate)} - ${formatDate(endDate)}`
      break
    case "month":
      // Last month to present
      startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - 1)
      startDate.setHours(0, 0, 0, 0)

      periodText = `${formatDate(startDate)} - ${formatDate(endDate)}`
      break
    case "year":
      // Last year to present
      startDate = new Date(today)
      startDate.setFullYear(startDate.getFullYear() - 1)
      startDate.setHours(0, 0, 0, 0)

      periodText = `${formatDate(startDate)} - ${formatDate(endDate)}`
      break
    default:
      // Default to today
      startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)
      periodText = "Today"
  }

  // Update the period text
  document.getElementById("periodText").textContent = periodText
  
  // Fetch invoices from API
  fetchInvoices(startDate, endDate)
}

function filterByCustomDateRange(startDate, endDate) {
  // Adjust end date to include the entire day
  const adjustedEndDate = new Date(endDate)
  adjustedEndDate.setHours(23, 59, 59, 999)
  
  // Show loading state
  const tableBody = document.getElementById("invoiceTableBody")
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px;">
          <div style="display: flex; justify-content: center; align-items: center;">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span style="margin-left: 10px;">Loading invoices...</span>
          </div>
        </td>
      </tr>
    `
  }
  
  // Fetch invoices from API
  fetchInvoices(startDate, adjustedEndDate)
}

function fetchInvoices(startDate, endDate) {
  // Get the authentication token from localStorage
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "../login.html"
    return
  }
  
  // Create XHR request to get invoices
  const xhr = new XMLHttpRequest()
  xhr.open("GET", "http://localhost:3000/invoice", true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        const allInvoices = response.invoices || []
        
        // Filter invoices by date range
        const filteredInvoices = allInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.dateFacture)
          return invoiceDate >= startDate && invoiceDate <= endDate
        })
        
        // Transform API data to match the expected format
        const formattedInvoices = formatInvoicesData(filteredInvoices)
        
        // Update the UI
        updateInvoiceTable(formattedInvoices)
        
        // Store the filtered data for product summary
        window.currentFilteredData = formattedInvoices
      } catch (error) {
        console.error("Error parsing invoices:", error)
        const tableBody = document.getElementById("invoiceTableBody")
        if (tableBody) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 30px; color: red;">
                Error loading invoices: ${error.message}
              </td>
            </tr>
          `
        }
      }
    } else {
      console.error("Error fetching invoices:", xhr.status)
      const tableBody = document.getElementById("invoiceTableBody")
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 30px; color: red;">
              Error loading invoices. Status: ${xhr.status}
            </td>
          </tr>
        `
      }
    }
  }
  
  xhr.onerror = function() {
    console.error("Network error when fetching invoices")
    const tableBody = document.getElementById("invoiceTableBody")
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 30px; color: red;">
            Network error. Please check your connection and try again.
          </td>
        </tr>
      `
    }
  }
  
  // Send the request
  xhr.send()
}

function formatInvoicesData(apiInvoices) {
  return apiInvoices.map(invoice => {
    // Get order data
    const order = invoice.idCommande || {}
    
    // Get customer data
    const customer = invoice.idClient || order.idClient || {}
    
    // Format customer data
    const customerData = {
      name: customer.firstname && customer.lastname ? 
        `${customer.firstname} ${customer.lastname}` : 
        (customer.name || "Unknown Customer"),
      email: customer.email || "N/A",
      phone: customer.phoneNumber || "N/A",
      address: customer.address || "N/A"
    }
    
    // Format items data
    let items = []
    if (order.cartData && order.cartData.items && order.cartData.items.length > 0) {
      items = order.cartData.items.map(item => {
        const product = item.productId || {}
        return {
          name: product.productName || "Product",
          price: parseFloat(product.productPrice) || 0,
          quantity: parseInt(item.quantity) || 1
        }
      })
    } else {
      // Default item if no items found
      items = [{
        name: "Product",
        price: invoice.montantTotal || 0,
        quantity: 1
      }]
    }
    
    // Format status
    let status = "pending"
    if (invoice.statutPaiement === "payé") {
      status = "completed"
    } else if (order.orderStatus === "cancelled") {
      status = "cancelled"
    } else if (order.orderStatus === "accepted") {
      status = "pending"
    }
    
    // Return formatted invoice
    return {
      orderId: `#${invoice._id ? invoice._id.substring(0, 8) : "N/A"}`,
      date: new Date(invoice.dateFacture),
      customer: customerData,
      items: items,
      amount: parseFloat(invoice.montantTotal) || 0,
      status: status,
      shipping: 7.99, // Default shipping
      tax: (parseFloat(invoice.montantTotal) || 0) * 0.19 // 19% VAT
    }
  })
}

function updateInvoiceTable(data) {
  const tableBody = document.getElementById("invoiceTableBody")
  tableBody.innerHTML = ""

  if (data.length === 0) {
    // No data for the selected period
    const emptyRow = document.createElement("tr")
    emptyRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 30px;">
                No invoices found for the selected period
            </td>
        `
    tableBody.appendChild(emptyRow)

    // Update summary with zeros
    document.getElementById("totalSales").textContent = "0.00 DT"
    document.getElementById("totalOrders").textContent = "0"
    document.getElementById("averageOrder").textContent = "0.00 DT"

    return
  }

  // Calculate totals
  let totalSales = 0

  // Add rows to table
  data.forEach((invoice) => {
    const row = document.createElement("tr")

    // Format date
    const invoiceDate = new Date(invoice.date)
    const formattedDate = formatDate(invoiceDate)

    // Add to total sales
    totalSales += invoice.amount

    // Create status badge
    const statusClass = `status-${invoice.status.toLowerCase()}`
    const statusText = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)

    row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${invoice.orderId}</td>
            <td>${invoice.customer.name}</td>
            <td>${invoice.amount.toFixed(2)} DT</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td><button class="view-details-btn" data-order-id="${invoice.orderId}">View Details</button></td>
        `

    tableBody.appendChild(row)
  })

  // Add event listeners to view details buttons
  const detailButtons = document.querySelectorAll(".view-details-btn")
  detailButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const orderId = this.getAttribute("data-order-id")
      showOrderDetails(orderId, data)
    })
  })

  // Update summary
  document.getElementById("totalSales").textContent = totalSales.toFixed(2) + " DT"
  document.getElementById("totalOrders").textContent = data.length

  const averageOrder = totalSales / data.length
  document.getElementById("averageOrder").textContent = averageOrder.toFixed(2) + " DT"
}

function showOrderDetails(orderId, data) {
  // Find the order in the data
  const order = data.find((invoice) => invoice.orderId === orderId)

  if (!order) return

  // Update modal with order details
  document.getElementById("modalOrderTitle").textContent = `Order ${order.orderId}`
  document.getElementById("modalCustomerName").textContent = order.customer.name
  document.getElementById("modalCustomerEmail").textContent = order.customer.email
  document.getElementById("modalCustomerPhone").textContent = order.customer.phone
  document.getElementById("modalCustomerAddress").textContent = order.customer.address

  // Update items table
  const itemsBody = document.getElementById("modalItemsBody")
  itemsBody.innerHTML = ""

  let subtotal = 0

  order.items.forEach((item) => {
    const row = document.createElement("tr")
    const itemTotal = item.price * item.quantity
    subtotal += itemTotal

    row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.price.toFixed(2)} DT</td>
            <td>${item.quantity}</td>
            <td>${itemTotal.toFixed(2)} DT</td>
        `

    itemsBody.appendChild(row)
  })

  // Calculate order summary
  const shipping = order.shipping || 0
  const tax = order.tax || subtotal * 0.1 // Default 10% tax if not specified
  const total = subtotal + shipping + tax

  document.getElementById("modalSubtotal").textContent = subtotal.toFixed(2) + " DT"
  document.getElementById("modalShipping").textContent = shipping.toFixed(2) + " DT"
  document.getElementById("modalTax").textContent = tax.toFixed(2) + " DT"
  document.getElementById("modalTotal").textContent = total.toFixed(2) + " DT"

  
    // Update the event listener for the existing button
    document.getElementById("printSingleOrderBtn").onclick = () => {
      printSingleOrderInvoice(order)
    }
  

  // Show the modal
  document.getElementById("orderModal").style.display = "flex"
}

// Now add the printSingleOrderInvoice function after the showOrderDetails function
function printSingleOrderInvoice(order) {
  // Create a new window for the invoice
  const invoiceWindow = window.open("", "_blank")

  // Format the date
  const orderDate = new Date(order.date)
  const formattedDate = formatDate(orderDate)

  // Calculate subtotal
  let subtotal = 0
  order.items.forEach((item) => {
    subtotal += item.price * item.quantity
  })

  // Calculate totals
  const shipping = order.shipping || 0
  const tax = order.tax || subtotal * 0.1
  const total = subtotal + shipping + tax

  // Create the invoice HTML
  invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice ${order.orderId}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background-color: #f5f7fa;
                    color: #333;
                    line-height: 1.6;
                    padding: 20px;
                }
                
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background-color: white;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    padding: 40px;
                }
                
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #3498db;
                }
                
                .logo-container {
                    display: flex;
                    align-items: center;
                }
                
                .logo {
                    width: 80px;
                    height: 80px;
                    background-color: #3498db;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                    margin-right: 15px;
                }
                
                .company-info h1 {
                    font-size: 24px;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                
                .company-info p {
                    color: #7f8c8d;
                    font-size: 14px;
                }
                
                .invoice-info {
                    text-align: right;
                }
                
                .invoice-info h2 {
                    font-size: 28px;
                    color: #3498db;
                    margin-bottom: 10px;
                }
                
                .invoice-info p {
                    color: #7f8c8d;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                
                .customer-details {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                
                .customer-details h3 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-size: 18px;
                }
                
                .customer-details p {
                    color: #7f8c8d;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                
                .invoice-items {
                    margin-bottom: 30px;
                }
                
                .invoice-items h3 {
                    color: #2c3e50;
                    margin-bottom: 15px;
                    font-size: 18px;
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .items-table th {
                    background-color: #f8f9fa;
                    padding: 12px 15px;
                    text-align: left;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #eaeaea;
                }
                
                .items-table td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #eaeaea;
                }
                
                .items-table tr:last-child td {
                    border-bottom: none;
                }
                
                .invoice-summary {
                    margin-top: 30px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eaeaea;
                }
                
                .summary-row:last-child {
                    border-bottom: none;
                }
                
                .summary-row.total {
                    font-weight: 700;
                    font-size: 18px;
                    border-top: 2px solid #ddd;
                    margin-top: 10px;
                    padding-top: 15px;
                }
                
                .invoice-footer {
                    margin-top: 50px;
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 14px;
                }
                
                .print-btn {
                    display: block;
                    margin: 30px auto;
                    background-color: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 10px 20px;
                    cursor: pointer;
                    font-size: 16px;
                }
                
                .print-btn:hover {
                    background-color: #2980b9;
                }
                
                @media print {
                    body {
                        background-color: white;
                    }
                    
                    .invoice-container {
                        box-shadow: none;
                        padding: 0;
                    }
                    
                    .print-btn {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="logo-container">
                        <img src="../../assets/images/dashboard/shop-logo.jpg" class="logo" alt="Shop Logo">
                        <div class="company-info">
                            <h1>Abroud Shop</h1>
                            <p>Hamman sousse , Sousse</p>
                            <p>abShop@gmail.com | +216 26 788 694</p>
                        </div>
                    </div>
                    <div class="invoice-info">
                        <h2>Invoice</h2>
                        <p>Invoice #: ${order.orderId}</p>
                        <p>Date: ${formattedDate}</p>
                        <p>Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                    </div>
                </div>
                
                <div class="customer-details">
                    <h3>Bill To:</h3>
                    <p><strong>${order.customer.name}</strong></p>
                    <p>${order.customer.email}</p>
                    <p>${order.customer.phone}</p>
                    <p>${order.customer.address}</p>
                </div>
                
                <div class="invoice-items">
                    <h3>Order Items</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Product ID</th>
                                <th>Item</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
    `)

  // Add items to the table
  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity
    const productId = `PROD-${String(index + 1).padStart(3, "0")}`
    invoiceWindow.document.write(`
            <tr>
                <td>${productId}</td>
                <td>${item.name}</td>
                <td>${item.price.toFixed(2)} DT</td>
                <td>${item.quantity}</td>
                <td>${itemTotal.toFixed(2)} DT</td>
            </tr>
        `)
  })

  // Complete the invoice
  invoiceWindow.document.write(`
                        </tbody>
                    </table>
                </div>
                
                <div class="invoice-summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)} DT</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <span>${shipping.toFixed(2)} DT</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax:</span>
                        <span>${tax.toFixed(2)} DT</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>${total.toFixed(2)} DT</span>
                    </div>
                </div>
                
                <div class="invoice-footer">
                    <p>Thank you for your business!</p>
                    <p>© ${new Date().getFullYear()} Your Shop. All rights reserved.</p>
                </div>
            </div>
            
            <button class="print-btn" onclick="window.print()">Print Invoice</button>
        </body>
        </html>
    `)

  invoiceWindow.document.close()
}


function generateCustomPDF() {
  // Get the filtered data
  const filteredData = window.currentFilteredData || []
  
  if (filteredData.length === 0) {
    alert("No data available for the selected period")
    return
  }

  // Create a new window for the PDF preview
  const pdfWindow = window.open("", "_blank")

  // Get the current period text
  const periodText = document.getElementById("periodText").textContent

  // Aggregate product data
  const productSummary = aggregateProductData(filteredData)

  // Calculate grand total
  let grandTotal = 0
  let totalQuantity = 0
  Object.values(productSummary).forEach((product) => {
    grandTotal += product.totalSales
    totalQuantity += product.quantity
  })

  // Create the PDF content with a cool design
  pdfWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sales Summary PDF</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background-color: #f5f7fa;
                    color: #333;
                    line-height: 1.6;
                    padding: 20px;
                }
                
                .pdf-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background-color: white;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    padding: 40px;
                }
                
                .pdf-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #3498db;
                }
                
                .logo-container {
                    display: flex;
                    align-items: center;
                }
                
                .logo {
                    width: 80px;
                    height: 80px;
                    background-color: #3498db;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                    margin-right: 15px;
                }
                
                .company-info h1 {
                    font-size: 24px;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                
                .company-info p {
                    color: #7f8c8d;
                    font-size: 14px;
                }
                
                .invoice-info {
                    text-align: right;
                }
                
                .invoice-info h2 {
                    font-size: 28px;
                    color: #3498db;
                    margin-bottom: 10px;
                }
                
                .invoice-info p {
                    color: #7f8c8d;
                    font-size: 14px;
                }
                
                .period-heading {
                    font-size: 18px;
                    color: #2c3e50;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eaeaea;
                }
                
                .product-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                
                .product-table th {
                    background-color: #f8f9fa;
                    padding: 12px 15px;
                    text-align: left;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #eaeaea;
                }
                
                .product-table td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #eaeaea;
                }
                
                .product-table tr.total-row {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                
                .product-table tr.total-row td {
                    border-top: 2px solid #eaeaea;
                    border-bottom: none;
                }
                
                .summary-card {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 30px 0;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eaeaea;
                }
                
                .summary-row.total {
                    font-weight: 700;
                    font-size: 18px;
                    border-top: 2px solid #ddd;
                    border-bottom: none;
                    padding-top: 15px;
                    margin-top: 5px;
                }
                
                .pdf-footer {
                    margin-top: 50px;
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 14px;
                }
                
                .print-btn {
                    display: block;
                    margin: 30px auto;
                    background-color: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 10px 20px;
                    cursor: pointer;
                    font-size: 16px;
                }
                
                .print-btn:hover {
                    background-color: #2980b9;
                }
                
                @media print {
                    body {
                        background-color: white;
                    }
                    
                    .pdf-container {
                        box-shadow: none;
                        padding: 0;
                    }
                    
                    .print-btn {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="pdf-container">
                <div class="pdf-header">
                    <div class="logo-container">
                        <img src="../../assets/images/dashboard/shop-logo.jpg" class="logo" alt="Shop Logo">
                        <div class="company-info">
                            <h1>Abroud Shop</h1>
                            <p>Hamman sousse , Sousse</p>
                            <p>abShop@gmail.com | +216 26 788 694</p>
                        </div>
                    </div>
                    <div class="invoice-info">
                        <h2>Sales Summary</h2>
                        <p>Date: ${formatDate(new Date())}</p>
                        <p>Report #: REP-${Math.floor(Math.random() * 10000)
                          .toString()
                          .padStart(4, "0")}</p>
                    </div>
                </div>

                
                <h3 class="period-heading">Sales Period: ${periodText}</h3>
                
                <h3>Product Sales Summary</h3>
                
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity Sold</th>
                            <th>Unit Price (Avg)</th>
                            <th>Total Sales</th>
                        </tr>
                    </thead>
                    <tbody>
    `)

  // Add product rows
  Object.keys(productSummary).forEach((productName) => {
    const product = productSummary[productName]
    const avgPrice = product.totalSales / product.quantity

    pdfWindow.document.write(`
            <tr>
                <td>${productName}</td>
                <td>${product.quantity}</td>
                <td>${avgPrice.toFixed(2)} DT</td>
                <td>${product.totalSales.toFixed(2)} DT</td>
            </tr>
        `)
  })

  // Add total row
  pdfWindow.document.write(`
            <tr class="total-row">
                <td>Total</td>
                <td>${totalQuantity}</td>
                <td></td>
                <td>${grandTotal.toFixed(2)} DT</td>
            </tr>
        </tbody>
    </table>
    `)

  // Add order summary
  pdfWindow.document.write(`
                <div class="summary-card">
                    <div class="summary-row">
                        <span>Total Orders:</span>
                        <span>${filteredData.length}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Products Sold:</span>
                        <span>${totalQuantity}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total Sales:</span>
                        <span>${grandTotal.toFixed(2)} DT</span>
                    </div>
                </div>
                
                <div class="pdf-footer">
                    <p>Thank you for your business!</p>
                    <p>© ${new Date().getFullYear()} Your Shop. All rights reserved.</p>
                </div>
            </div>
            
            <button class="print-btn" onclick="window.print()">Print Report</button>
        </body>
        </html>
    `)

  pdfWindow.document.close()
}

function aggregateProductData(invoices) {
  // Create an object to store product data
  const productSummary = {}

  // Loop through all invoices
  invoices.forEach((invoice) => {
    // Loop through items in each invoice
    invoice.items.forEach((item) => {
      // If product doesn't exist in summary, add it
      if (!productSummary[item.name]) {
        productSummary[item.name] = {
          quantity: 0,
          totalSales: 0,
        }
      }

      // Add to quantity and sales
      productSummary[item.name].quantity += item.quantity
      productSummary[item.name].totalSales += item.price * item.quantity
    })
  })

  return productSummary
}

function formatDate(date) {
  const options = { year: "numeric", month: "short", day: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

function getMonthName(monthIndex) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  return months[monthIndex]
}