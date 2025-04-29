document.addEventListener("DOMContentLoaded", () => {
  console.log("Checkout page loaded")

  // Debug localStorage to see what we have available
  debugLocalStorage()

  // First, try to load data from localStorage for immediate display
  populateFormFromLocalStorage()

  // Load cart products directly without authentication check
  loadCartProductsDirectly()

  // Debug form field selectors
  debugFormFields()

  // Try to manually set form values as a last resort
  setTimeout(manuallySetFormValues, 500)
})

// Function to debug localStorage
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

// Function to manually set form values as a last resort
function manuallySetFormValues() {
  console.log("Attempting to manually set form values")

  // Try to get data from complete userData object first (most reliable)
  const userDataStr = localStorage.getItem("userData")
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr)
      console.log("Using complete userData from localStorage:", userData)

      // Set values directly by ID
      setFieldValue("firstname", userData.firstname)
      setFieldValue("lastname", userData.lastname)
      setFieldValue("email", userData.email)
      setFieldValue("governorate", userData.governorate)
      setFieldValue("city", userData.city)
      setFieldValue("address", userData.address)
      setFieldValue("phone", userData.phone)
      setFieldValue("postCode", userData.postCode)

      return // Exit if we successfully populated from userData
    } catch (error) {
      console.error("Error parsing userData from localStorage:", error)
    }
  }

  // Try to get data from checkoutClientData
  const clientDataStr = localStorage.getItem("checkoutClientData")
  if (clientDataStr) {
    try {
      const clientData = JSON.parse(clientDataStr)

      // Check if we have data in camelCase format (firstName) or lowercase (firstname)
      const firstName = clientData.firstName || clientData.firstname || ""
      const lastName = clientData.lastName || clientData.lastname || ""
      const email = clientData.email || ""

      console.log("Manual population with:", { firstName, lastName, email })

      // Set values directly by ID
      setFieldValue("firstname", firstName)
      setFieldValue("lastname", lastName)
      setFieldValue("email", email)

      // Try other fields too
      setFieldValue("governorate", clientData.governorate)
      setFieldValue("city", clientData.city)
      setFieldValue("address", clientData.address)
      setFieldValue("phone", clientData.phone)
      setFieldValue("postCode", clientData.postCode)

      return // Exit if we successfully populated from checkoutClientData
    } catch (error) {
      console.error("Error in manual form population:", error)
    }
  }

  // If we get here, try to get data from individual localStorage items
  console.log("Trying individual localStorage items")

  // Try to get values from user_* prefixed items
  setFieldValue("firstname", localStorage.getItem("user_firstname"))
  setFieldValue("lastname", localStorage.getItem("user_lastname"))
  setFieldValue("email", localStorage.getItem("user_email"))
  setFieldValue("governorate", localStorage.getItem("user_governorate"))
  setFieldValue("city", localStorage.getItem("user_city"))
  setFieldValue("address", localStorage.getItem("user_address"))
  setFieldValue("phone", localStorage.getItem("user_phone"))
  setFieldValue("postCode", localStorage.getItem("user_postCode"))

  // Try to get values from user* prefixed items
  setFieldValue("firstname", localStorage.getItem("userFirstName"))
  setFieldValue("lastname", localStorage.getItem("userLastName"))
  setFieldValue("email", localStorage.getItem("userEmail"))

  // Try to get email from loginEmail
  setFieldValue("email", localStorage.getItem("loginEmail"))
}

