let categories = [];
const subcategories = {};
var editor1 = new RichTextEditor("#richTextEditor");
const token = localStorage.getItem("token");

function loadSubcategories(categoryId, categoryName) {
  console.log("Loading subcategories for:", categoryId, categoryName);

  // If categoryId is invalid, don't make the request
  if (!categoryId || categoryId === "undefined" || categoryId === "null") {
    console.warn("Invalid category ID, skipping subcategory load:", categoryId);
    subcategories[categoryName] = [];
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `http://localhost:3000/subcategory/category/${categoryId}`;

    xhr.open("GET", url, true);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
      console.log(
        `Response for category ${categoryName} (${categoryId}):`,
        xhr.status,
        xhr.responseText
      );

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);

          if (response.subCategories && Array.isArray(response.subCategories)) {
            subcategories[categoryName] = response.subCategories;
            console.log(
              "Successfully loaded subcategories for",
              categoryName,
              ":",
              subcategories[categoryName]
            );

            // Check both possible dropdown IDs
            const currentCategory =
              document.getElementById("productCategory")?.value ||
              document.getElementById("editProductCategory")?.value;

            if (currentCategory === categoryName) {
              populateSubcategoryDropdown(categoryName);
            }
            resolve(response.subCategories);
          } else {
            console.log(
              "No subcategories found for",
              categoryName,
              "- setting empty array"
            );
            subcategories[categoryName] = [];
            resolve([]);
          }
        } catch (e) {
          console.error("Error parsing subcategories response:", e);
          subcategories[categoryName] = [];
          resolve([]);
        }
      } else if (xhr.status === 404) {
        // Handle 404 gracefully - just set an empty array for this category
        console.log(
          "Category not found (404) for",
          categoryName,
          "- setting empty array"
        );
        subcategories[categoryName] = [];
        resolve([]);
      } else {
        console.error(
          "Failed to load subcategories for",
          categoryName,
          xhr.status,
          xhr.statusText
        );
        subcategories[categoryName] = [];
        resolve([]);
      }
    };

    xhr.onerror = () => {
      console.error("Network error loading subcategories for", categoryName);
      subcategories[categoryName] = [];
      reject("Network error");
    };

    xhr.send();
  });
}

function loadProducts() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/product/get", true);

  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText);

      const tbody = document.getElementById("productTableBody");
      tbody.innerHTML = "";

      if (
        response.status === "success" &&
        response.data &&
        response.data.products
      ) {
        response.data.products.forEach((product) => {
          addProductToTable(product);
        });

        const productCountElement = document.querySelector(
          ".info-box:nth-child(1) .info-box-number"
        );
        if (productCountElement) {
          productCountElement.textContent = response.data.products.length;
        }
      } else {
        showAlert("warning", "No products found");
      }
    } else {
      showAlert("danger", "Failed to load products");
    }
  };

  xhr.onerror = () => {
    showAlert("danger", "Network error occurred");
  };

  xhr.send();
}

// Also update the loadCategories function to better handle category loading
function loadCategories() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/category", true);
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        console.log("Categories response:", response);

        if (response.categories && Array.isArray(response.categories)) {
          categories = response.categories.filter((category) => {
            // Filter out invalid categories
            if (!category || !category._id || !category.categoryName) {
              console.warn("Skipping invalid category:", category);
              return false;
            }
            return true;
          });

          console.log("Loaded valid categories:", categories);

          // Load subcategories for each valid category
          const promises = categories.map((category) => {
            const categoryName = category.categoryName;
            const categoryId = category._id;
            return loadSubcategories(categoryId, categoryName).catch((err) => {
              console.error(
                "Error loading subcategories for",
                categoryName,
                err
              );
              return [];
            });
          });

          // Wait for all subcategories to load
          Promise.all(promises).then(() => {
            console.log("All subcategories loaded");
          });

          const categoryCountElement = document.querySelector(
            ".info-box:nth-child(2) .info-box-number"
          );
          if (categoryCountElement) {
            categoryCountElement.textContent = categories.length;
          }

          populateCategoryDropdown();
          populateEditCategoryDropdown();
        } else {
          console.warn("No categories found or invalid response format");
          categories = [];
        }
      } catch (e) {
        console.error("Error parsing categories response:", e);
        categories = [];
      }
    } else {
      showAlert("danger", "Failed to load categories");
      categories = [];
    }
  };

  xhr.onerror = () => {
    showAlert("danger", "Network error occurred while loading categories");
    categories = [];
  };

  xhr.send();
}

