document.addEventListener("DOMContentLoaded", () => {
  console.log("Reports.js loaded successfully")

  const form = document.getElementById("reportForm")

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault()

      const name = document.getElementById("name").value
      const email = document.getElementById("email").value
      const phone = document.getElementById("phone").value
      const subject = document.getElementById("subject").value
      const message = document.getElementById("message").value

      const token = localStorage.getItem("token")

      if (!token) {
        alert("You need to be logged in to submit a report. Please log in and try again.")
        return
      }

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

  const reportLink = document.getElementById("reportLink")
  console.log("Report link element:", reportLink)

  if (reportLink) {
    reportLink.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("Report link clicked")

      let modal = document.getElementById("productReportModal")
      if (!modal) {
        console.log("Creating product report modal")
        createProductReportModal()
        modal = document.getElementById("productReportModal")
      }

      openProductReportModal()
    })
  }

  // Extracts user ID from JWT token
  function getUserIdFromToken(token) {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const payload = JSON.parse(window.atob(base64))

      return payload.userId || payload._id || payload.id
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }

  // Sends report data to the server
  function sendReportToServer(data, token) {
    const submitBtn = document.querySelector('#reportForm button[type="submit"]')
    let originalText = ""
    if (submitBtn) {
      originalText = submitBtn.textContent
      submitBtn.disabled = true
      submitBtn.textContent = "Sending..."
    }

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "http://localhost:3000/report", true)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("Content-Type", "application/json")

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          form.reset()
          alert("Your report has been submitted successfully!")
        } catch (e) {
          form.reset()
          alert("Your report has been submitted successfully!")
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText)
          alert(`Error submitting report: ${errorData.message || "Unknown error occurred"}`)
        } catch (e) {
          alert(`Server error: ${xhr.status}`)
        }
      }

      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = originalText
      }
    }

    xhr.onerror = () => {
      console.error("Request failed")
      alert("Network error occurred when trying to send report")

      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = originalText
      }
    }

    xhr.send(JSON.stringify(data))
  }

  // Creates the product report modal HTML
  function createProductReportModal() {
    console.log("Creating product report modal")

    const existingModal = document.getElementById("productReportModal")
    if (existingModal) {
      existingModal.remove()
      console.log("Removed existing modal")
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
    `

    document.body.insertAdjacentHTML("beforeend", modalHTML)
    console.log("Modal HTML appended to body")

    document.getElementById("closeReportModal").addEventListener("click", () => {
      console.log("Close button clicked")
      closeProductReportModal()
    })

    document.getElementById("productReportForm").addEventListener("submit", (event) => {
      console.log("Report form submitted")
      submitProductReport(event)
    })

    document.getElementById("productReportModal").addEventListener("click", function (event) {
      if (event.target === this) {
        console.log("Clicked outside modal")
        closeProductReportModal()
      }
    })

    console.log("Modal event listeners set up")
  }

  // Opens the product report modal
  function openProductReportModal() {
    console.log("Opening product report modal")
    const modal = document.getElementById("productReportModal")
    if (modal) {
      modal.style.display = "flex"
      console.log("Modal displayed")
    } else {
      console.error("Modal element not found")
    }
  }

  // Closes the product report modal
  function closeProductReportModal() {
    console.log("Closing product report modal")
    const modal = document.getElementById("productReportModal")
    if (modal) {
      modal.style.display = "none"
      console.log("Modal hidden")
      const form = document.getElementById("productReportForm")
      if (form) {
        form.reset()
      }
    }
  }

  // Submits product report to server
  function submitProductReport(event) {
    event.preventDefault()
    console.log("Processing product report submission")

    const token = localStorage.getItem("token")
    if (!token) {
      console.log("User not logged in")
      const Swal = window.Swal; // Declare Swal variable here
      if (Swal) {
        Swal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "Please log in to report this product.",
          confirmButtonColor: "#4a6cf7",
        })
      } else {
        alert("Please log in to report this product.")
      }
      closeProductReportModal()
      return
    }

    const reason = document.getElementById("reportReason").value
    const title = document.getElementById("reportTitle").value
    const message = document.getElementById("reportDescription").value

    console.log("Form data:", { reason, title, message })

    const productId = getProductIdFromUrl()
    if (!productId) {
      console.error("Could not determine product ID")
      const Swal = window.Swal; // Declare Swal variable here
      if (Swal) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Product ID could not be determined.",
          confirmButtonColor: "#4a6cf7",
        })
      } else {
        alert("Product ID could not be determined.")
      }
      return
    }

    console.log("Product ID:", productId)

    const reportData = {
      clientId: getUserIdFromToken(token),
      targetType: "Product",
      targetId: productId,
      title: `${reason.toUpperCase()}: ${title}`,
      message: message,
    }

    console.log("Report data:", reportData)

    const submitBtn = document.querySelector('#productReportForm button[type="submit"]')
    if (submitBtn) {
      const originalText = submitBtn.textContent
      submitBtn.disabled = true
      submitBtn.textContent = "Submitting..."

      console.log("Sending report to server")

      const xhr = new XMLHttpRequest()
      xhr.open("POST", "http://localhost:3000/report", true)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.setRequestHeader("Content-Type", "application/json")

      xhr.onload = () => {
        console.log("Server response:", xhr.status)

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            console.log("Report submitted successfully:", data)
            closeProductReportModal()

            const Swal = window.Swal; // Declare Swal variable here
            if (Swal) {
              Swal.fire({
                icon: "success",
                title: "Report Submitted",
                text: "Thank you for your report. We will review it as soon as possible.",
                confirmButtonColor: "#4a6cf7",
              })
            } else {
              alert("Thank you for your report. We will review it as soon as possible.")
            }
          } catch (e) {
            closeProductReportModal()

            const Swal = window.Swal; // Declare Swal variable here
            if (Swal) {
              Swal.fire({
                icon: "success",
                title: "Report Submitted",
                text: "Thank you for your report. We will review it as soon as possible.",
                confirmButtonColor: "#4a6cf7",
              })
            } else {
              alert("Thank you for your report. We will review it as soon as possible.")
            }
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            console.error("Error submitting product report:", errorData)

            const Swal = window.Swal; // Declare Swal variable here
            if (Swal) {
              Swal.fire({
                icon: "error",
                title: "Submission Error",
                text: `There was an error submitting your report: ${errorData.message || xhr.status}`,
                confirmButtonColor: "#4a6cf7",
              })
            } else {
              alert(`There was an error submitting your report: ${errorData.message || xhr.status}`)
            }
          } catch (e) {
            console.error("Error parsing error response:", e)

            const Swal = window.Swal; // Declare Swal variable here
            if (Swal) {
              Swal.fire({
                icon: "error",
                title: "Submission Error",
                text: `Server error: ${xhr.status}`,
                confirmButtonColor: "#4a6cf7",
              })
            } else {
              alert(`Server error: ${xhr.status}`)
            }
          }
        }

        submitBtn.disabled = false
        submitBtn.textContent = originalText
      }

      xhr.onerror = () => {
        console.error("Network error while submitting product report")

        const Swal = window.Swal; // Declare Swal variable here
        if (Swal) {
          Swal.fire({
            icon: "error",
            title: "Connection Error",
            text: "Network error occurred while trying to submit your report.",
            confirmButtonColor: "#4a6cf7",
          })
        } else {
          alert("Network error occurred while trying to submit your report.")
        }

        submitBtn.disabled = false
        submitBtn.textContent = originalText
      }

      xhr.send(JSON.stringify(reportData))
    }
  }

  // Gets product ID from URL parameters
  function getProductIdFromUrl() {
    console.log("Getting product ID from URL:", window.location.search)
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("id")
  }
})

// DECLARATION DES VARIABLES GLOBALES
let reportsData = []
let filteredReports = []
let currentPage = 1
const rowsPerPage = 10
const currentSort = { column: "date", direction: "desc" }
let currentTab = "all"
let currentDateFilter = "all"
let searchTerm = ""
let currentReportId = null

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
// Use a renamed variable for bootstrap to avoid conflicts
const reportsBootstrap = window.bootstrap

document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.bootstrap !== "undefined") {
    // Use the renamed bootstrap variable
    reportModalInstance = new reportsBootstrap.Modal(reportModalEl)
    respondModalInstance = new reportsBootstrap.Modal(respondModalEl)
    deleteModalInstance = new reportsBootstrap.Modal(deleteModalEl)
  }

  setupEventListeners()

  if (document.getElementById("reportsTableBody")) {
    loadReports()
  }
})

// Gets authentication token
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

// Loads all reports from server
function loadReports() {
  const token = getAuthToken()
  if (!token) return

  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading reports...</td></tr>'
  }

  const xhr = new XMLHttpRequest()
  xhr.open("GET", "http://localhost:3000/reports", true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText)
        reportsData = data
        console.log("Loaded all reports:", reportsData)
        filteredReports = [...reportsData]
        updateStats()
        applyFilters()
        renderTable()
        renderPagination()
      } catch (e) {
        console.error("Error parsing response:", e)
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: Invalid response format</td></tr>`
        }
      }
    } else {
      try {
        const errorData = JSON.parse(xhr.responseText)
        console.error("Error loading reports:", errorData)
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${errorData.message || "Failed to load reports"}</td></tr>`
        }
      } catch (e) {
        console.error("Error parsing error response:", e)
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Server error: ${xhr.status}</td></tr>`

          if (xhr.status === 401) {
            tableBody.innerHTML += `<tr><td colspan="6" class="text-center">Please <a href="login.html">log in</a> again.</td></tr>`
          }
        }
      }
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred")
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Network error. Please check your connection.</td></tr>`
    }
  }

  xhr.send()
}

// Loads reports filtered by target type
function loadReportsByTargetType(targetType) {
  const token = getAuthToken()
  if (!token) return

  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading reports...</td></tr>'
  }

  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/reports/targetType/${targetType}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText)
        filteredReports = data
        console.log(`Loaded reports for target type ${targetType}:`, filteredReports)
        updateStats()
        applyFilters()
        renderTable()
        renderPagination()
      } catch (e) {
        console.error("Error parsing response:", e)
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: Invalid response format</td></tr>`
        }
      }
    } else {
      try {
        const errorData = JSON.parse(xhr.responseText)
        console.error(`Error loading reports for target type ${targetType}:`, errorData)
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${errorData.message || "Failed to load reports"}</td></tr>`
        }
      } catch (e) {
        console.error("Error parsing error response:", e)
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Server error: ${xhr.status}</td></tr>`
        }
      }
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred")
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Network error. Please check your connection.</td></tr>`
    }
  }

  xhr.send()
}

// Safely gets a property value with fallback
function safeGet(obj, path, fallback = "N/A") {
  try {
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

// Formats date to YYYY-MM-DD
function formatDate(dateStr) {
  if (!dateStr) {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  try {
    if (typeof dateStr === "string" && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr
    }

    const date = new Date(dateStr)

    if (isNaN(date.getTime())) {
      const today = new Date()
      return today.toISOString().split("T")[0]
    }

    return date.toISOString().split("T")[0]
  } catch (e) {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }
}

// Updates report statistics
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

// Applies filters to the reports
function applyFilters() {
  filteredReports = [...reportsData]

  if (currentTab !== "all") {
    filteredReports = filteredReports.filter((r) => safeGet(r, "status", "").toLowerCase() === currentTab)
  }


  if (currentDateFilter !== "all") {
    const now = new Date();
    // Set time to start of current day
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate start of current week (Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // Calculate start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    filteredReports = filteredReports.filter((r) => {
      const dateField = safeGet(r, "date") || safeGet(r, "createdAt") || safeGet(r, "created_at");
      if (!dateField) return false;

      const d = new Date(dateField);

      // Compare based on current filter
      // Make sure date is between start of period and now (current time)
      return (
        (currentDateFilter === "today" && d >= today && d <= now) ||
        (currentDateFilter === "week" && d >= weekStart && d <= now) ||
        (currentDateFilter === "month" && d >= monthStart && d <= now)
      );
    });
  }

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

  filteredReports.sort((a, b) => {
    let va, vb

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

  const totalPages = Math.ceil(filteredReports.length / rowsPerPage)
  if (currentPage > totalPages) {
    currentPage = totalPages || 1
  }
}
// Declare safeGet function
function safeGet(obj, path, defaultValue) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || defaultValue;
}

// Renders the reports table
function renderTable() {
  if (!tableBody) return

  tableBody.innerHTML = ""

  if (!filteredReports.length) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No reports found</td></tr>`
    if (pageInfo) pageInfo.textContent = "Showing 0 to 0 of 0 entries"
    return
  }

  const start = (currentPage - 1) * rowsPerPage
  const end = Math.min(start + rowsPerPage, filteredReports.length)
  const pageItems = filteredReports.slice(start, end)

  pageItems.forEach((r) => {
    const id = safeGet(r, "_id") || safeGet(r, "id") || "N/A"
    const displayId = safeGet(r, "displayId") || `Report #${id.toString().slice(-5)}`
    const title = safeGet(r, "title") || "N/A"
    const category = safeGet(r, "targetType") || "N/A"

    const formattedDate = safeGet(r, "formattedDate") || formatDate(safeGet(r, "createdAt"))
    const status = safeGet(r, "status") || "Pending"
    const badge = status.toLowerCase() === "resolved" ? "badge-success" : "badge-primary"

    const row = document.createElement("tr")
    row.classList.add("table-row")
    row.dataset.id = id

    if (category.toLowerCase() === "product") {
      let productRef = "N/A"
      if (r.targetId && r.targetId.productId) {
        productRef = r.targetId.productId
      }

      row.innerHTML = `
        <td>${displayId}</td>
        <td>${title}</td>
        <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
        <td>${productRef}</td>
        <td>${formattedDate}</td>
        <td><span class="badge ${badge}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary view-btn" data-id="${id}">
            <i class="bi bi-eye"></i> View
          </button>
        </td>
      `
    } else {
      row.innerHTML = `
        <td>${displayId}</td>
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
    }

    tableBody.appendChild(row)
  })

  if (pageInfo) {
    pageInfo.textContent = `Showing ${start + 1} to ${end} of ${filteredReports.length} entries`
  }
}

// Renders pagination controls
function renderPagination() {
  if (!pagination) return

  pagination.innerHTML = ""
  const totalPages = Math.ceil(filteredReports.length / rowsPerPage)
  if (totalPages <= 1) return

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

// Sets up event listeners
function setupEventListeners() {
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

  const deleteReportBtn = document.getElementById("deleteReportBtn")
  if (deleteReportBtn) {
    deleteReportBtn.addEventListener("click", () => {
      if (reportModalInstance) reportModalInstance.hide()
      if (deleteModalInstance) deleteModalInstance.show()
    })
  }

  const resolveReportBtn = document.getElementById("resolveReportBtn")
  if (resolveReportBtn) {
    resolveReportBtn.addEventListener("click", () => {
      resolveReport(currentReportId)
    })
  }

  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn")
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
      deleteReport(currentReportId)
    })
  }

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

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".filter-dropdown")) {
        dateFilterMenu.classList.remove("show")
      }
    })
  }

  if (tabs) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", function (e) {
        e.preventDefault()
        tabs.forEach((t) => t.classList.remove("active"))
        this.classList.add("active")

        currentTab = this.dataset.tab
        currentPage = 1

        applyFilters()
        renderTable()
        renderPagination()
      })
    })
  }

  if (sortableHeaders) {
    sortableHeaders.forEach((th) => {
      th.addEventListener("click", function () {
        const column = this.dataset.sort

        if (column === currentSort.column) {
          currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc"
        } else {
          currentSort.column = column
          currentSort.direction = column === "date" ? "desc" : "asc"
        }

        sortableHeaders.forEach((header) => {
          header.classList.remove("asc", "desc")
        })
        this.classList.add(currentSort.direction)

        applyFilters()
        renderTable()
      })
    })
  }
}

// Populates and opens the report details modal
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

  const displayId = safeGet(rpt, "displayId") || `Report #${id.toString().slice(-5)}`
  const title = safeGet(rpt, "title") || safeGet(rpt, "name") || "N/A"
  const category = safeGet(rpt, "targetType") || safeGet(rpt, "category") || "N/A"
  const description = safeGet(rpt, "message") || safeGet(rpt, "content") || "N/A"
  const status = safeGet(rpt, "status") || "Pending"
  const formattedDate = safeGet(rpt, "formattedDate") || formatDate(safeGet(rpt, "createdAt") || safeGet(rpt, "date"))
  const productId = safeGet(rpt, "targetId.productId") || "N/A"

  if (document.getElementById("reportModalLabel")) {
    document.getElementById("reportModalLabel").textContent = `${displayId}`
  }

  if (document.getElementById("reportId")) {
    document.getElementById("reportId").value = displayId
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

  const productRefElement = document.getElementById("productReferenceId")
  if (productRefElement) {
    if (category.toLowerCase() === "product") {
      productRefElement.value = productId
      productRefElement.parentElement.style.display = "block"
    } else {
      productRefElement.value = "N/A"
      productRefElement.parentElement.style.display = "none"
    }
  }

  if (reportModalInstance) {
    reportModalInstance.show()
  }
}

// Resolves a report
function resolveReport(id) {
  const token = getAuthToken()
  if (!token) return

  const resolveBtn = document.getElementById("resolveReportBtn")
  let originalText = ""
  if (resolveBtn) {
    originalText = resolveBtn.textContent
    resolveBtn.disabled = true
    resolveBtn.textContent = "Resolving..."
  }

  console.log(`Attempting to resolve report with ID: ${id}`)
  console.log(`API URL: http://localhost:3000/report/${id}`)

  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/report/${id}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    console.log(`Resolve response status: ${xhr.status}`)

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText)

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
          showReportsToast("Success", "Report has been resolved", "success")
        } else {
          console.warn(`Report with ID ${id} was not found in local data`)
          loadReports()
        }

        if (respondModalInstance) {
          respondModalInstance.hide()
        }
      } catch (e) {
        console.warn("Could not parse response, but request was successful:", e)
        showReportsToast("Success", "Report has been resolved", "success")
        loadReports()

        if (respondModalInstance) {
          respondModalInstance.hide()
        }
      }
    } else {
      try {
        const errorData = JSON.parse(xhr.responseText)
        console.error("Error resolving report:", errorData)
        showReportsToast("Error", errorData.message || `Failed to resolve report. Status: ${xhr.status}`, "error")
      } catch (e) {
        console.error("Error parsing error response:", e)
        if (xhr.status === 404) {
          showReportsToast(
            "Error",
            `Report with ID ${id} not found. The report may have been deleted or the ID is incorrect.`,
            "error",
          )
        } else {
          showReportsToast("Error", `Failed to resolve report. Status: ${xhr.status}`, "error")
        }
      }
    }

    if (resolveBtn) {
      resolveBtn.disabled = false
      resolveBtn.textContent = originalText
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred while resolving report")
    showReportsToast("Error", "Network error. Please check your connection.", "error")

    if (resolveBtn) {
      resolveBtn.disabled = false
      resolveBtn.textContent = originalText
    }
  }

  xhr.send(JSON.stringify({ status: "resolved" }))
}

