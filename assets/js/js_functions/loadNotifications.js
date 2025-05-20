const API_BASE_URL = ""; // à configurer selon ton environnement
let currentShopId = null;
let allNotifications = []; // Variable pour stocker toutes les notifications
const selectedNotifications = new Set(); // Pour stocker les IDs des notifications sélectionnées
let currentFilterType = "all"; // Pour suivre le filtre actuel

// Références DOM
const notificationCounter = document.querySelector(".notification-counter");
const notificationCountHeader = document.querySelector(
  ".notification-count-header"
);
const notificationList = document.querySelector(".notification-list");
const markAllReadBtn = document.querySelector(".mark-all-read-btn");
const seeAllNotificationsBtn = document.querySelector(
  ".see-all-notifications-btn"
);

document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  // Check for both shop and shopId properties to support both vendor and moderator roles
  if (userData.shop) {
    currentShopId = userData.shop;
    initNotifications();
    createNotificationsModal();
  } else {
    console.error("No shop ID found in userData");
  }
});

function initNotifications() {
  loadNotifications();
  setInterval(loadNotifications, 60000);
  setupListeners();
}

// Helper function to get valid shop ID string
function getValidShopId() {
  // Make sure currentShopId is a valid string and not an object
  if (currentShopId && typeof currentShopId === "object" && currentShopId._id) {
    return currentShopId._id;
  } else if (currentShopId && typeof currentShopId === "object") {
    console.error("Invalid shop ID format:", currentShopId);
    return null;
  }
  return currentShopId;
}

function makeRequest(method, url, data, onSuccess, onError) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
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

  xhr.onerror = () => {
    if (onError) onError("Network error");
  };

  xhr.send(data ? JSON.stringify(data) : null);
}

function loadNotifications() {
  const shopIdParam = getValidShopId();
  if (!shopIdParam) {
    console.error("Cannot load notifications: Invalid shop ID");
    return;
  }

  makeRequest(
    "GET",
    `${API_BASE_URL}/notifications/shop/${shopIdParam}/count`,
    null,
    (data) => {
      updateCounter(data.count);
    }
  );

  makeRequest(
    "GET",
    `${API_BASE_URL}/notifications/shop/${shopIdParam}`,
    null,
    (data) => {
      allNotifications = data.data || []; // Stocker toutes les notifications
      showNotifications(allNotifications);

      // Si le modal est ouvert, mettre à jour son contenu
      if (
        document
          .getElementById("allNotificationsModal")
          .classList.contains("show")
      ) {
        updateModalNotifications(currentFilterType);
      }
    }
  );
}

function updateCounter(count) {
  notificationCounter.textContent = count;
  notificationCountHeader.textContent = `${count} Notifications`;
  notificationCounter.style.display = count > 0 ? "inline-block" : "none";
}

