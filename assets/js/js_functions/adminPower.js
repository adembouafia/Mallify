// Configuration
const config = {
  magnification: 70,
  baseItemSize: 50,
  distance: 200,
  panelHeight: 68,
  dockHeight: 256,
  spring: {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  },
};

// Admin dock items with ban functionality
const dockItems = [
  {
    icon: "https://cdn-icons-png.flaticon.com/512/7358/7358499.png",
    label: "Ban Shop",
    className: "ban-shop-icon",
    action: "banShop",
  },
  {
    icon: "https://cdn-icons-png.flaticon.com/512/1828/1828843.png",
    label: "Ban Product",
    className: "ban-product-icon",
    action: "banProduct",
  },
];

// DOM elements
const dockPanel = document.querySelector(".dock-panel");
const dockOuter = document.querySelector(".dock-outer");

// Helper function to get URL parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Ban API functions
function banShop() {
  const productId = getUrlParameter("id");
  if (!productId) {
    Swal.fire({
      title: "Error!",
      text: "Product ID not found in URL",
      icon: "error",
    });
    return;
  }

  Swal.fire({
    title: "Loading...",
    text: "Fetching product details",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true);

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        const product = response.data?.product;

        if (response.status === "success" && product?.shop) {
          const shopId = typeof product.shop === "string" ? product.shop : product.shop._id;

          if (!shopId) {
            Swal.fire({
              title: "Error!",
              text: "Shop ID not found",
              icon: "error",
            });
            return;
          }

          banShopById(shopId);
        } else {
          Swal.fire({
            title: "Error!",
            text: "Shop information not found in product data",
            icon: "error",
          });
        }
      } catch (e) {
        Swal.fire({
          title: "Error!",
          text: "Error parsing product data",
          icon: "error",
        });
      }
    } else {
      Swal.fire({
        title: "Error!",
        text: `Failed to get product details. Status: ${xhr.status}`,
        icon: "error",
      });
    }
  };

  xhr.onerror = () => {
    Swal.fire({
      title: "Error!",
      text: "Network error occurred",
      icon: "error",
    });
  };

  xhr.send();
}


function banShopById(shopId) {
  Swal.fire({
    title: "Confirm Ban",
    text: `Are you sure you want to ban the shop (ID: ${shopId})?`,
    input: "text",
    inputLabel: "Ban Reason",
    inputPlaceholder: "Please provide a reason for banning this product",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ban",
    confirmButtonColor: "#d33",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `http://localhost:3000/shop/ban/${shopId}`, true);

      const token = localStorage.getItem("token");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", "application/json");
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          Swal.fire({
            title: "Success!",
            text: "Shop has been banned successfully",
            icon: "success",
          });
        } else {
          let errorMessage = "Failed to ban shop";
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.message) {
              errorMessage = response.message;
            }
          } catch (e) {}

          Swal.fire({
            title: "Error!",
            text: errorMessage,
            icon: "error",
          });
        }
      };

      xhr.onerror = () => {
        Swal.fire({
          title: "Error!",
          text: "Network error occurred",
          icon: "error",
        });
      };

      xhr.send();
    }
  });
}

function banProduct() {
  const productId = getUrlParameter("id");
  if (!productId) {
    Swal.fire({
      title: "Error!",
      text: "Product ID not found in URL",
      icon: "error",
    });
    return;
  }

  Swal.fire({
    title: "Confirm Ban",
    text: `Are you sure you want to ban this product (ID: ${productId})?`,
    input: "text",
    inputLabel: "Ban Reason",
    inputPlaceholder: "Please provide a reason for banning this product",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ban",
    confirmButtonColor: "#d33",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `http://localhost:3000/product/ban/${productId}`, true);

      const token = localStorage.getItem("token");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", "application/json");
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          Swal.fire({
            title: "Success!",
            text: "Product has been banned successfully",
            icon: "success",
          }).then(() => {
            window.location.reload();
          });
        } else {
          let errorMessage = "Failed to ban product";
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.message) {
              errorMessage = response.message;
            }
          } catch (e) {
            // Use default error message
          }

          Swal.fire({
            title: "Error!",
            text: errorMessage,
            icon: "error",
          });
        }
      };

      xhr.onerror = () => {
        Swal.fire({
          title: "Error!",
          text: "Network error occurred",
          icon: "error",
        });
      };

      const data = JSON.stringify({
        banReason: result.value || "Violation of marketplace policies",
      });

      xhr.send(data);
    }
  });
}