// Deletes a report
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

  const xhr = new XMLHttpRequest()
  xhr.open("DELETE", `http://localhost:3000/report/${id}`, true)
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    console.log(`Delete response status: ${xhr.status}`)

    if (xhr.status >= 200 && xhr.status < 300) {
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
        showReportsToast("Success", "Report deleted successfully", "success")
      } else {
        console.warn(`Report with ID ${id} was not found in local data`)
        showReportsToast("Success", "Report deleted successfully. Refreshing data...", "success")
        loadReports()
      }

      if (deleteModalInstance) {
        deleteModalInstance.hide()
      }
      if (reportModalInstance) {
        reportModalInstance.hide()
      }
    } else {
      try {
        const errorData = JSON.parse(xhr.responseText)
        console.error("Error deleting report:", errorData)
        showReportsToast("Error", errorData.message || `Failed to delete report. Status: ${xhr.status}`, "error")
      } catch (e) {
        console.error("Error parsing error response:", e)
        if (xhr.status === 404) {
          showReportsToast(
            "Error",
            `Report with ID ${id} not found. The report may have been deleted or the ID is incorrect.`,
            "error",
          )
        } else {
          showReportsToast("Error", `Failed to delete report. Status: ${xhr.status}`, "error")
        }
      }
    }

    if (deleteBtn) {
      deleteBtn.disabled = false
      deleteBtn.textContent = originalText
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred while deleting report")
    showReportsToast("Error", "Network error. Please check your connection.", "error")

    if (deleteBtn) {
      deleteBtn.disabled = false
      deleteBtn.textContent = originalText
    }
  }

  xhr.send()
}

