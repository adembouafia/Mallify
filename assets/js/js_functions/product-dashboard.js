const Swal = window.Swal; // Assuming Swal is available globally

let categories = [];
const subcategories = {};
var editor1 = new RichTextEditor("#richTextEditor");
const token = localStorage.getItem("token");
let productSoldCounts = {}; // Add this global variable to store sold counts

// Pagination and sorting variables
let allProducts = []; // Store all products for filtering
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let currentSearchTerm = "";
let currentSortField = "productName"; // Default sort field
let currentSortOrder = "asc"; // Default sort order: asc or desc

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
  // Get user data from localStorage to determine role
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  let url = "http://localhost:3000/product/get/myProducts";

  // For admin/moderator, we may need to specify a shopId
  if (
    (userData.role === "admin" || userData.role === "moderator") &&
    userData.managingShopId
  ) {
    url += `?shopId=${userData.managingShopId}`;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        console.log("Products loaded:", response);

        const tbody = document.getElementById("productTableBody");
        if (!tbody) {
          console.error("Product table body element not found");
          return;
        }

        tbody.innerHTML = "";

        if (
          response.status === "success" &&
          response.data &&
          response.data.products &&
          response.data.products.length > 0
        ) {
          // Store all products for filtering and pagination
          allProducts = response.data.products;

          // Initialize pagination
          initializePagination(allProducts.length);

          // Initialize sorting
          initializeSorting();

          // Sort and display products
          sortAndDisplayProducts();

          const productCountElement = document.querySelector(
            ".info-box:nth-child(1) .info-box-number"
          );
          if (productCountElement) {
            productCountElement.textContent = allProducts.length;
          }

          // If response contains shopId for admin/moderator, store it for future use
          if (
            response.data.shopId &&
            (userData.role === "admin" || userData.role === "moderator")
          ) {
            userData.managingShopId = response.data.shopId;
            localStorage.setItem("userData", JSON.stringify(userData));
          }
        } else {
          console.log("No products found in response");
          showToast("warning", "No products found");
          updatePaginationInfo(0, 0, 0);
        }
      } catch (e) {
        console.error("Error parsing products response:", e);
        showToast("danger", "Error processing server response");
      }
    } else {
      console.error("Failed to load products:", xhr.status, xhr.statusText);
      try {
        const errorResponse = JSON.parse(xhr.responseText);
        showToast("danger", errorResponse.message || "Failed to load products");
      } catch (e) {
        showToast("danger", "Failed to load products");
      }
    }
  };

  xhr.onerror = () => {
    console.error("Network error occurred while loading products");
    showToast("danger", "Network error occurred");
  };

  xhr.send();
}

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
      showToast("danger", "Failed to load categories");
      categories = [];
    }
  };

  xhr.onerror = () => {
    showToast("danger", "Network error occurred while loading categories");
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

  // Debug the product structure to see how categories are stored
  console.log("Product data:", product);
  console.log("SubCategory data:", product.subCategory);
  if (product.subCategory) {
    console.log("Category in subCategory:", product.subCategory.category);
  }

  const tr = document.createElement("tr");
  tr.setAttribute("data-product-id", product._id); // Add product ID as data attribute

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
    <td>$${Number.parseFloat(product.productPrice).toFixed(2)}</td>    <td>
      <div class="text-muted">
        <span class="fw-semibold text-dark">${product.stock}</span><br> Item Left
        ${product.stockLimit ? `<span class="badge bg-light text-warning">Alert at ${product.stockLimit}</span>` : ""}<br>
        <span>${productSoldCounts[product._id] || 0} Sold</span>
      </div>
    </td><td>
      <span class="badge bg-soft-primary text-primary category-cell" data-product-id="${product._id}">
        ${(() => {
          // Get category name from various potential locations in the product object
          if (
            product.subCategory &&
            product.subCategory.category &&
            product.subCategory.category.categoryName
          ) {
            return product.subCategory.category.categoryName; // Properly populated subCategory with category
          } else if (product.category && product.category.categoryName) {
            return product.category.categoryName; // Direct category reference
          } else if (product.categoryName) {
            return product.categoryName; // Direct category name property
          } else {
            // Make additional API call to get the category
            getCategoryForProduct(product._id, product.subCategory?._id);
            return "Loading...";
          }
        })()}
      </span>
    </td>
    <td>
      <div class="d-flex align-items-center gap-1">
        <span class="badge bg-light text-warning">
          <i class="bi bi-star-fill me-1"></i> ${product.averageRating ? product.averageRating.toFixed(1) : "0.0"}
        </span>
        <span class="text-muted small">${product.reviewCount || product.reviews?.length || 0} Review${product.reviewCount > 1 || (product.reviews && product.reviews.length > 1) ? "s" : ""}</span>
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

  tbody.appendChild(tr);
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

        if (
          response.status === "success" &&
          response.data &&
          response.data.product
        ) {
          const product = response.data.product;

          // Set product ID in the edit form
          const form = document.getElementById("editProductForm");
          form.dataset.productId = product._id;

          // Store category and subcategory IDs as data attributes for later use
          form.dataset.categoryId =
            product.category?._id || product.category || "";
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

          // Handle category selection
          if (product.category) {
            const categoryName = getCategoryNameById(
              product.category?._id || product.category
            );
            if (categoryName) {
              const editCategoryDropdown = document.getElementById(
                "editProductCategory"
              );
              if (editCategoryDropdown) {
                editCategoryDropdown.value = categoryName;

                // Load subcategories for this category
                const categoryId = product.category?._id || product.category;
                loadSubcategories(categoryId, categoryName).then(() => {
                  populateSubcategoryDropdown(categoryName, "edit");

                  // Set subcategory after populating dropdown
                  setTimeout(() => {
                    const subcategoryDropdown = document.getElementById(
                      "editProductSubcategory"
                    );
                    if (subcategoryDropdown && product.subCategory?.name) {
                      subcategoryDropdown.value = product.subCategory.name;
                    }
                  }, 300);
                });
              }
            }
          }

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
          const editProductModalEl =
            document.getElementById("editProductModal");
          let editProductModal =
            bootstrap.Modal.getInstance(editProductModalEl);
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
          showToast("danger", "Failed to load product data");
        }
      } catch (e) {
        console.error("Error parsing product data:", e);
        showToast("danger", "Error processing server response");
      }
    } else {
      showToast("danger", "Failed to load product data");
    }
  };

  xhr.onerror = () => {
    showToast("danger", "Network error occurred");
  };

  xhr.send();
}

