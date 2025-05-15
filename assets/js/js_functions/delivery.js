document.addEventListener("DOMContentLoaded", () => {
  // Initialize the delivery dashboard
  initDeliveryDashboard();

  // Add notification loading
  const shopId = localStorage.getItem("shopId");
  if (shopId) {
    // Load notifications immediately
    loadNotifications();

    // Refresh notifications every 5 minutes
    setInterval(loadNotifications, 5 * 60 * 1000);
  }
});

function initDeliveryDashboard() {
  // Set up event listeners for the delivery page
  setupDeliveryEventListeners();

  // Load deliveries data
  loadDeliveries();
}

function setupDeliveryEventListeners() {
  // Action buttons for deliveries (mark as delivered, cancelled, postponed)
  document.addEventListener("click", function (e) {
    // Deliveries table action buttons
    if (e.target.classList.contains("btn-delivered")) {
      const deliveryId = e.target.dataset.id;
      confirmDeliveryAction(deliveryId, "Marquer comme livrée", "Delivered");
    }

    if (e.target.classList.contains("btn-cancel")) {
      const deliveryId = e.target.dataset.id;
      confirmDeliveryAction(deliveryId, "Annuler la livraison", "Cancelled");
    }

    if (e.target.classList.contains("btn-postpone")) {
      const deliveryId = e.target.dataset.id;
      showPostponeDialog(deliveryId);
    }

    // View details button
    if (e.target.classList.contains("btn-view-details")) {
      const deliveryId = e.target.dataset.id;
      loadDeliveryDetails(deliveryId);
    }

    // Make to Ship button for orders
    if (e.target.classList.contains("btn-make-to-ship")) {
      const orderId = e.target.dataset.id;
      makeToShip(orderId);
    }
  });

  // Search functionality
  const searchInput = document.querySelector(".search-input");
  const searchButton = document.querySelector(".search-button");

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", function () {
      searchDeliveries(searchInput.value);
    });

    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") {
        searchDeliveries(searchInput.value);
      }
    });
  }

  // Entries per page selector
  const entriesSelect = document.querySelector(".items-per-page");
  if (entriesSelect) {
    entriesSelect.addEventListener("change", function () {
      updateEntriesPerPage(parseInt(this.value));
    });
  }
}

// Modifier la fonction loadDeliveries pour ajouter des logs et corriger l'URL
function loadDeliveries() {
  console.log("Chargement des livraisons...")

  const xhr = new XMLHttpRequest()
  // Assurez-vous que l'URL est correcte avec le préfixe http://localhost:3000 si nécessaire
  xhr.open("GET", "http://localhost:3000/delivery/all", true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("token")}`)

  xhr.onload = () => {
    if (xhr.status === 200) {
      console.log("Réponse reçue:", xhr.responseText)
      try {
        const deliveries = JSON.parse(xhr.responseText)
        console.log("Livraisons chargées:", deliveries)
        displayDeliveries(deliveries)
      } catch (error) {
        console.error("Erreur lors du parsing des livraisons:", error)
        showErrorMessage("Erreur lors du traitement des données de livraison")
      }
    } else {
      console.error("Erreur lors du chargement des livraisons. Statut:", xhr.status, "Réponse:", xhr.responseText)
      showErrorMessage("Erreur lors du chargement des livraisons")
    }
  }

  xhr.onerror = (e) => {
    console.error("Erreur de connexion au serveur:", e)
    showErrorMessage("Erreur de connexion au serveur")
  }

  xhr.send()
}

// Modifier la fonction displayDeliveries pour s'adapter à la structure HTML actuelle
function displayDeliveries(deliveries) {
  console.log("Affichage des livraisons:", deliveries)

  // Sélectionner le tableau principal dans delivery.html
  const deliveryTable = document.querySelector(".table tbody")

  if (!deliveryTable) {
    console.error("Tableau de livraisons non trouvé dans le DOM")
    return
  }

  // Vider le tableau existant
  deliveryTable.innerHTML = ""

  if (!deliveries || deliveries.length === 0) {
    deliveryTable.innerHTML = '<tr><td colspan="9" class="text-center">Aucune livraison trouvée</td></tr>'
    return
  }

  // Afficher chaque livraison dans le tableau
  deliveries.forEach((delivery) => {
    // Formater la date
    const formattedDate = new Date(delivery.deliveryDate).toLocaleDateString()

    // Créer une ligne pour chaque livraison
    const row = document.createElement("tr")

    // Déterminer les actions disponibles en fonction du statut
    let actionButtons = `
      <a href="detailsDelivery.html?id=${delivery._id}" class="btn btn-sm btn-outline-secondary me-1" title="View Details">
        <i class="bi bi-eye"></i>
      </a>
    `

    if (delivery.statut === "InProgress" || delivery.statut === "Pending") {
      actionButtons += `
        <a href="#" class="btn btn-sm btn-outline-success me-1 btn-delivered" data-id="${delivery._id}" title="Make as Delivered">
          <i class="bi bi-check-circle"></i>
        </a>
        <a href="#" class="btn btn-sm btn-outline-danger btn-cancel" data-id="${delivery._id}" title="Make as Cancelled">
          <i class="bi bi-trash"></i>
        </a>
        <a href="#" class="btn btn-sm btn-outline-warning btn-postpone" data-id="${delivery._id}" title="Postpone Delivery">
          <i class="bi bi-clock"></i>
        </a>
      `
    }

    // Récupérer les informations de la commande associée
    const orderId = delivery.idCommande
      ? typeof delivery.idCommande === "object"
        ? delivery.idCommande._id
        : delivery.idCommande
      : "N/A"

    // Générer un numéro de livraison aléatoire si non disponible
    const deliveryNumber = `#D-${Math.floor(Math.random() * 10000000)}`

    // Déterminer le nombre d'articles (si disponible)
    let itemCount = 0
    if (delivery.idCommande && delivery.idCommande.cartData && delivery.idCommande.cartData.items) {
      itemCount = delivery.idCommande.cartData.items.length
    }

    // Construire le HTML de la ligne
    row.innerHTML = `
      <td>
        <img src="../../assets/images/dashboard/devoloper1.jpg" alt="avatar" class="rounded-circle object-fit-cover" width="37" height="37" />
      </td>
      <td>Agent de livraison</td>
      <td>${deliveryNumber}</td>
      <td>${orderId}</td>
      <td>${delivery.clientInfo.prenom} ${delivery.clientInfo.nom}</td>
      <td>${itemCount}</td>
      <td>${delivery.deliveryAdresse.split(",")[0]}</td>
      <td>${delivery.idCommande && delivery.idCommande.orderTotal ? delivery.idCommande.orderTotal.toFixed(2) + " DT" : "N/A"}</td>
      <td>${actionButtons}</td>
    `

    deliveryTable.appendChild(row)
  })

  // Mettre à jour la pagination
  updatePagination(deliveries.length)

  // Ajouter les écouteurs d'événements pour les boutons d'action
  document.querySelectorAll(".btn-delivered").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault()
      const deliveryId = this.getAttribute("data-id")
      confirmDeliveryAction(deliveryId, "Marquer comme livrée", "Delivered")
    })
  })

  document.querySelectorAll(".btn-cancel").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault()
      const deliveryId = this.getAttribute("data-id")
      confirmDeliveryAction(deliveryId, "Annuler la livraison", "Cancelled")
    })
  })

  document.querySelectorAll(".btn-postpone").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault()
      const deliveryId = this.getAttribute("data-id")
      showPostponeDialog(deliveryId)
    })
  })
}

