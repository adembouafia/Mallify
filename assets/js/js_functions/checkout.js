document.addEventListener("DOMContentLoaded", () => {
  console.log("Checkout page loaded")

  // Debug localStorage to see what we have available (keeping this for debugging)
  debugLocalStorage()

  // Load user data and cart products directly from the server
  loadUserDataAndCart()

  // Debug form field selectors
  debugFormFields()
})

// Function to debug localStorage (keeping for debugging purposes)
function debugLocalStorage() {
  console.log("Debugging localStorage contents:")
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    let value = localStorage.getItem(key)

    // Try to parse JSON values for cleaner logging
    try {
      if (value && (value.startsWith("{") || value.startsWith("["))) {
        value = JSON.parse(value)
      }
    } catch (e) {
      // Not JSON, keep as string
    }

    console.log(`${key}:`, value)
  }
}

// Function to debug form fields
function debugFormFields() {
  console.log("Debugging form fields:")
  const selectors = ["#firstname", "#lastname", "#email", "#governorate", "#city", "#address", "#phone", "#postCode"]

  selectors.forEach((selector) => {
    const field = document.querySelector(selector)
    console.log(`Selector: ${selector}, Found: ${field ? "Yes" : "No"}`)
    if (field) {
      console.log(`  Current value: "${field.value}"`)
    }
  })

  // Log all input fields for inspection
  console.log("All input fields on the page:")
  const allInputs = document.querySelectorAll("input")
  allInputs.forEach((input, index) => {
    console.log(`Input #${index}:`, {
      name: input.name,
      id: input.id,
      placeholder: input.placeholder,
      type: input.type,
      value: input.value,
    })
  })
}

// Main function to load user data and cart
function loadUserDataAndCart() {
  // Get client ID and token from localStorage
  const clientId = localStorage.getItem("userId")
  const token = localStorage.getItem("token")

  console.log("Client ID from localStorage:", clientId)
  console.log("Token available:", token ? "Yes" : "No")

  if (!clientId || !token) {
    console.error("Client ID or token not found in localStorage")
    showAuthError("Vous devez vous connecter pour continuer.")
    return
  }

  // Load client data and shipping addresses
  loadClientData(clientId, token)

  // Load cart products
  loadCartProducts(clientId, token)

  // Setup place order button
  setupPlaceOrderButton(clientId, token)
}

// Function to load client data including shipping addresses
function loadClientData(clientId, token) {
  console.log("Loading client data for ID:", clientId)

  // Check token format and fix if needed
  let authToken = token
  if (token && !token.startsWith("Bearer ")) {
    authToken = "Bearer " + token
  }

  // First, get the client's basic information
  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/client/${clientId}`, true)
  xhr.setRequestHeader("Authorization", authToken)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    console.log("Client data response status:", xhr.status)

    if (xhr.status === 200) {
      try {
        const clientData = JSON.parse(xhr.responseText)
        console.log("Client data loaded from server:", clientData)

        // Populate form with client data
        populateClientForm(clientData)

        // Now get the client's shipping addresses
        loadShippingAddresses(clientId, authToken)
      } catch (error) {
        console.error("Error parsing client data:", error)
      }
    } else {
      console.error("Failed to load client data. Status:", xhr.status)
      console.error("Response:", xhr.responseText)
      showAuthError("Erreur lors du chargement des données client.")
    }
  }

  xhr.onerror = () => {
    console.error("Client data request failed")
  }

  xhr.send()
}

// Function to load shipping addresses
function loadShippingAddresses(clientId, token) {
  console.log("Loading shipping addresses for client ID:", clientId)

  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/client/${clientId}/shipping-address`, true)
  xhr.setRequestHeader("Authorization", token)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    console.log("Shipping addresses response status:", xhr.status)

    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        console.log("Shipping addresses loaded:", response)

        // If there are saved addresses, populate the form with the default one
        if (response.addresses && response.addresses.length > 0) {
          const defaultAddress = response.addresses.find(addr => addr.isDefault) || response.addresses[0]
          populateShippingForm(defaultAddress)
          
          // If we have multiple addresses, create a dropdown to select them
          if (response.addresses.length > 1) {
            createAddressSelector(response.addresses)
          }
        } else if (response.defaultShippingInfo) {
          // If no saved addresses but there's default shipping info
          populateShippingForm(response.defaultShippingInfo)
        }
      } catch (error) {
        console.error("Error parsing shipping addresses:", error)
      }
    } else if (xhr.status === 404) {
      // This is fine - the client might not have any saved addresses yet
      console.log("No shipping addresses found for this client")
    } else {
      console.error("Failed to load shipping addresses. Status:", xhr.status)
    }
  }

  xhr.onerror = () => {
    console.error("Shipping addresses request failed")
  }

  xhr.send()
}

