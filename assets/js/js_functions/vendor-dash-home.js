function updateShopNavigation() {
  // Get the user ID and role from localStorage
  const userId = localStorage.getItem("userId")
  const userRole = localStorage.getItem("userRole") || "vendor"

  if (!userId) {
    console.error("No user ID found in localStorage")
    return
  }

  let manage = document.getElementById("manageModerators")

  if(userRole == "vendor") {
    manage.style.display = "block"
  }

  console.log(`Fetching shop data for ${userRole} ID:`, userId)

  // First, try to get all shops
  const xhr = new XMLHttpRequest()
  xhr.open("GET", "http://localhost:3000/shop/get", true)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const shops = JSON.parse(xhr.responseText)
          console.log("All shops received:", shops)

          // Find the shop based on user role
          let userShop = null

          if (Array.isArray(shops)) {
            if (userRole === "vendor") {
              // For vendors: Find shop where vendor ID matches the user ID
              for (let i = 0; i < shops.length; i++) {
                const shop = shops[i]
                console.log(`Comparing shop vendor ${shop.vendor} with userId ${userId}`)

                // Check if vendor exists and matches userId (either as string or ObjectId)
                if (
                  shop.vendor &&
                  (shop.vendor === userId ||
                    (typeof shop.vendor === "object" && shop.vendor._id === userId) ||
                    (typeof shop.vendor === "string" && shop.vendor.includes(userId)))
                ) {
                  userShop = shop
                  break
                }
              }
            } else if (userRole === "moderator") {
              
              getModeratorsShop(userId, shops)
              return // Exit this function as we'll handle it in the callback
            }
          }

          if (userShop) {
            console.log("Found user's shop:", userShop)
            updateNavWithShopInfo(userShop)
          } else {
            console.error(`No shop found for this ${userRole} ID`)
          }
        } catch (error) {
          console.error("Error parsing shop data:", error)
        }
      } else {
        console.error("Request failed with status:", xhr.status)
      }
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred")
  }

  xhr.send()
}

// Fonction pour obtenir le shop d'un modérateur
function getModeratorsShop(moderatorId, allShops) {
  console.log("Getting shop for moderator ID:", moderatorId)

  // Utiliser le token pour l'authentification
  const token = localStorage.getItem("token")

  const xhr = new XMLHttpRequest()
  // Utiliser l'endpoint correct pour obtenir les modérateurs par shop
  xhr.open("GET", "http://localhost:3000/moderator/shop", true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.setRequestHeader("Authorization", `Bearer ${token}`)

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          console.log("Moderators data received:", response)

          // Trouver le modérateur correspondant à l'ID
          let userModerator = null
          if (response.moderators && Array.isArray(response.moderators)) {
            for (let i = 0; i < response.moderators.length; i++) {
              const moderator = response.moderators[i]
              if (
                moderator._id === moderatorId ||
                (typeof moderator._id === "object" && moderator._id._id === moderatorId) ||
                (typeof moderator._id === "string" && moderator._id.includes(moderatorId))
              ) {
                userModerator = moderator
                break
              }
            }
          }

          if (userModerator && userModerator.shop) {
            const shopId = userModerator.shop

            // Trouver le shop dans la liste des shops déjà récupérés
            let moderatorShop = null
            for (let i = 0; i < allShops.length; i++) {
              if (
                allShops[i]._id === shopId ||
                (typeof shopId === "object" && allShops[i]._id === shopId._id) ||
                (typeof shopId === "string" && (allShops[i]._id === shopId || allShops[i]._id.includes(shopId)))
              ) {
                moderatorShop = allShops[i]
                break
              }
            }

            if (moderatorShop) {
              console.log("Found moderator's shop:", moderatorShop)
              updateNavWithShopInfo(moderatorShop)
            } else {
              console.error("Shop not found in the list of shops")
              // Si le shop n'est pas trouvé dans la liste, faire une requête directe
              getShopById(shopId)
            }
          } else {
            console.error("Moderator not found or has no shop assigned")
            tryAlternativeModeratorApproach(moderatorId, allShops)
          }
        } catch (error) {
          console.error("Error parsing moderator data:", error)
          tryAlternativeModeratorApproach(moderatorId, allShops)
        }
      } else {
        console.error("Request failed with status:", xhr.status)
        // En cas d'échec, essayer une approche alternative
        tryAlternativeModeratorApproach(moderatorId, allShops)
      }
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred")
    // En cas d'erreur réseau, essayer une approche alternative
    tryAlternativeModeratorApproach(moderatorId, allShops)
  }

  xhr.send()
}

