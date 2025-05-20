const config = {
  baseItemSize: 50,
  panelHeight: 68,
  dockHeight: 256,
}

const adminDockItems = [
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
]

const vendorDockItems = [
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

const dockPanel = document.querySelector(".dock-panel")
const dockOuter = document.querySelector(".dock-outer")

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

function getUserRole() {
  return localStorage.getItem("userRole")
}

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

function extractShopId(userData) {
  console.log("Extracting shop ID from user data:", userData)

  if (!userData) return null

  if (userData.shopId) {
    console.log("Found shopId directly in userData:", userData.shopId)
    return userData.shopId
  }

  if (userData.shop) {
    if (typeof userData.shop === "string") {
      console.log("Found shop as string in userData:", userData.shop)
      return userData.shop
    }

    if (userData.shop._id) {
      console.log("Found shop._id in userData:", userData.shop._id)
      return userData.shop._id
    }
  }

  if (userData.vendor && userData.vendor.shop) {
    if (typeof userData.vendor.shop === "string") {
      console.log("Found vendor.shop as string:", userData.vendor.shop)
      return userData.vendor.shop
    }

    if (userData.vendor.shop._id) {
      console.log("Found vendor.shop._id:", userData.vendor.shop._id)
      return userData.vendor.shop._id
    }
  }

  if (userData.shopDetails) {
    if (typeof userData.shopDetails === "string") {
      console.log("Found shopDetails as string:", userData.shopDetails)
      return userData.shopDetails
    }

    if (userData.shopDetails._id) {
      console.log("Found shopDetails._id:", userData.shopDetails._id)
      return userData.shopDetails._id
    }
  }

  console.warn("Could not find shop ID in user data")
  return null
}

// ==================== ADMIN FUNCTIONS ====================

// Ban shop
function banShop() {
  const productId = getUrlParameter("id")
  if (!productId) {
    window.Swal.fire({
      title: "Error!",
      text: "Product ID not found in URL",
      icon: "error",
    })
    return
  }

  window.Swal.fire({
    title: "Loading...",
    text: "Fetching product details",
    allowOutsideClick: false,
    didOpen: () => {
      window.Swal.showLoading()
    },
  })

  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/product/get/${productId}`, true)

  const token = localStorage.getItem("token")
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  }

  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        const product = response.data?.product

        if (response.status === "success" && product?.shop) {
          const shopId = typeof product.shop === "string" ? product.shop : product.shop._id

          if (!shopId) {
            window.Swal.fire({
              title: "Error!",
              text: "Shop ID not found",
              icon: "error",
            })
            return
          }

          banShopById(shopId)
        } else {
          window.Swal.fire({
            title: "Error!",
            text: "Shop information not found in product data",
            icon: "error",
          })
        }
      } catch (e) {
        window.Swal.fire({
          title: "Error!",
          text: "Error parsing product data",
          icon: "error",
        })
      }
    } else {
      window.Swal.fire({
        title: "Error!",
        text: `Failed to get product details. Status: ${xhr.status}`,
        icon: "error",
      })
    }
  }

  xhr.onerror = () => {
    window.Swal.fire({
      title: "Error!",
      text: "Network error occurred",
      icon: "error",
    })
  }

  xhr.send()
}

function banShopById(shopId) {
  window.Swal.fire({
    title: "Confirm Ban",
    text: `Are you sure you want to ban this shop ?`,
    input: "text",
    inputLabel: "Ban Reason",
    inputPlaceholder: "Please provide a reason for banning this shop",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ban",
    confirmButtonColor: "#d33",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      const xhr = new XMLHttpRequest()
      xhr.open("PUT", `http://localhost:3000/shop/ban/${shopId}`, true)

      const token = localStorage.getItem("token")
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.setRequestHeader("Content-Type", "application/json")
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          window.Swal.fire({
            title: "Success!",
            text: "Shop has been banned successfully",
            icon: "success",
          })
        } else {
          let errorMessage = "Failed to ban shop"
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.message) {
              errorMessage = response.message
            }
          } catch (e) {}

          window.Swal.fire({
            title: "Error!",
            text: errorMessage,
            icon: "error",
          })
        }
      }

      xhr.onerror = () => {
        window.Swal.fire({
          title: "Error!",
          text: "Network error occurred",
          icon: "error",
        })
      }

      const data = JSON.stringify({
        bannedReason: result.value || "Violation of marketplace policies",
      })

      xhr.send(data)
    }
  })
}

