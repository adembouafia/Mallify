const API_BASE_URL_1 = "" // configure according to your environment
let currentShopId = null
let allNotifications = [] // Variable to store all notifications
let allAdminNotifications = [] // Variable to store admin notifications
const selectedNotifications = new Set() // To store IDs of selected notifications
let currentFilterType = "all" // To track current filter
let isAdminDashboard = false // To track if we're in admin or shop dashboard

// DOM References
const notificationCounter = document.querySelector(".notification-counter")
const notificationCountHeader = document.querySelector(".notification-count-header")
const notificationList = document.querySelector(".notification-list")
const markAllReadBtn = document.querySelector(".mark-all-read-btn")
const seeAllNotificationsBtn = document.querySelector(".see-all-notifications-btn")

document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")

  // Determine if user is on admin dashboard by checking specific URL
  isAdminDashboard = window.location.pathname.includes("/dashbordA_pages/")

  // Check if user has admin or superAdmin role
  const userRole = userData.role || ""
  const isAdmin = userRole === "admin" || userRole === "superAdmin"

  if (isAdminDashboard && !isAdmin) {
    console.error("Unauthorized access to admin dashboard")
    // Redirect to home page or display error message
    window.location.href = "/" // or display error message
    return
  }

  // For shop dashboard, check if shopId exists
  if (!isAdminDashboard) {
    if (userData.shop) {
      currentShopId = userData.shop
      initShopNotifications()
    } else {
      console.error("No shop ID found in userData")
    }
  } else {
    // For admin dashboard, no shopId needed
    initAdminNotifications()
  }

  createNotificationsModal()
})

function initShopNotifications() {
  loadShopNotifications()
  setInterval(loadShopNotifications, 60000)
  setupShopListeners()
}

function initAdminNotifications() {
  loadAdminNotifications()
  setInterval(loadAdminNotifications, 60000)
  setupAdminListeners()
}

// Helper function to get valid shop ID string
function getValidShopId() {
  // Make sure currentShopId is a valid string and not an object
  if (currentShopId && typeof currentShopId === "object" && currentShopId._id) {
    return currentShopId._id
  } else if (currentShopId && typeof currentShopId === "object") {
    console.error("Invalid shop ID format:", currentShopId)
    return null
  }
  return currentShopId
}

function makeRequest(method, url, data, onSuccess, onError) {
  const xhr = new XMLHttpRequest()
  xhr.open(method, url, true)

  const token = localStorage.getItem("token")
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  }

  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText)
        onSuccess(response)
      } catch {
        onSuccess(xhr.responseText)
      }
    } else {
      if (onError) onError(xhr.statusText)
    }
  }

  xhr.onerror = () => {
    if (onError) onError("Network error")
  }

  xhr.send(data ? JSON.stringify(data) : null)
}

// Functions for shop notifications
function loadShopNotifications() {
  const shopIdParam = getValidShopId()
  if (!shopIdParam) {
    console.error("Cannot load notifications: Invalid shop ID")
    return
  }

  makeRequest("GET", `${API_BASE_URL_1}/notifications/shop/${shopIdParam}/count`, null, (data) => {
    // For shop users, we'll only count non-admin notifications
    updateCounter(data.count)
  })

  makeRequest("GET", `${API_BASE_URL_1}/notifications/shop/${shopIdParam}`, null, (data) => {
    // Store all notifications but filter out admin ones for display
    allNotifications = data.data || []

    // Filter out admin notifications for the counter
    const nonAdminNotifications = allNotifications.filter((n) => n.type !== "admin")
    const unreadCount = nonAdminNotifications.filter((n) => n.status === "unread").length
    updateCounter(unreadCount)

    // Show notifications (the function now filters out admin notifications)
    showNotifications(allNotifications)

    // If modal is open, update its content
    if (document.getElementById("allNotificationsModal").classList.contains("show")) {
      updateModalNotifications(currentFilterType)
    }
  })
}

// Functions for admin notifications
function loadAdminNotifications() {
  makeRequest("GET", `${API_BASE_URL_1}/notifications/admin/count`, null, (data) => {
    updateCounter(data.count)
  })

  makeRequest("GET", `${API_BASE_URL_1}/notifications/admin`, null, (data) => {
    allAdminNotifications = data.data || [] // Store all admin notifications
    showAdminNotifications(allAdminNotifications)

    // If modal is open, update its content
    if (document.getElementById("allNotificationsModal").classList.contains("show")) {
      updateModalAdminNotifications(currentFilterType)
    }
  })
}

function updateCounter(count) {
  notificationCounter.textContent = count
  notificationCountHeader.textContent = `${count} Notifications`
  notificationCounter.style.display = count > 0 ? "inline-block" : "none"
}

