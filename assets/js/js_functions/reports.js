/**
 * Report Management System
 * This file contains both the report submission form and report management dashboard functionality
 */

// ==============================================
// REPORT SUBMISSION FORM
// ==============================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Reports.js loaded successfully");
  
  // Get the report form
  const form = document.getElementById("reportForm")

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault() // Prevent default form submission

      // Get form data
      const name = document.getElementById("name").value
      const email = document.getElementById("email").value
      const phone = document.getElementById("phone").value
      const subject = document.getElementById("subject").value
      const message = document.getElementById("message").value

      // Get token from localStorage
      const token = localStorage.getItem("token")

      // Check if user is logged in
      if (!token) {
        alert("You need to be logged in to submit a report. Please log in and try again.")
        return
      }

      // Prepare the data object to send to the server
      const data = {
        clientId: getUserIdFromToken(token),
        targetType: "Platform",
        title: subject,
        message: message,
        senderName: name,
        senderEmail: email,
        senderPhone: phone,
      }

      sendReportToServer(data, token)
    })
  }
  
  // Product report functionality
  const reportLink = document.getElementById("reportLink");
  console.log("Report link element:", reportLink);
  
  if (reportLink) {
    reportLink.addEventListener("click", function(e) {
      e.preventDefault();
      console.log("Report link clicked");
      
      // Check if modal exists
      let modal = document.getElementById("productReportModal");
      if (!modal) {
        console.log("Creating product report modal");
        createProductReportModal();
        modal = document.getElementById("productReportModal");
      }
      
      // Open the modal
      openProductReportModal();
    });
  }

  // Function to extract user ID from JWT token
  function getUserIdFromToken(token) {
    try {
      // For JWT tokens, you can decode the payload
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const payload = JSON.parse(window.atob(base64))

      // Return the user ID from the token payload
      return payload.userId || payload._id || payload.id
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }

  // Function to send report to the server
  function sendReportToServer(data, token) {
    // Show loading indicator
    const submitBtn = document.querySelector('#reportForm button[type="submit"]')
    let originalText = ""
    if (submitBtn) {
      originalText = submitBtn.textContent
      submitBtn.disabled = true
      submitBtn.textContent = "Sending..."
    }

    fetch("http://localhost:3000/report", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            try {
              // Try to parse as JSON
              const errorData = JSON.parse(text)
              throw new Error(errorData.message || "Unknown error occurred")
            } catch (e) {
              // If not JSON, return text error
              throw new Error("Server error: " + response.status)
            }
          })
        }
        return response.text().then((text) => {
          try {
            return JSON.parse(text)
          } catch (e) {
            return { success: true }
          }
        })
      })
      .then((data) => {
        // Clear the form
        form.reset()

        // Show success message
        alert("Your report has been submitted successfully!")
      })
      .catch((error) => {
        console.error("Error submitting report:", error)
        alert(`Error submitting report: ${error.message}`)
      })
      .finally(() => {
        // Reset button state
        if (submitBtn) {
          submitBtn.disabled = false
          submitBtn.textContent = originalText
        }
      })
  }
  
  // Create product report modal HTML
  function createProductReportModal() {
    console.log("Creating product report modal");
    
    // First remove any existing modal with the same ID
    const existingModal = document.getElementById('productReportModal');
    if (existingModal) {
      existingModal.remove();
      console.log("Removed existing modal");
    }
    
    const modalHTML = `
      <div id="productReportModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center;">
        <div class="modal-content" style="background-color:#fff; border-radius:16px; width:90%; max-width:500px; max-height:90vh; overflow-y:auto; box-shadow:0 5px 15px rgba(0,0,0,0.2);">
          <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-bottom:1px solid #e0e0e0;">
            <h5 style="margin:0; font-weight:600;">Report Product</h5>
            <button type="button" class="close-button" id="closeReportModal" style="background:none; border:none; font-size:24px; cursor:pointer; color:#666;">&times;</button>
          </div>
          <div class="modal-body" style="padding:24px;">
            <form id="productReportForm">
              <div style="margin-bottom:16px;">
                <label for="reportReason" style="display:block; margin-bottom:8px; font-weight:500;">Reason for Report</label>
                <select id="reportReason" required style="width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px; margin-bottom:16px;">
                  <option value="">Select a reason</option>
                  <option value="counterfeit">Counterfeit Product</option>
                  <option value="misleading">Misleading Description</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="offensive">Offensive Content</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style="margin-bottom:16px;">
                <label for="reportTitle" style="display:block; margin-bottom:8px; font-weight:500;">Report Title</label>
                <input type="text" id="reportTitle" placeholder="Brief summary of the issue" required style="width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px; margin-bottom:16px;">
              </div>
              <div style="margin-bottom:16px;">
                <label for="reportDescription" style="display:block; margin-bottom:8px; font-weight:500;">Description</label>
                <textarea id="reportDescription" rows="4" placeholder="Please provide details about the issue" required style="width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px; margin-bottom:16px; resize:vertical;"></textarea>
              </div>
              <button type="submit" style="background-color:#4a6cf7; color:white; border:none; padding:10px 24px; border-radius:8px; cursor:pointer; transition:background-color 0.3s;">Submit Report</button>
            </form>
          </div>
        </div>
      </div>
    `;

    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log("Modal HTML appended to body");

    // Set up event listeners for the modal
    document.getElementById('closeReportModal').addEventListener('click', function() {
      console.log("Close button clicked");
      closeProductReportModal();
    });
    
    document.getElementById('productReportForm').addEventListener('submit', function(event) {
      console.log("Report form submitted");
      submitProductReport(event);
    });

    // Close modal when clicking outside
    document.getElementById('productReportModal').addEventListener('click', function(event) {
      if (event.target === this) {
        console.log("Clicked outside modal");
        closeProductReportModal();
      }
    });
    
    console.log("Modal event listeners set up");
  }

  // Function to open product report modal
  function openProductReportModal() {
    console.log("Opening product report modal");
    const modal = document.getElementById('productReportModal');
    if (modal) {
      modal.style.display = 'flex';
      console.log("Modal displayed");
    } else {
      console.error("Modal element not found");
    }
  }

  // Function to close product report modal
  function closeProductReportModal() {
    console.log("Closing product report modal");
    const modal = document.getElementById('productReportModal');
    if (modal) {
      modal.style.display = 'none';
      console.log("Modal hidden");
      // Reset form
      const form = document.getElementById('productReportForm');
      if (form) {
        form.reset();
      }
    }
  }

  // Submit product report
  function submitProductReport(event) {
    event.preventDefault();
    console.log("Processing product report submission");
    
    // Get token and check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("User not logged in");
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please log in to report this product.',
          confirmButtonColor: '#4a6cf7'
        });
      } else {
        alert("Please log in to report this product.");
      }
      closeProductReportModal();
      return;
    }
    
    // Get form data
    const reason = document.getElementById('reportReason').value;
    const title = document.getElementById('reportTitle').value;
    const message = document.getElementById('reportDescription').value;
    
    console.log("Form data:", { reason, title, message });
    
    // Get product ID from URL
    const productId = getProductIdFromUrl();
    if (!productId) {
      console.error("Could not determine product ID");
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Product ID could not be determined.',
          confirmButtonColor: '#4a6cf7'
        });
      } else {
        alert("Product ID could not be determined.");
      }
      return;
    }
    
    console.log("Product ID:", productId);
    
    // Prepare data
    const reportData = {
      clientId: getUserIdFromToken(token),
      targetType: 'Product',
      targetId: productId,
      title: `${reason.toUpperCase()}: ${title}`,
      message: message
    };
    
    console.log("Report data:", reportData);
    
    // Show loading state
    const submitBtn = document.querySelector('#productReportForm button[type="submit"]');
    if (submitBtn) {
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      
      console.log("Sending report to server");
      // Send report to server
      fetch("http://localhost:3000/report", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      })
      .then(response => {
        console.log("Server response:", response);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Report submitted successfully:", data);
        closeProductReportModal();
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Report Submitted',
            text: 'Thank you for your report. We will review it as soon as possible.',
            confirmButtonColor: '#4a6cf7'
          });
        } else {
          alert("Thank you for your report. We will review it as soon as possible.");
        }
      })
      .catch(error => {
        console.error('Error submitting product report:', error);
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'error',
            title: 'Submission Error',
            text: `There was an error submitting your report: ${error.message}`,
            confirmButtonColor: '#4a6cf7'
          });
        } else {
          alert(`There was an error submitting your report: ${error.message}`);
        }
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
    }
  }
  
  // Function to get product ID from URL
  function getProductIdFromUrl() {
    console.log("Getting product ID from URL:", window.location.search);
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }
})

