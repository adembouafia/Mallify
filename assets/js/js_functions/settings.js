// Global variables
let currentUserRole = ""
let currentUserId = ""
let shopId = ""

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Get user info from token
  getUserInfo()
})

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar")
  const overlay = document.getElementById("overlay")
  sidebar.classList.toggle("active")
  overlay.classList.toggle("show")
}

document.getElementById("logo-upload").addEventListener("change", (e) => {
  const reader = new FileReader()
  reader.onload = () => {
    document.getElementById("shop-logo").src = reader.result
  }
  reader.readAsDataURL(e.target.files[0])
})

document.getElementById("moderator-image-upload")?.addEventListener("change", (e) => {
  const reader = new FileReader()
  reader.onload = () => {
    // You could add a preview image here if needed
    console.log("Moderator image selected")
  }
  reader.readAsDataURL(e.target.files[0])
})

function updateSidebarInfo() {
  document.getElementById("sidebar-shop-name").textContent = document.getElementById("shop-name").value
  document.getElementById("sidebar-shop-description").textContent = document.getElementById("shop-description").value
  document.getElementById("sidebar-address").textContent = "📍 " + document.getElementById("shop-address").value
  document.getElementById("sidebar-phone").textContent = "📞 " + document.getElementById("shop-phone").value
}

function saveShopInfo() {
  if (currentUserRole !== "vendor") {
    Swal.fire({
      icon: "error",
      title: "Permission Denied",
      text: "Only vendors can update shop information",
    })
    return
  }

  const shopData = {
    shopName: document.getElementById("shop-name").value,
    shopdescription: document.getElementById("shop-description").value,
    adresse: document.getElementById("shop-address").value,
    shop_phone: document.getElementById("shop-phone").value,
  }

  // Create FormData for file upload
  const formData = new FormData()
  const logoFile = document.getElementById("logo-upload").files[0]

  if (logoFile) {
    formData.append("shopLogo", logoFile)
  }

  // Add other shop data to FormData
  for (const key in shopData) {
    formData.append(key, shopData[key])
  }

  // Send XHR request to update shop info
  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/shop/update/${shopId}`, true)
  xhr.setRequestHeader("Authorization", "Bearer " + getToken())

  xhr.onload = () => {
    if (xhr.status === 200) {
      updateSidebarInfo()
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Shop information updated successfully",
      })
    } else {
      console.error("Error response:", xhr.responseText)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update shop information",
      })
    }
  }

  xhr.onerror = () => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Network error occurred",
    })
  }

  xhr.send(formData)
}

function setStockLimit() {
  if (currentUserRole !== "vendor") {
    Swal.fire({
      icon: "error",
      title: "Permission Denied",
      text: "Only vendors can update stock limit",
    })
    return
  }

  const limit = document.getElementById("stock-limit").value

  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/shop/stock-limit/${shopId}`, true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.setRequestHeader("Authorization", "Bearer " + getToken())

  xhr.onload = () => {
    if (xhr.status === 200) {
      document.getElementById("sidebar-stock-limit").textContent = `📦 Stock Limit: ${limit}`
      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Stock limit set to ${limit}`,
      })
    } else {
      console.error("Error response:", xhr.responseText)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update stock limit",
      })
    }
  }

  xhr.onerror = () => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Network error occurred",
    })
  }

  xhr.send(JSON.stringify({ stockLimit: limit }))
}

function saveVendorInfo() {
  if (currentUserRole !== "vendor") {
    Swal.fire({
      icon: "error",
      title: "Permission Denied",
      text: "Only vendors can update vendor information",
    })
    return
  }

  const vendorData = {
    vendorName: document.getElementById("vendor-name").value,
    email: document.getElementById("vendor-email").value,
    phone: document.getElementById("vendor-phone").value,
  }

  // Add password only if it's provided
  const password = document.getElementById("vendor-password").value
  if (password) {
    vendorData.vendorPassword = password
  }

  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/vendor/update/${currentUserId}`, true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.setRequestHeader("Authorization", "Bearer " + getToken())

  xhr.onload = () => {
    if (xhr.status === 200) {

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Vendor information updated successfully",
      })
    } else {
      console.error("Error response:", xhr.responseText)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update vendor information",
      })
    }
  }

  xhr.onerror = () => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Network error occurred",
    })
  }

  xhr.send(JSON.stringify(vendorData))
}

