document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on the delivery details page
  const urlParams = new URLSearchParams(window.location.search);
  const deliveryId = urlParams.get("id");

  if (deliveryId && window.location.pathname.includes("detailsDelivery.html")) {
    // We're on the delivery details page
    initDeliveryDetailsPage(deliveryId);
  } else {
    // We're on the main delivery dashboard page
    initDeliveryDashboard();
  }
  // Add notification loading
  const userDataString = localStorage.getItem("userData");
  let shopId;

  try {
    // Essayer de parser les données utilisateur si c'est une chaîne JSON
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      shopId = userData.shop;
    }
  } catch (error) {
    console.error("Erreur lors du parsing des données utilisateur:", error);
  }

  if (shopId) {
    // Load notifications immediately
    loadNotifications();

    // Refresh notifications every 5 minutes
    setInterval(loadNotifications, 5 * 60 * 1000);
  }

  // Vérifier les livraisons reportées au chargement de la page
  checkPostponedDeliveries();

  // Vérifier les livraisons reportées toutes les 5 minutes
  setInterval(checkPostponedDeliveries, 5 * 60 * 1000);
});

// Fonction pour vérifier les livraisons reportées
function checkPostponedDeliveries() {
  // Récupérer le shopId depuis le localStorage
  const userDataString = localStorage.getItem("userData");
  let shopId;

  try {
    // Essayer de parser les données utilisateur si c'est une chaîne JSON
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      shopId = userData.shop;
    }
  } catch (error) {
    console.error("Erreur lors du parsing des données utilisateur:", error);
  }

  // Si nous n'avons pas pu obtenir le shopId à partir de userData, essayer de l'obtenir directement
  if (!shopId) {
    shopId = localStorage.getItem("shopId");
  }

  if (!shopId) {
    console.error(
      "Aucun shopId trouvé dans le localStorage pour la vérification des livraisons reportées"
    );
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open(
    "GET",
    `http://localhost:3000/delivery/check-postponed?shopId=${shopId}`,
    true
  );
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader(
    "Authorization",
    `Bearer ${localStorage.getItem("token")}`
  );

  xhr.onload = () => {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      console.log("Vérification des livraisons reportées:", response.message);

      // Si des livraisons ont été mises à jour, recharger les données
      if (response.updated > 0) {
        loadDeliveries();
      }
    }
  };

  xhr.onerror = () => {
    console.error("Erreur lors de la vérification des livraisons reportées");
  };

  xhr.send();
}

// =============================================
// DELIVERY DASHBOARD FUNCTIONS
// =============================================

function initDeliveryDashboard() {
  // Set up event listeners for the delivery page
  setupDeliveryEventListeners();

  // Load deliveries data
  loadDeliveries();
}

function setupDeliveryEventListeners() {
  // Action buttons for deliveries (mark as delivered, cancelled, postponed)
  document.addEventListener("click", (e) => {
    // Deliveries table action buttons
    if (
      e.target.classList.contains("btn-delivered") ||
      e.target.closest(".btn-delivered")
    ) {
      const deliveryId = e.target.closest(".btn-delivered").dataset.id;
      confirmDeliveryAction(deliveryId, "Marquer comme livrée", "Delivered");
    }

    if (
      e.target.classList.contains("btn-cancel") ||
      e.target.closest(".btn-cancel")
    ) {
      const deliveryId = e.target.closest(".btn-cancel").dataset.id;
      const btn = e.target.closest(".btn-cancel");
      const deliveryStatus = btn.getAttribute("data-status");

      // Vérifier si la livraison est en cours avant d'autoriser l'annulation
      if (deliveryStatus === "InProgress" || deliveryStatus === "Pending") {
        confirmDeliveryAction(deliveryId, "Annuler la livraison", "Cancelled");
      } else {
        Swal.fire({
          title: "Action non autorisée",
          text: "Seules les livraisons en cours peuvent être annulées",
          icon: "warning",
          confirmButtonText: "OK",
        });
      }
    }

    if (
      e.target.classList.contains("btn-postpone") ||
      e.target.closest(".btn-postpone")
    ) {
      const deliveryId = e.target.closest(".btn-postpone").dataset.id;
      showPostponeDialog(deliveryId);
    }

    // View details button
    if (
      e.target.classList.contains("btn-view-details") ||
      e.target.closest(".btn-view-details")
    ) {
      const deliveryId = e.target.closest(".btn-view-details").dataset.id;
      loadDeliveryDetails(deliveryId);
    }

    // Make to Ship button for orders
    if (
      e.target.classList.contains("btn-make-to-ship") ||
      e.target.closest(".btn-make-to-ship")
    ) {
      const orderId = e.target.closest(".btn-make-to-ship").dataset.id;
      makeToShip(orderId);
    }
  });

  // Search functionality
  const searchInput = document.querySelector(".search-input");
  const searchButton = document.querySelector(".search-button");

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", () => {
      searchDeliveries(searchInput.value);
    });

    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        searchDeliveries(searchInput.value);
      }
    });
  }

  // Entries per page selector
  const entriesSelect = document.querySelector(".items-per-page");
  if (entriesSelect) {
    entriesSelect.addEventListener("change", function () {
      updateEntriesPerPage(Number.parseInt(this.value));
    });
  }

  // Tab change event listeners
  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach((tab) => {
    tab.addEventListener("shown.bs.tab", (e) => {
      const targetId = e.target.getAttribute("aria-controls");
      // No need to reload data, just update the UI based on the current tab
    });
  });

  // Sort options
  document.querySelectorAll(".sort-option").forEach((option) => {
    option.addEventListener("click", function (e) {
      e.preventDefault();
      const sortBy = this.getAttribute("data-sort");
      document.querySelector(".sort-dropdown").textContent = this.textContent;
      sortDeliveries(sortBy);
    });
  });
}