function showNotifications(notifications) {
  notificationList.innerHTML = "";
  if (!notifications || notifications.length === 0) {
    notificationList.innerHTML =
      '<div class="dropdown-item">No notifications</div>';
    return;
  }

  notifications.slice(0, 5).forEach((n) => {
    const item = document.createElement("div");
    item.className = "dropdown-item d-flex align-items-center";
    if (n.status === "unread") item.classList.add("unread-notification");

    // Déterminer l'icône en fonction du type de notification
    let icon = "bi-bell";
    if (n.type === "stock") {
      icon = "bi-box";
    } else if (n.type === "order") {
      icon = "bi-cart";
    } else if (n.type === "delivery") {
      icon = "bi-truck";
    }

    // Ajouter -fill si non lu
    if (n.status === "unread") {
      icon += "-fill";
    }

    // Déterminer la couleur en fonction du type
    let iconColorClass = "text-muted";
    if (n.status === "unread") {
      if (n.type === "stock") {
        iconColorClass = "text-warning";
      } else if (n.type === "order") {
        iconColorClass = "text-primary";
      } else if (n.type === "delivery") {
        iconColorClass = "text-success";
      }
    }

    const date = new Date(n.createdAt);
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
    `;
    notificationList.appendChild(item);
  });
}

// Fonction pour créer le modal des notifications
function createNotificationsModal() {
  // Créer l'élément modal
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
                <button type="button" class="btn btn-outline-warning filter-btn" data-filter="stock">Stock</button>
                <button type="button" class="btn btn-outline-primary filter-btn" data-filter="order">Orders</button>
                <button type="button" class="btn btn-outline-success filter-btn" data-filter="delivery">Deliveries</button>
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
              <!-- Les notifications seront chargées ici -->
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" id="markAllReadModalBtn">Mark All as Read</button>
          </div>
        </div>
      </div>
    </div>
  `;
  // Ajouter le modal au body
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Ajouter les gestionnaires d'événements pour le modal
  document
    .getElementById("markAllReadModalBtn")
    .addEventListener("click", () => {
      const shopIdParam = getValidShopId();
      if (!shopIdParam) {
        console.error("Cannot mark all as read: Invalid shop ID");
        return;
      }

      makeRequest(
        "PUT",
        `${API_BASE_URL}/notifications/shop/${shopIdParam}/read-all`,
        null,
        () => {
          // Mettre à jour localement toutes les notifications
          allNotifications.forEach((notification) => {
            notification.status = "read";
          });

          // Mettre à jour l'interface
          updateModalNotifications(currentFilterType);
          showNotifications(allNotifications);
          updateCounter(0); // Toutes les notifications sont lues

          toast("All notifications have been marked as read", "success");
        },
        () => toast("Error during operation", "error")
      );
    });

  // Gestionnaire pour la case à cocher "Select All"
  document
    .getElementById("selectAllCheckbox")
    .addEventListener("change", (e) => {
      const isChecked = e.target.checked;

      // Sélectionner ou désélectionner toutes les cases à cocher
      document
        .querySelectorAll(".notification-checkbox")
        .forEach((checkbox) => {
          checkbox.checked = isChecked;

          const notificationId = checkbox.dataset.id;
          if (isChecked) {
            selectedNotifications.add(notificationId);
          } else {
            selectedNotifications.delete(notificationId);
          }
        });

      // Mettre à jour le compteur et l'état du bouton
      updateSelectedCount();
    });

  // Gestionnaire pour le bouton "Delete Selected"
  document.getElementById("deleteSelectedBtn").addEventListener("click", () => {
    if (selectedNotifications.size === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedNotifications.size} selected notification(s)?`
      )
    ) {
      // Convertir le Set en Array pour itération
      const selectedIds = Array.from(selectedNotifications);

      // Compteur pour suivre les suppressions réussies
      let successCount = 0;
      let errorCount = 0;
      const totalToDelete = selectedIds.length;

      // Mettre à jour l'interface immédiatement
      allNotifications = allNotifications.filter(
        (notification) => !selectedNotifications.has(notification._id)
      );
      updateModalNotifications(currentFilterType);
      showNotifications(allNotifications);

      // Mettre à jour le compteur
      updateCounter(
        allNotifications.filter((n) => n.status === "unread").length
      );

      // Fonction pour supprimer une notification
      const deleteNotification = (id, index) => {
        makeRequest(
          "DELETE",
          `${API_BASE_URL}/notifications/${id}`,
          null,
          () => {
            successCount++;

            // Si toutes les requêtes sont terminées
            if (successCount + errorCount === totalToDelete) {
              // Notification de succès
              if (errorCount === 0) {
                toast(
                  `${successCount} notification(s) successfully deleted`,
                  "success"
                );
              } else {
                toast(
                  `${successCount} deleted, ${errorCount} failed`,
                  "warning"
                );
              }
            }
          },
          () => {
            errorCount++;

            // Si toutes les requêtes sont terminées
            if (successCount + errorCount === totalToDelete) {
              // Notification d'erreur ou mixte
              if (successCount === 0) {
                toast("Error during deletion", "error");
              } else {
                toast(
                  `${successCount} deleted, ${errorCount} failed`,
                  "warning"
                );
              }
            }
          }
        );
      };

      // Supprimer chaque notification sélectionnée
      selectedIds.forEach((id, index) => {
        deleteNotification(id, index);
      });

      // Réinitialiser les sélections
      selectedNotifications.clear();
      updateSelectedCount();
    }
  });

  // Gestionnaire pour les filtres
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Mettre à jour l'état actif des boutons
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      // Filtrer les notifications
      currentFilterType = e.target.dataset.filter;
      updateModalNotifications(currentFilterType);

      // Réinitialiser les sélections
      selectedNotifications.clear();
      updateSelectedCount();
      document.getElementById("selectAllCheckbox").checked = false;
    });
  });
}

// Fonction pour mettre à jour le compteur de notifications sélectionnées
function updateSelectedCount() {
  const count = selectedNotifications.size;
  document.getElementById("selectedCount").textContent = count;
  document.getElementById("deleteSelectedBtn").disabled = count === 0;
}

// Fonction pour mettre à jour les notifications dans le modal
function updateModalNotifications(filterType = "all") {
  const notificationsList = document.querySelector(".all-notifications-list");
  notificationsList.innerHTML = "";

  let filteredNotifications = [...allNotifications];

  // Appliquer le filtre si nécessaire
  if (filterType !== "all") {
    filteredNotifications = allNotifications.filter(
      (n) => n.type === filterType
    );
  }

  if (filteredNotifications.length === 0) {
    notificationsList.innerHTML =
      '<div class="list-group-item">No notifications</div>';
    return;
  }

  filteredNotifications.forEach((n) => {
    const item = document.createElement("div");
    item.className =
      "list-group-item list-group-item-action d-flex align-items-center notification-item";
    if (n.status === "unread") item.classList.add("unread-notification");

    // Déterminer l'icône en fonction du type de notification
    let icon = "bi-bell";
    if (n.type === "stock") {
      icon = "bi-box";
    } else if (n.type === "order") {
      icon = "bi-cart";
    } else if (n.type === "delivery") {
      icon = "bi-truck";
    }

    // Ajouter -fill si non lu
    if (n.status === "unread") {
      icon += "-fill";
    }

    // Déterminer la couleur en fonction du type
    let iconColorClass = "text-muted";
    if (n.status === "unread") {
      if (n.type === "stock") {
        iconColorClass = "text-warning";
      } else if (n.type === "order") {
        iconColorClass = "text-primary";
      } else if (n.type === "delivery") {
        iconColorClass = "text-success";
      }
    }

    const date = new Date(n.createdAt);

    // Vérifier si cette notification est déjà sélectionnée
    const isChecked = selectedNotifications.has(n._id) ? "checked" : "";

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
    `;
    notificationsList.appendChild(item);
  });

  // Ajouter les gestionnaires d'événements pour les boutons dans le modal
  setupModalButtonListeners();
}

// Fonction pour configurer les gestionnaires d'événements pour les boutons dans le modal
function setupModalButtonListeners() {
  // Gestionnaire pour les cases à cocher
  document.querySelectorAll(".notification-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const notificationId = e.target.dataset.id;

      if (e.target.checked) {
        selectedNotifications.add(notificationId);
      } else {
        selectedNotifications.delete(notificationId);

        // Désélectionner "Select All" si une case est décochée
        document.getElementById("selectAllCheckbox").checked = false;
      }

      updateSelectedCount();
    });
  });

  // Gestionnaire pour le bouton "marquer comme lu"
  document.querySelectorAll(".modal-mark-read-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;

      // Mettre à jour l'interface immédiatement
      const notification = allNotifications.find((n) => n._id === id);
      if (notification) {
        notification.status = "read";
      }

      // Mettre à jour l'affichage
      updateModalNotifications(currentFilterType);
      showNotifications(allNotifications);

      // Mettre à jour le compteur
      updateCounter(
        allNotifications.filter((n) => n.status === "unread").length
      );

      // Envoyer la requête à l'API
      makeRequest(
        "PUT",
        `${API_BASE_URL}/notifications/read/${id}`,
        null,
        () => {
          // Succès silencieux - l'interface est déjà mise à jour
        },
        () => {
          // En cas d'erreur, revenir à l'état précédent
          if (notification) {
            notification.status = "unread";
            updateModalNotifications(currentFilterType);
            showNotifications(allNotifications);
            updateCounter(
              allNotifications.filter((n) => n.status === "unread").length
            );
          }
          toast("Error during marking", "error");
        }
      );
    });
  });

  // Gestionnaire pour le bouton "supprimer"
  document.querySelectorAll(".modal-delete-notification-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm("Are you sure you want to delete this notification?")) {
        // Stocker une copie de la notification avant de la supprimer
        const notificationIndex = allNotifications.findIndex(
          (n) => n._id === id
        );
        const deletedNotification =
          notificationIndex !== -1
            ? { ...allNotifications[notificationIndex] }
            : null;

        // Mettre à jour l'interface immédiatement
        allNotifications = allNotifications.filter((n) => n._id !== id);

        // Supprimer de la sélection si elle était sélectionnée
        selectedNotifications.delete(id);
        updateSelectedCount();

        // Mettre à jour l'affichage
        updateModalNotifications(currentFilterType);
        showNotifications(allNotifications);

        // Mettre à jour le compteur
        updateCounter(
          allNotifications.filter((n) => n.status === "unread").length
        );

        // Envoyer la requête à l'API
        makeRequest(
          "DELETE",
          `${API_BASE_URL}/notifications/${id}`,
          null,
          () => {
            // Succès silencieux - l'interface est déjà mise à jour
            toast("Notification successfully deleted", "success");
          },
          () => {
            // En cas d'erreur, restaurer la notification
            if (deletedNotification) {
              if (notificationIndex !== -1) {
                allNotifications.splice(
                  notificationIndex,
                  0,
                  deletedNotification
                );
              } else {
                allNotifications.push(deletedNotification);
              }
              updateModalNotifications(currentFilterType);
              showNotifications(allNotifications);
              updateCounter(
                allNotifications.filter((n) => n.status === "unread").length
              );
            }
            toast("Error during deletion", "error");
          }
        );
      }
    });
  });
}