// Function to populate client form with basic info
function populateClientForm(clientData) {
  console.log("Populating client form with:", clientData)

  // Populate name and email fields
  populateField("#firstname", clientData.firstname)
  populateField("#lastname", clientData.lastname)
  populateField("#email", clientData.email)
  
  // Populate phone if available
  if (clientData.phoneNumber) {
    populateField("#phone", clientData.phoneNumber)
  }
}

// Function to populate shipping form fields
function populateShippingForm(shippingData) {
  console.log("Populating shipping form with:", shippingData)

  // Populate shipping fields
  if (shippingData.address) populateField("#address", shippingData.address)
  if (shippingData.city) populateField("#city", shippingData.city)
  if (shippingData.governorate) populateField("#governorate", shippingData.governorate)
  if (shippingData.postCode) populateField("#postCode", shippingData.postCode)
  if (shippingData.phone) populateField("#phone", shippingData.phone)
}

// Function to create address selector dropdown
function createAddressSelector(addresses) {
  console.log("Creating address selector with", addresses.length, "addresses")
  
  // Check if we already have a form container to add this to
  const formContainer = document.querySelector(".checkout-form") || document.querySelector("form")
  if (!formContainer) {
    console.error("Could not find form container for address selector")
    return
  }
  
  // Create a container for the address selector
  const selectorContainer = document.createElement("div")
  selectorContainer.className = "mb-24"
  
  // Create a label
  const label = document.createElement("label")
  label.className = "text-gray-900 font-heading-two text-md fw-medium mb-12 block"
  label.textContent = "Adresses enregistrées"
  
  // Create the select element
  const select = document.createElement("select")
  select.id = "savedAddressSelector"
  select.className = "form-control w-full h-56 rounded-8 border border-gray-200 px-16 text-gray-900 text-md"
  
  // Add options for each address
  addresses.forEach((address, index) => {
    const option = document.createElement("option")
    option.value = index
    option.textContent = address.name || `Adresse ${index + 1}`
    if (address.isDefault) {
      option.selected = true
    }
    select.appendChild(option)
  })
  
  // Add event listener to update form when selection changes
  select.addEventListener("change", () => {
    const selectedIndex = select.value
    populateShippingForm(addresses[selectedIndex])
  })
  
  // Assemble and insert into the DOM
  selectorContainer.appendChild(label)
  selectorContainer.appendChild(select)
  
  // Insert at the beginning of the form
  const firstFormElement = formContainer.firstChild
  formContainer.insertBefore(selectorContainer, firstFormElement)
}

// Helper function to safely populate a field if the value exists
function populateField(selector, value) {
  if (value) {
    const field = document.querySelector(selector)
    if (field) {
      field.value = value
      console.log(`Field populated: ${selector} = "${value}"`)
      return true
    } else {
      console.log(`Field not found: ${selector}`)
      return false
    }
  }
  return false
}