function saveModeratorInfo() {
  if (currentUserRole !== "moderator") {
    Swal.fire({
      icon: "error",
      title: "Permission Denied",
      text: "Only moderators can update moderator information",
    })
    return
  }

  // Create FormData for file upload
  const formData = new FormData()
  const imageFile = document.getElementById("moderator-image-upload").files[0]

  if (imageFile) {
    formData.append("moderatorImage", imageFile)
  }

  // Add other moderator data
  formData.append("moderatorName", document.getElementById("moderator-name").value)
  formData.append("email", document.getElementById("moderator-email").value)

  // Add password only if it's provided
  const password = document.getElementById("moderator-password").value
  if (password) {
    formData.append("password", password)
  }

  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/moderator/update/${currentUserId}`, true)
  xhr.setRequestHeader("Authorization", "Bearer " + getToken())

  xhr.onload = () => {
    if (xhr.status === 200) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Moderator information updated successfully",
      })
    } else {
      console.error("Error response:", xhr.responseText)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update moderator information",
      })
    }
  }

  xhr.onerror = () => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Network error occurred",
    })
  }

  xhr.send(formData)
}

function getUserInfo() {
  const token = getToken()
  if (!token) {
    window.location.href = "../login.html"
    return
  }

  try {
    const payloadBase64 = token.split(".")[1]
    const decodedPayload = JSON.parse(atob(payloadBase64))
    console.log("Token payload:", decodedPayload) // Ajouter pour déboguer

    currentUserRole = decodedPayload.role
    currentUserId = decodedPayload.id
    shopId = decodedPayload.shopId

    console.log("User role:", currentUserRole)
    console.log("User ID:", currentUserId)
    console.log("Shop ID:", shopId)

    // Role-based sidebar and data loading
    if (currentUserRole === "vendor") {
      document.getElementById("sidebar-role").textContent = "Shop Owner"
      loadVendorData()
      loadShopData()

      document.querySelectorAll(".sidebar-menu li").forEach((item) => {
        const link = item.querySelector("a")
        if (link && link.textContent.includes("Moderator Info")) {
          item.style.display = "none"
        }
      })
    } else if (currentUserRole === "moderator") {
      document.getElementById("sidebar-role").textContent = "Shop Moderator"
      loadModeratorData()
      loadShopData()

      document.querySelectorAll(".sidebar-menu li").forEach((item) => {
        const link = item.querySelector("a")
        if (
          link &&
          (link.textContent.includes("Shop Info") ||
            link.textContent.includes("Stock Limiter") ||
            link.textContent.includes("Vendor Info"))
        ) {
          item.style.display = "none"
        }
      })

      document.getElementById("save-shop-info-btn").disabled = true
      document.getElementById("save-stock-limit-btn").disabled = true

      // Show default section for moderators
      showSection({ preventDefault: () => {} }, "moderator-info")
    }
  } catch (e) {
    console.error("Error decoding token:", e)
    window.location.href = "../login.html"
  }
}

// Show section based on permissions
function showSection(event, sectionId) {
  if (event) event.preventDefault()

  if ((sectionId === "shop-info" || sectionId === "stock-limiter") && currentUserRole !== "vendor") {
    Swal.fire({
      icon: "info",
      title: "Information",
      text: "Only vendors can view and edit shop information and stock limits",
    })
    return
  }

  if (sectionId === "vendor-info" && currentUserRole !== "vendor") {
    Swal.fire({
      icon: "info",
      title: "Information",
      text: "Only vendors can view and edit vendor information",
    })
    return
  }

  if (sectionId === "moderator-info" && currentUserRole !== "moderator") {
    Swal.fire({
      icon: "info",
      title: "Information",
      text: "Only moderators can view and edit moderator information",
    })
    return
  }

  document.querySelectorAll(".settings-section").forEach((section) => section.classList.add("hidden"))
  document.getElementById(sectionId).classList.remove("hidden")

  document.querySelectorAll(".sidebar-menu a").forEach((link) => link.classList.remove("active"))
  if (event && event.target) event.target.classList.add("active")

  if (window.innerWidth <= 768) {
    toggleSidebar()
  }
}

// Load vendor data
function loadVendorData() {
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/vendor/${currentUserId}`, true)
  xhr.setRequestHeader("Authorization", "Bearer " + getToken())

  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        console.log("Vendor data:", response)

        const vendorData = response.vendor
        document.getElementById("vendor-name").value = vendorData.vendorName || ""
        document.getElementById("vendor-email").value = vendorData.email || ""
        document.getElementById("vendor-phone").value = vendorData.phone || ""
      } catch (error) {
        console.error("Error parsing vendor data:", error)
      }
    } else {
      console.error("Failed to load vendor data. Status:", xhr.status)
      console.error("Response:", xhr.responseText)
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred while loading vendor data")
  }

  xhr.send()
}