// In the showNotifications function, add a filter to exclude admin notifications
function showNotifications(notifications) {
  notificationList.innerHTML = ""

  // Filter out admin notifications for non-admin users
  const filteredNotifications = notifications.filter((n) => n.type !== "admin")

  if (!filteredNotifications || filteredNotifications.length === 0) {
    notificationList.innerHTML = '<div class="dropdown-item">No notifications</div>'
    return
  }

  filteredNotifications.slice(0, 5).forEach((n) => {
    const item = document.createElement("div")
    item.className = "dropdown-item d-flex align-items-center"
    if (n.status === "unread") item.classList.add("unread-notification")

    // Determine icon based on notification type
    let icon = "bi-bell"
    if (n.type === "stock") {
      icon = "bi-box"
    } else if (n.type === "order") {
      icon = "bi-cart"
    } else if (n.type === "delivery") {
      icon = "bi-truck"
    } else if (n.type === "product") {
      icon = "bi-box-seam"
    }

    // Add -fill if unread
    if (n.status === "unread") {
      icon += "-fill"
    }

    // Determine color based on type
    let iconColorClass = "text-muted"
    if (n.status === "unread") {
      if (n.type === "stock") {
        iconColorClass = "text-warning"
      } else if (n.type === "order") {
        iconColorClass = "text-primary"
      } else if (n.type === "delivery") {
        iconColorClass = "text-success"
      } else if (n.type === "product") {
        iconColorClass = "text-info"
      }
    }

    const date = new Date(n.createdAt)
    item.innerHTML = `
      <div class="me-3">
        <i class="bi ${icon} ${iconColorClass}"></i>
      </div>
      <div class="notification-content flex-grow-1">
        <div class="notification-message">${n.message}</div>
        <small class="text-muted">${relativeDate(date)}</small>
      </div>
      <div class="notification-actions">
        <button class="btn btn-sm btn-link mark-read-btn" data-id="${n._id}" title="Mark as read">
          <i class="bi bi-check-circle"></i>
        </button>
        <button class="btn btn-sm btn-link delete-notification-btn" data-id="${n._id}" title="Delete">
          <i class="bi bi-trash text-danger"></i>
        </button>
      </div>
    `
    notificationList.appendChild(item)
  })
}

// Function to display admin notifications
function showAdminNotifications(notifications) {
  notificationList.innerHTML = ""
  if (!notifications || notifications.length === 0) {
    notificationList.innerHTML = '<div class="dropdown-item">No notifications</div>'
    return
  }

  notifications.slice(0, 5).forEach((n) => {
    const item = document.createElement("div")
    item.className = "dropdown-item d-flex align-items-center"
    if (n.status === "unread") item.classList.add("unread-notification")

    // For admin notifications, use a specific icon
    let icon = "bi-shield"

    // Add -fill if unread
    if (n.status === "unread") {
      icon += "-fill"
    }

    // Color for admin notifications
    let iconColorClass = "text-muted"
    if (n.status === "unread") {
      iconColorClass = "text-danger" // Red for unread admin notifications
    }

    const date = new Date(n.createdAt)

    // Get shop information if available
    const shopName = n.shopId && n.shopId.shopName ? n.shopId.shopName : "N/A"
    const vendorName = n.vendorId && n.vendorId.vendorName ? n.vendorId.vendorName : ""

    // Add additional information for admin notifications
    const shopInfo = shopName !== "N/A" ? `<div><strong>Shop:</strong> ${shopName}</div>` : ""
    const vendorInfo = vendorName ? `<div><strong>Vendor:</strong> ${vendorName}</div>` : ""

    item.innerHTML = `
      <div class="me-3">
        <i class="bi ${icon} ${iconColorClass}"></i>
      </div>
      <div class="notification-content flex-grow-1">
        <div class="notification-message">${n.message}</div>
        ${shopInfo}
        ${vendorInfo}
        <small class="text-muted">${relativeDate(date)}</small>
      </div>
      <div class="notification-actions">
        <button class="btn btn-sm btn-link admin-mark-read-btn" data-id="${n._id}" title="Mark as read">
          <i class="bi bi-check-circle"></i>
        </button>
        <button class="btn btn-sm btn-link admin-delete-notification-btn" data-id="${n._id}" title="Delete">
          <i class="bi bi-trash text-danger"></i>
        </button>
      </div>
    `
    notificationList.appendChild(item)
  })
}

