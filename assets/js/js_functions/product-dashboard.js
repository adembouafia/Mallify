let categories = []
const subcategories = {}

const token = localStorage.getItem('token'); 

document.addEventListener("DOMContentLoaded", () => {
  loadProducts()
  loadCategories()

  document.getElementById("productCategory").addEventListener("change", function () {
    populateSubcategoryDropdown(this.value)
  })

  document.getElementById("addCategoryBtn").addEventListener("click", () => {
    const addCategoryModal = new bootstrap.Modal(document.getElementById("addCategoryModal"))
    addCategoryModal.show()
  })

  document.getElementById("addSubcategoryBtn").addEventListener("click", () => {
    const subcatCategorySelect = document.getElementById("subcategoryCategory")
    subcatCategorySelect.innerHTML = ""

    const defaultOption = document.createElement("option")
    defaultOption.value = ""
    defaultOption.textContent = "Select a category"
    defaultOption.disabled = true
    defaultOption.selected = true
    subcatCategorySelect.appendChild(defaultOption)

    categories.forEach((category) => {
      const option = document.createElement("option")
      option.value = category._id
      option.textContent = category.categoryName || category.name 
      subcatCategorySelect.appendChild(option)
    })

    document.getElementById("newSubcategoryName").value = ""

    const addSubcategoryModal = new bootstrap.Modal(document.getElementById("addSubcategoryModal"))
    addSubcategoryModal.show()
  })

  const categoryList = document.getElementById("categoryList")
  const subcategoryList = document.getElementById("subcategoryList")
  const saveCategoryBtn = document.getElementById("saveCategoryBtn")
  const saveSubcategoryBtn = document.getElementById("saveSubcategoryBtn")

  saveCategoryBtn.addEventListener("click", () => {
    const categoryName = document.getElementById("newCategoryName").value.trim()

    if (!categoryName) {
      showAlert("danger", "Category name cannot be empty")
      return
    }

    
    saveCategoryBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...'

    saveCategoryBtn.disabled = true

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "http://localhost:3000/category/create", true)
    xhr.setRequestHeader("Content-Type", "application/json")
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      saveCategoryBtn.disabled = false
      saveCategoryBtn.innerHTML = "Save Category"

      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText)

        if (response.status === "success" && response.data && response.data.category) {
          // Add the new category to the categories array
          categories.push(response.data.category)
          subcategories[response.data.category.categoryName] = []

          // Update the category dropdown
          populateCategoryDropdown()
          
          // Set the newly created category as selected
          const categorySelect = document.getElementById("productCategory")
          categorySelect.value = response.data.category.categoryName

          // Hide the modal after successful save
          const addCategoryModalEl = document.getElementById("addCategoryModal")
          const addCategoryModal = bootstrap.Modal.getInstance(addCategoryModalEl)
          if (addCategoryModal) {
            addCategoryModal.hide()
          }
          document.getElementById("newCategoryName").value = ""

          showAlert("success", "Category added successfully!")
        } else {
          showAlert("danger", response.message || "Failed to add category")
        }
      } else {
        let errorMessage = "Failed to add category"
        try {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        } catch (e) {
          console.error("Error parsing response:", e)
        }
        showAlert("danger", errorMessage)
      }
    }

    xhr.onerror = () => {
      saveCategoryBtn.disabled = false
      saveCategoryBtn.innerHTML = "Save Category"

      showAlert("danger", "Network error occurred")
    }

    console.log("Sending category data:", { categoryName })

    xhr.send(JSON.stringify({ categoryName }))
  })

  saveSubcategoryBtn.addEventListener("click", () => {
    const category = document.getElementById("subcategoryCategory").value
    const name = document.getElementById("newSubcategoryName").value.trim()

    if (!category) {
      showAlert("danger", "Please select a category")
      return
    }

    if (!name) {
      showAlert("danger", "Subcategory name cannot be empty")
      return
    }

    // Add loading state
    saveSubcategoryBtn.disabled = true
    saveSubcategoryBtn.innerHTML = 
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...'

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "http://localhost:3000/subcategory/create", true)
    xhr.setRequestHeader("Content-Type", "application/json")
    
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      // Reset button state
      saveSubcategoryBtn.disabled = false
      saveSubcategoryBtn.innerHTML = "Save Subcategory"

      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText)

        // Find the parent category by ID
        const parentCategory = categories.find((cat) => cat._id === category)

        if (parentCategory && response.status === "success" && response.data && response.data.subcategory) {
          const categoryName = parentCategory.categoryName || parentCategory.name;
          
          // Initialize the subcategories array if it doesn't exist
          if (!subcategories[categoryName]) {
            subcategories[categoryName] = []
          }

          // Add the new subcategory to the subcategories array
          subcategories[categoryName].push({
            _id: response.data.subcategory._id,
            name: response.data.subcategory.name,
          })

          // Update the subcategory dropdown if the parent category is currently selected
          const currentCategory = document.getElementById("productCategory").value
          if (currentCategory === categoryName) {
            populateSubcategoryDropdown(categoryName)
            
            // Set the newly created subcategory as selected
            const subcategorySelect = document.getElementById("productSubcategory")
            subcategorySelect.value = response.data.subcategory.name
          }

          // Hide the modal after successful save
          const addSubcategoryModalEl = document.getElementById("addSubcategoryModal")
          const addSubcategoryModal = bootstrap.Modal.getInstance(addSubcategoryModalEl)
          if (addSubcategoryModal) {
            addSubcategoryModal.hide()
          }
          document.getElementById("newSubcategoryName").value = ""

          showAlert("success", "Subcategory added successfully!")
        } else {
          showAlert("danger", response.message || "Failed to add subcategory")
        }
      } else {
        let errorMessage = "Failed to add subcategory"
        try {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        } catch (e) {
          console.error("Error parsing response:", e)
        }
        showAlert("danger", errorMessage)
      }
    }

    xhr.onerror = () => {
      // Reset button state
      saveSubcategoryBtn.disabled = false
      saveSubcategoryBtn.innerHTML = "Save Subcategory"
      showAlert("danger", "Network error occurred")
    }

    xhr.send(
      JSON.stringify({
        name: name,
        category: category,
      }),
    )
  })

  // Function to load categories
  function loadCategoriesOld() {
    categoryList.innerHTML = "" // Clear existing list

    const xhr = new XMLHttpRequest()
    xhr.open("GET", "http://localhost:3000/category/get", true)

    xhr.onload = () => {
      if (xhr.status === 200) {
        const categories = JSON.parse(xhr.responseText)

        // Populate the category list
        categories.forEach((category) => {
          const listItem = document.createElement("li")
          listItem.textContent = category.name
          listItem.addEventListener("click", () => loadSubcategoriesOld(category._id))
          categoryList.appendChild(listItem)

          // Populate the category select dropdown
          const option = document.createElement("option")
          option.value = category._id
          option.textContent = category.name
          document.getElementById("categorySelect").appendChild(option)
        })
      } else {
        alert("Failed to load categories.")
      }
    }

    xhr.send()
  }

  // Function to load subcategories for a given category ID
  function loadSubcategoriesOld(categoryId) {
    subcategoryList.innerHTML = "" // Clear existing list

    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/subcategory/get/category/${categoryId}`, true)

    xhr.onload = () => {
      if (xhr.status === 200) {
        const subcategories = JSON.parse(xhr.responseText)

        // Populate the subcategory list
        subcategories.forEach((subcategory) => {
          const listItem = document.createElement("li")
          listItem.textContent = subcategory.name
          subcategoryList.appendChild(listItem)
        })
      } else {
        alert("Failed to load subcategories.")
      }
    }

    xhr.send()
  }

  // Form submission - Connect to backend API
  document.getElementById("addProductForm").addEventListener("submit", (e) => {
    e.preventDefault()
    const form = e.target

    // Validate required fields
    const requiredFields = [
      "productName",
      "productId",
      "productPrice",
      "productCategory",
      "productSubcategory",
      "Stock",
      "description",
    ]
    let isValid = true

    requiredFields.forEach((field) => {
      if (!form[field] || !form[field].value.trim()) {
        showAlert("danger", `${field.replace(/([A-Z])/g, " $1").trim()} is required`)
        isValid = false
      }
    })

    if (!form.mainImage.files[0]) {
      showAlert("danger", "Main image is required")
      isValid = false
    }

    if (!isValid) return

    // Show loading indicator
    const submitBtn = form.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.innerHTML
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...'
    submitBtn.disabled = true

    // Create FormData object to handle file uploads
    const formData = new FormData()

    // Add all form fields to FormData
    formData.append("productName", form.productName.value)
    formData.append("productId", form.productId.value)
    formData.append("productPrice", form.productPrice.value)

    // Get the subcategory ID based on the selected name
    const selectedCategory = form.productCategory.value
    const selectedSubcategory = form.productSubcategory.value

    // Find the subcategory ID
    let subCategoryId = null
    if (subcategories[selectedCategory]) {
      const subcat = subcategories[selectedCategory].find(
        (sub) => sub.name === selectedSubcategory || sub === selectedSubcategory,
      )
      if (subcat && subcat._id) {
        subCategoryId = subcat._id
      }
    }

    if (!subCategoryId) {
      showAlert("danger", "Invalid subcategory selected")
      submitBtn.innerHTML = originalBtnText
      submitBtn.disabled = false
      return
    }

    formData.append("subCategory", subCategoryId)
    formData.append("availability", form.Availability.value === "in_stock" ? "In stock" : "Out of stock")
    formData.append("stock", form.Stock.value)
    formData.append("description", form.description.value)

    // Add the files
    if (form.mainImage.files[0]) {
      formData.append("mainImage", form.mainImage.files[0])
    }

    if (form.otherImages.files.length > 0) {
      for (let i = 0; i < form.otherImages.files.length; i++) {
        formData.append("otherImages", form.otherImages.files[i])
      }
    }

    // Send data to backend
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "http://localhost:3000/product/create", true)
    
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      submitBtn.innerHTML = originalBtnText
      submitBtn.disabled = false

      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText)

        if (response.status === "success" && response.data && response.data.product) {
          // Add the new product to the table
          addProductToTable(response.data.product)

          // Reset form and close modal
          form.reset()
          
          // Hide the modal after successful save
          const addProductModalEl = document.getElementById("addProductModal")
          let addProductModal = bootstrap.Modal.getInstance(addProductModalEl)
          if (!addProductModal) {
            addProductModal = new bootstrap.Modal(addProductModalEl);
          }
          addProductModal.hide()

          showAlert("success", "Product added successfully!")

          // Refresh product list
          loadProducts()
        } else {
          showAlert("danger", response.message || "Failed to add product")
        }
      } else {
        let errorMessage = "Failed to add product"
        try {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        } catch (e) {
          console.error("Error parsing response:", e)
        }
        showAlert("danger", errorMessage)
      }
    }

    xhr.onerror = () => {
      submitBtn.innerHTML = originalBtnText
      submitBtn.disabled = false
      showAlert("danger", "Network error occurred")
    }

    xhr.send(formData)
  })

  // Add event listeners for edit and delete buttons
  document.addEventListener("click", (e) => {
    // Edit button
    if (e.target.closest(".editProductBtn")) {
      const productId = e.target.closest(".editProductBtn").getAttribute("data-id")
      editProduct(productId)
    }

    // Delete button
    if (e.target.closest(".deleteProductBtn")) {
      const productId = e.target.closest(".deleteProductBtn").getAttribute("data-id")
      deleteProduct(productId)
    }
  })
})

// Function to load products from the database
function loadProducts() {
  const xhr = new XMLHttpRequest()
  xhr.open("GET", "http://localhost:3000/product/get", true)
  
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText)

      // Clear the table
      const tbody = document.getElementById("productTableBody")
      tbody.innerHTML = ""

      // Add products to the table
      if (response.status === "success" && response.data && response.data.products) {
        response.data.products.forEach((product) => {
          addProductToTable(product)
        })

        // Update product count in the info box
        const productCountElement = document.querySelector(".info-box:nth-child(1) .info-box-number")
        if (productCountElement) {
          productCountElement.textContent = response.data.products.length
        }
      } else {
        showAlert("warning", "No products found")
      }
    } else {
      showAlert("danger", "Failed to load products")
    }
  }

  xhr.onerror = () => {
    showAlert("danger", "Network error occurred")
  }

  xhr.send()
}

// Function to load categories from the database
function loadCategories() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/category", true);
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText);
      console.log("Categories response:", response);

      if (response.categories && Array.isArray(response.categories)) {
        categories = response.categories;
        console.log("Loaded categories:", categories);

        // Load subcategories for each category
        categories.forEach((category) => {
          const categoryName = category.categoryName || category.name; // Handle both field names
          loadSubcategories(category._id, categoryName);
        });

        // Update category count
        const categoryCountElement = document.querySelector(".info-box:nth-child(2) .info-box-number");
        if (categoryCountElement) {
          categoryCountElement.textContent = categories.length;
        }

        // Populate dropdown
        populateCategoryDropdown();
      } else {
        console.warn("No categories found or invalid response format");
      }
    } else {
      showAlert("danger", "Failed to load categories");
    }
  };

  xhr.onerror = () => {
    showAlert("danger", "Network error occurred");
  };

  xhr.send();
}


// Function to load subcategories for a category
function loadSubcategories(categoryId, categoryName) {
  const xhr = new XMLHttpRequest();
  const url = `http://localhost:3000/subcategory/category/${categoryId}`;

  xhr.open("GET", url, true);

  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    console.log(`Response for category ${categoryName}:`, xhr.responseText); // Add logging for response

    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText);

      // Handle case when subcategories are found
      if (response.subCategories && Array.isArray(response.subCategories)) {
        subcategories[categoryName] = response.subCategories; // Ensure using correct field (subCategories)

        // If this is the currently selected category, update the subcategory dropdown
        const currentCategory = document.getElementById("productCategory").value;
        if (currentCategory === categoryName) {
          populateSubcategoryDropdown(categoryName);
        }
      } else if (xhr.status === 404 || (response.subCategories && response.subCategories.length === 0)) {
        // No subcategories found, just initialize an empty array for the category
        subcategories[categoryName] = [];
      } else {
        console.error("Failed to load subcategories for", categoryName, response);
      }
    } else {
      console.error("Failed to load subcategories for", categoryName, xhr.status, xhr.statusText);
    }
  };

  xhr.onerror = function () {
    console.error("Network error loading subcategories for", categoryName);
  };

  xhr.send();
}



