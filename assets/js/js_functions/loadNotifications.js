const API_BASE_URL = "" // à configurer selon ton environnement
let currentShopId = null

// Références DOM
const notificationCounter = document.querySelector(".notification-counter")
const notificationCountHeader = document.querySelector(".notification-count-header")
const notificationList = document.querySelector(".notification-list")
const markAllReadBtn = document.querySelector(".mark-all-read-btn")
const seeAllNotificationsBtn = document.querySelector(".see-all-notifications-btn")

document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")
  if (userData.shop) {
    currentShopId = userData.shop
    initNotifications()
  } else {
    console.error("Aucun ID de shop trouvé dans userData")
  }
})

function initNotifications() {
  loadNotifications()
  setInterval(loadNotifications, 60000)
  setupListeners()
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
    if (onError) onError("Erreur réseau")
  }

  xhr.send(data ? JSON.stringify(data) : null)
}

function loadNotifications() {
  makeRequest("GET", `${API_BASE_URL}/notifications/shop/${currentShopId}/count`, null, (data) => {
    updateCounter(data.count)
  })

  makeRequest("GET", `${API_BASE_URL}/notifications/shop/${currentShopId}`, null, (data) => {
    showNotifications(data.data)
  })
}

function updateCounter(count) {
  notificationCounter.textContent = count
  notificationCountHeader.textContent = `${count} Notifications`
  notificationCounter.style.display = count > 0 ? "inline-block" : "none"
}

function showNotifications(notifications) {
  notificationList.innerHTML = ""
  if (!notifications || notifications.length === 0) {
    notificationList.innerHTML = '<div class="dropdown-item">Aucune notification</div>'
    return
  }

  notifications.slice(0, 5).forEach((n) => {
    const item = document.createElement("div")
    item.className = "dropdown-item d-flex align-items-center"
    if (n.status === "unread") item.classList.add("unread-notification")

    // Déterminer l'icône en fonction du type de notification
    let icon = "bi-bell"
    if (n.type === "stock") {
      icon = "bi-box"
    } else if (n.type === "order") {
      icon = "bi-cart"
    } else if (n.type === "delivery") {
      icon = "bi-truck"
    }

    // Ajouter -fill si non lu
    if (n.status === "unread") {
      icon += "-fill"
    }

    // Déterminer la couleur en fonction du type
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
    item.innerHTML = `
      <div class="me-3">
        <i class="bi ${icon} ${iconColorClass}"></i>
      </div>
      <div class="notification-content flex-grow-1">
        <div class="notification-message">${n.message}</div>
        <small class="text-muted">${relativeDate(date)}</small>
      </div>
      <div class="notification-actions">
        <button class="btn btn-sm btn-link mark-read-btn" data-id="${n._id}">
          <i class="bi bi-check-circle"></i>
        </button>
      </div>
    `
    notificationList.appendChild(item)
  })
}

function setupListeners() {
  markAllReadBtn.addEventListener("click", () => {
    makeRequest(
      "PUT",
      `${API_BASE_URL}/notifications/shop/${currentShopId}/read-all`,
      null,
      () => {
        loadNotifications()
        toast("Toutes les notifications ont été marquées comme lues", "success")
      },
      () => toast("Erreur lors de l’opération", "error"),
    )
  })

  seeAllNotificationsBtn.addEventListener("click", () => {
    console.log("Voir toutes les notifications")
  })

  notificationList.addEventListener("click", (e) => {
    const btn = e.target.closest(".mark-read-btn")
    if (btn) {
      const id = btn.dataset.id
      makeRequest(
        "PUT",
        `${API_BASE_URL}/notifications/read/${id}`,
        null,
        () => {
          loadNotifications()
        },
        () => toast("Erreur lors du marquage", "error"),
      )
    }
  })
}

function relativeDate(date) {
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return "À l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Il y a ${days} jour${days > 1 ? "s" : ""}`
  return date.toLocaleDateString()
}

function toast(msg, type = "info") {
  Swal.fire({
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
`
document.head.appendChild(css)