// Function to create notifications modal
function createNotificationsModal() {
  // Create modal element
  const modalHTML = `
    <div class="modal fade" id="allNotificationsModal" tabindex="-1" aria-labelledby="allNotificationsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="allNotificationsModalLabel">All Notifications</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex justify-content-between mb-3">
              <div class="btn-group" role="group" aria-label="Notification filters">
                <button type="button" class="btn btn-outline-secondary filter-btn active" data-filter="all">All</button>
                ${
                  !isAdminDashboard
                    ? `
                <button type="button" class="btn btn-outline-warning filter-btn" data-filter="stock">Stock</button>
                <button type="button" class="btn btn-outline-primary filter-btn" data-filter="order">Orders</button>
                <button type="button" class="btn btn-outline-success filter-btn" data-filter="delivery">Deliveries</button>
                `
                    : `
                <button type="button" class="btn btn-outline-danger filter-btn" data-filter="admin">Admin</button>
                `
                }
              </div>
              <div class="selection-controls">
                <div class="form-check d-inline-block me-2">
                  <input class="form-check-input" type="checkbox" id="selectAllCheckbox">
                  <label class="form-check-label" for="selectAllCheckbox">Select All</label>
                </div>
                <button type="button" class="btn btn-danger" id="deleteSelectedBtn" disabled>
                  <i class="bi bi-trash"></i> Delete Selected (<span id="selectedCount">0</span>)
                </button>
              </div>
            </div>
            <div class="list-group all-notifications-list">
              <!-- Notifications will be loaded here -->
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" id="markAllReadModalBtn">Mark All as Read</button>
          </div>
        </div>
      </div>
    </div>
  `
  // Add modal to body
  const modalContainer = document.createElement("div")
  modalContainer.innerHTML = modalHTML
  document.body.appendChild(modalContainer)

  // Add event handlers for the modal
  document.getElementById("markAllReadModalBtn").addEventListener("click", () => {
    if (isAdminDashboard) {
      // For admin dashboard
      makeRequest(
        "PUT",
        `${API_BASE_URL_1}/notifications/admin/read-all`,
        null,
        () => {
          // Update all notifications locally
          allAdminNotifications.forEach((notification) => {
            notification.status = "read"
          })

          // Update UI
          updateModalAdminNotifications(currentFilterType)
          showAdminNotifications(allAdminNotifications)
          updateCounter(0) // All notifications are read

          toast("All notifications have been marked as read", "success")
        },
        () => toast("Error during operation", "error"),
      )
    } else {
      // For shop dashboard
      const shopIdParam = getValidShopId()
      if (!shopIdParam) {
        console.error("Cannot mark all as read: Invalid shop ID")
        return
      }

      makeRequest(
        "PUT",
        `${API_BASE_URL_1}/notifications/shop/${shopIdParam}/read-all`,
        null,
        () => {
          // Update all notifications locally
          allNotifications.forEach((notification) => {
            notification.status = "read"
          })

          // Update UI
          updateModalNotifications(currentFilterType)
          showNotifications(allNotifications)
          updateCounter(0) // All notifications are read

          toast("All notifications have been marked as read", "success")
        },
        () => toast("Error during operation", "error"),
      )
    }
  })

  // Handler for "Select All" checkbox
  document.getElementById("selectAllCheckbox").addEventListener("change", (e) => {
    const isChecked = e.target.checked

    // Select or deselect all checkboxes
    document.querySelectorAll(".notification-checkbox").forEach((checkbox) => {
      checkbox.checked = isChecked

      const notificationId = checkbox.dataset.id
      if (isChecked) {
        selectedNotifications.add(notificationId)
      } else {
        selectedNotifications.delete(notificationId)
      }
    })

    // Update counter and button state
    updateSelectedCount()
  })

  // Handler for "Delete Selected" button
  document.getElementById("deleteSelectedBtn").addEventListener("click", () => {
    if (selectedNotifications.size === 0) return

    if (confirm(`Are you sure you want to delete ${selectedNotifications.size} selected notification(s)?`)) {
      // Convert Set to Array for iteration
      const selectedIds = Array.from(selectedNotifications)

      // Counter to track successful deletions
      let successCount = 0
      let errorCount = 0
      const totalToDelete = selectedIds.length

      // Update UI immediately
      if (isAdminDashboard) {
        allAdminNotifications = allAdminNotifications.filter(
          (notification) => !selectedNotifications.has(notification._id),
        )
        updateModalAdminNotifications(currentFilterType)
        showAdminNotifications(allAdminNotifications)
      } else {
        allNotifications = allNotifications.filter((notification) => !selectedNotifications.has(notification._id))
        updateModalNotifications(currentFilterType)
        showNotifications(allNotifications)
      }

      // Update counter
      if (isAdminDashboard) {
        updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)
      } else {
        updateCounter(allNotifications.filter((n) => n.status === "unread").length)
      }

      // Function to delete a notification
      const deleteNotification = (id, index) => {
        const endpoint = isAdminDashboard
          ? `${API_BASE_URL_1}/notifications/admin/${id}`
          : `${API_BASE_URL_1}/notifications/${id}`

        makeRequest(
          "DELETE",
          endpoint,
          null,
          () => {
            successCount++

            // If all requests are completed
            if (successCount + errorCount === totalToDelete) {
              // Success notification
              if (errorCount === 0) {
                toast(`${successCount} notification(s) successfully deleted`, "success")
              } else {
                toast(`${successCount} deleted, ${errorCount} failed`, "warning")
              }
            }
          },
          () => {
            errorCount++

            // If all requests are completed
            if (successCount + errorCount === totalToDelete) {
              // Error or mixed notification
              if (successCount === 0) {
                toast("Error during deletion", "error")
              } else {
                toast(`${successCount} deleted, ${errorCount} failed`, "warning")
              }
            }
          },
        )
      }

      // Delete each selected notification
      selectedIds.forEach((id, index) => {
        deleteNotification(id, index)
      })

      // Reset selections
      selectedNotifications.clear()
      updateSelectedCount()
    }
  })

  // Handler for filters
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Update active state of buttons
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"))
      e.target.classList.add("active")

      // Filter notifications
      currentFilterType = e.target.dataset.filter

      if (isAdminDashboard) {
        updateModalAdminNotifications(currentFilterType)
      } else {
        updateModalNotifications(currentFilterType)
      }

      // Reset selections
      selectedNotifications.clear()
      updateSelectedCount()
      document.getElementById("selectAllCheckbox").checked = false
    })
  })
}