// ==============================================
// REPORT MANAGEMENT DASHBOARD
// ==============================================

// Global variables
let reportsData = []
let filteredReports = []
let currentPage = 1
const rowsPerPage = 10
const currentSort = { column: "date", direction: "desc" }
let currentTab = "all"
let currentDateFilter = "all"
let searchTerm = ""
let currentReportId = null

// DOM elements
const tableBody = document.getElementById("reportsTableBody")
const pagination = document.getElementById("pagination")
const pageInfo = document.getElementById("pageInfo")
const totalReportsEl = document.getElementById("totalReports")
const pendingReportsEl = document.getElementById("pendingReports")
const resolvedReportsEl = document.getElementById("resolvedReports")
const searchInput = document.getElementById("searchInput")
const dateFilterBtn = document.getElementById("dateFilterBtn")
const dateFilterMenu = document.getElementById("dateFilterMenu")
const tabs = document.querySelectorAll(".tab")
const sortableHeaders = document.querySelectorAll("th.sortable")

const reportModalEl = document.getElementById("reportModal")
const respondModalEl = document.getElementById("respondModal")
const deleteModalEl = document.getElementById("deleteConfirmModal")

let reportModalInstance, respondModalInstance, deleteModalInstance

// Initialize modals if using Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  // Access bootstrap from window object
  if (typeof window.bootstrap !== "undefined") {
    reportModalInstance = new window.bootstrap.Modal(reportModalEl)
    respondModalInstance = new window.bootstrap.Modal(respondModalEl)
    deleteModalInstance = new window.bootstrap.Modal(deleteModalEl)
  }

  // Initialize event listeners
  setupEventListeners()

  // Load reports from the server
  if (document.getElementById("reportsTableBody")) {
    loadReports()
  }
})