// Load moderator data
function loadModeratorData() {
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/moderator/${currentUserId}`, true)
  xhr.setRequestHeader("Authorization", "Bearer " + getToken())

  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        console.log("Moderator data:", response)

        const moderatorData = response.moderator
        document.getElementById("moderator-name").value = moderatorData.moderatorName || ""
        document.getElementById("moderator-email").value = moderatorData.email || ""
      } catch (error) {
        console.error("Error parsing moderator data:", error)
      }
    } else {
      console.error("Failed to load moderator data. Status:", xhr.status)
      console.error("Response:", xhr.responseText)
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred while loading moderator data")
  }

  xhr.send()
}

// Load shop data
function loadShopData() {
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/shop/${shopId}`, true)
  xhr.setRequestHeader("Authorization", "Bearer " + getToken())

  xhr.onload = () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        console.log("Shop data:", response)

        const shopData = response.shop
        document.getElementById("shop-name").value = shopData.shopName || ""
        document.getElementById("shop-description").value = shopData.shopdescription || ""
        document.getElementById("shop-address").value = shopData.adresse || ""
        document.getElementById("shop-phone").value = shopData.shop_phone || ""
        document.getElementById("stock-limit").value = shopData.stockLimit || ""

        // Update sidebar
        document.getElementById("sidebar-shop-name").textContent = shopData.shopName || "Shop Name"
        document.getElementById("sidebar-shop-description").textContent = shopData.shopdescription || "Shop Description"
        document.getElementById("sidebar-address").textContent = "📍 " + (shopData.adresse || "Address")
        document.getElementById("sidebar-phone").textContent = "📞 " + (shopData.shop_phone || "")
        document.getElementById("sidebar-stock-limit").textContent = "📦 Stock Limit: " + (shopData.stockLimit || "0")

        // Update shop logo if available
        if (shopData.shopLogo) {
          document.getElementById("shop-logo").src = `/uploads/${shopData.shopLogo}`
        }
      } catch (error) {
        console.error("Error parsing shop data:", error)
      }
    } else {
      console.error("Failed to load shop data. Status:", xhr.status)
      console.error("Response:", xhr.responseText)
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred while loading shop data")
  }

  xhr.send()
}

// Helper function to get token from localStorage
function getToken() {
  return localStorage.getItem("token")
}

// Handle logout
function handleLogout() {
  localStorage.removeItem("token")
  window.location.href = "../login.html"
}