// Function to update selected notifications counter
function updateSelectedCount() {
  const count = selectedNotifications.size
  document.getElementById("selectedCount").textContent = count
  document.getElementById("deleteSelectedBtn").disabled = count === 0
}

// Also update the updateModalNotifications function to filter out admin notifications
function updateModalNotifications(filterType = "all") {
  const notificationsList = document.querySelector(".all-notifications-list")
  notificationsList.innerHTML = ""

  // Filter out admin notifications first
  let filteredNotifications = allNotifications.filter((n) => n.type !== "admin")

  // Then apply the user-selected filter
  if (filterType !== "all") {
    filteredNotifications = filteredNotifications.filter((n) => n.type === filterType)
  }

  if (filteredNotifications.length === 0) {
    notificationsList.innerHTML = '<div class="list-group-item">No notifications</div>'
    return
  }

  filteredNotifications.forEach((n) => {
    const item = document.createElement("div")
    item.className = "list-group-item list-group-item-action d-flex align-items-center notification-item"
    if (n.status === "unread") item.classList.add("unread-notification")

    // Determine icon based on notification type
    let icon = "bi-bell"
    if (n.type === "stock") {
      icon = "bi-box"
    } else if (n.type === "order") {
      icon = "bi-cart"
    } else if (n.type === "delivery") {
      icon = "bi-truck"
    }

    // Add -fill if unread
    if (n.status === "unread") {
      icon += "-fill"
    }

    // Determine color based on type
    let iconColorClass = "text-muted"
    if (n.status === "unread") {
      if (n.type === "stock") {
        iconColorClass = "text-warning"
      } else if (n.type === "order") {
        iconColorClass = "text-primary"
      } else if (n.type === "delivery") {
        iconColorClass = "text-success"
      }
    }

    const date = new Date(n.createdAt)

    // Check if this notification is already selected
    const isChecked = selectedNotifications.has(n._id) ? "checked" : ""

    item.innerHTML = `
      <div class="form-check me-2">
        <input class="form-check-input notification-checkbox" type="checkbox" data-id="${n._id}" ${isChecked}>
      </div>
      <div class="me-3">
        <i class="bi ${icon} ${iconColorClass}"></i>
      </div>
      <div class="notification-content flex-grow-1">
        <div class="notification-message">${n.message}</div>
        <small class="text-muted">${relativeDate(date)}</small>
      </div>
      <div class="notification-actions">
        <button class="btn btn-md modal-mark-read-btn" data-id="${n._id}" title="Mark as read" ${n.status === "read" ? "disabled" : ""}>
          <i class="bi bi-check-circle"></i>
        </button>
        <button class="btn btn-md modal-delete-notification-btn" data-id="${n._id}" title="Delete">
          <i class="bi bi-trash text-danger"></i>
        </button>
      </div>
    `
    notificationsList.appendChild(item)
  })

  // Add event listeners for buttons in the modal
  setupModalButtonListeners()
}