// Function to get the authentication token
function getAuthToken() {
  const token = localStorage.getItem("token")

  if (!token) {
    console.error("No authentication token found in localStorage")
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Authentication error: No token found. Please log in again.</td></tr>`
    }
  }

  return token
}

// Function to load reports from the server
function loadReports() {
  // Get the authentication token
  const token = getAuthToken()
  if (!token) return // Exit if no token is found

  // Show loading indicator
  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading reports...</td></tr>'
  }

  fetch("http://localhost:3000/reports", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          try {
            // Try to parse as JSON
            const errorData = JSON.parse(text)
            throw new Error(errorData.message || "Failed to load reports")
          } catch (e) {
            // If not JSON, return text error
            throw new Error("Server error: " + response.status)
          }
        })
      }
      return response.text().then((text) => {
        try {
          return JSON.parse(text)
        } catch (e) {
          throw new Error("Invalid response format")
        }
      })
    })
    .then((data) => {
      // Store the reports data globally
      reportsData = data
      console.log("Loaded all reports:", reportsData)

      // Initialize filtered reports with all reports
      filteredReports = [...reportsData]

      // Update stats
      updateStats()

      // Apply initial filters
      applyFilters()

      // Render the table and pagination
      renderTable()
      renderPagination()
    })
    .catch((error) => {
      console.error("Error loading reports:", error)
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`

        // If unauthorized, suggest logging in again
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          tableBody.innerHTML += `<tr><td colspan="6" class="text-center">Please <a href="login.html">log in</a> again.</td></tr>`
        }
      }
    })
}

// Function to load reports by target type
function loadReportsByTargetType(targetType) {
  // Get the authentication token
  const token = getAuthToken()
  if (!token) return // Exit if no token is found

  // Show loading indicator
  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading reports...</td></tr>'
  }

  fetch(`http://localhost:3000/reports/targetType/${targetType}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          try {
            // Try to parse as JSON
            const errorData = JSON.parse(text)
            throw new Error(errorData.message || "Failed to load reports")
          } catch (e) {
            // If not JSON, return text error
            throw new Error("Server error: " + response.status)
          }
        })
      }
      return response.text().then((text) => {
        try {
          return JSON.parse(text)
        } catch (e) {
          throw new Error("Invalid response format")
        }
      })
    })
    .then((data) => {
      // Store the filtered reports
      filteredReports = data
      console.log(`Loaded reports for target type ${targetType}:`, filteredReports)

      // Update stats
      updateStats()

      // Apply filters
      applyFilters()

      // Render the table and pagination
      renderTable()
      renderPagination()
    })
    .catch((error) => {
      console.error("Error loading reports:", error)
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`
      }
    })
}