function populateCategoryDropdown() {
  const categorySelect = document.getElementById("productCategory")
  const currentSelection = categorySelect.value

  categorySelect.innerHTML = ""

  const defaultOption = document.createElement("option")
  defaultOption.value = ""
  defaultOption.textContent = "Select a category"
  defaultOption.disabled = true
  defaultOption.selected = !currentSelection
  categorySelect.appendChild(defaultOption)

  categories.forEach((category) => {
    const option = document.createElement("option")
    const categoryName = category.categoryName || category.name // Handle both field names
    option.value = categoryName
    option.textContent = categoryName
    if (categoryName === currentSelection) {
      option.selected = true
    }
    categorySelect.appendChild(option)
  })
}

function populateSubcategoryDropdown(categoryName) {
  const subcategorySelect = document.getElementById("productSubcategory")

  subcategorySelect.innerHTML = ""

  const defaultOption = document.createElement("option")
  defaultOption.value = ""
  defaultOption.textContent = "Select a subcategory"
  defaultOption.disabled = true
  defaultOption.selected = true
  subcategorySelect.appendChild(defaultOption)

  if (categoryName && subcategories[categoryName]) {
    subcategories[categoryName].forEach((subcategory) => {
      const option = document.createElement("option")
      option.value = subcategory.name || subcategory
      option.textContent = subcategory.name || subcategory
      subcategorySelect.appendChild(option)
    })
  }
}