// Function to update admin notifications in the modal
function updateModalAdminNotifications(filterType = "all") {
  const notificationsList = document.querySelector(".all-notifications-list")
  notificationsList.innerHTML = ""

  let filteredNotifications = [...allAdminNotifications]

  // For admin notifications, only filter by "admin" type
  if (filterType !== "all" && filterType !== "admin") {
    filteredNotifications = []
  }

  if (filteredNotifications.length === 0) {
    notificationsList.innerHTML = '<div class="list-group-item">No notifications</div>'
    return
  }

  filteredNotifications.forEach((n) => {
    const item = document.createElement("div")
    item.className = "list-group-item list-group-item-action d-flex align-items-center notification-item"
    if (n.status === "unread") item.classList.add("unread-notification")

    // For admin notifications, use a specific icon
    let icon = "bi-shield"

    // Add -fill if unread
    if (n.status === "unread") {
      icon += "-fill"
    }

    // Color for admin notifications
    let iconColorClass = "text-muted"
    if (n.status === "unread") {
      iconColorClass = "text-danger" // Red for unread admin notifications
    }

    const date = new Date(n.createdAt)

    // Get shop information if available
    const shopName = n.shopId && n.shopId.shopName ? n.shopId.shopName : "N/A"
    const shopStatus = n.shopId && n.shopId.status ? n.shopId.status : ""
    const vendorName = n.vendorId && n.vendorId.vendorName ? n.vendorId.vendorName : ""

    // Add additional information for admin notifications
    const shopInfo =
      shopName !== "N/A" ? `<div><strong>Shop:</strong> ${shopName} ${shopStatus ? `(${shopStatus})` : ""}</div>` : ""
    const vendorInfo = vendorName ? `<div><strong>Vendor:</strong> ${vendorName}</div>` : ""

    // Check if this notification is already selected
    const isChecked = selectedNotifications.has(n._id) ? "checked" : ""

    item.innerHTML = `
      <div class="form-check me-2">
        <input class="form-check-input notification-checkbox" type="checkbox" data-id="${n._id}" ${isChecked}>
      </div>
      <div class="me-3">
        <i class="bi ${icon} ${iconColorClass}"></i>
      </div>
      <div class="notification-content flex-grow-1">
        <div class="notification-message">${n.message}</div>
        ${shopInfo}
        ${vendorInfo}
        <small class="text-muted">${relativeDate(date)}</small>
      </div>
      <div class="notification-actions">
        <button class="btn btn-md modal-admin-mark-read-btn" data-id="${n._id}" title="Mark as read" ${n.status === "read" ? "disabled" : ""}>
          <i class="bi bi-check-circle"></i>
        </button>
        <button class="btn btn-md modal-admin-delete-notification-btn" data-id="${n._id}" title="Delete">
          <i class="bi bi-trash text-danger"></i>
        </button>
      </div>
    `
    notificationsList.appendChild(item)
  })

  // Add event listeners for admin buttons in the modal
  setupModalAdminButtonListeners()
}

// Function to set up event listeners for buttons in the modal
function setupModalButtonListeners() {
  // Handler for checkboxes
  document.querySelectorAll(".notification-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const notificationId = e.target.dataset.id

      if (e.target.checked) {
        selectedNotifications.add(notificationId)
      } else {
        selectedNotifications.delete(notificationId)

        // Uncheck "Select All" if a checkbox is unchecked
        document.getElementById("selectAllCheckbox").checked = false
      }

      updateSelectedCount()
    })
  })

  // Handler for "mark as read" button
  document.querySelectorAll(".modal-mark-read-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id

      // Update UI immediately
      const notification = allNotifications.find((n) => n._id === id)
      if (notification) {
        notification.status = "read"
      }

      // Update display
      updateModalNotifications(currentFilterType)
      showNotifications(allNotifications)

      // Update counter
      updateCounter(allNotifications.filter((n) => n.status === "unread").length)

      // Send request to API
      makeRequest(
        "PUT",
        `${API_BASE_URL_1}/notifications/read/${id}`,
        null,
        () => {
          // Silent success - UI is already updated
        },
        () => {
          // In case of error, revert to previous state
          if (notification) {
            notification.status = "unread"
            updateModalNotifications(currentFilterType)
            showNotifications(allNotifications)
            updateCounter(allNotifications.filter((n) => n.status === "unread").length)
          }
          toast("Error during marking", "error")
        },
      )
    })
  })

  // Handler for "delete" button
  document.querySelectorAll(".modal-delete-notification-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id
      if (confirm("Are you sure you want to delete this notification?")) {
        // Store a copy of the notification before deleting it
        const notificationIndex = allNotifications.findIndex((n) => n._id === id)
        const deletedNotification = notificationIndex !== -1 ? { ...allNotifications[notificationIndex] } : null

        // Update UI immediately
        allNotifications = allNotifications.filter((n) => n._id !== id)

        // Remove from selection if it was selected
        selectedNotifications.delete(id)
        updateSelectedCount()

        // Update display
        updateModalNotifications(currentFilterType)
        showNotifications(allNotifications)

        // Update counter
        updateCounter(allNotifications.filter((n) => n.status === "unread").length)

        // Send request to API
        makeRequest(
          "DELETE",
          `${API_BASE_URL_1}/notifications/${id}`,
          null,
          () => {
            // Silent success - UI is already updated
            toast("Notification successfully deleted", "success")
          },
          () => {
            // In case of error, restore the notification
            if (deletedNotification) {
              if (notificationIndex !== -1) {
                allNotifications.splice(notificationIndex, 0, deletedNotification)
              } else {
                allNotifications.push(deletedNotification)
              }
              updateModalNotifications(currentFilterType)
              showNotifications(allNotifications)
              updateCounter(allNotifications.filter((n) => n.status === "unread").length)
            }
            toast("Error during deletion", "error")
          },
        )
      }
    })
  })
}

