function getImageUrl(filename) {
  // Check if we're on localhost or the file system (file://)
  const isLocalhost = window.location.hostname === "localhost";

  if (isLocalhost) {
    // If on localhost, use the server path
    return `http://localhost:3000/uploads/${filename}`;
  } else {
    // Otherwise, serve the image as a local file
    return `C:/Users/abkou/OneDrive/Desktop/PFE/code_Principal/Mallify/uploads/${filename}`;
  }
}

function getShops() {
  const rowContainer = document.querySelector(".shops-approved");
  rowContainer.innerHTML = `
    <div class="text-center w-100">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  const token = localStorage.getItem("token");
  if (!token) {
    rowContainer.innerHTML = `<div class="col-12 text-center">Authentication token not found. Please log in again.</div>`;
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/shop/get", true);
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onload = function () {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      const shops = response.shops || response;

      if (!Array.isArray(shops) || shops.length === 0) {
        rowContainer.innerHTML = `<div class="col-12 text-center">No shops found.</div>`;
        return;
      }

      rowContainer.innerHTML = ""; // clear loading
      shops.forEach((shop) => {
        // Vérifie que le shop est approuvé
        if (shop.status === "Pending") {
          const shopCard = document.createElement("div");
          shopCard.className = "col-12 col-sm-6 col-md-4 col-lg-3";

          const imgSrc = shop.shopLogo
            ? getImageUrl(shop.shopLogo) // Get correct image URL
            : "../../assets/images/products/default.png";

          shopCard.innerHTML = `
            <div class="card h-100 shadow-sm">
              <img
                src="${imgSrc}"
                class="card-img-top img-fluid p-3"
                style="height: 180px; object-fit: contain"
                alt="Image du shop"
              />
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${shop.shopName || "Nom du Shop"}</h5>
                <p class="card-text text-muted">
                  Spécialité : ${shop.shopdescription || "Non spécifiée"}
                </p>
              </div>
            </div>
          `;
          rowContainer.appendChild(shopCard);
        }
      });
    } else {
      console.error("Erreur:", xhr.status, xhr.responseText);
      rowContainer.innerHTML = `<div class="col-12 text-center text-danger">Erreur lors de la récupération des shops.</div>`;
    }
  };

  xhr.onerror = function () {
    console.error("Erreur réseau");
    rowContainer.innerHTML = `<div class="col-12 text-center text-danger">Erreur réseau. Veuillez réessayer.</div>`;
  };

  xhr.send();
}

document.addEventListener("DOMContentLoaded", function () {
  getShops();
});