function setupListeners() {
  markAllReadBtn.addEventListener("click", () => {
    makeRequest(
      "PUT",
      `${API_BASE_URL}/notifications/shop/${currentShopId}/read-all`,
      null,
      () => {
        // Mettre à jour localement toutes les notifications
        allNotifications.forEach((notification) => {
          notification.status = "read";
        });

        // Mettre à jour l'interface
        showNotifications(allNotifications);
        updateCounter(0); // Toutes les notifications sont lues

        toast("All notifications have been marked as read", "success");
      },
      () => toast("Error during operation", "error")
    );
  });

  seeAllNotificationsBtn.addEventListener("click", () => {
    // Réinitialiser les sélections
    selectedNotifications.clear();
    updateSelectedCount();

    // Mettre à jour les notifications dans le modal et l'afficher
    updateModalNotifications(currentFilterType);

    // Afficher le modal
    const modalElement = document.getElementById("allNotificationsModal");
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    }
  });

  notificationList.addEventListener("click", (e) => {
    // Gestion du bouton "marquer comme lu"
    const readBtn = e.target.closest(".mark-read-btn");
    if (readBtn) {
      const id = readBtn.dataset.id;

      // Mettre à jour l'interface immédiatement
      const notification = allNotifications.find((n) => n._id === id);
      if (notification) {
        notification.status = "read";
      }

      // Mettre à jour l'affichage
      showNotifications(allNotifications);

      // Mettre à jour le compteur
      updateCounter(
        allNotifications.filter((n) => n.status === "unread").length
      );

      // Envoyer la requête à l'API
      makeRequest(
        "PUT",
        `${API_BASE_URL}/notifications/read/${id}`,
        null,
        () => {
          // Succès silencieux - l'interface est déjà mise à jour
        },
        () => {
          // En cas d'erreur, revenir à l'état précédent
          if (notification) {
            notification.status = "unread";
            showNotifications(allNotifications);
            updateCounter(
              allNotifications.filter((n) => n.status === "unread").length
            );
          }
          toast("Error during marking", "error");
        }
      );
    }

    // Gestion du bouton "supprimer"
    const deleteBtn = e.target.closest(".delete-notification-btn");
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;

      // Confirmation avant suppression
      if (confirm("Are you sure you want to delete this notification?")) {
        // Stocker une copie de la notification avant de la supprimer
        const notificationIndex = allNotifications.findIndex(
          (n) => n._id === id
        );
        const deletedNotification =
          notificationIndex !== -1
            ? { ...allNotifications[notificationIndex] }
            : null;

        // Mettre à jour l'interface immédiatement
        allNotifications = allNotifications.filter((n) => n._id !== id);

        // Mettre à jour l'affichage
        showNotifications(allNotifications);

        // Mettre à jour le compteur
        updateCounter(
          allNotifications.filter((n) => n.status === "unread").length
        );

        // Envoyer la requête à l'API
        makeRequest(
          "DELETE",
          `${API_BASE_URL}/notifications/${id}`,
          null,
          () => {
            // Succès silencieux - l'interface est déjà mise à jour
            toast("Notification successfully deleted", "success");
          },
          () => {
            // En cas d'erreur, restaurer la notification
            if (deletedNotification) {
              if (notificationIndex !== -1) {
                allNotifications.splice(
                  notificationIndex,
                  0,
                  deletedNotification
                );
              } else {
                allNotifications.push(deletedNotification);
              }
              showNotifications(allNotifications);
              updateCounter(
                allNotifications.filter((n) => n.status === "unread").length
              );
            }
            toast("Error during deletion", "error");
          }
        );
      }
    }
  });
}

function relativeDate(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function toast(msg, type = "info") {
  window.Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1000,
    icon: type,
    title: msg,
  });
}

// CSS style via JS
const css = document.createElement("style");
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
  .notification-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .notification-actions .btn {
    padding: 0.25rem 0.5rem;
  }
  .delete-notification-btn:hover .bi-trash,
  .modal-delete-notification-btn:hover .bi-trash {
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
  .modal-mark-read-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Animation pour les actions */
  .notification-item {
    transition: opacity 0.3s, transform 0.3s;
  }
  
  .notification-item.removing {
    opacity: 0;
    transform: translateX(30px);
  }
`;
document.head.appendChild(css);

// Import des bibliothèques nécessaires
function loadScripts() {
  // Import Swal library
  const swalScript = document.createElement("script");
  swalScript.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
  document.head.appendChild(swalScript);

  // Import Bootstrap JS si ce n'est pas déjà fait
  if (typeof window.bootstrap === "undefined") {
    const bootstrapScript = document.createElement("script");
    bootstrapScript.src =
      "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js";
    document.head.appendChild(bootstrapScript);
  }
}

loadScripts();