// Function to safely get a property value with fallback
function safeGet(obj, path, fallback = "N/A") {
  try {
    // Handle nested properties with dot notation (e.g., "user.name")
    const props = path.split(".")
    let result = obj

    for (const prop of props) {
      result = result[prop]
      if (result === undefined || result === null) {
        return fallback
      }
    }

    return result
  } catch (e) {
    return fallback
  }
}

// FIXED: Format date to only show the date part (YYYY-MM-DD)
function formatDate(dateStr) {
  if (!dateStr) return "N/A"

  try {
    const date = new Date(dateStr)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "N/A"
    }

    // Return only the date part (YYYY-MM-DD)
    return date.toISOString().split("T")[0]
  } catch (e) {
    return "N/A"
  }
}

// Update statistics
function updateStats() {
  if (totalReportsEl) totalReportsEl.textContent = reportsData.length

  if (pendingReportsEl) {
    const pendingCount = reportsData.filter((r) => safeGet(r, "status", "").toLowerCase() === "pending").length
    pendingReportsEl.textContent = pendingCount
  }

  if (resolvedReportsEl) {
    const resolvedCount = reportsData.filter((r) => safeGet(r, "status", "").toLowerCase() === "resolved").length
    resolvedReportsEl.textContent = resolvedCount
  }
}

// Apply filters to the reports
function applyFilters() {
  // Start with all reports
  filteredReports = [...reportsData]

  // 1. Status tab filter
  if (currentTab !== "all") {
    filteredReports = filteredReports.filter((r) => safeGet(r, "status", "").toLowerCase() === currentTab)
  }

  // 2. Date filter
  if (currentDateFilter !== "all") {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    filteredReports = filteredReports.filter((r) => {
      const dateField = safeGet(r, "date") || safeGet(r, "createdAt") || safeGet(r, "created_at")
      if (!dateField) return false

      const d = new Date(dateField)
      return (
        (currentDateFilter === "today" && d >= today) ||
        (currentDateFilter === "week" && d >= weekStart) ||
        (currentDateFilter === "month" && d >= monthStart)
      )
    })
  }

  // 3. Search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filteredReports = filteredReports.filter(
      (r) =>
        safeGet(r, "_id", "").toLowerCase().includes(term) ||
        safeGet(r, "id", "").toLowerCase().includes(term) ||
        safeGet(r, "title", "").toLowerCase().includes(term) ||
        safeGet(r, "message", "").toLowerCase().includes(term) ||
        safeGet(r, "targetType", "").toLowerCase().includes(term) ||
        safeGet(r, "category", "").toLowerCase().includes(term),
    )
  }

  // 4. Sorting
  filteredReports.sort((a, b) => {
    let va, vb

    // Handle different field names
    if (currentSort.column === "id") {
      va = safeGet(a, "_id") || safeGet(a, "id")
      vb = safeGet(b, "_id") || safeGet(b, "id")
    } else if (currentSort.column === "category") {
      va = safeGet(a, "targetType") || safeGet(a, "category")
      vb = safeGet(b, "targetType") || safeGet(b, "category")
    } else if (currentSort.column === "date") {
      va = safeGet(a, "date") || safeGet(a, "createdAt") || safeGet(a, "created_at")
      vb = safeGet(b, "date") || safeGet(b, "createdAt") || safeGet(b, "created_at")
      va = new Date(va || 0).getTime()
      vb = new Date(vb || 0).getTime()
    } else {
      va = safeGet(a, currentSort.column)
      vb = safeGet(b, currentSort.column)
    }

    if (va < vb) return currentSort.direction === "asc" ? -1 : 1
    if (va > vb) return currentSort.direction === "asc" ? 1 : -1
    return 0
  })

  // 5. Recompute pagination
  const totalPages = Math.ceil(filteredReports.length / rowsPerPage)
  if (currentPage > totalPages) {
    currentPage = totalPages || 1
  }
}