function addProductToTable(product) {
  const tbody = document.getElementById("productTableBody")
  const tr = document.createElement("tr")

  // Create image URL - adjust the path based on your server setup
  const imageUrl = product.mainImage ? `/uploads/${product.mainImage}` : "/images/placeholder-product.png"

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
  `

  tbody.insertBefore(tr, tbody.firstElementChild)
}

function editProduct(productId) {
  // Fetch product details
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true)
  
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText)

      if (response.status === "success" && response.data && response.data.product) {
        const product = response.data.product
        const form = document.getElementById("addProductForm")

        // Set form values
        form.productName.value = product.productName
        form.productId.value = product.productId
        form.productPrice.value = product.productPrice
        form.Stock.value = product.stock
        form.Availability.value = product.availability === "In stock" ? "in_stock" : "out_of_stock"
        form.description.value = product.description

        // Set category and subcategory
        if (product.subCategory && product.subCategory.category) {
          const categoryName = getCategoryNameById(product.subCategory.category)
          if (categoryName) {
            form.productCategory.value = categoryName
            populateSubcategoryDropdown(categoryName)

            // Set subcategory after populating dropdown
            setTimeout(() => {
              form.productSubcategory.value = product.subCategory.name
            }, 100)
          }
        }

        // Set form mode to edit
        form.dataset.mode = "edit"
        form.dataset.productId = productId

        // Update modal title and button text
        document.getElementById("addProductModalLabel").textContent = "Edit Product"
        form.querySelector('button[type="submit"]').textContent = "Update Product"

        // Show modal
        const addProductModalEl = document.getElementById("addProductModal")
        let addProductModal = bootstrap.Modal.getInstance(addProductModalEl)
        if (!addProductModal) {
          addProductModal = new bootstrap.Modal(addProductModalEl);
        }
        addProductModal.show()
      } else {
        showAlert("danger", "Failed to load product details")
      }
    } else {
      showAlert("danger", "Failed to load product details")
    }
  }

  xhr.onerror = () => {
    showAlert("danger", "Network error occurred")
  }

  xhr.send()
}

function deleteProduct(productId) {
  if (confirm("Are you sure you want to delete this product?")) {
    const xhr = new XMLHttpRequest()
    xhr.open("DELETE", `http://localhost:3000/product/delete/${productId}`, true)
    
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Remove from table
        const row = document.querySelector(`.deleteProductBtn[data-id="${productId}"]`).closest("tr")
        if (row) {
          row.remove()
        }

        showAlert("success", "Product deleted successfully")

        // Refresh product list
        loadProducts()
      } else {
        showAlert("danger", "Failed to delete product")
      }
    }

    xhr.onerror = () => {
      showAlert("danger", "Network error occurred")
    }

    xhr.send()
  }
}