function populateCategoryDropdown() {
  const categorySelect = document.getElementById("productCategory");
  if (!categorySelect) {
    console.error("Category select element with ID productCategory not found.");
    return;
  }

  const currentSelection = categorySelect.value;

  categorySelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a category";
  defaultOption.disabled = true;
  defaultOption.selected = !currentSelection;
  categorySelect.appendChild(defaultOption);

  categories.forEach((category) => {
    const option = document.createElement("option");
    const categoryName = category.categoryName;
    option.value = categoryName;
    option.textContent = categoryName;
    // Store the category ID as a data attribute for easy access
    option.dataset.id = category._id;
    if (categoryName === currentSelection) {
      option.selected = true;
    }
    categorySelect.appendChild(option);
  });
}

function populateEditCategoryDropdown() {
  const categorySelect = document.getElementById("editProductCategory");
  if (!categorySelect) return;

  categorySelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a category";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  categorySelect.appendChild(defaultOption);

  categories.forEach((category) => {
    const option = document.createElement("option");
    const categoryName = category.categoryName;
    option.value = categoryName;
    option.textContent = categoryName;
    // Store the category ID as a data attribute for easy access
    option.dataset.id = category._id;
    categorySelect.appendChild(option);
  });
}

// Fixed populateSubcategoryDropdown function to handle both add and edit forms
function populateSubcategoryDropdown(categoryName, formPrefix = "") {
  console.log(
    `Populating subcategory dropdown for category: ${categoryName}, prefix: ${formPrefix}`
  );

  // Try both possible element IDs
  let subcategorySelect = document.getElementById(
    `${formPrefix}productSubcategory`
  );

  // If not found, try the other common ID
  if (!subcategorySelect) {
    subcategorySelect = document.getElementById("productSubcategory");
  }

  // If still not found, try editProductSubcategory as a fallback
  if (!subcategorySelect) {
    subcategorySelect = document.getElementById("editProductSubcategory");
  }

  // Check if the element exists
  if (!subcategorySelect) {
    console.error(
      `Subcategory select element not found. Tried IDs: ${formPrefix}productSubcategory, productSubcategory, and editProductSubcategory`
    );
    return Promise.resolve();
  }

  console.log(
    `Found subcategory select element with ID: ${subcategorySelect.id}`
  );

  // Clear existing options
  subcategorySelect.innerHTML = "";

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a subcategory";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  subcategorySelect.appendChild(defaultOption);

  // Check if categories exist
  if (categoryName && subcategories[categoryName]) {
    console.log(
      `Found ${subcategories[categoryName].length} subcategories for ${categoryName}:`,
      subcategories[categoryName]
    );

    subcategories[categoryName].forEach((subcategory) => {
      const option = document.createElement("option");
      const subName = subcategory.name || subcategory;
      const subId = subcategory._id || "";

      option.value = subName;
      option.textContent = subName;
      // Store the subcategory ID as a data attribute for easy access
      if (subId) {
        option.dataset.id = subId;
      }

      subcategorySelect.appendChild(option);
    });

    console.log(
      `Added ${subcategories[categoryName].length} subcategory options to dropdown`
    );
  } else {
    console.log(`No subcategories found for category: ${categoryName}`);
  }

  // Return a resolved promise for chaining
  return Promise.resolve();
}