// Function to set up event listeners for admin buttons in the modal
function setupModalAdminButtonListeners() {
  // Handler for checkboxes
  document.querySelectorAll(".notification-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const notificationId = e.target.dataset.id

      if (e.target.checked) {
        selectedNotifications.add(notificationId)
      } else {
        selectedNotifications.delete(notificationId)

        // Uncheck "Select All" if a checkbox is unchecked
        document.getElementById("selectAllCheckbox").checked = false
      }

      updateSelectedCount()
    })
  })

  // Handler for "mark as read" button for admin
  document.querySelectorAll(".modal-admin-mark-read-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id

      // Update UI immediately
      const notification = allAdminNotifications.find((n) => n._id === id)
      if (notification) {
        notification.status = "read"
      }

      // Update display
      updateModalAdminNotifications(currentFilterType)
      showAdminNotifications(allAdminNotifications)

      // Update counter
      updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)

      // Send request to API
      makeRequest(
        "PUT",
        `${API_BASE_URL_1}/notifications/admin/read/${id}`,
        null,
        () => {
          // Silent success - UI is already updated
        },
        () => {
          // In case of error, revert to previous state
          if (notification) {
            notification.status = "unread"
            updateModalAdminNotifications(currentFilterType)
            showAdminNotifications(allAdminNotifications)
            updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)
          }
          toast("Error during marking", "error")
        },
      )
    })
  })

  // Handler for "delete" button for admin
  document.querySelectorAll(".modal-admin-delete-notification-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id
      if (confirm("Are you sure you want to delete this notification?")) {
        // Store a copy of the notification before deleting it
        const notificationIndex = allAdminNotifications.findIndex((n) => n._id === id)
        const deletedNotification = notificationIndex !== -1 ? { ...allAdminNotifications[notificationIndex] } : null

        // Update UI immediately
        allAdminNotifications = allAdminNotifications.filter((n) => n._id !== id)

        selectedNotifications.delete(id)
        updateSelectedCount()

        // Update display
        updateModalAdminNotifications(currentFilterType)
        showAdminNotifications(allAdminNotifications)

        // Update counter
        updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)

        // Send request to API
        makeRequest(
          "DELETE",
          `${API_BASE_URL_1}/notifications/admin/${id}`,
          null,
          () => {
            // Silent success - UI is already updated
            toast("Notification successfully deleted", "success")
          },
          () => {
            // In case of error, restore the notification
            if (deletedNotification) {
              if (notificationIndex !== -1) {
                allAdminNotifications.splice(notificationIndex, 0, deletedNotification)
              } else {
                allAdminNotifications.push(deletedNotification)
              }
              showAdminNotifications(allAdminNotifications)
              updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)
            }
            toast("Error during deletion", "error")
          },
        )
      }
    })
  })
}