// Function to load cart products
function loadCartProducts(clientId, token) {
  console.log("Attempting to load cart for client ID:", clientId)

  // Check token format and fix if needed
  let authToken = token
  if (token && !token.startsWith("Bearer ")) {
    authToken = "Bearer " + token
  }

  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/cart/${clientId}`, true)
  xhr.setRequestHeader("Authorization", authToken)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    console.log("Cart response status:", xhr.status)

    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText)
        console.log("Cart data loaded from server:", response)

        // Based on your cart.controller.js, the response has cart and totalPrice properties
        if (response.cart && response.cart.items) {
          // Store cart ID for order creation
          localStorage.setItem("cartId", response.cart._id)

          // Calculate total with shipping fee
          const subtotal = response.totalPrice || 0
          const shippingFee = 15 // 15 DT shipping fee
          const total = subtotal + shippingFee

          // Store cart data in localStorage (just for the cart ID and totals)
          const cartData = {
            id: response.cart._id,
            subtotal: subtotal,
            shippingFee: shippingFee,
            total: total,
          }
          localStorage.setItem("checkoutCartData", JSON.stringify(cartData))

          // Render the cart
          renderCheckoutSidebar(response.cart.items, subtotal, shippingFee, total)
        } else {
          // Empty cart
          renderCheckoutSidebar([], 0, 15, 15)
        }
      } catch (error) {
        console.error("Error parsing cart data:", error)
      }
    } else if (xhr.status === 401 || xhr.status === 403) {
      console.error("Authentication error when loading cart:", xhr.responseText)
      showAuthError("Votre session a expiré. Veuillez vous reconnecter.")
    } else {
      console.error("Failed to load cart products. Status:", xhr.status)
      console.error("Response:", xhr.responseText)
    }
  }

  xhr.onerror = () => {
    console.error("Cart request failed")
  }

  xhr.send()
}

// Function to render the checkout sidebar with cart products
function renderCheckoutSidebar(cartItems, subtotal, shippingFee, total) {
  const sidebarContainer = document.querySelector(".checkout-sidebar .border")
  if (!sidebarContainer) {
    console.error("Sidebar container not found")
    return
  }

  // Clear existing product entries (keep the header)
  const headerElement = sidebarContainer.querySelector(".mb-32.pb-32.border-bottom")
  if (!headerElement) {
    console.error("Header element not found in sidebar")
    return
  }

  sidebarContainer.innerHTML = ""
  sidebarContainer.appendChild(headerElement)

  // Add each product to the sidebar
  cartItems.forEach((item) => {
    const product = item.productId // Based on your model structure
    if (!product) {
      console.error("Product not found in cart item:", item)
      return
    }

    const productPrice = product.productPrice * item.quantity

    const productElement = document.createElement("div")
    productElement.className = "flex-between gap-24 mb-32"
    productElement.innerHTML = `
        <div class="flex-align gap-12">
          <span class="text-gray-900 fw-normal text-md font-heading-two w-144">${product.productName}</span>
          <span class="text-gray-900 fw-normal text-md font-heading-two"><i class="ph-bold ph-x"></i></span>
          <span class="text-gray-900 fw-semibold text-md font-heading-two">${item.quantity}</span>
        </div>
        <span class="text-gray-900 fw-bold text-md font-heading-two">${productPrice.toFixed(2)} DT</span>
      `

    sidebarContainer.appendChild(productElement)
  })

  // Add subtotal, shipping fee, and total section
  const paymentSection = document.createElement("div")
  paymentSection.className = "border-top border-gray-100 pt-30 mt-30"
  paymentSection.innerHTML = `
      <div class="mb-16 flex-between gap-8">
        <span class="text-gray-900 font-heading-two text-md fw-medium">Subtotal</span>
        <span class="text-gray-900 font-heading-two text-md fw-bold">${subtotal.toFixed(2)} DT</span>
      </div>
      <div class="mb-16 flex-between gap-8">
        <span class="text-gray-900 font-heading-two text-md fw-medium">Shipping Fee</span>
        <span class="text-gray-900 font-heading-two text-md fw-bold">${shippingFee.toFixed(2)} DT</span>
      </div>
      <div class="mb-32 flex-between gap-8">
        <span class="text-gray-900 font-heading-two text-xl fw-semibold">Payment</span>
        <span class="text-gray-900 font-heading-two text-md fw-bold">Cash on delivery</span>
      </div>
      <div class="mb-0 flex-between gap-8">
        <span class="text-gray-900 font-heading-two text-xl fw-semibold">Total</span>
        <span class="text-gray-900 font-heading-two text-md fw-bold">${total.toFixed(2)} DT</span>
      </div>
    `

  sidebarContainer.appendChild(paymentSection)
}

// Function to set up the place order button
function setupPlaceOrderButton(clientId, token) {
  const placeOrderButton =
    document.querySelector("#placeOrderBtn") || document.querySelector(".checkout-sidebar .btn-main")
  if (!placeOrderButton) {
    console.error("Place order button not found")
    return
  }

  placeOrderButton.addEventListener("click", (e) => {
    e.preventDefault()

    // Save shipping info to client profile before placing order
    saveShippingInfo(clientId, token, () => {
      placeOrder(clientId, token)
    })
  })

  // Set up form field change listeners
  setupFormChangeListeners()
}

// Function to set up form change listeners
function setupFormChangeListeners() {
  const formFields = [
    "#firstname",
    "#lastname",
    "#email",
    "#governorate",
    "#city",
    "#address",
    "#phone",
    "#postCode",
    "#notes",
  ]

  formFields.forEach((selector) => {
    const field = document.querySelector(selector)
    if (field) {
      field.addEventListener("change", () => {
        console.log(`Field ${selector} changed to: ${field.value}`)
      })
    }
  })
}

// Function to save shipping info to client profile
function saveShippingInfo(clientId, token, callback) {
  console.log("Saving shipping info for client ID:", clientId)

  // Get shipping details from form
  const shippingInfo = {
    address: document.querySelector("#address")?.value || "",
    city: document.querySelector("#city")?.value || "",
    governorate: document.querySelector("#governorate")?.value || "",
    postCode: document.querySelector("#postCode")?.value || "",
    phone: document.querySelector("#phone")?.value || ""
  }

  // Validate required fields
  const requiredFields = ["address", "city", "governorate", "postCode", "phone"]
  const missingFields = requiredFields.filter(field => !shippingInfo[field])
  
  if (missingFields.length > 0) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Informations manquantes",
        text: `Veuillez remplir tous les champs obligatoires: ${missingFields.join(", ")}`,
        confirmButtonColor: "#3b82f6",
      })
    } else {
      alert(`Veuillez remplir tous les champs obligatoires: ${missingFields.join(", ")}`)
    }
    return
  }

  // Check token format and fix if needed
  let authToken = token
  if (token && !token.startsWith("Bearer ")) {
    authToken = "Bearer " + token
  }

  // First, check if the client already has shipping addresses
  const checkXhr = new XMLHttpRequest()
  checkXhr.open("GET", `http://localhost:3000/client/${clientId}/shipping-address`, true)
  checkXhr.setRequestHeader("Authorization", authToken)
  checkXhr.setRequestHeader("Content-Type", "application/json")

  checkXhr.onload = () => {
    if (checkXhr.status === 200) {
      try {
        const response = JSON.parse(checkXhr.responseText)
        
        if (response.addresses && response.addresses.length > 0) {
          // Client has existing addresses, update the default one or add a new one
          const defaultAddress = response.addresses.find(addr => addr.isDefault)
          
          if (defaultAddress) {
            // Update the default address
            updateAddress(clientId, defaultAddress._id, shippingInfo, authToken, callback)
          } else {
            // Add a new address as default
            addNewAddress(clientId, shippingInfo, authToken, callback)
          }
        } else {
          // No addresses yet, add a new one
          addNewAddress(clientId, shippingInfo, authToken, callback)
        }
      } catch (error) {
        console.error("Error checking shipping addresses:", error)
        // Proceed with order anyway
        if (callback) callback()
      }
    } else {
      // No addresses yet or error, add a new one
      addNewAddress(clientId, shippingInfo, authToken, callback)
    }
  }

  checkXhr.onerror = () => {
    console.error("Error checking shipping addresses")
    // Proceed with order anyway
    if (callback) callback()
  }

  checkXhr.send()
}

