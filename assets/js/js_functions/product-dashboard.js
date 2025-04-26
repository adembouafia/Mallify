// Define categories and subcategories
const categories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Clothing" },
  { id: 3, name: "Home & Kitchen" },
  { id: 4, name: "Books" },
  { id: 5, name: "Sports" },
]

const subcategories = {
  Electronics: ["Smartphones", "Laptops", "Cameras", "Audio", "Accessories"],
  Clothing: ["Men's Wear", "Women's Wear", "Kids", "Shoes", "Accessories"],
  "Home & Kitchen": ["Furniture", "Kitchen Appliances", "Decor", "Bedding", "Storage"],
  Books: ["Fiction", "Non-fiction", "Academic", "Children's Books", "Comics"],
  Sports: ["Fitness", "Outdoor", "Team Sports", "Water Sports", "Winter Sports"],
}

document.addEventListener("DOMContentLoaded", () => {
  populateCategoryDropdown()

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

    categories.forEach((category) => {
      const option = document.createElement("option")
      option.value = category.name
      option.textContent = category.name
      subcatCategorySelect.appendChild(option)
    })

    const addSubcategoryModal = new bootstrap.Modal(document.getElementById("addSubcategoryModal"))
    addSubcategoryModal.show()
  })

  document.getElementById("saveCategoryBtn").addEventListener("click", () => {
    const newCategoryName = document.getElementById("newCategoryName").value.trim()

    if (newCategoryName) {
      const newId = categories.length + 1
      categories.push({ id: newId, name: newCategoryName })

      subcategories[newCategoryName] = []

      populateCategoryDropdown()

      document.getElementById("productCategory").value = newCategoryName

      populateSubcategoryDropdown(newCategoryName)

      const addCategoryModalEl = document.getElementById("addCategoryModal")
      const addCategoryModal = bootstrap.Modal.getInstance(addCategoryModalEl)
      if (addCategoryModal) {
        addCategoryModal.hide()
      }
      document.getElementById("newCategoryName").value = ""
    }
  })

  document.getElementById("saveSubcategoryBtn").addEventListener("click", () => {
    const parentCategory = document.getElementById("subcategoryCategory").value
    const newSubcategoryName = document.getElementById("newSubcategoryName").value.trim()

    if (parentCategory && newSubcategoryName) {
      // Add to 
      if (!subcategories[parentCategory]) {
        subcategories[parentCategory] = []
      }

      subcategories[parentCategory].push(newSubcategoryName)

      if (document.getElementById("productCategory").value === parentCategory) {
        populateSubcategoryDropdown(parentCategory)

        document.getElementById("productSubcategory").value = newSubcategoryName
      }

      const addSubcategoryModalEl = document.getElementById("addSubcategoryModal")
      const addSubcategoryModal = bootstrap.Modal.getInstance(addSubcategoryModalEl)
      if (addSubcategoryModal) {
        addSubcategoryModal.hide()
      }
      document.getElementById("newSubcategoryName").value = ""
    }
  })

  // Form submission
  document.getElementById("addProductForm").addEventListener("submit", (e) => {
    e.preventDefault()
    const form = e.target

    const product = {
      productId: form.productId.value,
      productName: form.productName.value,
      productPrice: Number.parseFloat(form.productPrice.value),
      productCategory: form.productCategory.value,
      productSubcategory: form.productSubcategory.value,
      Availability: form.Availability.value === "in_stock" ? "In Stock" : "Out of Stock",
      Stock: Number.parseInt(form.Stock.value, 10),
      description: form.description.value,
      mainImageFile: form.mainImage.files[0],
      otherImageFiles: Array.from(form.otherImages.files),
    }

    const mainImageURL = URL.createObjectURL(product.mainImageFile)

    console.log("Product data:", product)

    const tbody = document.getElementById("productTableBody")
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td class="fw-semibold">${product.productId}</td>
      <td>
        <div class="d-flex align-items-center gap-3">
          <div class="bg-light rounded">
            <img src="${mainImageURL}" alt="${product.productName}" style="width:70px; height:70px;">
          </div>
          <div>
            <a href="#!" class="text-dark fw-semibold text-decoration-none">
              ${product.productName}
            </a>
            <p class="text-muted mb-0 mt-1 small">${product.description}</p>
          </div>
        </div>
      </td>
      <td>$${product.productPrice.toFixed(2)}</td>
      <td>
        <div class="text-muted">
          <span class="fw-semibold text-dark">${product.Stock}</span><br> Item Left<br>
          <span>0 Sold</span>
        </div>
      </td>
      <td>
        <span class="badge bg-soft-primary text-primary">${product.productCategory}</span>
        <span class="badge bg-soft-secondary text-secondary">${product.productSubcategory}</span>
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
        <a href="detailsProduct.html" class="btn btn-sm bg-light text-secondary" title="View Details">
            <i class="bi bi-eye"></i>
        </a>
        <button class="btn btn-sm bg-light text-warning editProductBtn" title="Edit">
            <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm bg-light text-danger" title="Delete">
            <i class="bi bi-trash"></i>
        </button>
      </td>
    `

    tbody.insertBefore(tr, tbody.firstElementChild)

    form.reset()
    const addProductModalEl = document.getElementById("addProductModal")
    const addProductModal = bootstrap.Modal.getInstance(addProductModalEl)
    if (addProductModal) {
      addProductModal.hide()
    }
  })
})

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
    option.value = category.name
    option.textContent = category.name
    if (category.name === currentSelection) {
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
      option.value = subcategory
      option.textContent = subcategory
      subcategorySelect.appendChild(option)
    })
  }
}