function setupShopListeners() {
  markAllReadBtn.addEventListener("click", () => {
    makeRequest(
      "PUT",
      `${API_BASE_URL_1}/notifications/shop/${currentShopId}/read-all`,
      null,
      () => {
        // Update all notifications locally
        allNotifications.forEach((notification) => {
          notification.status = "read"
        })

        // Update UI
        showNotifications(allNotifications)
        updateCounter(0) // All notifications are read

        toast("All notifications have been marked as read", "success")
      },
      () => toast("Error during operation", "error"),
    )
  })

  seeAllNotificationsBtn.addEventListener("click", () => {
    // Reset selections
    selectedNotifications.clear()
    updateSelectedCount()

    // Update notifications in the modal and display it
    updateModalNotifications(currentFilterType)

    // Show the modal
    const modalElement = document.getElementById("allNotificationsModal")
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement)
      modal.show()
    }
  })

  notificationList.addEventListener("click", (e) => {
    // Handle "mark as read" button
    const readBtn = e.target.closest(".mark-read-btn")
    if (readBtn) {
      const id = readBtn.dataset.id

      // Update UI immediately
      const notification = allNotifications.find((n) => n._id === id)
      if (notification) {
        notification.status = "read"
      }

      // Update display
      showNotifications(allNotifications)

      // Update counter
      updateCounter(allNotifications.filter((n) => n.status === "unread").length)

      // Send request to API
      makeRequest(
        "PUT",
        `${API_BASE_URL_1}/notifications/read/${id}`,
        null,
        () => {
          // Silent success - UI is already updated
        },
        () => {
          // In case of error, revert to previous state
          if (notification) {
            notification.status = "unread"
            showNotifications(allNotifications)
            updateCounter(allNotifications.filter((n) => n.status === "unread").length)
          }
          toast("Error during marking", "error")
        },
      )
    }

    // Handle "delete" button
    const deleteBtn = e.target.closest(".delete-notification-btn")
    if (deleteBtn) {
      const id = deleteBtn.dataset.id

      // Confirm before deletion
      if (confirm("Are you sure you want to delete this notification?")) {
        // Store a copy of the notification before deleting it
        const notificationIndex = allNotifications.findIndex((n) => n._id === id)
        const deletedNotification = notificationIndex !== -1 ? { ...allNotifications[notificationIndex] } : null

        // Update UI immediately
        allNotifications = allNotifications.filter((n) => n._id !== id)

        // Update display
        showNotifications(allNotifications)

        // Update counter
        updateCounter(allNotifications.filter((n) => n.status === "unread").length)

        // Send request to API
        makeRequest(
          "DELETE",
          `${API_BASE_URL_1}/notifications/${id}`,
          null,
          () => {
            // Silent success - UI is already updated
            toast("Notification successfully deleted", "success")
          },
          () => {
            // In case of error, restore the notification
            if (deletedNotification) {
              if (notificationIndex !== -1) {
                allNotifications.splice(notificationIndex, 0, deletedNotification)
              } else {
                allNotifications.push(deletedNotification)
              }
              showNotifications(allNotifications)
              updateCounter(allNotifications.filter((n) => n.status === "unread").length)
            }
            toast("Error during deletion", "error")
          },
        )
      }
    }
  })
}

// Function to set up event listeners for admin dashboard
function setupAdminListeners() {
  markAllReadBtn.addEventListener("click", () => {
    makeRequest(
      "PUT",
      `${API_BASE_URL_1}/notifications/admin/read-all`,
      null,
      () => {
        // Update all notifications locally
        allAdminNotifications.forEach((notification) => {
          notification.status = "read"
        })

        // Update UI
        showAdminNotifications(allAdminNotifications)
        updateCounter(0) // All notifications are read

        toast("All notifications have been marked as read", "success")
      },
      () => toast("Error during operation", "error"),
    )
  })

  seeAllNotificationsBtn.addEventListener("click", () => {
    // Reset selections
    selectedNotifications.clear()
    updateSelectedCount()

    // Update notifications in the modal and display it
    updateModalAdminNotifications(currentFilterType)

    // Show the modal
    const modalElement = document.getElementById("allNotificationsModal")
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement)
      modal.show()
    }
  })

  notificationList.addEventListener("click", (e) => {
    // Handle "mark as read" button for admin
    const readBtn = e.target.closest(".admin-mark-read-btn")
    if (readBtn) {
      const id = readBtn.dataset.id

      // Update UI immediately
      const notification = allAdminNotifications.find((n) => n._id === id)
      if (notification) {
        notification.status = "read"
      }

      // Update display
      showAdminNotifications(allAdminNotifications)

      // Update counter
      updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)

      // Send request to API
      makeRequest(
        "PUT",
        `${API_BASE_URL_1}/notifications/admin/read/${id}`,
        null,
        () => {
          // Silent success - UI is already updated
        },
        () => {
          // In case of error, revert to previous state
          if (notification) {
            notification.status = "unread"
            showAdminNotifications(allAdminNotifications)
            updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)
          }
          toast("Error during marking", "error")
        },
      )
    }

    // Handle "delete" button for admin
    const deleteBtn = e.target.closest(".admin-delete-notification-btn")
    if (deleteBtn) {
      const id = deleteBtn.dataset.id

      // Confirm before deletion
      if (confirm("Are you sure you want to delete this notification?")) {
        // Store a copy of the notification before deleting it
        const notificationIndex = allAdminNotifications.findIndex((n) => n._id === id)
        const deletedNotification = notificationIndex !== -1 ? { ...allAdminNotifications[notificationIndex] } : null

        // Update UI immediately
        allAdminNotifications = allAdminNotifications.filter((n) => n._id !== id)

        // Update display
        showAdminNotifications(allAdminNotifications)

        // Update counter
        updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)

        // Send request to API
        makeRequest(
          "DELETE",
          `${API_BASE_URL_1}/notifications/admin/${id}`,
          null,
          () => {
            // Silent success - UI is already updated
            toast("Notification successfully deleted", "success")
          },
          () => {
            // In case of error, restore the notification
            if (deletedNotification) {
              if (notificationIndex !== -1) {
                allAdminNotifications.splice(notificationIndex, 0, deletedNotification)
              } else {
                allAdminNotifications.push(deletedNotification)
              }
              showAdminNotifications(allAdminNotifications)
              updateCounter(allAdminNotifications.filter((n) => n.status === "unread").length)
            }
            toast("Error during deletion", "error")
          },
        )
      }
    }
  })
}

