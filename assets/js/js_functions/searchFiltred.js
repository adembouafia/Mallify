/**
 * Search Form Handler
 * Handles the search form with category dropdown and product name search
 */
;(() => {
  // Run when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Search Form Handler initialized")

    // Find all search forms
    const searchForms = document.querySelectorAll("form.form-location-wrapper, form.search-form, form.search-box")

    searchForms.forEach((form) => {
      console.log("Found search form:", form)

      // Add submit event handler
      form.addEventListener("submit", function (e) {
        // Prevent the default form submission
        e.preventDefault()

        // Get the search input
        const searchInput = this.querySelector('input[type="text"], .form-control, .search-form__input')

        if (!searchInput) {
          console.warn("Could not find search input in form")
          return
        }

        // Get the search term
        const searchTerm = searchInput.value.trim()

        // Get the category
        const categoryDropdown = this.querySelector('select[name="category"]')
        let category = ""

        if (categoryDropdown) {
          category = categoryDropdown.value
          console.log("Category dropdown value:", category)
        }

        // Log the search term and category
        console.log("Search Term:", searchTerm)
        console.log("Category:", category)

        // Construct the URL
        let url = "shop.html"
        const params = []

        // Only add search parameters if we have a search term
        if (searchTerm) {
          params.push("name=" + encodeURIComponent(searchTerm) + "&search=" + encodeURIComponent(searchTerm))
        }

        // Always include category if it's valid (not empty and not the default "1" value)
        if (category && category !== "1" && category !== "All Categories") {
          params.push("category=" + encodeURIComponent(category))
        }

        // Add parameters to URL if we have any
        if (params.length > 0) {
          url += "?" + params.join("&")
        }

        console.log("Redirecting to URL:", url)

        // Redirect to the search results page
        window.location.href = url
      })
    })

    // Find all search buttons
    const searchButtons = document.querySelectorAll('button[type="submit"], .search-form__button')

    searchButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        // Prevent the default button action
        e.preventDefault()

        // Find the parent form
        const form = this.closest("form")

        if (form) {
          // Trigger the form's submit event
          form.dispatchEvent(new Event("submit"))
        } else {
          console.warn("No parent form found for search button")
        }
      })
    })

    // Special handling for mobile search icon
    const searchIcon = document.getElementById("searchIcon")
    if (searchIcon) {
      const iconButton = searchIcon.closest("button")
      if (iconButton) {
        iconButton.addEventListener("click", function (e) {
          // Prevent the default button action
          e.preventDefault()

          // Find the parent form
          const form = this.closest("form")

          if (form) {
            // Trigger the form's submit event
            form.dispatchEvent(new Event("submit"))
          } else {
            console.warn("No parent form found for search icon button")
          }
        })
      }
    }

    // Handle standalone category dropdowns in the header
    const headerCategoryDropdowns = document.querySelectorAll(
      'header select[name="category"], .navbar select[name="category"]',
    )
    headerCategoryDropdowns.forEach((dropdown) => {
      console.log("Found header category dropdown:", dropdown)

      // Only add event listener if not inside a search form
      if (!dropdown.closest("form.form-location-wrapper, form.search-form, form.search-box")) {
        dropdown.addEventListener("change", function () {
          const categoryId = this.value
          console.log("Header category dropdown changed to:", categoryId)

          // Only redirect if a valid category is selected
          if (categoryId && categoryId !== "1" && categoryId !== "All Categories") {
            window.location.href = `shop.html?category=${encodeURIComponent(categoryId)}`
          }
        })
      }
    })

    // Add this code at the end of the DOMContentLoaded event listener to handle the header category dropdown

    // Handle header category dropdown clicks
    const categoryButtons = document.querySelectorAll(".category__button")
    categoryButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        // Find the closest category container
        const categoryContainer = this.closest(".category, .category-two")
        if (categoryContainer) {
          // Toggle the dropdown visibility on mobile
          const dropdown = categoryContainer.querySelector(".responsive-dropdown")
          if (dropdown) {
            dropdown.classList.toggle("show")
          }
        }
      })
    })

    // First, let's fetch the categories to map names to IDs
    const categoryMap = {}

    // Function to fetch categories and build the map
    function fetchCategoriesForMapping() {
      const xhr = new XMLHttpRequest()
      xhr.open("GET", "http://localhost:3000/categorieswithsubcategories", true)
      xhr.setRequestHeader("Content-Type", "application/json")

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)

            if (response && response.categories) {
              // Build a map of category names to IDs
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

    // Call the function to fetch categories and build the map
    fetchCategoriesForMapping()

    // Handle category item clicks in the header dropdown
    document.querySelectorAll(".responsive-dropdown .has-submenus-submenu > a").forEach((link) => {
      link.addEventListener("click", function (e) {
        // Get the category name from the link text
        const categoryName = this.querySelector("span:not(.icon)").textContent.trim()
        console.log("Header category clicked:", categoryName)

        // Check if we have a submenu
        const hasSubmenu = this.nextElementSibling && this.nextElementSibling.classList.contains("submenus-submenu")

        if (hasSubmenu) {
          // If it has a submenu, prevent default navigation and toggle the submenu
          e.preventDefault()
          const submenu = this.nextElementSibling
          submenu.classList.toggle("active")
        } else {
          // If no submenu, prevent default and redirect to shop with category
          e.preventDefault()

          // Try to find the category ID from our map
          const categoryId = categoryMap[categoryName.toLowerCase()]

          if (categoryId) {
            console.log("Found category ID:", categoryId, "for category:", categoryName)
            window.location.href = `shop.html?category=${encodeURIComponent(categoryId)}`
          } else {
            // Fallback to using the category name if we don't have the ID
            console.log("Category ID not found, using name:", categoryName)
            window.location.href = `shop.html?name=${encodeURIComponent(categoryName)}`
          }
        }
      })
    })

    // Handle subcategory clicks in the header dropdown
    document.querySelectorAll(".submenus-submenu__list li a").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault()

        // Get the subcategory name
        const subcategoryName = this.textContent.trim()
        console.log("Header subcategory clicked:", subcategoryName)

        // Try to find the subcategory ID from our map
        const subcategoryId = categoryMap[subcategoryName.toLowerCase()]

        if (subcategoryId) {
          console.log("Found subcategory ID:", subcategoryId, "for subcategory:", subcategoryName)
          window.location.href = `shop.html?category=${encodeURIComponent(subcategoryId)}`
        } else {
          // Fallback to using the subcategory name if we don't have the ID
          console.log("Subcategory ID not found, using name:", subcategoryName)
          window.location.href = `shop.html?name=${encodeURIComponent(subcategoryName)}`
        }
      })
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".category, .category-two")) {
        document.querySelectorAll(".responsive-dropdown").forEach((dropdown) => {
          dropdown.classList.remove("show")
        })
      }
    })

    // Close button functionality
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