// Displays toast notifications - renamed to avoid conflicts
function showReportsToast(title, message, type) {
  // First check if we can use the globally available toast function from superadmin.js
  if (window.showSuperAdminToast) {
    window.showSuperAdminToast(title, message, type);
    return;
  }
  
  // Otherwise use SweetAlert if available
  const Swal = window.Swal; // Declare Swal variable here
  if (Swal) {
    Swal.fire({
      title: `<span style="font-weight:bold;">${title}</span>`,
      html: `<p style="margin:0;">${message}</p>`,
      icon: type,
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
        toast.addEventListener("mouseenter", Swal.stopTimer)
        toast.addEventListener("mouseleave", Swal.resumeTimer)
      },
      customClass: {
        popup: "cool-toast-popup",
        timerProgressBar: "cool-toast-timer",
      },
    })
  } else {
    // If no toast mechanism is available, create our own simple implementation
    let toastContainer = document.getElementById("reports-toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "reports-toast-container";
      toastContainer.className = "position-fixed bottom-0 end-0 p-3";
      toastContainer.style.zIndex = "1050";
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = "toast-" + Date.now();
    const toastElement = document.createElement("div");
    toastElement.id = toastId;
    toastElement.className = `toast align-items-center text-bg-${type} border-0`;
    toastElement.role = "alert";
    toastElement.setAttribute("aria-live", "assertive");
    toastElement.setAttribute("aria-atomic", "true");

    // Create toast content
    toastElement.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong>${title}</strong>: ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toastElement);

    // Initialize and show toast
    if (reportsBootstrap && reportsBootstrap.Toast) {
      const toastInstance = new reportsBootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
      });
      toastInstance.show();
    } else {
      console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }

    // Remove toast after it's hidden
    toastElement.addEventListener("hidden.bs.toast", function() {
      toastElement.remove();
    });
  }
}



// Debounces a function
function debounce(fn, wait) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}