function addProductToTable(product) {
  const tbody = document.getElementById("productTableBody");
  const tr = document.createElement("tr");

  const imageUrl = product.mainImage
    ? `/uploads/${product.mainImage}`
    : "/images/placeholder-product.png";

  tr.innerHTML = `
    <td class="fw-semibold">${product.productId}</td>
    <td>
      <div class="d-flex align-items-center gap-3">
        <div class="bg-light rounded">
          <img src="${imageUrl}" alt="${product.productName}" style="width:70px; height:70px; object-fit: cover;">
        </div>
        <div>
          <a href="#!" class="text-dark fw-semibold text-decoration-none">
            ${product.productName}
          </a>
          <p class="text-muted mb-0 mt-1 small">${product.description.substring(0, 50)}${product.description.length > 50 ? "..." : ""}</p>
        </div>
      </div>
    </td>
    <td>$${Number.parseFloat(product.productPrice).toFixed(2)}</td>
    <td>
      <div class="text-muted">
        <span class="fw-semibold text-dark">${product.stock}</span><br> Item Left<br>
        <span>0 Sold</span>
      </div>
    </td>
    <td>
      <span class="badge bg-soft-primary text-primary">${product.subCategory && product.subCategory.name ? product.subCategory.name : "N/A"}</span>
    </td>
    <td>
      <div class="d-flex align-items-center gap-1">
        <span class="badge bg-light text-warning">
          <i class="bi bi-star-fill me-1"></i> 0.0
        </span>
        <span class="text-muted small">0 Review</span>
      </div>
    </td>
    <td>
      <a href="detailsProduct.html?id=${product._id}" class="btn btn-sm bg-light text-secondary" title="View Details">
        <i class="bi bi-eye"></i>
      </a>
      <button class="btn btn-sm bg-light text-warning editProductBtn" data-id="${product._id}" title="Edit">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm bg-light text-danger deleteProductBtn" data-id="${product._id}" title="Delete">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;

  tbody.insertBefore(tr, tbody.firstElementChild);
}

function editProduct(productId) {
  console.log("Editing product:", productId);

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true);
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        console.log("Product data for editing:", response);

        if (response.status === "success" && response.data && response.data.product) {
          const product = response.data.product;

          // Set product ID in the edit form
          const form = document.getElementById("editProductForm");
          form.dataset.productId = product._id;

          // Store category and subcategory IDs as data attributes for later use
          form.dataset.categoryId = product.category?._id || product.category || "";
          form.dataset.subcategoryId = product.subCategory?._id || "";

          // Fill form fields with product data
          form.editProductName.value = product.productName || "";
          form.editProductId.value = product.productId || "";
          form.editProductPrice.value = product.productPrice || "";
          form.editStock.value = product.stock || "";
          form.editDescription.value = product.description || "";
          form.editAvailability.value = product.availability === "In stock" ? "in_stock" : "out_of_stock";

          // Handle category selection
          if (product.category) {
            const categoryName = getCategoryNameById(product.category?._id || product.category);
            if (categoryName) {
              const editCategoryDropdown = document.getElementById("editProductCategory");
              if (editCategoryDropdown) {
                editCategoryDropdown.value = categoryName;
                
                // Load subcategories for this category
                const categoryId = product.category?._id || product.category;
                loadSubcategories(categoryId, categoryName).then(() => {
                  populateSubcategoryDropdown(categoryName, "edit");
                  
                  // Set subcategory after populating dropdown
                  setTimeout(() => {
                    const subcategoryDropdown = document.getElementById("editProductSubcategory");
                    if (subcategoryDropdown && product.subCategory?.name) {
                      subcategoryDropdown.value = product.subCategory.name;
                    }
                  }, 300);
                });
              }
            }
          }

          // Show current main image if available
          const currentMainImageContainer = document.getElementById("currentMainImageContainer");
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
          const currentOtherImagesContainer = document.getElementById("currentOtherImagesContainer");
          if (currentOtherImagesContainer && product.otherImages && product.otherImages.length > 0) {
            let imagesHTML = '<p class="mb-1">Current Other Images:</p><div class="d-flex flex-wrap gap-2">';
            product.otherImages.forEach(image => {
              imagesHTML += `
                <div class="position-relative">
                  <img src="/uploads/${image}" alt="Other Image" class="img-thumbnail" style="max-height: 80px;">
                </div>`;
            });
            imagesHTML += '</div>';
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
            // Make sure editor2 variable is available in global scope
            window.editor2 = window.editor2 || {};
            
            // Reinitialize the editor when the modal is shown
            if (typeof window.editor2.destroy === "function") {
              window.editor2.destroy();
            }
            window.editor2 = new RichTextEditor("#editRichTextEditor");

            // Set the content if available
            if (product.productDetails) {
              window.editor2.setHTMLCode(product.productDetails);
            } else {
              window.editor2.setHTMLCode(product.description || "");
            }
          }, 300);
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
  formData.append("productPrice", Number.parseFloat(form.editProductPrice.value));
  formData.append("stock", Number.parseInt(form.editStock.value));
  formData.append("availability", form.editAvailability.value === "in_stock" ? "In stock" : "Out of stock");
  formData.append("description", form.editDescription.value);
  
  // Add rich text editor content if available
  if (window.editor2 && typeof window.editor2.getHTMLCode === "function") {
    formData.append("productDetails", window.editor2.getHTMLCode());
  }

  // Get category and subcategory from the dropdowns if they exist
  const editCategoryDropdown = document.getElementById("editProductCategory");
  const editSubcategoryDropdown = document.getElementById("editProductSubcategory");
  
  if (editCategoryDropdown && editCategoryDropdown.selectedIndex > 0) {
    const selectedOption = editCategoryDropdown.options[editCategoryDropdown.selectedIndex];
    const categoryId = selectedOption.dataset.id;
    if (categoryId) {
      formData.append("category", categoryId);
      console.log("Adding category ID from dropdown:", categoryId);
    }
  } else if (form.dataset.categoryId) {
    formData.append("category", form.dataset.categoryId);
    console.log("Adding category ID from dataset:", form.dataset.categoryId);
  }

  if (editSubcategoryDropdown && editSubcategoryDropdown.selectedIndex > 0) {
    const selectedOption = editSubcategoryDropdown.options[editSubcategoryDropdown.selectedIndex];
    const subcategoryId = selectedOption.dataset.id;
    if (subcategoryId) {
      formData.append("subCategory", subcategoryId);
      console.log("Adding subcategory ID from dropdown:", subcategoryId);
    }
  } else if (form.dataset.subcategoryId) {
    formData.append("subCategory", form.dataset.subcategoryId);
    console.log("Adding subcategory ID from dataset:", form.dataset.subcategoryId);
  }

  // Add image files if they exist
  if (form.editMainImage && form.editMainImage.files && form.editMainImage.files[0]) {
    formData.append("mainImage", form.editMainImage.files[0]);
  }

  if (form.editOtherImages && form.editOtherImages.files && form.editOtherImages.files.length > 0) {
    for (let i = 0; i < form.editOtherImages.files.length; i++) {
      formData.append("otherImages", form.editOtherImages.files[i]);
    }
  }

  // Log the form data for debugging
  console.log("Form data being sent:");
  for (const pair of formData.entries()) {
    console.log(pair[0] + ": " + pair[1]);
  }

  // Send the update request
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", `http://localhost:3000/product/update/${productId}`, true);

  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  // DO NOT set Content-Type header for FormData - browser will set it automatically

  xhr.onload = () => {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        console.log("Update response:", response);

        form.reset();

        const modalEl = document.getElementById("editProductModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }

        showAlert("success", "Product updated successfully!");
        loadProducts(); // Reload product list to reflect changes
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

  // Send FormData
  xhr.send(formData);
}

function deleteProduct(productId) {
  if (confirm("Are you sure you want to delete this product?")) {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "DELETE",
      `http://localhost:3000/product/delete/${productId}`,
      true
    );

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const row = document
          .querySelector(`.deleteProductBtn[data-id="${productId}"]`)
          .closest("tr");
        if (row) {
          row.remove();
        }

        showAlert("success", "Product deleted successfully");

        loadProducts();
      } else {
        showAlert("danger", "Failed to delete product");
      }
    };

    xhr.onerror = () => {
      showAlert("danger", "Network error occurred");
    };

    xhr.send();
  }
}

