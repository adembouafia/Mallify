// Get token from localStorage
const token = localStorage.getItem("token");

// Initialize variables
let currentProduct = null;
let editor2 = null;

// Function to get URL parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Function to load product details
function loadProductDetails() {
  const productId = getUrlParameter("id");

  if (!productId) {
    showAlert("danger", "Product ID is missing from URL");
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true);

  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        if (
          response.status === "success" &&
          response.data &&
          response.data.product
        ) {
          currentProduct = response.data.product;
          displayProductDetails(currentProduct);
          setupImageSlider(currentProduct);
        } else {
          showAlert("danger", "Failed to load product data");
        }
      } catch (e) {
        console.error("Error parsing product data:", e);
        showAlert("danger", "Error processing server response");
      }
    } else {
      showAlert("danger", "Failed to load product data");
    }
  };

  xhr.onerror = () => {
    showAlert("danger", "Network error occurred");
  };

  xhr.send();
}

// Function to display product details
function displayProductDetails(product) {
  // Update product name
  const productNameElement = document.querySelector("h2.fw-bold");
  if (productNameElement) {
    productNameElement.textContent =
      product.productName || "Product Name Not Available";
  }

  // Update product ID
  const productIdElement = document.querySelector("p.text-muted");
  if (productIdElement) {
    productIdElement.textContent = `Product REF: #${product.productId || "N/A"}`;
  }

  // Update price
  const priceElement = document.querySelector("h4.text-danger.fw-bold");
  if (priceElement) {
    priceElement.textContent = `${Number.parseFloat(product.productPrice || 0).toFixed(2)} TND`;
  }

  // Update category
  const categoryElement = document.getElementById("product-category");
  if (categoryElement) {
    const categoryName = product.subCategory?.category?.categoryName || "N/A";
    const subcategoryName = product.subCategory?.name
      ? ` / ${product.subCategory.name}`
      : "";

    const strongElement = categoryElement.querySelector("strong");

    if (strongElement) {
      // Set the text after the <strong>Category:</strong>
      strongElement.nextSibling.nodeValue = ` ${categoryName}${subcategoryName}`;
    }
  }

  // Update availability
  const availabilityElement = document.querySelector(
    "p.mb-2:nth-of-type(2) strong"
  );
  if (availabilityElement && availabilityElement.parentElement) {
    availabilityElement.parentElement.innerHTML = `<strong>Availability:</strong> ${product.availability || "N/A"}`;
  } // Update stock
  const stockParagraphs = document.querySelectorAll("p.mb-2");
  stockParagraphs.forEach((p) => {
    if (p.querySelector("strong")?.textContent.includes("Stock")) {
      const stockElement = p.querySelector("span.badge");
      if (stockElement) {
        stockElement.textContent = `${product.stock || 0} units`;

        // Set color based on stock limit if available
        const stockLimit = product.stockLimit || 0;
        if (product.stock <= 0) {
          stockElement.className = "badge bg-danger";
        } else if (stockLimit > 0 && product.stock <= stockLimit) {
          stockElement.className = "badge bg-warning";
        } else {
          stockElement.className = "badge bg-success";
        }

        // Remove any existing stock limit info
        const parent = stockElement.parentNode;
        const existingAlerts = parent.querySelectorAll("small.ms-2.text-muted");
        existingAlerts.forEach((alert) => {
          parent.removeChild(alert);
        });

        // Add stock limit info if set
        if (stockLimit > 0) {
          const limitInfo = document.createElement("small");
          limitInfo.className = "ms-2 text-muted";
          limitInfo.textContent = `(Alert at ${stockLimit})`;
          stockElement.parentNode.appendChild(limitInfo);
        }
      }
    }
  });

  // Update description
  const descriptionElement = document.getElementById("product-description");
  if (descriptionElement) {
    descriptionElement.textContent =
      product.description || "No description available";
  }

  // Update tab content
  const descTabContent = document.getElementById("desc");
  if (descTabContent) {
    // Use productDetails if available, otherwise use description
    descTabContent.innerHTML =
      product.productDetails ||
      product.description ||
      "No detailed description available";
  }

  // Set up edit button
  const editButton = document.querySelector(".editProductBtn");
  if (editButton) {
    editButton.setAttribute("data-id", product._id);
    editButton.addEventListener("click", () => editProduct(product._id));
  }
}