// Helper function to set field value if not already set
function setFieldValue(fieldId, value) {
  if (!value) return false

  const field = document.getElementById(fieldId)
  if (field && !field.value) {
    field.value = value
    console.log(`Set ${fieldId} to "${value}"`)
    return true
  }
  return false
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

// Function to load cart products directly without authentication check
function loadCartProductsDirectly() {
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

  // Try to load user data from localStorage
  const userType = localStorage.getItem("userType")
  if (userType === "client") {
    // Try to get user details directly from API
    loadUserDetails(clientId, token)
  }

  // Load cart products directly
  loadCartProducts(clientId, token)
  setupPlaceOrderButton(clientId, token)
}

// Function to load user details
function loadUserDetails(clientId, token) {
  console.log("Attempting to load user details for client ID:", clientId)

  // Check token format and fix if needed
  let authToken = token
  if (token && !token.startsWith("Bearer ")) {
    authToken = "Bearer " + token
  }

  const xhr = new XMLHttpRequest()
  xhr.open("GET", `http://localhost:3000/client/${clientId}`, true)
  xhr.setRequestHeader("Authorization", authToken)
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = () => {
    console.log("User details response status:", xhr.status)

    if (xhr.status === 200) {
      try {
        const userData = JSON.parse(xhr.responseText)
        console.log("User data loaded from server:", userData)

        // Store the complete user data
        localStorage.setItem("userData", JSON.stringify(userData))

        // Process and store user data
        processUserData(userData)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    } else {
      console.error("Failed to load user details. Status:", xhr.status)
      console.error("Response:", xhr.responseText)

      // If we get a 403, try to use any data we have in localStorage
      if (xhr.status === 403) {
        console.log("Using localStorage data due to 403 error")

        // Try to use the complete userData object if available
        const userDataStr = localStorage.getItem("userData")
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr)
            processUserData(userData)
            return
          } catch (error) {
            console.error("Error parsing userData from localStorage:", error)
          }
        }

        // Fall back to email if available
        const email = localStorage.getItem("loginEmail") || localStorage.getItem("userEmail")
        if (email) {
          // Create a minimal user data object
          const minimalUserData = {
            email: email,
            firstname: localStorage.getItem("userFirstName") || "",
            lastname: localStorage.getItem("userLastName") || "",
          }
          processUserData(minimalUserData)
        }
      }
    }
  }

  xhr.onerror = () => {
    console.error("User details request failed")
  }

  xhr.send()
}

// Function to process user data
function processUserData(userData) {
  // Check if we need to access a nested property
  let clientData = userData
  if (userData.client) clientData = userData.client
  else if (userData.data) clientData = userData.data

  console.log("Processing client data:", clientData)

  // Create a standardized object to store in localStorage
  const clientInfo = {
    // Store both camelCase and lowercase versions for maximum compatibility
    firstname: clientData.firstname || clientData.firstName || clientData.first_name || "",
    firstName: clientData.firstname || clientData.firstName || clientData.first_name || "",
    lastname: clientData.lastname || clientData.lastName || clientData.last_name || "",
    lastName: clientData.lastname || clientData.lastName || clientData.last_name || "",
    email: clientData.email || clientData.emailAddress || clientData.email_address || "",
    governorate: clientData.governorate || clientData.Governorate || "",
    city: clientData.city || clientData.City || "",
    address: clientData.address || clientData.Address || clientData.streetAddress || "",
    phone: clientData.phone || clientData.Phone || clientData.phoneNumber || clientData.telephone || "",
    postCode: clientData.postCode || clientData.PostCode || clientData.postalCode || clientData.zipCode || "",
  }

  console.log("Standardized client info:", clientInfo)

  // Store individual fields in localStorage for easier access
  if (clientInfo.firstname) localStorage.setItem("userFirstName", clientInfo.firstname)
  if (clientInfo.lastname) localStorage.setItem("userLastName", clientInfo.lastname)
  if (clientInfo.email) localStorage.setItem("userEmail", clientInfo.email)

  // Store each field with user_ prefix
  for (const [key, value] of Object.entries(clientInfo)) {
    if (value) {
      localStorage.setItem(`user_${key}`, value)
    }
  }

  // Store in localStorage
  localStorage.setItem("checkoutClientData", JSON.stringify(clientInfo))
  console.log("Client data saved to localStorage")

  // Populate form fields - try multiple selector approaches
  populateFormFields(clientInfo)
}