// Update the getCategoryNameById function to be more robust
function getCategoryNameById(categoryId) {
  if (!categoryId) return null;

  const category = categories.find((cat) => cat._id === categoryId);
  return category ? category.categoryName : null;
}

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

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded - initializing product management");

  loadProducts();
  loadCategories();

  const productCategoryDropdown = document.getElementById("productCategory");
  if (productCategoryDropdown) {
    productCategoryDropdown.addEventListener("change", function () {
      const selectedCategory = this.value;
      const selectedOption = this.options[this.selectedIndex];
      const categoryId = selectedOption.dataset.id;

      console.log(
        "Product category changed to:",
        selectedCategory,
        "with ID:",
        categoryId
      );

      if (categoryId) {
        loadSubcategories(categoryId, selectedCategory).then(() => {
          populateSubcategoryDropdown(selectedCategory);
        });
      } else {
        console.warn("No category ID found for selected option");
        populateSubcategoryDropdown(selectedCategory);
      }
    });
  } else {
    console.error("Product category dropdown not found");
  }

  const editCategoryDropdown = document.getElementById("editProductCategory");
  if (editCategoryDropdown) {
    editCategoryDropdown.addEventListener("change", function () {
      const selectedCategory = this.value;
      const selectedOption = this.options[this.selectedIndex];
      const categoryId = selectedOption.dataset.id;

      console.log(
        "Edit category changed to:",
        selectedCategory,
        "with ID:",
        categoryId
      );

      if (categoryId) {
        loadSubcategories(categoryId, selectedCategory).then(() => {
          populateSubcategoryDropdown(selectedCategory, "edit");
        });
      } else {
        console.warn("No category ID found for selected option");
        populateSubcategoryDropdown(selectedCategory, "edit");
      }
    });
  }

  document.getElementById("addCategoryBtn").addEventListener("click", () => {
    const addCategoryModalEl = document.getElementById("addCategoryModal");
    const addCategoryModal = new bootstrap.Modal(addCategoryModalEl);
    addCategoryModal.show();
  });

  document.getElementById("addSubcategoryBtn").addEventListener("click", () => {
    const subcatCategorySelect = document.getElementById("subcategoryCategory");
    subcatCategorySelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a category";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    subcatCategorySelect.appendChild(defaultOption);

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category._id;
      option.textContent = category.categoryName;
      subcatCategorySelect.appendChild(option);
    });

    document.getElementById("newSubcategoryName").value = "";

    const addSubcategoryModalEl = document.getElementById(
      "addSubcategoryModal"
    );
    const addSubcategoryModal = new bootstrap.Modal(addSubcategoryModalEl);
    addSubcategoryModal.show();
  });

  const saveCategoryBtn = document.getElementById("saveCategoryBtn");
  const saveSubcategoryBtn = document.getElementById("saveSubcategoryBtn");

  saveCategoryBtn.addEventListener("click", () => {
    const categoryName = document
      .getElementById("newCategoryName")
      .value.trim();

    if (!categoryName) {
      showAlert("danger", "Category name cannot be empty");
      return;
    }

    // Store original button text
    const originalBtnText = saveCategoryBtn.innerHTML;

    saveCategoryBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    saveCategoryBtn.disabled = true;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/category/create", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      // Reset button state
      saveCategoryBtn.disabled = false;
      saveCategoryBtn.innerHTML = originalBtnText;

      console.log("Response:", xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);

        if (response.category) {
          categories.push(response.category);
          subcategories[response.category.categoryName] = [];

          populateCategoryDropdown();
          populateEditCategoryDropdown();

          const categorySelect = document.getElementById("productCategory");
          categorySelect.value = response.category.categoryName;

          const addCategoryModalEl =
            document.getElementById("addCategoryModal");
          const addCategoryModal =
            bootstrap.Modal.getInstance(addCategoryModalEl);
          addCategoryModal.hide();

          document.getElementById("newCategoryName").value = "";

          showAlert(
            "success",
            response.message || "Category added successfully!"
          );
        } else {
          showAlert("danger", response.message || "Failed to add category");
        }
      } else {
        let errorMessage = "Failed to add category";
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        } catch (e) {
          console.error("Error parsing response:", e);
        }
        showAlert("danger", errorMessage);
      }
    };

    xhr.onerror = () => {
      saveCategoryBtn.disabled = false;
      saveCategoryBtn.innerHTML = originalBtnText;

      showAlert("danger", "Network error occurred");
    };

    console.log("Sending category data:", { categoryName });

    xhr.send(JSON.stringify({ categoryName }));
  });

  saveSubcategoryBtn.addEventListener("click", () => {
    const categoryId = document.getElementById("subcategoryCategory").value;
    const name = document.getElementById("newSubcategoryName").value.trim();

    if (!categoryId) {
      showAlert("danger", "Please select a category");
      return;
    }

    if (!name) {
      showAlert("danger", "Subcategory name cannot be empty");
      return;
    }

    const originalBtnText = saveSubcategoryBtn.innerHTML;

    saveSubcategoryBtn.disabled = true;
    saveSubcategoryBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/subcategory/create", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      saveSubcategoryBtn.disabled = false;
      saveSubcategoryBtn.innerHTML = originalBtnText;

      console.log("Response:", xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);

        const newSubcategory =
          response.subCategory ||
          response.subcategory ||
          (response.data && response.data.subcategory);

        if (newSubcategory) {
          const parentCategory = categories.find(
            (cat) => cat._id === categoryId
          );

          if (parentCategory) {
            const categoryName =
              parentCategory.categoryName || parentCategory.name;

            if (!subcategories[categoryName]) {
              subcategories[categoryName] = [];
            }

            subcategories[categoryName].push({
              _id: newSubcategory._id,
              name: newSubcategory.name,
            });

            const productCategorySelect =
              document.getElementById("productCategory");
            productCategorySelect.value = categoryName;

            populateSubcategoryDropdown(categoryName);

            setTimeout(() => {
              const productSubcategorySelect =
                document.getElementById("productSubcategory");
              productSubcategorySelect.value = newSubcategory.name;
            }, 100);

            loadSubcategories(categoryId, categoryName);

            const addSubcategoryModalEl = document.getElementById(
              "addSubcategoryModal"
            );
            const addSubcategoryModal = bootstrap.Modal.getInstance(
              addSubcategoryModalEl
            );
            if (addSubcategoryModal) {
              addSubcategoryModal.hide();
            }

            document.getElementById("newSubcategoryName").value = "";

            showAlert(
              "success",
              response.message || "Subcategory added successfully!"
            );
          } else {
            showAlert("danger", "Parent category not found");
          }
        } else {
          showAlert("danger", response.message || "Failed to add subcategory");
        }
      } else {
        let errorMessage = "Failed to add subcategory";
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        } catch (e) {
          console.error("Error parsing response:", e);
        }
        showAlert("danger", errorMessage);
      }
    };

    xhr.onerror = () => {
      saveSubcategoryBtn.disabled = false;
      saveSubcategoryBtn.innerHTML = originalBtnText;
      showAlert("danger", "Network error occurred");
    };

    console.log("Sending subcategory data:", { name, categoryId });

    xhr.send(
      JSON.stringify({
        name: name,
        category: categoryId,
      })
    );
  });

  document.getElementById("addProductForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;

    const requiredFields = [
      "productName",
      "productId",
      "productPrice",
      "productCategory",
      "productSubcategory",
      "Stock",
      "description",
    ];
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!form[field] || !form[field].value.trim()) {
        showAlert(
          "danger",
          `${field.replace(/([A-Z])/g, " $1").trim()} is required`
        );
        isValid = false;
      }
    });

    if (!form.mainImage.files[0]) {
      showAlert("danger", "Main image is required");
      isValid = false;
    }

    if (!isValid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    submitBtn.disabled = true;

    const formData = new FormData();

    formData.append("productName", form.productName.value);
    formData.append("productId", form.productId.value);
    formData.append("productPrice", form.productPrice.value);
    formData.append("productDetails" , editor1.getHTMLCode())

    const selectedCategory = form.productCategory.value;
    const selectedSubcategory = form.productSubcategory.value;

    let categoryId = null;
    const categoryObj = categories.find(
      (cat) => cat.categoryName === selectedCategory
    );
    if (categoryObj) {
      categoryId = categoryObj._id;
      console.log("Found category ID:", categoryId);
      formData.append("category", categoryId);
    } else {
      console.error("Could not find category ID for:", selectedCategory);
      showAlert("danger", "Invalid category selected");
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      return;
    }

    let subCategoryId = null;
    if (subcategories[selectedCategory]) {
      const subcat = subcategories[selectedCategory].find(
        (sub) => sub.name === selectedSubcategory || sub === selectedSubcategory
      );
      if (subcat && subcat._id) {
        subCategoryId = subcat._id;
      }
    }

    if (!subCategoryId) {
      showAlert("danger", "Invalid subcategory selected");
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      return;
    }

    formData.append("subCategory", subCategoryId);
    formData.append(
      "availability",
      form.Availability.value === "in_stock" ? "In stock" : "Out of stock"
    );
    formData.append("stock", form.Stock.value);
    formData.append("description", form.description.value);

    if (form.mainImage.files[0]) {
      formData.append("mainImage", form.mainImage.files[0]);
    }

    if (form.otherImages.files.length > 0) {
      for (let i = 0; i < form.otherImages.files.length; i++) {
        formData.append("otherImages", form.otherImages.files[i]);
      }
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/product/create", true);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;

      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);

        if (
          response.status === "success" &&
          response.data &&
          response.data.product
        ) {
          addProductToTable(response.data.product);

          form.reset();

          const addProductModalEl = document.getElementById("addProductModal");
          let addProductModal = bootstrap.Modal.getInstance(addProductModalEl);
          if (!addProductModal) {
            addProductModal = new bootstrap.Modal(addProductModalEl);
          }
          addProductModal.hide();
          form.reset();
          showAlert("success", "Product added successfully!");

          loadProducts();
        } else {
          showAlert("danger", response.message || "Failed to add product");
        }
      } else {
        let errorMessage = "Failed to add product";
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        } catch (e) {
          console.error("Error parsing response:", e);
        }
        showAlert("danger", errorMessage);
      }
    };

    xhr.onerror = () => {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      showAlert("danger", "Network error occurred");
    };

    xhr.send(formData);
  });

  // Add event listener for the edit product form
  const editProductForm = document.getElementById("editProductForm");
  if (editProductForm) {
    editProductForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleProductUpdate(e.target);
    });
  }

  // Add event listeners for edit and delete buttons
  document.addEventListener("click", (e) => {
    // Edit button
    if (e.target.closest(".editProductBtn")) {
      const productId = e.target
        .closest(".editProductBtn")
        .getAttribute("data-id");
      editProduct(productId);
    }

    // Delete button
    if (e.target.closest(".deleteProductBtn")) {
      const productId = e.target
        .closest(".deleteProductBtn")
        .getAttribute("data-id");
      deleteProduct(productId);
    }
  });
});