// Function to set up image slider
function setupImageSlider(product) {
  // Clear existing sliders
  const sliderFor = document.querySelector(".slider-for");
  const sliderNav = document.querySelector(".slider-nav");

  if (!sliderFor || !sliderNav) return;

  sliderFor.innerHTML = "";
  sliderNav.innerHTML = "";

  // Add main image
  if (product.mainImage) {
    const mainImageUrl = `/uploads/${product.mainImage}`;

    const mainSlide = document.createElement("div");
    mainSlide.innerHTML = `<img src="${mainImageUrl}" class="img-fluid main-img" alt="${product.productName}">`;
    sliderFor.appendChild(mainSlide);

    const mainThumb = document.createElement("div");
    mainThumb.innerHTML = `<img src="${mainImageUrl}" class="img-thumbnail thumb-img" alt="${product.productName}">`;
    sliderNav.appendChild(mainThumb);
  }

  // Add other images
  if (product.otherImages && product.otherImages.length > 0) {
    product.otherImages.forEach((image) => {
      const imageUrl = `/uploads/${image}`;

      const slide = document.createElement("div");
      slide.innerHTML = `<img src="${imageUrl}" class="img-fluid main-img" alt="${product.productName}">`;
      sliderFor.appendChild(slide);

      const thumb = document.createElement("div");
      thumb.innerHTML = `<img src="${imageUrl}" class="img-thumbnail thumb-img" alt="${product.productName}">`;
      sliderNav.appendChild(thumb);
    });
  }

  // If no images were added, add a placeholder
  if (sliderFor.children.length === 0) {
    const placeholderSlide = document.createElement("div");
    placeholderSlide.innerHTML = `<img src="/images/placeholder-product.png" class="img-fluid main-img" alt="Placeholder">`;
    sliderFor.appendChild(placeholderSlide);

    const placeholderThumb = document.createElement("div");
    placeholderThumb.innerHTML = `<img src="/images/placeholder-product.png" class="img-thumbnail thumb-img" alt="Placeholder">`;
    sliderNav.appendChild(placeholderThumb);
  }

  // Initialize slick slider
  try {
    // Destroy existing sliders if they exist
    if (
      typeof jQuery !== "undefined" &&
      jQuery(".slider-for").hasClass("slick-initialized")
    ) {
      jQuery(".slider-for").slick("unslick");
    }
    if (
      typeof jQuery !== "undefined" &&
      jQuery(".slider-nav").hasClass("slick-initialized")
    ) {
      jQuery(".slider-nav").slick("unslick");
    }

    // Initialize main slider
    if (typeof jQuery !== "undefined") {
      jQuery(".slider-for").slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        asNavFor: ".slider-nav",
      });

      // Initialize thumbnail slider
      jQuery(".slider-nav").slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: ".slider-for",
        dots: false,
        centerMode: true,
        focusOnSelect: true,
        responsive: [
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 3,
            },
          },
          {
            breakpoint: 480,
            settings: {
              slidesToShow: 2,
            },
          },
        ],
      });
    }
  } catch (e) {
    console.error("Error initializing slick slider:", e);
  }
}

// Function to edit product
function editProduct(productId) {
  if (!productId) {
    showAlert("danger", "Product ID is missing");
    return;
  }

  // If we already have the product data, use it
  if (currentProduct && currentProduct._id === productId) {
    populateEditForm(currentProduct);
    return;
  }

  // Otherwise fetch the product data
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true);

  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        if (
          response.status === "success" &&
          response.data &&
          response.data.product
        ) {
          populateEditForm(response.data.product);
        } else {
          showAlert("danger", "Failed to load product data for editing");
        }
      } catch (e) {
        console.error("Error parsing product data:", e);
        showAlert("danger", "Error processing server response");
      }
    } else {
      showAlert("danger", "Failed to load product data for editing");
    }
  };

  xhr.onerror = () => {
    showAlert("danger", "Network error occurred");
  };

  xhr.send();
}

