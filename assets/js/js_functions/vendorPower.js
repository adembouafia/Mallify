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
  }
  
  // Vendor/Moderator dock items
  const dockItems = [
    {
      icon: "https://cdn-icons-png.flaticon.com/512/1159/1159633.png",
      label: "Edit Product",
      className: "edit-product-icon",
      action: "editProduct",
    },
    {
      icon: "https://cdn-icons-png.flaticon.com/512/1214/1214428.png",
      label: "Delete Product",
      className: "delete-product-icon",
      action: "deleteProduct",
    },
  ]
  
  // DOM elements
  const dockPanel = document.querySelector(".dock-panel")
  const dockOuter = document.querySelector(".dock-outer")
  let quillEditor // Variable pour stocker l'instance de l'éditeur Quill
  
  // Helper function to get URL parameters
  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(name)
  }
  
  // Helper function to get user data from localStorage
  function getUserData() {
    const userData = localStorage.getItem("userData")
    if (!userData) return null
  
    try {
      return JSON.parse(userData)
    } catch (e) {
      console.error("Error parsing user data:", e)
      return null
    }
  }
  
  // Check if the current user is a vendor or moderator and has access to the product
  function checkProductAccess(callback) {
    const productId = getUrlParameter("id")
    if (!productId) {
      console.error("Product ID not found in URL")
      callback(false)
      return
    }
  
    const userData = getUserData()
    if (!userData) {
      console.error("User data not found")
      callback(false)
      return
    }
  
    // Check if user is a vendor or moderator
    if (userData.role !== "vendor" && userData.role !== "moderator") {
      console.error("User is not a vendor or moderator")
      callback(false)
      return
    }
  
    // Fetch product details
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("Authentication token not found")
      callback(false)
      return
    }
  
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("Content-Type", "application/json")
  
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          const product = response.data?.product
  
          if (!product) {
            console.error("Product not found in response")
            callback(false)
            return
          }
  
          // For vendors, check if the product belongs to their shop
          if (userData.role === "vendor") {
            const vendorShopId = userData.shopId || (userData.shop && userData.shop._id)
  
            if (!vendorShopId) {
              console.error("Vendor shop ID not found")
              callback(false)
              return
            }
  
            const productShopId = typeof product.shop === "string" ? product.shop : product.shop._id
  
            if (vendorShopId !== productShopId) {
              console.error("Product does not belong to vendor's shop")
              callback(false)
              return
            }
          }
          window.currentProduct = product
          callback(true)
        } catch (error) {
          console.error("Error parsing product data:", error)
          callback(false)
        }
      } else {
        console.error("Failed to fetch product details")
        callback(false)
      }
    }
  
    xhr.onerror = () => {
      console.error("Network error occurred while fetching product")
      callback(false)
    }
  
    xhr.send()
  }
  
  // Edit product function
  function editProduct() {
    const product = window.currentProduct
    if (!product) {
      Swal.fire({
        title: "Error!",
        text: "Product data not found",
        icon: "error",
      })
      return
    }
  
    // Initialize Quill rich text editor if not already initialized
    if (!quillEditor && typeof Quill !== "undefined") {
      quillEditor = new Quill("#editRichTextEditor", {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ color: [] }, { background: [] }],
            ["link", "image"],
            ["clean"],
          ],
        },
      })
    }
  
    // Fill the form with product data
    document.getElementById("editProductName").value = product.name || ""
    document.getElementById("editProductId").value = product._id || ""
    document.getElementById("editProductPrice").value = product.price || ""
    document.getElementById("editStock").value = product.stock || 0
    document.getElementById("editAvailability").value = product.availability || "in_stock"
    document.getElementById("editDescription").value = product.description || ""
  
    // Set rich text editor content
    if (quillEditor) {
      quillEditor.root.innerHTML = product.details || ""
    }
  
    // Display current main image if available
    const currentMainImageContainer = document.getElementById("currentMainImageContainer")
    if (currentMainImageContainer) {
      currentMainImageContainer.innerHTML = ""
      currentMainImageContainer.style.display = "none"
  
      if (product.mainImage) {
        const img = document.createElement("img")
        img.src = `/uploads/${product.mainImage}`
        img.alt = "Current Main Image"
        img.className = "img-thumbnail mt-2 mb-2"
        img.style.maxHeight = "150px"
  
        currentMainImageContainer.appendChild(img)
        currentMainImageContainer.style.display = "block"
      }
    }
  
    // Show the modal
    const editProductModal = new bootstrap.Modal(document.getElementById("editProductModal"))
    editProductModal.show()
  
    // Set up form submission
    setupFormSubmission()
  }
  
  // Setup form submission
  function setupFormSubmission() {
    const form = document.getElementById("editProductForm")
    if (!form) return
  
    // Remove any existing event listeners
    const newForm = form.cloneNode(true)
    form.parentNode.replaceChild(newForm, form)
  
    newForm.addEventListener("submit", (e) => {
      e.preventDefault()
  
      const productId = document.getElementById("editProductId").value
      if (!productId) {
        Swal.fire({
          title: "Error!",
          text: "Product ID is missing",
          icon: "error",
        })
        return
      }
  
      // Create FormData object
      const formData = new FormData()
      formData.append("name", document.getElementById("editProductName").value)
      formData.append("price", document.getElementById("editProductPrice").value)
      formData.append("stock", document.getElementById("editStock").value)
      formData.append("availability", document.getElementById("editAvailability").value)
      formData.append("description", document.getElementById("editDescription").value)
  
      // Add rich text editor content
      if (quillEditor) {
        formData.append("details", quillEditor.root.innerHTML)
      }
  
      // Add main image if selected
      const mainImageInput = document.getElementById("editMainImage")
      if (mainImageInput.files.length > 0) {
        formData.append("mainImage", mainImageInput.files[0])
      } else if (window.currentProduct.mainImage) {
        formData.append("currentMainImage", window.currentProduct.mainImage)
      }
  
      // Add other images if selected
      const otherImagesInput = document.getElementById("editOtherImages")
      if (otherImagesInput.files.length > 0) {
        for (let i = 0; i < otherImagesInput.files.length; i++) {
          formData.append("otherImages", otherImagesInput.files[i])
        }
      } else if (window.currentProduct.otherImages && window.currentProduct.otherImages.length > 0) {
        formData.append("currentOtherImages", JSON.stringify(window.currentProduct.otherImages))
      }
  
      // Send update request
      const token = localStorage.getItem("token")
      if (!token) {
        Swal.fire({
          title: "Error!",
          text: "Authentication token not found",
          icon: "error",
        })
        return
      }
  
      const xhr = new XMLHttpRequest()
      xhr.open("PUT", `http://localhost:3000/product/update/${productId}`, true)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
  
            // Close the modal
            const editProductModal = bootstrap.Modal.getInstance(document.getElementById("editProductModal"))
            editProductModal.hide()
  
            // Show success message
            Swal.fire({
              title: "Success!",
              text: "Product updated successfully",
              icon: "success",
            }).then(() => {
              // Reload the page to show updated product
              window.location.reload()
            })
          } catch (error) {
            console.error("Error parsing response:", error)
            Swal.fire({
              title: "Error!",
              text: "Failed to update product",
              icon: "error",
            })
          }
        } else {
          let errorMessage = "Failed to update product"
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            errorMessage = errorResponse.message || errorMessage
          } catch (e) {
            // Use default error message
          }
  
          Swal.fire({
            title: "Error!",
            text: errorMessage,
            icon: "error",
          })
        }
      }
  
      xhr.onerror = () => {
        Swal.fire({
          title: "Error!",
          text: "Network error occurred",
          icon: "error",
        })
      }
  
      xhr.send(formData)
    })
  }
  
  // Delete product function
  function deleteProduct() {
    const productId = getUrlParameter("id")
    if (!productId) {
      Swal.fire({
        title: "Error!",
        text: "Product ID not found in URL",
        icon: "error",
      })
      return
    }
  
    Swal.fire({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete this product? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token")
        if (!token) {
          Swal.fire({
            title: "Error!",
            text: "Authentication token not found",
            icon: "error",
          })
          return
        }
  
        const xhr = new XMLHttpRequest()
        xhr.open("DELETE", `http://localhost:3000/product/delete/${productId}`, true)
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.setRequestHeader("Content-Type", "application/json")
  
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            Swal.fire({
              title: "Success!",
              text: "Product deleted successfully",
              icon: "success",
            }).then(() => {
              // Redirect to products page or dashboard
              window.location.href = "/dashboard/products.html"
            })
          } else {
            let errorMessage = "Failed to delete product"
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              errorMessage = errorResponse.message || errorMessage
            } catch (e) {
              // Use default error message
            }
  
            Swal.fire({
              title: "Error!",
              text: errorMessage,
              icon: "error",
            })
          }
        }
  
        xhr.onerror = () => {
          Swal.fire({
            title: "Error!",
            text: "Network error occurred",
            icon: "error",
          })
        }
  
        xhr.send()
      }
    })
  }
  
  // Create dock items
  function createDockItems() {
    dockItems.forEach((item, index) => {
      const dockItem = document.createElement("div")
      dockItem.className = `dock-item ${item.className || ""}`
      dockItem.tabIndex = 0
      dockItem.setAttribute("role", "button")
      dockItem.setAttribute("aria-haspopup", "true")
  
      const dockIcon = document.createElement("div")
      dockIcon.className = "dock-icon"
  
      const img = document.createElement("img")
      img.src = item.icon
      img.alt = item.label
  
      const dockLabel = document.createElement("div")
      dockLabel.className = "dock-label"
      dockLabel.textContent = item.label
  
      dockIcon.appendChild(img)
      dockItem.appendChild(dockIcon)
      dockItem.appendChild(dockLabel)
  
      dockPanel.appendChild(dockItem)
  
      // Add click event
      dockItem.addEventListener("click", () => {
        console.log(`Clicked on ${item.label}`)
        if (item.action === "editProduct") {
          editProduct()
        } else if (item.action === "deleteProduct") {
          deleteProduct()
        }
      })
    })
  }
  
  // Calculate size based on distance from mouse
  function calculateSize(mouseX, itemRect) {
    const itemCenterX = itemRect.left + itemRect.width / 2
    const distance = Math.abs(mouseX - itemCenterX)
  
    // Calculate scale factor based on distance
    if (distance > config.distance) {
      return config.baseItemSize
    }
  
    const distanceRatio = 1 - distance / config.distance
    const sizeDiff = config.magnification - config.baseItemSize
    const additionalSize = sizeDiff * distanceRatio
  
    return config.baseItemSize + additionalSize
  }
  
  // Handle mouse movement for magnification effect
  function handleMouseMove(e) {
    const mouseX = e.clientX
    const dockItems = document.querySelectorAll(".dock-item")
  
    dockItems.forEach((item) => {
      const rect = item.getBoundingClientRect()
      const size = calculateSize(mouseX, rect)
  
      // Apply size with smooth transition
      item.style.width = `${size}px`
      item.style.height = `${size}px`
    })
  
    // Expand dock height when hovered
    dockOuter.style.height = `${config.dockHeight}px`
  }
  
  // Reset dock when mouse leaves
  function handleMouseLeave() {
    const dockItems = document.querySelectorAll(".dock-item")
  
    dockItems.forEach((item) => {
      item.style.width = `${config.baseItemSize}px`
      item.style.height = `${config.baseItemSize}px`
    })
  
    // Reset dock height
    dockOuter.style.height = `${config.panelHeight}px`
  }
  
  // Check if the current page is product-details and user is a vendor or moderator with access to the product
  function shouldShowDock(callback) {
    // Check if this is the product-details page
    const path = window.location.pathname
    const isProductDetailsPage = path.includes("product-details")
  
    if (!isProductDetailsPage) {
      callback(false)
      return
    }
  
    // Check if user is a vendor or moderator
    const userData = getUserData()
    if (!userData) {
      callback(false)
      return
    }
  
    const isVendorOrModerator = userData.role === "vendor" || userData.role === "moderator"
    if (!isVendorOrModerator) {
      callback(false)
      return
    }
  
    // Check if the user has access to the product
    checkProductAccess((hasAccess) => {
      callback(hasAccess)
    })
  }
  
  // Initialize the dock
  function initDock() {
    shouldShowDock((shouldShow) => {
      if (shouldShow) {
        if (!dockPanel || !dockOuter) {
          console.error("Dock elements not found in the DOM")
          return
        }
  
        createDockItems()
  
        // Add event listeners for hover effects
        dockOuter.addEventListener("mousemove", handleMouseMove)
        dockOuter.addEventListener("mouseleave", handleMouseLeave)
  
        // Make dock visible
        dockOuter.style.display = "block"
      } else {
        // Hide dock completely if user is not a vendor/moderator or doesn't have access to the product
        if (dockOuter) {
          dockOuter.style.display = "none"
        }
      }
    })
  }
  
  // Initialize when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    // Check if SweetAlert2 is available, if not, load it
    if (typeof Swal === "undefined") {
      const sweetAlertScript = document.createElement("script")
      sweetAlertScript.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11"
      sweetAlertScript.onload = () => {
        console.log("SweetAlert2 loaded")
        initDock()
      }
      document.head.appendChild(sweetAlertScript)
    } else {
      // If Swal is already loaded, proceed with initDock
      initDock()
    }
  
    // Check if Quill is available, if not, load it
    if (typeof Quill === "undefined") {
      // Load Quill CSS
      const quillCSS = document.createElement("link")
      quillCSS.rel = "stylesheet"
      quillCSS.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css"
      document.head.appendChild(quillCSS)
  
      // Load Quill JS
      const quillScript = document.createElement("script")
      quillScript.src = "https://cdn.quilljs.com/1.3.6/quill.min.js"
      quillScript.onload = () => {
        console.log("Quill loaded")
        // Quill is now loaded, you can proceed with your logic that uses Quill
      }
      document.head.appendChild(quillScript)
    }
  
    // Check if Bootstrap is available
    if (typeof bootstrap === "undefined") {
      // Load Bootstrap CSS
      const bootstrapCSS = document.createElement("link")
      bootstrapCSS.rel = "stylesheet"
      bootstrapCSS.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      document.head.appendChild(bootstrapCSS)
  
      // Load Bootstrap JS
      const bootstrapScript = document.createElement("script")
      bootstrapScript.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
      bootstrapScript.onload = () => {
        console.log("Bootstrap loaded")
      }
      document.head.appendChild(bootstrapScript)
    }
  })
  