// Render the reports table
function renderTable() {
  if (!tableBody) return

  tableBody.innerHTML = ""

  if (!filteredReports.length) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No reports found</td></tr>`
    if (pageInfo) pageInfo.textContent = "Showing 0 to 0 of 0 entries"
    return
  }

  const start = (currentPage - 1) * rowsPerPage
  const end = Math.min(start + rowsPerPage, filteredReports.length)
  const pageItems = filteredReports.slice(start, end)

  pageItems.forEach((r) => {
    // Get values safely with fallbacks
    const id = safeGet(r, "_id") || safeGet(r, "id") || "N/A"
    const title = safeGet(r, "title") || safeGet(r, "name") || "N/A"
    const category = safeGet(r, "targetType") || safeGet(r, "category") || "N/A"
    const dateStr = safeGet(r, "date") || safeGet(r, "createdAt") || safeGet(r, "created_at")
    const status = safeGet(r, "status") || "Pending"

    // Format date - FIXED: Only show date part
    const formattedDate = formatDate(dateStr)

    // Create status badge class based on status
    const badge = status.toLowerCase() === "resolved" ? "badge-success" : "badge-primary"

    // Create row
    const row = document.createElement("tr")
    row.classList.add("table-row")
    row.dataset.id = id

    // Create row content
    row.innerHTML = `
      <td>${id}</td>
      <td>${title}</td>
      <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
      <td>${formattedDate}</td>
      <td><span class="badge ${badge}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
      <td>
        <button class="btn btn-sm btn-secondary view-btn" data-id="${id}">
          <i class="bi bi-eye"></i> View
        </button>
      </td>
    `

    tableBody.appendChild(row)
  })

  if (pageInfo) {
    pageInfo.textContent = `Showing ${start + 1} to ${end} of ${filteredReports.length} entries`
  }
}

// Render pagination
function renderPagination() {
  if (!pagination) return

  pagination.innerHTML = ""
  const totalPages = Math.ceil(filteredReports.length / rowsPerPage)
  if (totalPages <= 1) return

  // Previous
  const prev = document.createElement("button")
  prev.className = "page-button"
  prev.innerHTML = '<i class="bi bi-chevron-left"></i>'
  prev.disabled = currentPage === 1
  prev.onclick = () => {
    currentPage--
    renderTable()
    renderPagination()
  }
  pagination.appendChild(prev)

  // Page numbers
  const maxBtns = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxBtns / 2))
  const endPage = Math.min(totalPages, startPage + maxBtns - 1)
  if (endPage - startPage + 1 < maxBtns) {
    startPage = Math.max(1, endPage - maxBtns + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button")
    btn.className = "page-button" + (i === currentPage ? " active" : "")
    btn.textContent = i
    btn.onclick = () => {
      currentPage = i
      renderTable()
      renderPagination()
    }
    pagination.appendChild(btn)
  }

  // Next
  const next = document.createElement("button")
  next.className = "page-button"
  next.innerHTML = '<i class="bi bi-chevron-right"></i>'
  next.disabled = currentPage === totalPages
  next.onclick = () => {
    currentPage++
    renderTable()
    renderPagination()
  }
  pagination.appendChild(next)
}

// Set up event listeners
function setupEventListeners() {
  // View button & row click
  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      const btn = e.target.closest(".view-btn")
      if (btn) {
        const id = btn.dataset.id
        openReportDetails(id)
        return
      }

      const row = e.target.closest(".table-row")
      if (row) {
        openReportDetails(row.dataset.id)
      }
    })
  }

  // Respond button
  const respondReportBtn = document.getElementById("respondReportBtn")
  if (respondReportBtn) {
    respondReportBtn.addEventListener("click", () => {
      if (reportModalInstance) reportModalInstance.hide()

      const rpt = reportsData.find((r) => {
        const id = safeGet(r, "_id") || safeGet(r, "id")
        return id === currentReportId
      })

      if (rpt) {
        document.getElementById("respondReportId").value = currentReportId
        document.getElementById("respondReportTitle").value = safeGet(rpt, "title")
        document.getElementById("responseText").value = ""

        if (respondModalInstance) respondModalInstance.show()
      }
    })
  }

  // Delete button
  const deleteReportBtn = document.getElementById("deleteReportBtn")
  if (deleteReportBtn) {
    deleteReportBtn.addEventListener("click", () => {
      if (reportModalInstance) reportModalInstance.hide()
      if (deleteModalInstance) deleteModalInstance.show()
    })
  }

  // Resolve in Respond modal
  const resolveReportBtn = document.getElementById("resolveReportBtn")
  if (resolveReportBtn) {
    resolveReportBtn.addEventListener("click", () => {
      resolveReport(currentReportId)
    })
  }

  // Confirm Delete
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
      deleteReport(currentReportId)
    })
  }

  // Search input
  if (searchInput) {
    const debouncedSearch = debounce(() => {
      searchTerm = searchInput.value.trim()
      currentPage = 1
      applyFilters()
      renderTable()
      renderPagination()
    }, 300)

    searchInput.addEventListener("input", debouncedSearch)
  }

  // Date filter
  if (dateFilterBtn && dateFilterMenu) {
    dateFilterBtn.addEventListener("click", () => {
      dateFilterMenu.classList.toggle("show")
    })

    dateFilterMenu.addEventListener("click", (e) => {
      const item = e.target.closest(".filter-item")
      if (item) {
        currentDateFilter = item.dataset.value
        dateFilterBtn.textContent = item.textContent
        dateFilterMenu.classList.remove("show")
        currentPage = 1
        applyFilters()
        renderTable()
        renderPagination()
      }
    })

    // Close filter menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".filter-dropdown")) {
        dateFilterMenu.classList.remove("show")
      }
    })
  }

  // Status tabs
  if (tabs) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", function (e) {
        e.preventDefault()
        // Highlight active tab
        tabs.forEach((t) => t.classList.remove("active"))
        this.classList.add("active")

        // Set the filter value
        currentTab = this.dataset.tab // "all", "pending", or "resolved"
        currentPage = 1

        // Re-run filtering & re-render
        applyFilters()
        renderTable()
        renderPagination()
      })
    })
  }

  // Sortable headers
  if (sortableHeaders) {
    sortableHeaders.forEach((th) => {
      th.addEventListener("click", function () {
        const column = this.dataset.sort

        // Toggle direction if clicking on the same column
        if (column === currentSort.column) {
          currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc"
        } else {
          currentSort.column = column
          currentSort.direction = column === "date" ? "desc" : "asc"
        }

        // Update sort indicators
        sortableHeaders.forEach((header) => {
          header.classList.remove("asc", "desc")
        })
        this.classList.add(currentSort.direction)

        // Re-apply filters and render
        applyFilters()
        renderTable()
      })
    })
  }
}

// Populate & open the Details modal
function openReportDetails(id) {
  const rpt = reportsData.find((r) => {
    const reportId = safeGet(r, "_id") || safeGet(r, "id")
    return reportId === id
  })

  if (!rpt) {
    console.error("Report not found:", id)
    return
  }

  currentReportId = id

  // Get values safely
  const title = safeGet(rpt, "title") || safeGet(rpt, "name") || "N/A"
  const category = safeGet(rpt, "targetType") || safeGet(rpt, "category") || "N/A"
  const description = safeGet(rpt, "message") || safeGet(rpt, "content") || "N/A"
  const status = safeGet(rpt, "status") || "Pending"
  const dateStr = safeGet(rpt, "date") || safeGet(rpt, "createdAt") || safeGet(rpt, "created_at")

  // Format date - FIXED: Only show date part
  const formattedDate = formatDate(dateStr)

  // Update modal fields
  if (document.getElementById("reportModalLabel")) {
    document.getElementById("reportModalLabel").textContent = `Report Details – ${id}`
  }

  if (document.getElementById("reportId")) {
    document.getElementById("reportId").value = id
  }

  if (document.getElementById("reportTitle")) {
    document.getElementById("reportTitle").value = title
  }

  if (document.getElementById("reportCategory")) {
    document.getElementById("reportCategory").value = category.charAt(0).toUpperCase() + category.slice(1)
  }

  if (document.getElementById("reportDescription")) {
    document.getElementById("reportDescription").value = description
  }

  if (document.getElementById("reportStatus")) {
    document.getElementById("reportStatus").value = status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (document.getElementById("reportDate")) {
    document.getElementById("reportDate").value = formattedDate
  }

  // Show the modal
  if (reportModalInstance) {
    reportModalInstance.show()
  }
}

// FIXED: Resolve a report - Update status in database with improved error handling
function resolveReport(id) {
  // Get the authentication token
  const token = getAuthToken()
  if (!token) return // Exit if no token is found

  // Show loading indicator
  const resolveBtn = document.getElementById("resolveReportBtn")
  let originalText = ""
  if (resolveBtn) {
    originalText = resolveBtn.textContent
    resolveBtn.disabled = true
    resolveBtn.textContent = "Resolving..."
  }

  // Log the request details for debugging
  console.log(`Attempting to resolve report with ID: ${id}`)
  console.log(`API URL: http://localhost:3000/report/${id}`)

  // Send request to update status in database
  fetch(`http://localhost:3000/report/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "resolved" }),
  })
    .then((response) => {
      console.log(`Resolve response status: ${response.status}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Report with ID ${id} not found. The report may have been deleted or the ID is incorrect.`)
        } else {
          throw new Error(`Failed to resolve report. Status: ${response.status}`)
        }
      }

      return response.text().then((text) => {
        try {
          return JSON.parse(text)
        } catch (e) {
          return { success: true }
        }
      })
    })
    .then((data) => {
      // Update local data
      const idx = reportsData.findIndex((r) => {
        const reportId = safeGet(r, "_id") || safeGet(r, "id")
        return reportId === id
      })

      if (idx > -1) {
        reportsData[idx].status = "resolved"
        updateStats()
        applyFilters()
        renderTable()
        renderPagination()
        showToast("Success", "Report has been resolved", "success")
      } else {
        console.warn(`Report with ID ${id} was not found in local data`)
        // Reload reports to ensure UI is in sync
        loadReports()
      }

      // Close modal
      if (respondModalInstance) {
        respondModalInstance.hide()
      }
    })
    .catch((error) => {
      console.error("Error resolving report:", error)
      showToast("Error", error.message, "error")
    })
    .finally(() => {
      // Reset button state
      if (resolveBtn) {
        resolveBtn.disabled = false
        resolveBtn.textContent = originalText
      }
    })
}

// Replace the deleteReport function with this simplified version now that we know the correct endpoint

function deleteReport(id) {

  const token = getAuthToken()
  if (!token) return

  const deleteBtn = document.getElementById("confirmDeleteBtn")
  let originalText = ""
  if (deleteBtn) {
    originalText = deleteBtn.textContent
    deleteBtn.disabled = true
    deleteBtn.textContent = "Deleting..."
  }

  console.log(`Attempting to delete report with ID: ${id}`)
  console.log(`API URL: http://localhost:3000/report/${id}`)
  fetch(`http://localhost:3000/report/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log(`Delete response status: ${response.status}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `Report with ID ${id} not found. The report may have been already deleted or the ID is incorrect.`,
          )
        } else {
          throw new Error(`Failed to delete report. Status: ${response.status}`)
        }
      }

      // Success - remove from local data
      const idx = reportsData.findIndex((r) => {
        const reportId = safeGet(r, "_id") || safeGet(r, "id")
        return reportId === id
      })

      if (idx > -1) {
        reportsData.splice(idx, 1)
        updateStats()
        applyFilters()
        renderTable()
        renderPagination()
        showToast("Success", "Report deleted successfully", "success")
      } else {
        console.warn(`Report with ID ${id} was not found in local data`)
        showToast("Success", "Report deleted successfully. Refreshing data...", "success")
        // Reload reports to ensure UI is in sync
        loadReports()
      }

      // Close modals
      if (deleteModalInstance) {
        deleteModalInstance.hide()
      }
      if (reportModalInstance) {
        reportModalInstance.hide()
      }
    })
    .catch((error) => {
      console.error("Error deleting report:", error)
      showToast("Error", error.message, "error")
    })
    .finally(() => {
      // Reset button state
      if (deleteBtn) {
        deleteBtn.disabled = false
        deleteBtn.textContent = originalText
      }
    })
}

// Toast notification utility
function showToast(title, message, type) {
  // Check if SweetAlert2 is available
  if (typeof window.Swal !== "undefined") {
    window.Swal.fire({
      title: `<span style="font-weight:bold;">${title}</span>`,
      html: `<p style="margin:0;">${message}</p>`,
      icon: type, // 'success', 'error', 'warning', 'info', or 'question'
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: "#1e1e2f",
      color: "#fff",
      iconColor:
        type === "success" ? "#00e676" : type === "warning" ? "#ff9100" : type === "error" ? "#ff1744" : "#40c4ff",
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", window.Swal.stopTimer)
        toast.addEventListener("mouseleave", window.Swal.resumeTimer)
      },
      customClass: {
        popup: "cool-toast-popup",
        timerProgressBar: "cool-toast-timer",
      },
    })
  } else {
    // Fallback to console if SweetAlert2 is not available
    console.log(`${type.toUpperCase()}: ${title} - ${message}`)
  }
}

// Debounce utility
function debounce(fn, wait) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}