// Fonction pour charger les livraisons
function loadDeliveries() {
  console.log("Loading deliveries...");

  // Récupérer le shopId depuis le localStorage
  const userDataString = localStorage.getItem("userData");
  let shopId;

  try {
    // Essayer de parser les données utilisateur si c'est une chaîne JSON
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      shopId = userData.shop;
    }
  } catch (error) {
    console.error("Erreur lors du parsing des données utilisateur:", error);
  }

  if (!shopId) {
    console.error("Aucun shopId trouvé dans le localStorage");
    showErrorMessage(
      "Aucun magasin sélectionné. Veuillez vous connecter à nouveau."
    );
    return;
  }

  console.log("Chargement des livraisons pour le shop:", shopId);

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/delivery/all?shopId=${shopId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader(
    "Authorization",
    `Bearer ${localStorage.getItem("token")}`
  );

  xhr.onload = () => {
    if (xhr.status === 200) {
      console.log("Réponse reçue:", xhr.responseText);
      try {
        const deliveries = JSON.parse(xhr.responseText);
        console.log("Livraisons chargées:", deliveries);

        // Mettre à jour les compteurs
        updateDeliveryCounts(deliveries);

        // Afficher toutes les livraisons
        displayDeliveries(deliveries, "all-deliveries-table");

        // Filtrer et afficher les livraisons par statut
        displayDeliveriesByStatus(
          deliveries,
          "InProgress",
          "in-progress-deliveries-table"
        );
        displayDeliveriesByStatus(
          deliveries,
          "Delivered",
          "delivered-deliveries-table"
        );
        displayDeliveriesByStatus(
          deliveries,
          "Postponed",
          "postponed-deliveries-table"
        );
        displayDeliveriesByStatus(
          deliveries,
          "Cancelled",
          "cancelled-deliveries-table"
        );

        // Mettre à jour la pagination
        updatePagination(deliveries.length);
      } catch (error) {
        console.error("Erreur lors du parsing des livraisons:", error);
        showErrorMessage("Erreur lors du traitement des données de livraison");
      }
    } else {
      console.error(
        "Erreur lors du chargement des livraisons. Statut:",
        xhr.status,
        "Réponse:",
        xhr.responseText
      );
      showErrorMessage("Erreur lors du chargement des livraisons");
    }
  };

  xhr.onerror = (e) => {
    console.error("Erreur de connexion au serveur:", e);
    showErrorMessage("Erreur de connexion au serveur");
  };

  xhr.send();
}

// Fonction pour mettre à jour les compteurs de livraisons
function updateDeliveryCounts(deliveries) {
  const totalCount = deliveries.length;
  const inProgressCount = deliveries.filter(
    (d) => d.statut === "InProgress" || d.statut === "Pending"
  ).length;
  const deliveredCount = deliveries.filter(
    (d) => d.statut === "Delivered"
  ).length;
  const postponedCount = deliveries.filter(
    (d) => d.statut === "Postponed"
  ).length;
  const cancelledCount = deliveries.filter(
    (d) => d.statut === "Cancelled"
  ).length;

  // Mettre à jour les compteurs dans les cartes statistiques
  document.querySelector(".total-deliveries-count").textContent = totalCount;
  document.querySelector(".in-progress-count").textContent = inProgressCount;
  document.querySelector(".delivered-count").textContent = deliveredCount;
  document.querySelector(".postponed-count").textContent = postponedCount;
  document.querySelector(".cancelled-count").textContent = cancelledCount;

  // Mettre à jour les badges des onglets
  document.querySelector(".all-deliveries-badge").textContent = totalCount;
  document.querySelector(".in-progress-badge").textContent = inProgressCount;
  document.querySelector(".delivered-badge").textContent = deliveredCount;
  document.querySelector(".postponed-badge").textContent = postponedCount;
  document.querySelector(".cancelled-badge").textContent = cancelledCount;
}