function loadDeliveryDetails(deliveryId) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/delivery/${deliveryId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader(
    "Authorization",
    `Bearer ${localStorage.getItem("token")}`
  );

  xhr.onload = function () {
    if (xhr.status === 200) {
      const delivery = JSON.parse(xhr.responseText);

      // Redirect to the appropriate details page based on delivery status
      let detailsPage;

      switch (delivery.statut) {
        case "Pending":
        case "InProgress":
          detailsPage = "detailsDelivery.html";
          break;
        case "Delivered":
          detailsPage = "detailsDelivery.html"; // Or create a specific page for delivered
          break;
        case "Cancelled":
          detailsPage = "detailsDelCanc.html";
          break;
        case "Postponed":
          detailsPage = "detailsDelPost.html";
          break;
        default:
          detailsPage = "detailsDelivery.html";
      }

      // Store delivery in localStorage for the details page
      localStorage.setItem("currentDelivery", JSON.stringify(delivery));

      // Navigate to details page
      window.location.href = detailsPage + "?id=" + deliveryId;
    } else {
      showErrorMessage("Erreur lors du chargement des détails de la livraison");
    }
  };

  xhr.onerror = function () {
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
      <label for="postpone-time" class="swal2-label">Nouvelle heure de livraison</label>
      <input id="postpone-time" class="swal2-input" type="time" required>
    `,
    showCancelButton: true,
    confirmButtonText: "Reporter",
    cancelButtonText: "Annuler",
    preConfirm: () => {
      const date = document.getElementById("postpone-date").value;
      const time = document.getElementById("postpone-time").value;

      if (!date || !time) {
        Swal.showValidationMessage("Veuillez remplir tous les champs");
        return false;
      }

      return `${date}T${time}`;
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

  xhr.onload = function () {
    if (xhr.status === 200) {
      Swal.fire({
        title: "Succès!",
        text: `Statut de livraison mis à jour avec succès`,
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        // Check if we're on the main page or details page
        const currentPath = window.location.pathname;
        if (
          currentPath.includes("delivery.html") ||
          currentPath.includes("deliveryPostponed.html") ||
          currentPath.includes("deliveryCancelled.html")
        ) {
          // Reload deliveries on the main page
          loadDeliveries();
        } else {
          // Go back to the main page from details
          window.location.href = "delivery.html";
        }
      });
    } else {
      showErrorMessage("Erreur lors de la mise à jour du statut de livraison");
    }
  };

  xhr.onerror = function () {
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

  xhr.onload = function () {
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

      displayDeliveries(filteredDeliveries);
    } else {
      showErrorMessage("Erreur lors de la recherche des livraisons");
    }
  };

  xhr.onerror = function () {
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
    parseInt(localStorage.getItem("deliveriesPerPage")) || 10;
  const totalPages = Math.ceil(totalItems / entriesPerPage);

  let currentPage =
    parseInt(localStorage.getItem("deliveriesCurrentPage")) || 1;
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

      xhr.onload = function () {
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

      xhr.onerror = function () {
        showErrorMessage("Erreur de connexion au serveur");
      };

      xhr.send();
    }
  });
}

// Export functions that need to be accessible from other files
window.makeToShip = makeToShip;
window.updateDeliveryStatus = updateDeliveryStatus;