//ban product
function banProduct() {
  const productId = getUrlParameter("id")
  if (!productId) {
    window.Swal.fire({
      title: "Error!",
      text: "Product ID not found in URL",
      icon: "error",
    })
    return
  }

  window.Swal.fire({
    title: "Confirm Ban",
    text: `Are you sure you want to ban this product ?`,
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
      const xhr = new XMLHttpRequest()
      xhr.open("PUT", `http://localhost:3000/product/ban/${productId}`, true)

      const token = localStorage.getItem("token")
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.setRequestHeader("Content-Type", "application/json")
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          window.Swal.fire({
            title: "Success!",
            text: "Product has been banned successfully",
            icon: "success",
          }).then(() => {
            window.location.reload()
          })
        } else {
          let errorMessage = "Failed to ban product"
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.message) {
              errorMessage = response.message
            }
          } catch (e) {
            errorMessage = "Error parsing response"
          }

          window.Swal.fire({
            title: "Error!",
            text: errorMessage,
            icon: "error",
          })
        }
      }

      xhr.onerror = () => {
        window.Swal.fire({
          title: "Error!",
          text: "Network error occurred",
          icon: "error",
        })
      }

      const data = JSON.stringify({
        banReason: result.value || "Violation of marketplace policies",
      })

      xhr.send(data)
    }
  })
}

// ==================== VENDOR/MODERATOR FUNCTIONS ====================

function checkProductAccess(callback) {
  const productId = getUrlParameter("id")
  if (!productId) {
    console.error("Product ID not found in URL")
    callback(false)
    return
  }

  const userRole = getUserRole()
  const userData = getUserData()

  console.log("Checking product access with role:", userRole)
  console.log("User data:", userData)

  if (!userRole || !userData) {
    console.error("User data or role not found")
    callback(false)
    return
  }

  if (userRole !== "vendor" && userRole !== "moderator") {
    console.error("User is not a vendor or moderator")
    callback(false)
    return
  }

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

        console.log("Product data:", product)

        // Vérifier que le produit appartient au shop de l'utilisateur
        const userShopId = extractShopId(userData)
        if (!userShopId) {
          console.error("User shop ID not found")
          callback(false)
          return
        }

        const productShopId =
          typeof product.shop === "string" ? product.shop : product.shop && product.shop._id ? product.shop._id : null

        if (!productShopId) {
          console.error("Product shop ID not found")
          callback(false)
          return
        }

        console.log("User shop ID:", userShopId)
        console.log("Product shop ID:", productShopId)

        // Comparer les IDs en tant que chaînes pour éviter les problèmes de type
        const hasAccess = userShopId.toString() === productShopId.toString()

        if (!hasAccess) {
          console.error("Product does not belong to user's shop")
          callback(false)
          return
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

// Edit product
function editProduct() {
  const productId = getUrlParameter("id")
  if (!productId) {
    window.Swal.fire({
      title: "Error!",
      text: "Product ID not found in URL",
      icon: "error",
    })
    return
  }

  // Vérifier d'abord que l'utilisateur a le droit de modifier ce produit
  checkProductAccess((hasAccess) => {
    if (!hasAccess) {
      window.Swal.fire({
        title: "Access Denied",
        text: "You do not have permission to edit this product. You can only edit products from your own shop.",
        icon: "error",
      })
      return
    }

    const dashboardUrl = `http://localhost:3000/dashbordBout_pages/detailsProduct.html?id=${productId}`

    console.log("Preparing to redirect to dashboard product details:", dashboardUrl)

    window.Swal.fire({
      title: "Edit Product",
      text: "You will be redirected to the product edit page in the dashboard. Continue?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, edit product",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        window.Swal.fire({
          title: "Redirecting...",
          text: "You are being redirected to the product edit page",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          willOpen: () => {
            window.Swal.showLoading()
          },
          timer: 1000,
        }).then(() => {
          window.location.href = dashboardUrl
        })
      }
    })
  })
}

// Delete product function
function deleteProduct() {
  const productId = getUrlParameter("id")
  if (!productId) {
    window.Swal.fire({
      title: "Error!",
      text: "Product ID not found in URL",
      icon: "error",
    })
    return
  }

  // Vérifier d'abord que l'utilisateur a le droit de supprimer ce produit
  checkProductAccess((hasAccess) => {
    if (!hasAccess) {
      window.Swal.fire({
        title: "Access Denied",
        text: "You do not have permission to delete this product. You can only delete products from your own shop.",
        icon: "error",
      })
      return
    }

    window.Swal.fire({
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
          window.Swal.fire({
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
            window.Swal.fire({
              title: "Success!",
              text: "Product deleted successfully",
              icon: "success",
            }).then(() => {
              window.location.href = "/index.html"
            })
          } else {
            let errorMessage = "Failed to delete product"
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              errorMessage = errorResponse.message || errorMessage
            } catch (e) {
              errorMessage = "Error parsing response"
            }

            window.Swal.fire({
              title: "Error!",
              text: errorMessage,
              icon: "error",
            })
          }
        }

        xhr.onerror = () => {
          window.Swal.fire({
            title: "Error!",
            text: "Network error occurred",
            icon: "error",
          })
        }

        xhr.send()
      }
    })
  })
}