function handleProductUpdate(form) {
  const productId = form.dataset.productId;

  if (!productId) {
    showToast("danger", "Product ID is missing");
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
  if (window.editor2 && typeof window.editor2.getHTMLCode === "function") {
    formData.append("productDetails", window.editor2.getHTMLCode());
  }

  // Get category and subcategory from the dropdowns if they exist
  const editCategoryDropdown = document.getElementById("editProductCategory");
  const editSubcategoryDropdown = document.getElementById(
    "editProductSubcategory"
  );

  if (editCategoryDropdown && editCategoryDropdown.selectedIndex > 0) {
    const selectedOption =
      editCategoryDropdown.options[editCategoryDropdown.selectedIndex];
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
    const selectedOption =
      editSubcategoryDropdown.options[editSubcategoryDropdown.selectedIndex];
    const subcategoryId = selectedOption.dataset.id;
    if (subcategoryId) {
      formData.append("subCategory", subcategoryId);
      console.log("Adding subcategory ID from dropdown:", subcategoryId);
    }
  } else if (form.dataset.subcategoryId) {
    formData.append("subCategory", form.dataset.subcategoryId);
    console.log(
      "Adding subcategory ID from dataset:",
      form.dataset.subcategoryId
    );
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

        // Get updated product data to update UI immediately
        const updatedProduct = {
          _id: productId,
          productName: form.editProductName.value,
          productId: form.editProductId.value,
          productPrice: Number.parseFloat(form.editProductPrice.value),
          stock: Number.parseInt(form.editStock.value),
          stockLimit: Number.parseInt(form.editStockLimit.value || 0),
          description: form.editDescription.value,
          availability:
            form.editAvailability.value === "in_stock"
              ? "In stock"
              : "Out of stock",
        };

        // Update the product in the local array first
        const productIndex = allProducts.findIndex((p) => p._id === productId);
        if (productIndex !== -1) {
          // Merge the updated product with the existing one to keep other properties
          allProducts[productIndex] = {
            ...allProducts[productIndex],
            ...updatedProduct,
          };

          // Update the displayed product row immediately
          updateProductRowInTable(productId, allProducts[productIndex]);
        }

        form.reset();

        const modalEl = document.getElementById("editProductModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }
        showToast(
          "success",
          response.message || "Product updated successfully!"
        );

        // Only reload product stats to update dashboard counters
        loadProductStats(); // Reload product stats to update dashboard
      } catch (e) {
        console.error("Error parsing response:", e);
        showToast("danger", "Error processing server response");
      }
    } else {
      try {
        const response = JSON.parse(xhr.responseText);
        showToast("danger", response.message || "Failed to update product");
      } catch (e) {
        showToast("danger", "Failed to update product");
      }
    }
  };

  xhr.onerror = () => {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    showToast("danger", "Network error occurred");
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

        showToast("success", "Product deleted successfully");

        // Update allProducts array by removing the deleted product
        allProducts = allProducts.filter(
          (product) => product._id !== productId
        );

        // Reinitialize pagination with the updated product count
        initializePagination(allProducts.length);

        // Redisplay products with the updated list
        sortAndDisplayProducts();
      } else {
        showToast("danger", "Failed to delete product");
      }
    };

    xhr.onerror = () => {
      showToast("danger", "Network error occurred");
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

function loadProductStats() {
  console.log("Loading product stats...");
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/product/stats", true);

  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        console.log("Product stats loaded:", response);

        if (response.status === "success" && response.data) {
          const stats = response.data;

          // Log the stats for debugging
          console.log("Total Products:", stats.totalProducts);
          console.log("Out of Stock Products:", stats.outOfStockProducts);
          console.log("Categories:", stats.categories);
          console.log("Sold Products Count:", stats.soldProductsCount);
          console.log("Product Sold Counts:", stats.productSoldCounts);

          // Update the dashboard cards
          updateDashboardStats(stats);

          // Store the sold counts for individual products
          productSoldCounts = stats.productSoldCounts || {};
          console.log("Product sold counts updated:", productSoldCounts);

          // Update products table if it exists
          const tbody = document.getElementById("productTableBody");
          if (tbody) {
            updateProductSoldCounts();
          }
        } else {
          console.warn("Invalid product stats response:", response);
        }
      } catch (e) {
        console.error("Error parsing product stats:", e);
      }
    } else {
      console.error(
        "Failed to load product stats:",
        xhr.status,
        xhr.responseText
      );
    }
  };

  xhr.onerror = () => {
    console.error("Network error loading product stats");
  };

  xhr.send();
}