// Fonction pour afficher les livraisons filtrées par statut
function displayDeliveriesByStatus(deliveries, status, tableId) {
  const filteredDeliveries = deliveries.filter((delivery) => {
    if (status === "InProgress") {
      return delivery.statut === "InProgress" || delivery.statut === "Pending";
    }
    return delivery.statut === status;
  });

  displayDeliveries(filteredDeliveries, tableId);
}

// Fonction pour afficher les livraisons dans un tableau
function displayDeliveries(deliveries, tableId) {
  console.log(`Affichage des livraisons dans ${tableId}:`, deliveries);

  // Sélectionner le tableau
  const deliveryTable = document.getElementById(tableId);

  if (!deliveryTable) {
    console.error(`Tableau ${tableId} non trouvé dans le DOM`);
    return;
  }

  // Vider le tableau existant
  deliveryTable.innerHTML = "";

  if (!deliveries || deliveries.length === 0) {
    deliveryTable.innerHTML =
      '<tr><td colspan="9" class="text-center">No Deliveries Found</td></tr>';
    return;
  }

  // Afficher chaque livraison dans le tableau
  deliveries.forEach((delivery) => {
    // Formater la date
    const formattedDate = new Date(delivery.deliveryDate).toLocaleDateString();

    // Déterminer le statut et la classe CSS correspondante
    let statusClass = "";
    let statusText = delivery.statut;

    switch (delivery.statut) {
      case "Delivered":
        statusClass = "status-shipped";
        statusText = "Delivered";
        break;
      case "InProgress":
      case "Pending":
        statusClass = "status-pending";
        statusText = "In Progress";
        break;
      case "Cancelled":
        statusClass = "status-cancelled";
        statusText = "Cancelled";
        break;
      case "Postponed":
        statusClass = "status-postponed";
        statusText = "Postponed";
        break;
    }

    // Déterminer les actions disponibles en fonction du statut
    let actionButtons = `
      <a href="detailsDelivery.html?id=${delivery._id}" class="btn btn-sm btn-outline-secondary me-1 btn-view-details" data-id="${delivery._id}" title="View Details">
        <i class="bi bi-eye"></i>
      </a>
    `;

    if (delivery.statut === "InProgress" || delivery.statut === "Pending") {
      actionButtons += `
        <a href="#" class="btn btn-sm btn-outline-success me-1 btn-delivered" data-id="${delivery._id}" title="Mark as Delivered">
          <i class="bi bi-check-circle"></i>
        </a>
        <a href="#" class="btn btn-sm btn-outline-danger me-1 btn-cancel" data-id="${delivery._id}" data-status="${delivery.statut}" title="Mark as Cancelled">
          <i class="bi bi-x-circle"></i>
        </a>
        <a href="#" class="btn btn-sm btn-outline-warning btn-postpone" data-id="${delivery._id}" title="Postpone Delivery">
          <i class="bi bi-clock"></i>
        </a>
      `;
    }

    // Récupérer les informations de la commande associée
    const orderId = delivery.idCommande
      ? typeof delivery.idCommande === "object"
        ? delivery.idCommande._id.substring(0, 8)
        : delivery.idCommande
      : "N/A";

    // Générer un numéro de livraison aléatoire si non disponible
    const deliveryNumber = `#D-${Math.floor(Math.random() * 10000000)}`;

    // Déterminer le nombre d'articles (si disponible)
    let itemCount = 0;
    if (
      delivery.idCommande &&
      delivery.idCommande.cartData &&
      delivery.idCommande.cartData.items
    ) {
      itemCount = delivery.idCommande.cartData.items.length;
    }

    // Construire le HTML de la ligne
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="delivery-number">${deliveryNumber}</span></td>
      <td><span class="order-id">#${orderId}</span></td>
      <td><span class="customer-name">${delivery.clientInfo.prenom} ${delivery.clientInfo.nom}</span></td>
      <td><span class="items-count">${itemCount}</span></td>
      <td>${delivery.deliveryAdresse.split(",")[0]}</td>
      <td><span class="price-amount">${delivery.idCommande && delivery.idCommande.orderTotal ? delivery.idCommande.orderTotal.toFixed(2) + " DT" : "N/A"}</span></td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <div class="d-flex">
          ${actionButtons}
        </div>
      </td>
    `;

    deliveryTable.appendChild(row);
  });
}

function loadDeliveryDetails(deliveryId) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/delivery/${deliveryId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader(
    "Authorization",
    `Bearer ${localStorage.getItem("token")}`
  );

  xhr.onload = () => {
    if (xhr.status === 200) {
      const delivery = JSON.parse(xhr.responseText);

      // Store delivery in localStorage for the details page
      localStorage.setItem("currentDelivery", JSON.stringify(delivery));

      // Redirect to the details page
      window.location.href = "detailsDelivery.html?id=" + deliveryId;
    } else {
      showErrorMessage("Erreur lors du chargement des détails de la livraison");
    }
  };

  xhr.onerror = () => {
    showErrorMessage("Erreur de connexion au serveur");
  };

  xhr.send();
}

function confirmDeliveryAction(deliveryId, actionName, actionStatus) {
  Swal.fire({
    title: `${actionName}`,
    text: `Êtes-vous sûr de vouloir ${actionName.toLowerCase()} cette livraison ?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Oui",
    cancelButtonText: "Annuler",
  }).then((result) => {
    if (result.isConfirmed) {
      updateDeliveryStatus(deliveryId, actionStatus);
    }
  });
}