// Fonction alternative pour obtenir le shop d'un modérateur
function tryAlternativeModeratorApproach(moderatorId, allShops) {
  console.log("Trying alternative approach for moderator ID:", moderatorId)

  // Vérifier si l'ID du shop est stocké dans localStorage
  const shopId = localStorage.getItem("shopId")
  if (shopId) {
    console.log("Using shopId from localStorage:", shopId)
    getShopById(shopId)
    return
  }

  // Si nous n'avons pas l'ID du shop, essayer de le trouver dans les shops
  // en cherchant un shop qui a ce modérateur dans sa liste de modérateurs
  for (let i = 0; i < allShops.length; i++) {
    const shop = allShops[i]
    if (shop.moderators && Array.isArray(shop.moderators)) {
      for (let j = 0; j < shop.moderators.length; j++) {
        const modId = shop.moderators[j]
        if (
          modId === moderatorId ||
          (typeof modId === "object" && modId._id === moderatorId) ||
          (typeof modId === "string" && modId.includes(moderatorId))
        ) {
          console.log("Found shop with this moderator:", shop)
          updateNavWithShopInfo(shop)
          return
        }
      }
    }
  }

  console.error("Could not find shop for this moderator using any method")
}

// Function to get shop by ID directly
function getShopById(shopId) {
  console.log("Getting shop by ID:", shopId)

  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/shop/${shopId}`, true)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          console.log("Shop data received:", response)

          if (response.shop) {
            updateNavWithShopInfo(response.shop)
          } else {
            console.error("No shop found with this ID")
          }
        } catch (error) {
          console.error("Error parsing shop data:", error)
        }
      } else {
        console.error("Request failed with status:", xhr.status)
      }
    }
  }

  xhr.onerror = () => {
    console.error("Network error occurred")
  }

  xhr.send()
}

function updateNavWithShopInfo(shop) {
  if (!shop) {
    console.error("No shop data provided")
    return
  }

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole") || "vendor"
  const userType = localStorage.getItem("userType") || "vendor"

  // Get the shop name or use a default
  const shopName = shop.shopName || "Shop Name"
  const shopLogoUrl = shop.shopLogo
    ? `http://localhost:3000/uploads/${shop.shopLogo}`
    : "../../assets/images/dashboard/shop-logo.jpg"

  // Determine the role description for the small text
  let roleDescription = ""
  if (userRole === "vendor" || userType === "vendor") {
    roleDescription = "Shop Owner"
  } else if (userRole === "moderator" || userType === "moderator") {
    roleDescription = "Shop Moderator"
  } else {
    roleDescription = "Founded In " + (shop.createdAt ? new Date(shop.createdAt).getFullYear() : "2025")
  }

  console.log("Updating navigation with:", {
    shopName,
    shopLogoUrl,
    roleDescription,
  })

  // Update the shop name in the navigation bar
  const navShopNameElement = document.querySelector(".user-menu .d-none.d-md-inline")
  if (navShopNameElement) {
    navShopNameElement.textContent = shopName
  }

  // Update all shop logo images in the navigation
  const shopLogoElements = document.querySelectorAll(".user-image, .user-header img")
  shopLogoElements.forEach((imgElement) => {
    imgElement.src = shopLogoUrl
    imgElement.alt = `${shopName} logo`
  })

  // Update the shop name, role, and role description in the dropdown
  const userHeaderTextElement = document.querySelector(".user-header p")
  if (userHeaderTextElement) {
    // Create the text node for the shop name and role
    const textNode = document.createTextNode(`${shopName}`)

    // Create the small element for the role description
    const smallElement = document.createElement("small")
    smallElement.textContent = roleDescription

    // Clear the existing content and append the new content
    userHeaderTextElement.innerHTML = ""
    userHeaderTextElement.appendChild(textNode)
    userHeaderTextElement.appendChild(document.createElement("br"))
    userHeaderTextElement.appendChild(smallElement)
  }

  // Update the user header background to use the image
  const userHeaderElement = document.querySelector(".user-header")
  if (userHeaderElement) {
    // Remove the text-bg-secondary class
    userHeaderElement.classList.remove("text-bg-secondary")

    // Add custom styling for background image
    userHeaderElement.style.position = "relative"
    userHeaderElement.style.overflow = "hidden"
    userHeaderElement.style.zIndex = "1"

    // Check if the background image already exists
    let backgroundImg = userHeaderElement.querySelector(".header-background-img")

    if (!backgroundImg) {
      // Create a background image element
      backgroundImg = document.createElement("div")
      backgroundImg.className = "header-background-img"
      backgroundImg.style.position = "absolute"
      backgroundImg.style.top = "0"
      backgroundImg.style.left = "0"
      backgroundImg.style.width = "100%"
      backgroundImg.style.height = "100%"
      backgroundImg.style.backgroundImage = 'url("../assets/images/sellers/background.jpg")'
      backgroundImg.style.backgroundSize = "cover"
      backgroundImg.style.backgroundPosition = "center"
      backgroundImg.style.opacity = "0.85"
      backgroundImg.style.zIndex = "-1"

      // Add a dark overlay for better text readability
      const overlay = document.createElement("div")
      overlay.style.position = "absolute"
      overlay.style.top = "0"
      overlay.style.left = "0"
      overlay.style.width = "100%"
      overlay.style.height = "100%"
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
      overlay.style.zIndex = "-1"

      // Insert the background and overlay at the beginning of the user header
      userHeaderElement.insertBefore(overlay, userHeaderElement.firstChild)
      userHeaderElement.insertBefore(backgroundImg, userHeaderElement.firstChild)
    }

    // Ensure text is readable on the background image
    userHeaderElement.style.color = "white"
    userHeaderElement.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.6)"

    // Add padding for better appearance
    userHeaderElement.style.padding = "20px 15px"
  }

  // NEW CODE: Update the sidebar brand logo and text
  const sidebarBrandLogo = document.querySelector(".sidebar-brand .brand-image")
  if (sidebarBrandLogo) {
    sidebarBrandLogo.src = shopLogoUrl
    sidebarBrandLogo.alt = `${shopName} Logo`
  }

  const sidebarBrandText = document.querySelector(".sidebar-brand .brand-text")
  if (sidebarBrandText) {
    sidebarBrandText.textContent = shopName
  }
}

function addHeaderStyles() {
  const styleElement = document.createElement("style")
  styleElement.textContent = `
    .user-header {
        position: relative;
        overflow: hidden;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
        padding: 20px 15px;
    }
    
    .user-header img.rounded-circle {
        border: 3px solid rgba(255, 255, 255, 0.8);
        position: relative;
        z-index: 2;
    }
    
    .user-header p {
        position: relative;
        z-index: 2;
        margin-top: 10px;
    }
    
    /* Add styles for sidebar brand */
    .sidebar-brand .brand-image {
        max-height: 40px;
        width: auto;
        object-fit: contain;
    }
  `
  document.head.appendChild(styleElement)
}

document.addEventListener("DOMContentLoaded", () => {
  addHeaderStyles()
  updateShopNavigation()
})