function updateDashboardStats(stats) {
  console.log("Updating dashboard stats with:", stats);

  // Find all info-box elements for better targeting
  const infoBoxes = document.querySelectorAll(".info-box");

  if (infoBoxes.length >= 4) {
    // Update total products card - first info box
    const totalProductsElement = infoBoxes[0].querySelector(".info-box-number");
    if (totalProductsElement) {
      totalProductsElement.textContent = stats.totalProducts || 0;
      console.log("Updated total products:", totalProductsElement.textContent);
    } else {
      console.error("Total products element not found");
    }

    // Update categories card - second info box
    const categoriesElement = infoBoxes[1].querySelector(".info-box-number");
    if (categoriesElement) {
      categoriesElement.textContent = stats.categories || 0;
      console.log("Updated categories:", categoriesElement.textContent);
    } else {
      console.error("Categories element not found");
    }

    // Update out of stock card - third info box
    const outOfStockElement = infoBoxes[2].querySelector(".info-box-number");
    if (outOfStockElement) {
      outOfStockElement.textContent = stats.outOfStockProducts || 0;
      console.log("Updated out of stock:", outOfStockElement.textContent);
    } else {
      console.error("Out of stock element not found");
    }

    // Update sold products card - fourth info box
    const soldProductsElement = infoBoxes[3].querySelector(".info-box-number");
    if (soldProductsElement) {
      soldProductsElement.textContent = stats.soldProductsCount || 0;
      console.log("Updated sold products:", soldProductsElement.textContent);
    } else {
      console.error("Sold products element not found");
    }
  } else {
    console.error("Could not find all info boxes. Found:", infoBoxes.length);

    // Fallback to direct class selectors
    const allBoxes = document.querySelectorAll(".info-box-number");
    console.log("Found info boxes by class:", allBoxes.length);

    // Try to update them in order
    if (allBoxes.length >= 1)
      allBoxes[0].textContent = stats.totalProducts || 0;
    if (allBoxes.length >= 2) allBoxes[1].textContent = stats.categories || 0;
    if (allBoxes.length >= 3)
      allBoxes[2].textContent = stats.outOfStockProducts || 0;
    if (allBoxes.length >= 4)
      allBoxes[3].textContent = stats.soldProductsCount || 0;
  }
}

function updateProductSoldCounts() {
  const productRows = document.querySelectorAll("#productTableBody tr");
  productRows.forEach((row) => {
    const productId = row.querySelector(".deleteProductBtn, .editProductBtn")
      ?.dataset?.id;
    if (productId && productSoldCounts[productId]) {
      const soldCountSpan = row.querySelector(
        "td:nth-child(4) span:last-child"
      );
      if (soldCountSpan) {
        soldCountSpan.textContent = `${productSoldCounts[productId] || 0} Sold`;
      }
    }
  });
}