function relativeDate(date) {
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`
  return date.toLocaleDateString()
}

function toast(msg, type = "info") {
  window.Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1000,
    icon: type,
    title: msg,
  })
}

// CSS style via JS
const css = document.createElement("style")
css.textContent = `
  .unread-notification {
    background-color: rgba(255, 193, 7, 0.1);
  }
  .notification-content {
    max-width: 250px;
    white-space: normal;
    word-wrap: break-word;
  }
  .notification-message {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
    max-height: unset;
    padding-right: 5px;
  }
  .notification-list {
    max-height: 300px;
    overflow-y: auto;
  }
  .bi-cart-fill.text-primary {
    color: #0d6efd !important;
  }
  .bi-truck-fill.text-success {
    color: #198754 !important;
  }
  .bi-box-fill.text-warning {
    color: #ffc107 !important;
  }
  .bi-shield-fill.text-danger {
    color: #dc3545 !important;
  }
  .notification-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .notification-actions .btn {
    padding: 0.25rem 0.5rem;
  }
  .delete-notification-btn:hover .bi-trash,
  .modal-delete-notification-btn:hover .bi-trash,
  .admin-delete-notification-btn:hover .bi-trash,
  .modal-admin-delete-notification-btn:hover .bi-trash {
    color: #dc3545 !important;
  }
  .all-notifications-list {
    max-height: 60vh;
    overflow-y: auto;
  }
  .filter-btn.active {
    font-weight: bold;
  }
  #allNotificationsModal .list-group-item {
    border-left: none;
    border-right: none;
  }
  #allNotificationsModal .list-group-item:first-child {
    border-top: none;
  }
  #allNotificationsModal .list-group-item:last-child {
    border-bottom: none;
  }
  
  /* Larger buttons in modal */
  .notification-item .notification-actions {
    margin-left: auto;
  }
  
  .notification-item .notification-actions .btn {
    font-size: 1.1rem;
    padding: 0.5rem 0.75rem;
  }
  
  .notification-item .notification-actions .btn i {
    font-size: 1.2rem;
  }
  
  /* Make sure buttons are aligned to the right */
  .notification-item {
    position: relative;
  }
  
  .notification-item .notification-actions {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  /* Checkbox styling */
  .form-check-input.notification-checkbox {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }
  
  /* Selection controls styling */
  .selection-controls {
    display: flex;
    align-items: center;
  }
  
  #selectAllCheckbox {
    cursor: pointer;
  }
  
  #deleteSelectedBtn {
    transition: opacity 0.3s;
  }
  
  #deleteSelectedBtn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  #deleteSelectedBtn:not(:disabled):hover {
    background-color: #bb2d3b;
    border-color: #b02a37;
  }
  
  /* Disabled mark as read button */
  .modal-mark-read-btn:disabled,
  .modal-admin-mark-read-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Animation for actions */
  .notification-item {
    transition: opacity 0.3s, transform 0.3s;
  }
  
  .notification-item.removing {
    opacity: 0;
    transform: translateX(30px);
  }
`
document.head.appendChild(css)

// Import required libraries
function loadScripts() {
  // Import Swal library
  const swalScript = document.createElement("script")
  swalScript.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11"
  document.head.appendChild(swalScript)

  // Import Bootstrap JS if not already done
  if (typeof window.bootstrap === "undefined") {
    const bootstrapScript = document.createElement("script")
    bootstrapScript.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
    document.head.appendChild(bootstrapScript)
  }
}

loadScripts()

// Execute this code to test
console.log("Notifications system initialized")