function getCategoryNameById(categoryId) {
  const category = categories.find((cat) => cat._id === categoryId)
  return category ? (category.categoryName || category.name) : null
}

function showAlert(type, message) {
  // Create alert element
  const alertDiv = document.createElement("div")
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`
  alertDiv.role = "alert"
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `

  // Add to the page
  const container = document.querySelector(".container")
  container.insertBefore(alertDiv, container.firstChild)

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      const bsAlert = bootstrap.Alert.getInstance(alertDiv) || new bootstrap.Alert(alertDiv);
      bsAlert.close()
    }
  }, 5000)
}

// Handle modal reset when closed
document.getElementById("addProductModal").addEventListener("hidden.bs.modal", () => {
  const form = document.getElementById("addProductForm")

  // Only reset if not in edit mode or explicitly requested
  if (form.dataset.mode !== "edit") {
    form.reset()
  }

  form.dataset.mode = "create"
  form.dataset.productId = ""

  // Reset modal title and button text
  document.getElementById("addProductModalLabel").textContent = "Add New Product"
  form.querySelector('button[type="submit"]').textContent = "Add Product"
})

// Handle form submission based on mode (create or edit)
document.getElementById("addProductForm").addEventListener("submit", function (e) {
  // If in edit mode, handle differently
  if (this.dataset.mode === "edit" && this.dataset.productId) {
    e.preventDefault()

    // Show loading indicator
    const submitBtn = this.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.innerHTML
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...'
    submitBtn.disabled = true

    // Create FormData object
    const formData = new FormData()

    // Add all form fields to FormData
    formData.append("productName", this.productName.value)
    formData.append("productId", this.productId.value)
    formData.append("productPrice", this.productPrice.value)

    // Get the subcategory ID based on the selected name
    const selectedCategory = this.productCategory.value
    const selectedSubcategory = this.productSubcategory.value

    // Find the subcategory ID
    let subCategoryId = null
    if (subcategories[selectedCategory]) {
      const subcat = subcategories[selectedCategory].find(
        (sub) => sub.name === selectedSubcategory || sub === selectedSubcategory,
      )
      if (subcat && subcat._id) {
        subCategoryId = subcat._id
      }
    }

    if (!subCategoryId) {
      showAlert("danger", "Invalid subcategory selected")
      submitBtn.innerHTML = originalBtnText
      submitBtn.disabled = false
      return
    }

    formData.append("subCategory", subCategoryId)
    formData.append("availability", this.Availability.value === "in_stock" ? "In stock" : "Out of stock")
    formData.append("stock", this.Stock.value)
    formData.append("description", this.description.value)

    // Add the files if provided
    if (this.mainImage.files[0]) {
      formData.append("mainImage", this.mainImage.files[0])
    }

    if (this.otherImages.files.length > 0) {
      for (let i = 0; i < this.otherImages.files.length; i++) {
        formData.append("otherImages", this.otherImages.files[i])
      }
    }

    // Send data to backend
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", `http://localhost:3000/product/update/${this.dataset.productId}`, true)
    
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      submitBtn.innerHTML = originalBtnText
      submitBtn.disabled = false

      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText)

        if (response.status === "success") {
          // Reset form and close modal
          this.reset()
          
          // Hide the modal after successful save
          const addProductModalEl = document.getElementById("addProductModal")
          let addProductModal = bootstrap.Modal.getInstance(addProductModalEl)
          if (!addProductModal) {
            addProductModal = new bootstrap.Modal(addProductModalEl);
          }
          addProductModal.hide()

          showAlert("success", "Product updated successfully!")

          // Refresh product list
          loadProducts()
        } else {
          showAlert("danger", response.message || "Failed to update product")
        }
      } else {
        let errorMessage = "Failed to update product"
        try {
          const response = JSON.parse(xhr.responseText)
          errorMessage = response.message || errorMessage
        } catch (e) {
          console.error("Error parsing response:", e)
        }
        showAlert("danger", errorMessage)
      }
    }

    xhr.onerror = () => {
      submitBtn.innerHTML = originalBtnText
      submitBtn.disabled = false
      showAlert("danger", "Network error occurred")
    }

    xhr.send(formData)
  }
})