// Function to populate edit form
function populateEditForm(product) {
  const form = document.getElementById("editProductForm");
  if (!form) {
    console.error("Edit form not found");
    return;
  }

  // Set product ID in the form
  form.dataset.productId = product._id;

  // Store category and subcategory IDs as data attributes for later use
  form.dataset.categoryId = product.category?._id || product.category || "";
  form.dataset.subcategoryId = product.subCategory?._id || "";

  // Fill form fields with product data
  form.editProductName.value = product.productName || "";
  form.editProductId.value = product.productId || "";
  form.editProductPrice.value = product.productPrice || "";
  form.editStock.value = product.stock || "";
  form.editStockLimit.value = product.stockLimit || "";
  form.editDescription.value = product.description || "";
  form.editAvailability.value =
    product.availability === "In stock" ? "in_stock" : "out_of_stock";

  // Show current main image if available
  const currentMainImageContainer = document.getElementById(
    "currentMainImageContainer"
  );
  if (currentMainImageContainer) {
    if (product.mainImage) {
      currentMainImageContainer.innerHTML = `
                <div class="mb-2">
                    <p class="mb-1">Current Main Image:</p>
                    <img src="/uploads/${product.mainImage}" alt="Current Main Image" class="img-thumbnail" style="max-height: 100px;">
                    <input type="hidden" name="currentMainImage" value="${product.mainImage}">
                </div>
            `;
      currentMainImageContainer.style.display = "block";
    } else {
      currentMainImageContainer.style.display = "none";
    }
  }

  // Show other images if available
  const currentOtherImagesContainer = document.getElementById(
    "currentOtherImagesContainer"
  );
  if (
    currentOtherImagesContainer &&
    product.otherImages &&
    product.otherImages.length > 0
  ) {
    let imagesHTML =
      '<p class="mb-1">Current Other Images:</p><div class="d-flex flex-wrap gap-2">';
    product.otherImages.forEach((image) => {
      imagesHTML += `
                <div class="position-relative">
                    <img src="/uploads/${image}" alt="Other Image" class="img-thumbnail" style="max-height: 80px;">
                </div>`;
    });
    imagesHTML += "</div>";
    currentOtherImagesContainer.innerHTML = imagesHTML;
    currentOtherImagesContainer.style.display = "block";
  } else if (currentOtherImagesContainer) {
    currentOtherImagesContainer.style.display = "none";
  }

  // Show the modal
  const editProductModalEl = document.getElementById("editProductModal");
  let editProductModal = bootstrap.Modal.getInstance(editProductModalEl);
  if (!editProductModal) {
    editProductModal = new bootstrap.Modal(editProductModalEl);
  }

  editProductModal.show();

  // Initialize rich text editor after modal is shown
  setTimeout(() => {
    // Initialize the editor
    if (
      typeof editor2 === "object" &&
      editor2 !== null &&
      typeof editor2.destroy === "function"
    ) {
      editor2.destroy();
    }
    if (window.RichTextEditor) {
      editor2 = new RichTextEditor("#editRichTextEditor");

      // Set the content if available
      if (product.productDetails) {
        editor2.setHTMLCode(product.productDetails);
      } else {
        editor2.setHTMLCode(product.description || "");
      }
    }
  }, 300);
}

// Function to handle product update
function handleProductUpdate(form) {
  const productId = form.dataset.productId;

  if (!productId) {
    showAlert("danger", "Product ID is missing");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
  submitBtn.disabled = true;

  // Use FormData instead of JSON to handle file uploads
  const formData = new FormData();

  // Add basic product data to FormData
  formData.append("productName", form.editProductName.value);
  formData.append("productId", form.editProductId.value);
  formData.append(
    "productPrice",
    Number.parseFloat(form.editProductPrice.value)
  );
  formData.append("stock", Number.parseInt(form.editStock.value));
  formData.append(
    "stockLimit",
    Number.parseInt(form.editStockLimit.value || 0)
  );
  formData.append(
    "availability",
    form.editAvailability.value === "in_stock" ? "In stock" : "Out of stock"
  );
  formData.append("description", form.editDescription.value);

  // Add rich text editor content if available
  if (editor2 && typeof editor2.getHTMLCode === "function") {
    formData.append("productDetails", editor2.getHTMLCode());
  }

  // Add category and subcategory IDs if available
  if (form.dataset.categoryId) {
    formData.append("category", form.dataset.categoryId);
  }

  if (form.dataset.subcategoryId) {
    formData.append("subCategory", form.dataset.subcategoryId);
  }

  // Add image files if they exist
  if (
    form.editMainImage &&
    form.editMainImage.files &&
    form.editMainImage.files[0]
  ) {
    formData.append("mainImage", form.editMainImage.files[0]);
  }

  if (
    form.editOtherImages &&
    form.editOtherImages.files &&
    form.editOtherImages.files.length > 0
  ) {
    for (let i = 0; i < form.editOtherImages.files.length; i++) {
      formData.append("otherImages", form.editOtherImages.files[i]);
    }
  }

  // Send the update request
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/product/update/${productId}`, true);

  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        form.reset();

        const modalEl = document.getElementById("editProductModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }

        showAlert("success", "Product updated successfully!");

        // Reload product details to reflect changes
        loadProductDetails();
      } catch (e) {
        console.error("Error parsing response:", e);
        showAlert("danger", "Error processing server response");
      }
    } else {
      try {
        const response = JSON.parse(xhr.responseText);
        showAlert("danger", response.message || "Failed to update product");
      } catch (e) {
        showAlert("danger", "Failed to update product");
      }
    }
  };

  xhr.onerror = () => {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    showAlert("danger", "Network error occurred");
  };

  xhr.send(formData);
}

// Function to show alerts
function showAlert(type, message) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = "alert";
  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  const container = document.querySelector(".container");
  container.insertBefore(alertDiv, container.firstChild);

  setTimeout(() => {
    if (alertDiv.parentNode) {
      const bsAlert =
        bootstrap.Alert.getInstance(alertDiv) || new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }
  }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded - initializing product details page");

  // Load product details
  loadProductDetails();

  // Add event listener for the edit product form
  const editProductForm = document.getElementById("editProductForm");
  if (editProductForm) {
    editProductForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleProductUpdate(e.target);
    });
  }
});