// ==================== COMMON FUNCTIONS ====================

// Create dock items based on user role
function createDockItems() {
  if (dockPanel) {
    dockPanel.innerHTML = ""
  }

  const userRole = getUserRole()
  console.log("Creating dock items for role:", userRole)

  let itemsToShow = []

  if (userRole === "admin" || userRole === "superAdmin") {
    itemsToShow = adminDockItems
  } else if (userRole === "vendor" || userRole === "moderator") {
    // Pour les vendeurs et modérateurs, vérifier d'abord qu'ils ont accès au produit
    checkProductAccess((hasAccess) => {
      if (hasAccess) {
        itemsToShow = vendorDockItems
        renderDockItems(itemsToShow)
      } else {
        console.log("User does not have access to this product, hiding vendor dock items")
        dockOuter.style.display = "none"
      }
    })
    return
  }

  renderDockItems(itemsToShow)
}

// Render dock items
function renderDockItems(itemsToShow) {
  // Create dock items
  itemsToShow.forEach((item) => {
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

    dockItem.addEventListener("click", () => {
      console.log(`Clicked on ${item.label}`)
      if (item.action === "banShop") {
        banShop()
      } else if (item.action === "banProduct") {
        banProduct()
      } else if (item.action === "editProduct") {
        editProduct()
      } else if (item.action === "deleteProduct") {
        deleteProduct()
      }
    })
  })
}

// Check if the dock should be shown based on user role and page
function shouldShowDock(callback) {
  const path = window.location.pathname
  const isProductDetailsPage = path.includes("product-details")

  if (!isProductDetailsPage) {
    console.log("Not on product details page, hiding dock")
    callback(false)
    return
  }

  const userRole = getUserRole()
  if (!userRole) {
    console.log("No user role found, hiding dock")
    callback(false)
    return
  }

  console.log("Checking if dock should be shown for role:", userRole)

  if (userRole === "admin" || userRole === "superAdmin") {
    console.log("User is admin/superAdmin, showing dock")
    callback(true)
    return
  }

  if (userRole === "vendor" || userRole === "moderator") {
    console.log("User is vendor/moderator, checking product access")
    checkProductAccess((hasAccess) => {
      console.log("Product access check result:", hasAccess)
      callback(hasAccess)
    })
    return
  }

  console.log("User has other role, hiding dock")
  callback(false)
}

// Initialize the dock
function initDock() {
  console.log("Initializing dock")
  shouldShowDock((shouldShow) => {
    if (shouldShow) {
      if (!dockPanel || !dockOuter) {
        console.error("Dock elements not found in the DOM")
        return
      }

      console.log("Creating dock items")
      createDockItems()

      dockOuter.style.display = "block"
    } else {
      if (dockOuter) {
        console.log("Hiding dock")
        dockOuter.style.display = "none"
      }
    }
  })
}

// Load SweetAlert2 from an approved CDN
function loadSweetAlert() {
  return new Promise((resolve, reject) => {
    if (typeof window.Swal !== "undefined") {
      console.log("SweetAlert2 already loaded")
      resolve()
      return
    }

    console.log("Loading SweetAlert2 from approved CDN")
    const sweetAlertScript = document.createElement("script")
    sweetAlertScript.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11"
    sweetAlertScript.onload = () => {
      console.log("SweetAlert2 loaded successfully")
      resolve()
    }
    sweetAlertScript.onerror = (e) => {
      console.error("Failed to load SweetAlert2:", e)
      reject(e)
    }
    document.head.appendChild(sweetAlertScript)
  })
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("UserPower script loaded, checking role:", getUserRole())

  loadSweetAlert()
    .then(() => {
      console.log("SweetAlert2 loaded, initializing dock")
      initDock()
    })
    .catch((error) => {
      console.error("Error loading SweetAlert2:", error)
      initDock()
    })
})