// Create dock items
function createDockItems() {
  dockItems.forEach((item, index) => {
    const dockItem = document.createElement("div");
    dockItem.className = `dock-item ${item.className || ""}`;
    dockItem.tabIndex = 0;
    dockItem.setAttribute("role", "button");
    dockItem.setAttribute("aria-haspopup", "true");

    const dockIcon = document.createElement("div");
    dockIcon.className = "dock-icon";

    const img = document.createElement("img");
    img.src = item.icon;
    img.alt = item.label;

    const dockLabel = document.createElement("div");
    dockLabel.className = "dock-label";
    dockLabel.textContent = item.label;

    dockIcon.appendChild(img);
    dockItem.appendChild(dockIcon);
    dockItem.appendChild(dockLabel);

    dockPanel.appendChild(dockItem);

    // Add click event
    dockItem.addEventListener("click", () => {
      console.log(`Clicked on ${item.label}`);
      if (item.action === "banShop") {
        banShop();
      } else if (item.action === "banProduct") {
        banProduct();
      }
    });
  });
}

// Calculate size based on distance from mouse
function calculateSize(mouseX, itemRect) {
  const itemCenterX = itemRect.left + itemRect.width / 2;
  const distance = Math.abs(mouseX - itemCenterX);

  // Calculate scale factor based on distance
  if (distance > config.distance) {
    return config.baseItemSize;
  }

  const distanceRatio = 1 - distance / config.distance;
  const sizeDiff = config.magnification - config.baseItemSize;
  const additionalSize = sizeDiff * distanceRatio;

  return config.baseItemSize + additionalSize;
}

// Handle mouse movement for magnification effect
function handleMouseMove(e) {
  const mouseX = e.clientX;
  const dockItems = document.querySelectorAll(".dock-item");

  dockItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const size = calculateSize(mouseX, rect);

    // Apply size with smooth transition
    item.style.width = `${size}px`;
    item.style.height = `${size}px`;
  });

  // Expand dock height when hovered
  dockOuter.style.height = `${config.dockHeight}px`;
}

// Reset dock when mouse leaves
function handleMouseLeave() {
  const dockItems = document.querySelectorAll(".dock-item");

  dockItems.forEach((item) => {
    item.style.width = `${config.baseItemSize}px`;
    item.style.height = `${config.baseItemSize}px`;
  });

  // Reset dock height
  dockOuter.style.height = `${config.panelHeight}px`;
}

// Check if the current page is product-details and user is a super admin
function shouldShowDock() {
  // Check if this is the product-details page
  const path = window.location.pathname;
  const isProductDetailsPage = path.includes("product-details");

  // Check if user is superAdmin
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const isSuperAdmin =
    userData.role === "superAdmin" || userData.role === "admin";

  return isProductDetailsPage && isSuperAdmin;
}

// Initialize the dock
function initDock() {
  // Only initialize if we should show the dock
  if (shouldShowDock()) {
    if (!dockPanel || !dockOuter) {
      console.error("Dock elements not found in the DOM");
      return;
    }

    createDockItems();

    // Make dock visible
    dockOuter.style.display = "block";
  } else {
    // Hide dock completely if user is not superAdmin or not on product details page
    if (dockOuter) {
      dockOuter.style.display = "none";
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initDock);