// Function to add a new address
function addNewAddress(clientId, shippingInfo, token, callback) {
  console.log("Adding new shipping address")

  const addressData = {
    name: "Adresse de livraison",
    address: shippingInfo.address,
    city: shippingInfo.city,
    governorate: shippingInfo.governorate,
    postCode: shippingInfo.postCode,
    phone: shippingInfo.phone,
    isDefault: true
  }

  const xhr = new XMLHttpRequest()
  xhr.open("POST", `http://localhost:3000/client/${clientId}/shipping-address`, true)
  xhr.setRequestHeader("Authorization", token)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status === 201) {
      console.log("Shipping address added successfully")
    } else {
      console.error("Failed to add shipping address. Status:", xhr.status)
    }
    
    // Proceed with order regardless
    if (callback) callback()
  }

  xhr.onerror = () => {
    console.error("Error adding shipping address")
    // Proceed with order anyway
    if (callback) callback()
  }

  xhr.send(JSON.stringify(addressData))
}

// Function to update an existing address
function updateAddress(clientId, addressId, shippingInfo, token, callback) {
  console.log("Updating shipping address:", addressId)

  const addressData = {
    address: shippingInfo.address,
    city: shippingInfo.city,
    governorate: shippingInfo.governorate,
    postCode: shippingInfo.postCode,
    phone: shippingInfo.phone,
    isDefault: true
  }

  const xhr = new XMLHttpRequest()
  xhr.open("PUT", `http://localhost:3000/client/${clientId}/shipping-address/${addressId}`, true)
  xhr.setRequestHeader("Authorization", token)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    if (xhr.status === 200) {
      console.log("Shipping address updated successfully")
    } else {
      console.error("Failed to update shipping address. Status:", xhr.status)
    }
    
    // Proceed with order regardless
    if (callback) callback()
  }

  xhr.onerror = () => {
    console.error("Error updating shipping address")
    // Proceed with order anyway
    if (callback) callback()
  }

  xhr.send(JSON.stringify(addressData))
}