// Function to update a product row in the table without reloading all products
function updateProductRowInTable(productId, product) {
  if (!productId || !product) return;

  // Find the existing row
  const row = document.querySelector(`tr[data-product-id="${productId}"]`);
  if (!row) return;

  // Update product name and description
  const nameLink =
    row.querySelector("td:nth-child(2) a.text-reset") ||
    row.querySelector("td:nth-child(2) a.text-dark");
  if (nameLink) {
    nameLink.textContent = product.productName;
  }

  const descriptionP = row.querySelector("td:nth-child(2) p.text-muted");
  if (descriptionP) {
    descriptionP.textContent = `${product.description.substring(0, 50)}${product.description.length > 50 ? "..." : ""}`;
  }

  // Update price
  const priceCell = row.querySelector("td:nth-child(3)");
  if (priceCell) {
    priceCell.textContent = `$${Number.parseFloat(product.productPrice).toFixed(2)}`;
  }

  // Update stock value
  const stockValueSpan = row.querySelector("td:nth-child(4) span.fw-semibold");
  if (stockValueSpan) {
    stockValueSpan.textContent = product.stock;
  }

  // Update or add stock limit badge
  const stockCell = row.querySelector("td:nth-child(4) div.text-muted");
  if (stockCell) {
    // Find existing stock limit badge
    const existingBadge = stockCell.querySelector(
      "span.badge.bg-light.text-warning"
    );

    // If there's a stock limit, update or create the badge
    if (product.stockLimit) {
      if (existingBadge) {
        existingBadge.textContent = `Alert at ${product.stockLimit}`;
      } else {
        // Create new badge and insert it after the "Item Left" text
        // First find the br element after "Item Left"
        const brElements = stockCell.querySelectorAll("br");
        if (brElements.length > 0) {
          // Insert after the first br element
          const badge = document.createElement("span");
          badge.className = "badge bg-light text-warning";
          badge.textContent = `Alert at ${product.stockLimit}`;
          stockCell.insertBefore(badge, brElements[0].nextSibling);
          stockCell.insertBefore(
            document.createElement("br"),
            badge.nextSibling
          );
        } else {
          // Fallback if br is not found - create the structure from scratch
          const soldSpan = stockCell.querySelector("span");
          if (soldSpan) {
            // Store the sold count text
            const soldText = soldSpan.textContent;
            // Clear and rebuild the cell content
            stockCell.innerHTML = `
              <span class="fw-semibold text-dark">${product.stock}</span><br> Item Left
              <span class="badge bg-light text-warning">Alert at ${product.stockLimit}</span><br>
              <span>${soldText}</span>
            `;
          }
        }
      }
    } else if (existingBadge) {
      // If there's no stock limit but there is a badge, remove it and any related br element
      const nextBr = existingBadge.nextSibling;
      if (nextBr && nextBr.nodeName === "BR") {
        nextBr.remove();
      }
      existingBadge.remove();
    }
  }

  // Update availability if it's displayed (column 5)
  const availabilityBadge = row.querySelector("td:nth-child(5) span.badge");
  if (availabilityBadge && product.availability) {
    if (product.availability === "In stock") {
      availabilityBadge.className = "badge bg-success";
      availabilityBadge.textContent = "In stock";
    } else {
      availabilityBadge.className = "badge bg-danger";
      availabilityBadge.textContent = "Out of stock";
    }
  }
}

function getCategoryForProduct(productId, subCategoryId) {
  if (!productId) return;

  // Check if we've already loaded or are loading this product's category
  if (window.loadingCategories && window.loadingCategories[productId]) return;

  // Initialize our tracking object if it doesn't exist
  if (!window.loadingCategories) window.loadingCategories = {};
  window.loadingCategories[productId] = true;

  console.log(`Fetching complete data for product: ${productId}`);

  // Make a call to get the complete product info (which includes properly populated category)
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
          const product = response.data.product;

          // Get the category name
          let categoryName = null;
          if (
            product.subCategory &&
            product.subCategory.category &&
            product.subCategory.category.categoryName
          ) {
            categoryName = product.subCategory.category.categoryName;
          } else if (product.category && product.category.categoryName) {
            categoryName = product.category.categoryName;
          } else if (product.categoryName) {
            categoryName = product.categoryName;
          }

          if (categoryName) {
            // Update the category display in the table
            const productRows = document.querySelectorAll(
              `[data-product-id="${productId}"]`
            );
            productRows.forEach((row) => {
              const categoryCell = row.querySelector(".category-cell");
              if (categoryCell) {
                categoryCell.textContent = categoryName;
                console.log(
                  `Updated category for product ${productId} to ${categoryName}`
                );
              } else {
                console.warn(
                  `Category cell not found for product ${productId}`
                );
              }
            });
          } else {
            console.warn(`No category found for product ${productId}`);
          }
        }
      } catch (e) {
        console.error("Error fetching product category:", e);
      }
    } else {
      console.error(
        `Failed to fetch product category for ${productId}:`,
        xhr.status,
        xhr.statusText
      );
    }

    // Clear the loading flag
    if (window.loadingCategories) {
      delete window.loadingCategories[productId];
    }
  };

  xhr.onerror = () => {
    console.error("Network error when fetching product category");
    // Clear the loading flag
    if (window.loadingCategories) {
      delete window.loadingCategories[productId];
    }
  };

  xhr.send();
}

