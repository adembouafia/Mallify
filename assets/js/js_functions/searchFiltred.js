;(() => {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Search Form Handler initialized")

    const searchForms = document.querySelectorAll("form.form-location-wrapper, form.search-form, form.search-box")

    searchForms.forEach((form) => {
      console.log("Found search form:", form)
      form.addEventListener("submit", function (e) {
        e.preventDefault()
        const searchInput = this.querySelector('input[type="text"], .form-control, .search-form__input')

        if (!searchInput) {
          console.warn("Could not find search input in form")
          return
        }
        const searchTerm = searchInput.value.trim()
        const categoryDropdown = this.querySelector('select[name="category"]')
        let category = ""

        if (categoryDropdown) {
          category = categoryDropdown.value
          console.log("Category dropdown value:", category)
        }
        console.log("Search Term:", searchTerm)
        console.log("Category:", category)
        let url = "shop.html"
        const params = []

        if (searchTerm) {
          params.push("name=" + encodeURIComponent(searchTerm) + "&search=" + encodeURIComponent(searchTerm))
        }
        if (category && category !== "1" && category !== "All Categories") {
          params.push("category=" + encodeURIComponent(category))
        }

        if (params.length > 0) {
          url += "?" + params.join("&")
        }

        console.log("Redirecting to URL:", url)
        window.location.href = url
      })
    })
    const searchButtons = document.querySelectorAll('button[type="submit"], .search-form__button')

    searchButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault()
        const form = this.closest("form")

        if (form) {
          form.dispatchEvent(new Event("submit"))
        } else {
          console.warn("No parent form found for search button")
        }
      })
    })
    const searchIcon = document.getElementById("searchIcon")
    if (searchIcon) {
      const iconButton = searchIcon.closest("button")
      if (iconButton) {
        iconButton.addEventListener("click", function (e) {
          e.preventDefault()
          const form = this.closest("form")

          if (form) {
            form.dispatchEvent(new Event("submit"))
          } else {
            console.warn("No parent form found for search icon button")
          }
        })
      }
    }

    const headerCategoryDropdowns = document.querySelectorAll(
      'header select[name="category"], .navbar select[name="category"]',
    )
    headerCategoryDropdowns.forEach((dropdown) => {
      console.log("Found header category dropdown:", dropdown)

      if (!dropdown.closest("form.form-location-wrapper, form.search-form, form.search-box")) {
        dropdown.addEventListener("change", function () {
          const categoryId = this.value
          console.log("Header category dropdown changed to:", categoryId)

          if (categoryId && categoryId !== "1" && categoryId !== "All Categories") {
            window.location.href = `shop.html?category=${encodeURIComponent(categoryId)}`
          }
        })
      }
    })
    const categoryButtons = document.querySelectorAll(".category__button")
    categoryButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        const categoryContainer = this.closest(".category, .category-two")
        if (categoryContainer) {
          const dropdown = categoryContainer.querySelector(".responsive-dropdown")
          if (dropdown) {
            dropdown.classList.toggle("show")
          }
        }
      })
    })

    const categoryMap = {}

    function fetchCategoriesForMapping() {
      const xhr = new XMLHttpRequest()
      xhr.open("GET", "http://localhost:3000/categorieswithsubcategories", true)
      xhr.setRequestHeader("Content-Type", "application/json")

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)

            if (response && response.categories) {
              response.categories.forEach((category) => {
                categoryMap[category.categoryName.toLowerCase()] = category._id

                // Also map subcategories if they exist
                if (category.subCategories && Array.isArray(category.subCategories)) {
                  category.subCategories.forEach((subCategory) => {
                    categoryMap[subCategory.name.toLowerCase()] = subCategory._id
                  })
                }
              })

              console.log("Category mapping built:", categoryMap)
            }
          } catch (error) {
            console.error("Error parsing category data for mapping:", error)
          }
        }
      }

      xhr.send()
    }

    fetchCategoriesForMapping()

    document.querySelectorAll(".responsive-dropdown .has-submenus-submenu > a").forEach((link) => {
      link.addEventListener("click", function (e) {
        const categoryName = this.querySelector("span:not(.icon)").textContent.trim()
        console.log("Header category clicked:", categoryName)

        const hasSubmenu = this.nextElementSibling && this.nextElementSibling.classList.contains("submenus-submenu")

        if (hasSubmenu) {
          e.preventDefault()
          const submenu = this.nextElementSibling
          submenu.classList.toggle("active")
        } else {
          e.preventDefault()

          const categoryId = categoryMap[categoryName.toLowerCase()]

          if (categoryId) {
            console.log("Found category ID:", categoryId, "for category:", categoryName)
            window.location.href = `shop.html?category=${encodeURIComponent(categoryId)}`
          } else {
            console.log("Category ID not found, using name:", categoryName)
            window.location.href = `shop.html?name=${encodeURIComponent(categoryName)}`
          }
        }
      })
    })
    document.querySelectorAll(".submenus-submenu__list li a").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault()
        const subcategoryName = this.textContent.trim()
        console.log("Header subcategory clicked:", subcategoryName)

        const subcategoryId = categoryMap[subcategoryName.toLowerCase()]

        if (subcategoryId) {
          console.log("Found subcategory ID:", subcategoryId, "for subcategory:", subcategoryName)
          window.location.href = `shop.html?subcategory=${encodeURIComponent(subcategoryId)}`
        } else {
          console.log("Subcategory ID not found, using name:", subcategoryName)
          window.location.href = `shop.html?name=${encodeURIComponent(subcategoryName)}`
        }
      })
    })
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".category, .category-two")) {
        document.querySelectorAll(".responsive-dropdown").forEach((dropdown) => {
          dropdown.classList.remove("show")
        })
      }
    })
    document.querySelectorAll(".close-responsive-dropdown").forEach((closeBtn) => {
      closeBtn.addEventListener("click", function () {
        const dropdown = this.closest(".responsive-dropdown")
        if (dropdown) {
          dropdown.classList.remove("show")
        }
      })
    })
  })
})()