function showPostponeDialog(deliveryId) {
  Swal.fire({
    title: "Reporter la livraison",
    html: `
      <label for="postpone-date" class="swal2-label">Nouvelle date de livraison</label>
      <input id="postpone-date" class="swal2-input" type="date" required>
    `,
    showCancelButton: true,
    confirmButtonText: "Reporter",
    cancelButtonText: "Annuler",
    preConfirm: () => {
      const date = document.getElementById("postpone-date").value;
      if (!date) {
        Swal.showValidationMessage("Veuillez remplir tous les champs");
        return false;
      }

      return `${date}`;
    },
  }).then((result) => {
    if (result.isConfirmed) {
      updateDeliveryStatus(deliveryId, "Postponed", {
        postponedDate: result.value,
      });
    }
  });
}

function updateDeliveryStatus(deliveryId, status, additionalData = {}) {
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `/delivery/statut/${deliveryId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader(
    "Authorization",
    `Bearer ${localStorage.getItem("token")}`
  );

  const requestData = {
    newStatut: status,
    ...additionalData,
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      Swal.fire({
        title: "Succès!",
        text: `Statut de livraison mis à jour avec succès`,
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        // If we're on the details page, reload the page
        if (window.location.pathname.includes("detailsDelivery.html")) {
          window.location.reload();
        } else {
          // Otherwise reload deliveries
          loadDeliveries();
        }
      });
    } else {
      showErrorMessage("Erreur lors de la mise à jour du statut de livraison");
    }
  };

  xhr.onerror = () => {
    showErrorMessage("Erreur de connexion au serveur");
  };

  xhr.send(JSON.stringify(requestData));
}

function searchDeliveries(searchTerm) {
  if (!searchTerm) {
    loadDeliveries();
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/delivery/all`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader(
    "Authorization",
    `Bearer ${localStorage.getItem("token")}`
  );

  xhr.onload = () => {
    if (xhr.status === 200) {
      const allDeliveries = JSON.parse(xhr.responseText);

      // Filter deliveries based on search term
      const filteredDeliveries = allDeliveries.filter((delivery) => {
        const searchString = searchTerm.toLowerCase();
        return (
          (delivery.idCommande &&
            delivery.idCommande._id &&
            delivery.idCommande._id.toLowerCase().includes(searchString)) ||
          delivery.clientInfo.nom.toLowerCase().includes(searchString) ||
          delivery.clientInfo.prenom.toLowerCase().includes(searchString) ||
          delivery.deliveryAdresse.toLowerCase().includes(searchString) ||
          delivery.statut.toLowerCase().includes(searchString)
        );
      });

      // Mettre à jour les compteurs
      updateDeliveryCounts(filteredDeliveries);

      // Afficher les résultats de recherche
      displayDeliveries(filteredDeliveries, "all-deliveries-table");

      // Filtrer et afficher les livraisons par statut
      displayDeliveriesByStatus(
        filteredDeliveries,
        "InProgress",
        "in-progress-deliveries-table"
      );
      displayDeliveriesByStatus(
        filteredDeliveries,
        "Delivered",
        "delivered-deliveries-table"
      );
      displayDeliveriesByStatus(
        filteredDeliveries,
        "Postponed",
        "postponed-deliveries-table"
      );
      displayDeliveriesByStatus(
        filteredDeliveries,
        "Cancelled",
        "cancelled-deliveries-table"
      );

      // Mettre à jour la pagination
      updatePagination(filteredDeliveries.length);
    } else {
      showErrorMessage("Erreur lors de la recherche des livraisons");
    }
  };

  xhr.onerror = () => {
    showErrorMessage("Erreur de connexion au serveur");
  };

  xhr.send();
}