// New functions for pagination, sorting, and search

function initializePagination(totalItems) {
  // Get the items per page from the dropdown
  const entriesSelect = document.querySelector(".pagination-info select");
  if (entriesSelect) {
    itemsPerPage = Number.parseInt(entriesSelect.value) || 10;

    // Add event listener to the entries select
    entriesSelect.addEventListener("change", function () {
      itemsPerPage = Number.parseInt(this.value);
      currentPage = 1; // Reset to first page when changing items per page

      // Apply current filters and search
      sortAndDisplayProducts();
    });
  }

  // Calculate total pages
  totalPages = Math.ceil(totalItems / itemsPerPage);

  // Initialize pagination UI
  renderPagination();
}

function renderPagination() {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  const prevLink = document.createElement("a");
  prevLink.className = "page-link";
  prevLink.href = "#";
  prevLink.textContent = "Previous";
  prevLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  });
  prevLi.appendChild(prevLink);
  paginationContainer.appendChild(prevLi);

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
    const pageLink = document.createElement("a");
    pageLink.className = "page-link";
    pageLink.href = "#";
    pageLink.textContent = i;
    pageLink.addEventListener("click", (e) => {
      e.preventDefault();
      goToPage(i);
    });
    pageLi.appendChild(pageLink);
    paginationContainer.appendChild(pageLi);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`;
  const nextLink = document.createElement("a");
  nextLink.className = "page-link";
  nextLink.href = "#";
  nextLink.textContent = "Next";
  nextLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  });
  nextLi.appendChild(nextLink);
  paginationContainer.appendChild(nextLi);
}

function goToPage(page) {
  currentPage = page;

  // Apply current filters and search
  sortAndDisplayProducts();

  // Update pagination UI
  renderPagination();
}

function sortAndDisplayProducts() {
  // First, filter by search term if any
  let filteredProducts = allProducts;

  if (currentSearchTerm) {
    const searchLower = currentSearchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter((product) => {
      return (
        (product.productName &&
          product.productName.toLowerCase().includes(searchLower)) ||
        (product.productId &&
          product.productId.toLowerCase().includes(searchLower)) ||
        (product.description &&
          product.description.toLowerCase().includes(searchLower))
      );
    });
  }

  // Then sort the filtered products
  const sortedProducts = sortProducts(filteredProducts);

  // Update total pages based on filtered count
  totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Make sure current page is valid
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }

  // Display the sorted and paginated products
  displayProducts(sortedProducts);

  // Update pagination UI
  renderPagination();
}

function sortProducts(products) {
  // Create a copy of the products array to avoid modifying the original
  const sortedProducts = [...products];

  // Sort based on current sort field and order
  sortedProducts.sort((a, b) => {
    let valueA, valueB;

    // Handle different sort fields
    switch (currentSortField) {
      case "productName":
        valueA = a.productName || "";
        valueB = b.productName || "";
        break;
      case "productId":
        valueA = a.productId || "";
        valueB = b.productId || "";
        break;
      case "productPrice":
        valueA = Number.parseFloat(a.productPrice) || 0;
        valueB = Number.parseFloat(b.productPrice) || 0;
        break;
      case "stock":
        valueA = Number.parseInt(a.stock) || 0;
        valueB = Number.parseInt(b.stock) || 0;
        break;
      case "createdAt":
        valueA = new Date(a.createdAt || 0).getTime();
        valueB = new Date(b.createdAt || 0).getTime();
        break;
      case "rating":
        valueA = Number.parseFloat(a.averageRating) || 0;
        valueB = Number.parseFloat(b.averageRating) || 0;
        break;
      default:
        valueA = a.productName || "";
        valueB = b.productName || "";
    }

    // For string values, use localeCompare for proper alphabetical sorting
    if (typeof valueA === "string" && typeof valueB === "string") {
      return currentSortOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    // For numeric values, use simple comparison
    return currentSortOrder === "asc" ? valueA - valueB : valueB - valueA;
  });

  return sortedProducts;
}

function displayProducts(products) {
  const tbody = document.getElementById("productTableBody");
  if (!tbody) return;

  // Clear the table
  tbody.innerHTML = "";

  // Apply pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);
  const paginatedProducts = products.slice(startIndex, endIndex);

  // Display products
  if (paginatedProducts.length > 0) {
    paginatedProducts.forEach((product) => {
      addProductToTable(product);
    });
  } else {
    // Show no results message
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="7" class="text-center py-4">
        <div class="text-muted">
          <i class="bi bi-search fs-3 d-block mb-2"></i>
          No products found
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }

  // Update pagination info
  updatePaginationInfo(startIndex + 1, endIndex, products.length);
}

// Update the updatePaginationInfo function to properly update the text
function updatePaginationInfo(start, end, total) {
  // Find all pagination info elements
  const paginationInfoElements = document.querySelectorAll(".pagination-info");

  if (paginationInfoElements.length > 0) {
    // Update all pagination info elements
    paginationInfoElements.forEach((element) => {
      if (total === 0) {
        element.textContent = "Showing 0 to 0 of 0 entries";
      } else {
        element.textContent = `Showing ${start} to ${end} of ${total} entries`;
      }
    });
  } else {
    console.error("Pagination info elements not found");
  }
}

// Update the initializeSorting function to position the sort button better
function initializeSorting() {
  // Add click event listeners to table headers for sorting
  const tableHeaders = document.querySelectorAll("#productTable th");

  // Define which columns are sortable and their corresponding sort fields
  const sortableColumns = [
    { index: 0, field: "productId", label: "Ref" },
    { index: 1, field: "productName", label: "Product Name" },
    { index: 2, field: "productPrice", label: "Price" },
    { index: 3, field: "stock", label: "Stock" },
    { index: 5, field: "rating", label: "Rating" },
  ];

  // Add sort indicators and click handlers to sortable columns
  sortableColumns.forEach((column) => {
    const th = tableHeaders[column.index];
    if (!th) return;

    // Make the header look clickable
    th.style.cursor = "pointer";

    // Remove existing click handlers by cloning and replacing the element
    const newTh = th.cloneNode(true);
    th.parentNode.replaceChild(newTh, th);

    // Add click handler to the new element
    newTh.addEventListener("click", () => {
      // If already sorting by this field, toggle the order
      if (currentSortField === column.field) {
        currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
      } else {
        // Otherwise, set this as the new sort field with default ascending order
        currentSortField = column.field;
        currentSortOrder = "asc";
      }

      // Re-sort and display products
      sortAndDisplayProducts();
    });
  });

  // Find the search input group
  const searchInputGroup = document.querySelector(".input-group");
  if (!searchInputGroup) return;

  // Find the parent container for the search
  const parentContainer = searchInputGroup.parentElement;

  // Remove any existing sort dropdown and wrapper
  const existingWrapper = parentContainer.querySelector(
    ".d-flex.align-items-center"
  );
  if (existingWrapper) {
    // Save the search input group before removing the wrapper
    if (existingWrapper.contains(searchInputGroup)) {
      parentContainer.appendChild(searchInputGroup);
    }
    parentContainer.removeChild(existingWrapper);
  }

  // Remove any existing entries per page container
  const existingEntriesContainer = parentContainer.querySelector(".me-3");
  if (existingEntriesContainer) {
    parentContainer.removeChild(existingEntriesContainer);
  }

  // Create a cleaner sort dropdown that matches the image
  const sortDropdown = document.createElement("div");
  sortDropdown.className = "dropdown d-inline-block me-2";
  sortDropdown.innerHTML = `
    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
      <i class="bi bi-sort-alpha-down"></i> Sort
    </button>
    <ul class="dropdown-menu">
      <li><h6 class="dropdown-header">Sort by</h6></li>
      <li><a class="dropdown-item sort-option" href="#" data-field="productName" data-order="asc">Name (A to Z)</a></li>
      <li><a class="dropdown-item sort-option" href="#" data-field="productName" data-order="desc">Name (Z to A)</a></li>
      <li><a class="dropdown-item sort-option" href="#" data-field="productPrice" data-order="asc">Price (Low to High)</a></li>
      <li><a class="dropdown-item sort-option" href="#" data-field="productPrice" data-order="desc">Price (High to Low)</a></li>
      <li><a class="dropdown-item sort-option" href="#" data-field="createdAt" data-order="desc">Newest First</a></li>
      <li><a class="dropdown-item sort-option" href="#" data-field="createdAt" data-order="asc">Oldest First</a></li>
    </ul>
  `;

  // Create a wrapper for the search and sort elements
  const searchSortWrapper = document.createElement("div");
  searchSortWrapper.className = "d-flex align-items-center";

  // Move the search input group into the wrapper
  parentContainer.removeChild(searchInputGroup);
  searchSortWrapper.appendChild(sortDropdown);
  searchSortWrapper.appendChild(searchInputGroup);

  // Add the wrapper to the parent container
  parentContainer.appendChild(searchSortWrapper);

  // Add event listeners to sort options
  sortDropdown.querySelectorAll(".sort-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      e.preventDefault();

      // Update active class
      sortDropdown.querySelectorAll(".sort-option").forEach((el) => {
        el.classList.remove("active");
      });
      option.classList.add("active");

      // Set sort field and order
      currentSortField = option.getAttribute("data-field");
      currentSortOrder = option.getAttribute("data-order");

      // Update sort button text
      const sortBtn = sortDropdown.querySelector("button");
      sortBtn.innerHTML = `<i class="bi bi-sort-alpha-down"></i> ${option.textContent}`;

      // Update table header indicators
      const index = sortableColumns.findIndex(
        (col) => col.field === currentSortField
      );

      // Re-sort and display products
      sortAndDisplayProducts();
    });
  });
  // Add entries per page dropdown
  const entriesPerPageContainer = document.createElement("div");
  entriesPerPageContainer.className = "me-3";
  entriesPerPageContainer.innerHTML = `
    <div class="d-flex align-items-center">
      <label class="me-2 small">Show</label>
      <select class="form-select form-select-sm entries-select" style="width: auto;">
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
      <label class="ms-2 small">entries</label>
    </div>
  `;

  // Insert the entries per page dropdown before the search and sort wrapper
  parentContainer.insertBefore(entriesPerPageContainer, searchSortWrapper);

  // Add event listener to the entries select
  const entriesSelect =
    entriesPerPageContainer.querySelector(".entries-select");
  entriesSelect.addEventListener("change", function () {
    itemsPerPage = Number.parseInt(this.value);
    currentPage = 1; // Reset to first page when changing items per page

    // Apply current filters and search
    sortAndDisplayProducts();
  });
}

// Update the initializePagination function to use the new entries select
function initializePagination(totalItems) {
  // Get the items per page from the dropdown
  const entriesSelect = document.querySelector(".entries-select");
  if (entriesSelect) {
    itemsPerPage = Number.parseInt(entriesSelect.value) || 10;
  }

  // Calculate total pages
  totalPages = Math.ceil(totalItems / itemsPerPage);

  // Initialize pagination UI
  renderPagination();
}

function initializeSearch() {
  const searchInput = document.querySelector('.input-group input[type="text"]');
  const searchButton = document.querySelector(".input-group button");

  if (!searchInput || !searchButton) return;

  // Add event listener to search button
  searchButton.addEventListener("click", () => {
    performSearch(searchInput.value);
  });

  // Add event listener for Enter key
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      performSearch(this.value);
    }
  });
}

function performSearch(searchTerm) {
  currentSearchTerm = searchTerm.trim();
  currentPage = 1; // Reset to first page

  // Apply search and sorting
  sortAndDisplayProducts();
}

function showToast(title, message, type) {
  // Check if SweetAlert2 is available
  if (typeof Swal !== "undefined") {
    // Define custom icons based on type
    let iconHtml = "";
    let iconColor = "";

    switch (type) {
      case "success":
        iconHtml = '<div style="font-size: 24px;">✅</div>';
        iconColor = "#00e676";
        break;
      case "error":
        iconHtml = '<div style="font-size: 24px;">❌</div>';
        iconColor = "#ff1744";
        break;
      case "warning":
        iconHtml = '<div style="font-size: 24px;">⚠️</div>';
        iconColor = "#ff9100";
        break;
      case "info":
      default:
        iconHtml = '<div style="font-size: 24px;">ℹ️</div>';
        iconColor = "#40c4ff";
        break;
    }

    Swal.fire({
      title: `<span style="font-weight:bold;">${title}</span>`,
      html: `
        <div style="display: flex; align-items: center;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${iconColor}; display: flex; justify-content: center; align-items: center; color: white; margin-right: 10px;">
            ${iconHtml}
          </div>
          <p style="margin:0;">${message}</p>
        </div>
      `,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
      timer: 2000,
      timerProgressBar: true,
      background: "#1e1e2f",
      color: "#fff",
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
      customClass: {
        popup: "cool-toast-popup",
        timerProgressBar: "cool-toast-timer",
      },
    });
  } else {
    // Fallback to console if SweetAlert2 is not available
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  }
}

function showAlert(options) {
  if (typeof Swal !== "undefined") {
    if (
      !options.input &&
      !options.showCancelButton &&
      !options.showConfirmButton
    ) {
      showToast(options.title, options.text || "", options.icon || "info");
      if (options.then) {
        setTimeout(() => {
          options.then();
        }, 2000);
      }
      return Promise.resolve();
    } else {
      return Swal.fire(options);
    }
  } else {
    alert(options.text || options.title);
    if (options.then) {
      options.then();
    }
    return Promise.resolve();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded - initializing product management");

  loadProducts();
  loadCategories();

  // Initialize search functionality
  initializeSearch();

  // Add a slight delay to ensure DOM is fully rendered before loading stats
  setTimeout(() => {
    loadProductStats(); // Load product statistics on page load with a slight delay
  }, 500);

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
      showToast("danger", "Category name cannot be empty");
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

          showToast(
            "success",
            response.message || "Category added successfully!"
          );
        } else {
          showToast("danger", response.message || "Failed to add category");
        }
      } else {
        let errorMessage = "Failed to add category";
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        } catch (e) {
          console.error("Error parsing response:", e);
        }
        showToast("danger", errorMessage);
      }
    };

    xhr.onerror = () => {
      saveCategoryBtn.disabled = false;
      saveCategoryBtn.innerHTML = originalBtnText;

      showToast("danger", "Network error occurred");
    };

    console.log("Sending category data:", { categoryName });

    xhr.send(JSON.stringify({ categoryName }));
  });

  saveSubcategoryBtn.addEventListener("click", () => {
    const categoryId = document.getElementById("subcategoryCategory").value;
    const name = document.getElementById("newSubcategoryName").value.trim();

    if (!categoryId) {
      showToast("danger", "Please select a category");
      return;
    }

    if (!name) {
      showToast("danger", "Subcategory name cannot be empty");
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

            showToast(
              "success",
              response.message || "Subcategory added successfully!"
            );
          } else {
            showToast("danger", "Parent category not found");
          }
        } else {
          showToast("danger", response.message || "Failed to add subcategory");
        }
      } else {
        let errorMessage = "Failed to add subcategory";
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        } catch (e) {
          console.error("Error parsing response:", e);
        }
        showToast("danger", errorMessage);
      }
    };

    xhr.onerror = () => {
      saveSubcategoryBtn.disabled = false;
      saveSubcategoryBtn.innerHTML = originalBtnText;
      showToast("danger", "Network error occurred");
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
        showToast(
          "danger",
          `${field.replace(/([A-Z])/g, " $1").trim()} is required`
        );
        isValid = false;
      }
    });

    if (!form.mainImage.files[0]) {
      showToast("danger", "Main image is required");
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
    formData.append("productDetails", editor1.getHTMLCode());

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    if (userData.role === "admin" || userData.role === "moderator") {
      const shopId = userData.managingShopId || form.shopId?.value;

      if (shopId) {
        formData.append("shopId", shopId);
      } else {
        console.warn("Shop ID is required for admins and moderators");
      }
    }

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
      showToast("danger", "Invalid category selected");
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
      showToast("danger", "Invalid subcategory selected");
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
    formData.append("stockLimit", form.stockLimit.value || "0");
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
          // Add the new product to our allProducts array
          allProducts.push(response.data.product);

          // Reinitialize pagination with the updated product count
          initializePagination(allProducts.length);

          // Redisplay products with the updated list
          sortAndDisplayProducts();

          form.reset();

          const addProductModalEl = document.getElementById("addProductModal");
          let addProductModal = bootstrap.Modal.getInstance(addProductModalEl);
          if (!addProductModal) {
            addProductModal = new bootstrap.Modal(addProductModalEl);
          }
          addProductModal.hide();
          form.reset();
          showToast("success", "Product added successfully!");
        } else {
          showToast("danger", response.message || "Failed to add product");
        }
      } else {
        let errorMessage = "Failed to add product";
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || errorMessage;
        } catch (e) {
          console.error("Error parsing response:", e);
        }
        showToast("danger", errorMessage);
      }
    };

    xhr.onerror = () => {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      showToast("danger", "Network error occurred");
    };

    xhr.send(formData);
  });

  const editProductForm = document.getElementById("editProductForm");
  if (editProductForm) {
    editProductForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleProductUpdate(e.target);
    });
  }

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