// Function to populate form fields using multiple approaches
function populateFormFields(clientInfo) {
  console.log("Attempting to populate form fields with:", clientInfo)

  // Try ID selectors first (most reliable)
  // Try both camelCase and lowercase versions
  const firstNamePopulated = populateField("#firstname", clientInfo.firstname || clientInfo.firstName)
  const lastNamePopulated = populateField("#lastname", clientInfo.lastname || clientInfo.lastName)
  const emailPopulated = populateField("#email", clientInfo.email)

  // Continue with other fields
  populateField("#governorate", clientInfo.governorate)
  populateField("#city", clientInfo.city)
  populateField("#address", clientInfo.address)
  populateField("#phone", clientInfo.phone)
  populateField("#postCode", clientInfo.postCode)

  // If any field failed to populate, try by placeholder
  if (!firstNamePopulated || !lastNamePopulated || !emailPopulated) {
    console.log("Some fields failed to populate by ID, trying by placeholder")

    // Try placeholder selectors as fallback
    if (!firstNamePopulated) {
      populateField('input[placeholder="First Name"]', clientInfo.firstname || clientInfo.firstName)
    }

    if (!lastNamePopulated) {
      populateField('input[placeholder="Last Name"]', clientInfo.lastname || clientInfo.lastName)
    }

    if (!emailPopulated) {
      populateField('input[placeholder="Email Address"]', clientInfo.email)
    }
  }
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

// Function to populate form from localStorage
function populateFormFromLocalStorage() {
  // Try to get client data from localStorage
  const clientDataStr = localStorage.getItem("checkoutClientData")
  if (clientDataStr) {
    try {
      const clientData = JSON.parse(clientDataStr)
      console.log("Populating form from localStorage:", clientData)

      // Use the enhanced population function
      populateFormFields(clientData)
    } catch (error) {
      console.error("Error parsing client data from localStorage:", error)
    }
  }

  // Try to load cart data from localStorage
  const cartDataStr = localStorage.getItem("checkoutCartData")
  if (cartDataStr) {
    try {
      const cartData = JSON.parse(cartDataStr)
      console.log("Rendering cart from localStorage:", cartData)
      renderCheckoutSidebar(
        cartData.items || [],
        cartData.subtotal || 0,
        cartData.shippingFee || 15,
        cartData.total || 15,
      )
    } catch (error) {
      console.error("Error parsing cart data from localStorage:", error)
    }
  }
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

          // Store cart data in localStorage
          const cartData = {
            id: response.cart._id,
            items: response.cart.items,
            subtotal: subtotal,
            shippingFee: shippingFee,
            total: total,
          }
          localStorage.setItem("checkoutCartData", JSON.stringify(cartData))
          console.log("Cart data saved to localStorage")

          // Render the cart
          renderCheckoutSidebar(response.cart.items, subtotal, shippingFee, total)
        } else {
          // Empty cart
          const emptyCartData = {
            items: [],
            subtotal: 0,
            shippingFee: 15,
            total: 15,
          }
          localStorage.setItem("checkoutCartData", JSON.stringify(emptyCartData))
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

  // Store the total price for later use
  localStorage.setItem("checkoutTotal", total.toFixed(2))
  localStorage.setItem("checkoutSubtotal", subtotal.toFixed(2))
  localStorage.setItem("checkoutShippingFee", shippingFee.toFixed(2))
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

    // Save form data to localStorage before placing order
    saveFormDataToLocalStorage()

    placeOrder(clientId, token)
  })

  // Set up form field change listeners to save data as user types
  setupFormChangeListeners()
}

// Function to save form data to localStorage
function saveFormDataToLocalStorage() {
  try {
    const clientInfo = {
      // Store both camelCase and lowercase versions for maximum compatibility
      firstname: document.querySelector("#firstname")?.value || "",
      firstName: document.querySelector("#firstname")?.value || "",
      lastname: document.querySelector("#lastname")?.value || "",
      lastName: document.querySelector("#lastname")?.value || "",
      email: document.querySelector("#email")?.value || "",
      governorate: document.querySelector("#governorate")?.value || "",
      city: document.querySelector("#city")?.value || "",
      address: document.querySelector("#address")?.value || "",
      phone: document.querySelector("#phone")?.value || "",
      postCode: document.querySelector("#postCode")?.value || "",
    }

    localStorage.setItem("checkoutClientData", JSON.stringify(clientInfo))
    console.log("Form data saved to localStorage")
  } catch (error) {
    console.error("Error saving form data to localStorage:", error)
  }
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
      field.addEventListener("change", saveFormDataToLocalStorage)
      field.addEventListener("blur", saveFormDataToLocalStorage)
    }
  })
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

  // Prepare data for order creation based on your controller requirements
  const orderData = {
    idPanier: cartId,
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