function updateEntriesPerPage(entriesPerPage) {
  // Store preference in localStorage
  localStorage.setItem("deliveriesPerPage", entriesPerPage);

  // Reload deliveries with new pagination
  loadDeliveries();
}

function updatePagination(totalItems) {
  const entriesPerPage =
    Number.parseInt(localStorage.getItem("deliveriesPerPage")) || 10;
  const totalPages = Math.ceil(totalItems / entriesPerPage);

  let currentPage =
    Number.parseInt(localStorage.getItem("deliveriesCurrentPage")) || 1;
  if (currentPage > totalPages) {
    currentPage = 1;
    localStorage.setItem("deliveriesCurrentPage", currentPage);
  }

  const paginationContainer = document.querySelector(".pagination");
  const paginationInfo = document.querySelector(".pagination-info");

  if (paginationContainer) {
    paginationContainer.innerHTML = "";

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" href="#">Précédent</a>`;
    paginationContainer.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageLi = document.createElement("li");
      pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
      pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      paginationContainer.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Suivant</a>`;
    paginationContainer.appendChild(nextLi);

    // Add event listeners to pagination links
    const pageLinks = paginationContainer.querySelectorAll(".page-link");
    pageLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();

        const page = this.dataset.page;
        if (page) {
          // Page number clicked
          localStorage.setItem("deliveriesCurrentPage", page);
          loadDeliveries();
        } else if (this.textContent === "Précédent" && currentPage > 1) {
          // Previous button clicked
          localStorage.setItem("deliveriesCurrentPage", currentPage - 1);
          loadDeliveries();
        } else if (this.textContent === "Suivant" && currentPage < totalPages) {
          // Next button clicked
          localStorage.setItem("deliveriesCurrentPage", currentPage + 1);
          loadDeliveries();
        }
      });
    });
  }

  if (paginationInfo) {
    const start = (currentPage - 1) * entriesPerPage + 1;
    const end = Math.min(currentPage * entriesPerPage, totalItems);
    paginationInfo.textContent = `Affichage de ${start} à ${end} sur ${totalItems} livraisons`;
  }
}

// Fonction pour trier les livraisons
function sortDeliveries(sortBy) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/delivery/all`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader(
    "Authorization",
    `Bearer ${localStorage.getItem("token")}`
  );

  xhr.onload = () => {
    if (xhr.status === 200) {
      const deliveries = JSON.parse(xhr.responseText);

      // Trier les livraisons selon l'option choisie
      if (sortBy === "newest") {
        deliveries.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      } else if (sortBy === "oldest") {
        deliveries.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }

      // Mettre à jour l'affichage
      updateDeliveryCounts(deliveries);
      displayDeliveries(deliveries, "all-deliveries-table");
      displayDeliveriesByStatus(
        deliveries,
        "InProgress",
        "in-progress-deliveries-table"
      );
      displayDeliveriesByStatus(
        deliveries,
        "Delivered",
        "delivered-deliveries-table"
      );
      displayDeliveriesByStatus(
        deliveries,
        "Postponed",
        "postponed-deliveries-table"
      );
      displayDeliveriesByStatus(
        deliveries,
        "Cancelled",
        "cancelled-deliveries-table"
      );
      updatePagination(deliveries.length);
    } else {
      showErrorMessage("Erreur lors du chargement des livraisons");
    }
  };

  xhr.onerror = () => {
    showErrorMessage("Erreur de connexion au serveur");
  };

  xhr.send();
}

function showErrorMessage(message) {
  Swal.fire({
    icon: "error",
    title: "Erreur",
    text: message,
    confirmButtonText: "OK",
  });
}

// Function to handle the "Make to Ship" button click
function makeToShip(orderId) {
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
            // Reload deliveries
            loadDeliveries();
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

// =============================================
// DELIVERY DETAILS PAGE FUNCTIONS
// =============================================

function initDeliveryDetailsPage(deliveryId) {
  if (!deliveryId) {
    showError("No delivery ID provided in the URL");
    return;
  }

  // Load delivery details
  fetchDeliveryDetails(deliveryId);
}

function fetchDeliveryDetails(deliveryId) {
  // First check if we have the delivery in localStorage (from the delivery.js file)
  const storedDelivery = localStorage.getItem("currentDelivery");

  if (storedDelivery) {
    try {
      const delivery = JSON.parse(storedDelivery);
      displayDeliveryDetails(delivery);
      // Clear localStorage after using it
      localStorage.removeItem("currentDelivery");
      return;
    } catch (error) {
      console.error("Error parsing stored delivery:", error);
      // Continue with API call if parsing fails
    }
  }

  // If not in localStorage, fetch from API
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/delivery/${deliveryId}`, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const delivery = JSON.parse(xhr.responseText);
        displayDeliveryDetails(delivery);
      } catch (error) {
        console.error("Error parsing delivery details:", error);
        showError("Failed to parse delivery details");
      }
    } else {
      console.error("Error fetching delivery details:", xhr.status);
      showError("Failed to load delivery details. Status: " + xhr.status);
    }
  };

  xhr.onerror = () => {
    console.error("Network error when fetching delivery details");
    showError("Network error. Please check your connection and try again.");
  };

  xhr.send();
}

function displayDeliveryDetails(delivery) {
  console.log("Displaying delivery details:", delivery);

  // Hide loading container and show details container
  document.getElementById("loading-container").style.display = "none";
  const detailsContainer = document.getElementById(
    "delivery-details-container"
  );
  detailsContainer.style.display = "block";

  // Format delivery date
  let deliveryDate = new Date();
  let formattedDate = "N/A";
  try {
    deliveryDate = new Date(delivery.deliveryDate);
    if (!isNaN(deliveryDate.getTime())) {
      formattedDate = deliveryDate.toLocaleDateString("en-US", {
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

  // Calculate estimated delivery date (2 days after current delivery date)
  const estimatedDate = new Date(deliveryDate);
  estimatedDate.setDate(estimatedDate.getDate());
  const formattedEstimatedDate = estimatedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Generate a delivery number if not available
  const deliveryNumber = `#D-${Math.floor(Math.random() * 10000000)}`;

  // Determine status text and class
  let statusText = "In Progress";
  let statusClass = "border-warning text-warning";
  let progressBarClass = "bg-warning";
  let progressBarWidth = "50%";
  let showSpinner = true;

  switch (delivery.statut) {
    case "Delivered":
      statusText = "Delivered";
      statusClass = "border-success text-success";
      progressBarClass = "bg-success";
      progressBarWidth = "100%";
      showSpinner = false;
      break;
    case "Cancelled":
      statusText = "Cancelled";
      statusClass = "border-danger text-danger";
      progressBarClass = "bg-danger";
      progressBarWidth = "100%";
      showSpinner = false;
      break;
    case "Postponed":
      statusText = "Postponed";
      statusClass = "border-purple text-purple";
      progressBarClass = "bg-purple";
      progressBarWidth = "75%";
      showSpinner = true;
      break;
    case "InProgress":
    case "Pending":
      statusText = "In Progress";
      statusClass = "border-warning text-warning";
      progressBarClass = "bg-warning";
      progressBarWidth = "50%";
      showSpinner = true;
      break;
  }

  // Get order items from the associated order
  let orderItems = [];
  let subtotal = 0;

  if (
    delivery.idCommande &&
    delivery.idCommande.cartData &&
    delivery.idCommande.cartData.items
  ) {
    orderItems = delivery.idCommande.cartData.items;

    // Calculate subtotal
    orderItems.forEach((item) => {
      const price = Number.parseFloat(item.productId.productPrice) || 0;
      const quantity = Number.parseInt(item.quantity) || 0;
      subtotal += price * quantity;
    });
  } else {
    // Fallback if no items are found
    console.warn("No items found in delivery order");
  }
  // Get customer details
  const firstName = delivery.clientInfo?.prenom || "";
  const lastName = delivery.clientInfo?.nom || "";
  const customerName =
    firstName && lastName
      ? `${firstName} ${lastName}`.trim()
      : "Unknown Customer";
  let customerEmail = delivery.idClient?.email || "N/A";
  let customerPhone = delivery.idClient?.phoneNumber || "N/A";

  // Get shipping details
  let shippingDetails = {};

  // First try to get shipping details from deliveryAdresse
  if (delivery.deliveryAdresse) {
    const addressParts = delivery.deliveryAdresse
      .split(",")
      .map((part) => part.trim());
    if (addressParts.length >= 3) {
      shippingDetails = {
        address: addressParts[0] || "",
        city: addressParts[1] || "",
        governorate: addressParts[2] || "",
        postCode: addressParts[3] || "",
      };
    } else {
      shippingDetails = {
        address: delivery.deliveryAdresse,
      };
    }
  }

  // Then check if client has shipping info in client object (higher priority)
  if (delivery.idClient && typeof delivery.idClient === "object") {
    // Check for shippingInfo in the client model
    if (delivery.idClient.shippingInfo) {
      console.log(
        "Found shipping info in client:",
        delivery.idClient.shippingInfo
      );

      const clientShippingInfo = delivery.idClient.shippingInfo;
      shippingDetails = {
        address: clientShippingInfo.address,
        city: clientShippingInfo.city,
        governorate: clientShippingInfo.governorate,
        postCode: clientShippingInfo.postCode,
        phone: clientShippingInfo.phone || customerPhone,
      };
    }
    // Check for shipping addresses in the client model (as fallback)
    else if (
      delivery.idClient.shippingAddresses &&
      delivery.idClient.shippingAddresses.length > 0
    ) {
      console.log(
        "Found shipping addresses in client:",
        delivery.idClient.shippingAddresses
      );

      // Get default shipping address or first one
      const clientAddresses = delivery.idClient.shippingAddresses;
      const defaultAddress =
        clientAddresses.find((addr) => addr.isDefault) || clientAddresses[0];

      shippingDetails = {
        address: defaultAddress.address,
        city: defaultAddress.city,
        governorate: defaultAddress.governorate,
        postCode: defaultAddress.postCode,
        phone: defaultAddress.phone || customerPhone,
      };
    }
  }

  console.log("Final shipping details:", shippingDetails);

  // Set shipping address components
  const shippingAddress = shippingDetails.address || "No address provided";
  const shippingCity = shippingDetails.city || "No city provided";
  const shippingGovernorate =
    shippingDetails.governorate || "No governorate provided";
  const shippingPostCode =
    shippingDetails.postCode || "No postal code provided";
  const shippingPhone =
    shippingDetails.phone || customerPhone || "No phone number provided";

  // Determine which action buttons to show based on status
  let actionButtons = "";

  if (delivery.statut === "InProgress" || delivery.statut === "Pending") {
    actionButtons = `
      <div>
        <a href="#!" class="btn btn-success btn-responsive" id="btn-mark-delivered" data-id="${delivery._id}">
          <i class="bi bi-check-circle"></i>
          <span>Make As Delivered</span>
        </a>
      </div>
      <div>
        <a href="#!" class="btn btn-danger btn-responsive" id="btn-mark-cancelled" data-id="${delivery._id}">
          <i class="bi bi-x-circle"></i>
          <span>Make as Cancelled</span>
        </a>
      </div>
      <div>
        <a href="#!" class="btn btn-warning btn-responsive" id="btn-mark-postponed" data-id="${delivery._id}">
          <i class="bi bi-clock"></i>
          <span>Make As Postponed</span>
        </a>
      </div>
    `;
  } else {
    // For other statuses, just show a back button
    actionButtons = `
      <div>
        <a href="delivery.html" class="btn btn-primary btn-responsive">
          <i class="bi bi-arrow-left"></i>
          <span>Back to Deliveries</span>
        </a>
      </div>
    `;
  }

  // Build the HTML for order items
  let orderItemsHtml = "";

  if (orderItems.length > 0) {
    orderItems.forEach((item) => {
      const product = item.productId;
      const price = Number.parseFloat(product.productPrice) || 0;
      const quantity = Number.parseInt(item.quantity) || 0;
      const itemTotal = price * quantity;

      orderItemsHtml += `
        <tr>
          <td>${product.productId || "N/A"}</td>
          <td>${product.productName || "Product Name"}</td>
          <td>${quantity}</td>
          <td>${price.toFixed(2)} DT</td>
          <td>${itemTotal.toFixed(2)} DT</td>
        </tr>
      `;
    });
  } else {
    // Fallback if no items
    orderItemsHtml = `
      <tr>
        <td colspan="5" class="text-center">No items found for this delivery</td>
      </tr>
    `;
  }

  // Add total row
  orderItemsHtml += `
    <tr class="fw-bold border-top fs-5 text">
      <td colspan="4" class="text-end">Total Amount</td>
      <td>${subtotal.toFixed(2)} DT</td>
    </tr>
  `;

  // Create the HTML content
  const html = `
    <div class="row">
      <div class="col-xl-9 col-lg-8">
        <div class="row">
          <div class="col-lg-12">
            <div class="card">
              <div class="card-header">
                <h4 class="card-title">Delivery Details</h4>
              </div>
              <div class="table-responsive">
                <table class="table align-middle mb-0 table-hover table-centered text-center">
                  <thead class="bg-light-subtle border-bottom">
                    <tr>
                      <th>Product ID</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItemsHtml}
                  </tbody>
                </table>
              </div>
            </div>
            <br>
            <div class="card">
              <div class="card-body">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div>
                    <h4 class="fw-medium text-dark d-flex align-items-center gap-2 p-2">
                      ${deliveryNumber}
                      <span class="border ${statusClass} fs-7 mx-2 px-2 py-1 rounded">
                        ${statusText}
                      </span>
                    </h4>
                    <p class="mb-0">
                      Delivery / Delivery Details / ${deliveryNumber} - ${formattedDate}
                    </p>
                  </div>
                  <div style="margin-right: 30px;">
                    <a href="delivery.html" class="btn btn-primary">Back to Deliveries</a>
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
                        class="progress-bar progress-bar-striped progress-bar-animated bg-success"
                        role="progressbar"
                        style="width: 100%"
                      ></div>
                    </div>
                    <p class="mb-0 mt-2">Order Confirming</p>
                  </div>
                
                  <!-- Processing -->
                  <div class="col">
                    <div class="progress mt-2" style="height: 10px">
                      <div
                        class="progress-bar progress-bar-striped progress-bar-animated bg-success"
                        role="progressbar"
                        style="width: 100%"
                      ></div>
                    </div>
                    <p class="mb-0 mt-2">Processing</p>
                  </div>
                
                  <!-- Shipping -->
                  <div class="col">
                    <div class="progress mt-2" style="height: 10px">
                      <div
                        class="progress-bar progress-bar-striped progress-bar-animated bg-success"
                        role="progressbar"
                        style="width: 100%"
                      ></div>
                    </div>
                    <p class="mb-0 mt-2">Shipping</p>
                  </div>
                
                  <!-- Delivered -->
                  <div class="col">
                    <div class="progress mt-2" style="height: 10px">
                      <div
                        class="progress-bar progress-bar-striped progress-bar-animated ${progressBarClass}"
                        role="progressbar"
                        style="width: ${progressBarWidth}"
                      ></div>
                    </div>
                    <div class="d-flex align-items-center gap-2 mt-2">
                      <p class="mb-0">Delivered</p>
                      ${
                        showSpinner
                          ? `
                        <div class="spinner-border spinner-border-sm text-warning" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      `
                          : ""
                      }
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-footer d-flex align-items-center justify-content-around flex-wrap gap-2">
                <p class="border rounded mb-0 px-2 py-1 bg-body">
                  <i class="bi bi-box-arrow-in-right fs-4 align-middle"></i>
                  Estimated Delivery date :
                  <span class="text-dark fw-medium">${formattedEstimatedDate}</span>
                </p>
                ${actionButtons}
              </div>                      
            </div>
          </div>
        </div>
      </div>      <div class="col-xl-3 col-lg-7">   
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">Customer Details</h4>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center gap-2">
              <img
                src="${delivery.idClient?.profilePicture ? `/uploads/${delivery.idClient.profilePicture}` : "../../assets/images/team_members/devoloper2.jpg"}"
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
            <p class="mb-1">${shippingPhone}</p>

            <div class="d-flex justify-content-between mt-3">
              <h5 class="card-title">Shipping Address</h5>
            </div>

            <div>                
              <p class="m-2"><strong>Address:</strong> ${shippingAddress}</p>
              <p class="m-2"><strong>City:</strong> ${shippingCity}</p>
              <p class="m-2"><strong>Governorate:</strong> ${shippingGovernorate}</p>
              <p class="m-2"><strong>Postal Code:</strong> ${shippingPostCode}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insert the HTML into the container
  detailsContainer.innerHTML = html;

  // Add event listeners to action buttons
  setupActionButtons(delivery._id);
}

function setupActionButtons(deliveryId) {
  // Mark as delivered button
  const deliveredBtn = document.getElementById("btn-mark-delivered");
  if (deliveredBtn) {
    deliveredBtn.addEventListener("click", () => {
      confirmDeliveryAction(deliveryId, "Marquer comme livrée", "Delivered");
    });
  }

  // Mark as cancelled button
  const cancelledBtn = document.getElementById("btn-mark-cancelled");
  if (cancelledBtn) {
    cancelledBtn.addEventListener("click", () => {
      confirmDeliveryAction(deliveryId, "Annuler la livraison", "Cancelled");
    });
  }

  // Mark as postponed button
  const postponedBtn = document.getElementById("btn-mark-postponed");
  if (postponedBtn) {
    postponedBtn.addEventListener("click", () => {
      showPostponeDialog(deliveryId);
    });
  }
}

function showError(message) {
  // Hide loading container
  document.getElementById("loading-container").style.display = "none";

  // Show error in the details container
  const detailsContainer = document.getElementById(
    "delivery-details-container"
  );
  detailsContainer.style.display = "block";
  detailsContainer.innerHTML = `
    <div class="alert alert-danger">
      <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
      <p>${message}</p>
      <a href="delivery.html" class="btn btn-primary mt-2">Back to Deliveries</a>
    </div>
  `;

  console.error(message);
}

// Placeholder for loadNotifications function.  This should be defined elsewhere.
function loadNotifications() {
  console.log("loadNotifications() called - placeholder function");
}

// Export functions that need to be accessible from other files
window.makeToShip = makeToShip;
window.updateDeliveryStatus = updateDeliveryStatus;
