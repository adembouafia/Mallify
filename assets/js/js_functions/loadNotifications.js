const API_BASE_URL = ''; // à configurer selon ton environnement
let currentShopId = null;

// Références DOM
const notificationCounter = document.querySelector('.notification-counter');
const notificationCountHeader = document.querySelector('.notification-count-header');
const notificationList = document.querySelector('.notification-list');
const markAllReadBtn = document.querySelector('.mark-all-read-btn');
const seeAllNotificationsBtn = document.querySelector('.see-all-notifications-btn');

document.addEventListener('DOMContentLoaded', function () {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (userData.shop) {
    currentShopId = userData.shop;
    initNotifications();
  } else {
    console.error('Aucun ID de shop trouvé dans userData');
  }
});

function initNotifications() {
  loadNotifications();
  setInterval(loadNotifications, 60000);
  setupListeners();
}

function makeRequest(method, url, data, onSuccess, onError) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);

  const token = localStorage.getItem('token');
  if (token) {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  }

  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        onSuccess(response);
      } catch {
        onSuccess(xhr.responseText);
      }
    } else {
      if (onError) onError(xhr.statusText);
    }
  };

  xhr.onerror = function () {
    if (onError) onError('Erreur réseau');
  };

  xhr.send(data ? JSON.stringify(data) : null);
}

function loadNotifications() {
  makeRequest('GET', `${API_BASE_URL}/notifications/shop/${currentShopId}/count`, null, data => {
    updateCounter(data.count);
  });

  makeRequest('GET', `${API_BASE_URL}/notifications/shop/${currentShopId}`, null, data => {
    showNotifications(data.data);
  });
}

function updateCounter(count) {
  notificationCounter.textContent = count;
  notificationCountHeader.textContent = `${count} Notifications`;
  notificationCounter.style.display = count > 0 ? 'inline-block' : 'none';
}

function showNotifications(notifications) {
  notificationList.innerHTML = '';
  if (!notifications || notifications.length === 0) {
    notificationList.innerHTML = '<div class="dropdown-item">Aucune notification</div>';
    return;
  }

  notifications.slice(0, 5).forEach(n => {
    const item = document.createElement('div');
    item.className = 'dropdown-item d-flex align-items-center';
    if (n.status === 'unread') item.classList.add('unread-notification');

    const date = new Date(n.createdAt);
    item.innerHTML = `
      <div class="me-3">
        <i class="bi ${n.status === 'unread' ? 'bi-bell-fill text-warning' : 'bi-bell text-muted'}"></i>
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
    `;
    notificationList.appendChild(item);
  });
}

function setupListeners() {
  markAllReadBtn.addEventListener('click', function () {
    makeRequest('PUT', `${API_BASE_URL}/notifications/shop/${currentShopId}/read-all`, null, () => {
      loadNotifications();
      toast('Toutes les notifications ont été marquées comme lues', 'success');
    }, () => toast('Erreur lors de l’opération', 'error'));
  });

  seeAllNotificationsBtn.addEventListener('click', function () {
    console.log('Voir toutes les notifications');
  });

  notificationList.addEventListener('click', function (e) {
    const btn = e.target.closest('.mark-read-btn');
    if (btn) {
      const id = btn.dataset.id;
      makeRequest('PUT', `${API_BASE_URL}/notifications/read/${id}`, null, () => {
        loadNotifications();
      }, () => toast('Erreur lors du marquage', 'error'));
    }
  });
}

function relativeDate(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  return date.toLocaleDateString();
}

function toast(msg, type = 'info') {
  Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1000,
    icon: type,
    title: msg
  });
}

// CSS style via JS
const css = document.createElement('style');
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
`;
document.head.appendChild(css);