// Function to handle placing the order
function placeOrder(clientId, token) {
  // Get cart ID from localStorage
  const cartId = localStorage.getItem("cartId")

  // SweetAlert2 import (if not already included)
  if (typeof Swal === "undefined") {
    console.warn("SweetAlert2 is not defined. Ensure it is properly imported.")
  }

  if (!cartId) {
    // Ensure Swal is defined before using it
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Panier vide",
        text: "Veuillez ajouter des articles à votre panier.",
        confirmButtonColor: "#3b82f6",
      })
    } else {
      alert("Panier vide: Veuillez ajouter des articles à votre panier.")
    }
    return
  }

  // Get shipping details from form
  const shippingDetails = {
    firstname: document.querySelector("#firstname")?.value || "",
    lastname: document.querySelector("#lastname")?.value || "",
    email: document.querySelector("#email")?.value || "",
    governorate: document.querySelector("#governorate")?.value || "",
    city: document.querySelector("#city")?.value || "",
    address: document.querySelector("#address")?.value || "",
    phone: document.querySelector("#phone")?.value || "",
    postCode: document.querySelector("#postCode")?.value || ""
  }

  // Validate required fields
  const requiredFields = ["firstname", "lastname", "email", "address", "city", "governorate", "postCode", "phone"]
  const missingFields = requiredFields.filter(field => !shippingDetails[field])
  
  if (missingFields.length > 0) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Informations manquantes",
        text: `Veuillez remplir tous les champs obligatoires: ${missingFields.join(", ")}`,
        confirmButtonColor: "#3b82f6",
      })
    } else {
      alert(`Veuillez remplir tous les champs obligatoires: ${missingFields.join(", ")}`)
    }
    return
  }

  // Show loading state
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: "Traitement de la commande",
      text: "Veuillez patienter pendant que nous traitons votre commande...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })
  } else {
    console.log("Traitement de la commande: Veuillez patienter...")
  }

  // Prepare data for order creation
  const orderData = {
    idPanier: cartId,
    shippingDetails: shippingDetails
  }

  console.log("Sending order data:", orderData)

  // Check token format and fix if needed
  let authToken = token
  if (token && !token.startsWith("Bearer ")) {
    authToken = "Bearer " + token
  }

  // Send order to server
  const xhr = new XMLHttpRequest()
  xhr.open("POST", "http://localhost:3000/order/create", true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.setRequestHeader("Authorization", authToken)

  xhr.onload = () => {
    console.log("Order response status:", xhr.status)
    console.log("Order response:", xhr.responseText)

    if (xhr.status === 200 || xhr.status === 201) {
      try {
        const response = JSON.parse(xhr.responseText)
        console.log("Parsed order response:", response)

        if (response.orders && response.orders.length > 0) {
          // Order was successful - Show success SweetAlert
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "success",
              title: "Commande passée avec succès!",
              text: "Merci pour votre achat. Votre commande a été confirmée.",
              confirmButtonColor: "#3b82f6",
              confirmButtonText: "Continuer vos achats",
            }).then((result) => {
              if (result.isConfirmed) {
                // Clear cart data from localStorage
                localStorage.removeItem("checkoutCartData")
                localStorage.removeItem("cartId")

                // Redirect to home page after confirmation
                window.location.href = "index.html"
              }
            })
          } else {
            alert("Commande passée avec succès!")
            localStorage.removeItem("checkoutCartData")
            localStorage.removeItem("cartId")
            window.location.href = "index.html"
          }
        } else {
          // Order failed but with 200 status
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "error",
              title: "Échec de la commande",
              text: response.message || "Un problème est survenu lors du traitement de votre commande.",
              confirmButtonColor: "#3b82f6",
            })
          } else {
            alert(
              "Échec de la commande: " +
                (response.message || "Un problème est survenu lors du traitement de votre commande."),
            )
          }
        }
      } catch (error) {
        console.error("Error parsing response:", error)
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Erreur de traitement",
            text: "Une erreur est survenue lors du traitement de votre commande.",
            confirmButtonColor: "#3b82f6",
          })
        } else {
          alert("Erreur de traitement: Une erreur est survenue lors du traitement de votre commande.")
        }
      }
    } else if (xhr.status === 401 || xhr.status === 403) {
      console.error("Authentication error when placing order:", xhr.responseText)
      showAuthError("Votre session a expiré. Veuillez vous reconnecter.")
    } else {
      console.error("Failed to place order. Status:", xhr.status)
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "error",
          title: "Échec de la commande",
          text: "Impossible de passer la commande. Veuillez réessayer plus tard.",
          confirmButtonColor: "#3b82f6",
        })
      } else {
        alert("Échec de la commande: Impossible de passer la commande. Veuillez réessayer plus tard.")
      }
    }
  }

  xhr.onerror = () => {
    console.error("Order request failed")
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Erreur de connexion",
        text: "Impossible de passer la commande. Veuillez vérifier votre connexion et réessayer.",
        confirmButtonColor: "#3b82f6",
      })
    } else {
      alert("Erreur de connexion: Impossible de passer la commande. Veuillez vérifier votre connexion et réessayer.")
    }
  }

  xhr.send(JSON.stringify(orderData))
}

// Function to show authentication error
function showAuthError(message) {
  // Check if SweetAlert2 is available
  if (typeof Swal !== "undefined") {
    Swal.fire({
      icon: "error",
      title: "Erreur d'authentification",
      text: message,
      confirmButtonColor: "#3b82f6",
      confirmButtonText: "Se connecter",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "account.html"
      }
    })
  } else {
    alert(message)
    window.location.href = "account.html"
  }
}