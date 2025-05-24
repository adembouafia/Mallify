// OAuth Handler for Google and Facebook Login
document.addEventListener("DOMContentLoaded", () => {
  console.log("OAuth handler initialized")

  // Check for existing login first
  if (!checkExistingLogin()) {
    // Only set up OAuth if user is not already logged in
    checkOAuthCallback()
    setupOAuthButtons()
  }

  enhanceLoginForm()
})

function checkOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search)

  // Check for OAuth success
  if (urlParams.get("oauth_success") === "true") {
    const token = urlParams.get("token")
    const userDataParam = urlParams.get("user")

    console.log("OAuth success detected")
    console.log("Token:", token ? "Present" : "Missing")
    console.log("User data:", userDataParam ? "Present" : "Missing")

    if (token && userDataParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userDataParam))
        console.log("Parsed user data:", userData)

        // Store authentication data in localStorage
        localStorage.setItem("token", token)
        localStorage.setItem("userId", userData.id)
        localStorage.setItem("userType", "client")
        localStorage.setItem("userFirstName", userData.firstname || "")
        localStorage.setItem("userLastName", userData.lastname || "")
        localStorage.setItem("userEmail", userData.email || "")
        localStorage.setItem("authProvider", userData.authProvider || "local")

        // Store profile picture URL for OAuth users
        if (userData.profilePicture) {
          localStorage.setItem("userProfilePicture", userData.profilePicture)
          console.log("Stored OAuth profile picture:", userData.profilePicture)
        }

        console.log("User data stored in localStorage")

        // Show success message
        showOAuthMessage(
          "success",
          `Successfully logged in with ${userData.authProvider}! Welcome ${userData.firstname}!`,
        )

        // Hide login forms and show logged-in state
        updateUIForLoggedInUser(userData)

        // Redirect after a delay
        setTimeout(() => {
          window.location.href = "index.html"
        }, 3000)
      } catch (error) {
        console.error("Error parsing OAuth user data:", error)
        showOAuthMessage("error", "Error processing login data. Please try again.")
      }
    } else {
      console.error("Missing token or user data in OAuth callback")
      showOAuthMessage("error", "Login data incomplete. Please try again.")
    }

    // Clean up URL
    cleanUpURL()
  }

  // Check for OAuth errors
  const error = urlParams.get("error")
  if (error) {
    let errorMessage = "Authentication failed. Please try again."

    switch (error) {
      case "google_auth_failed":
        errorMessage = "Google authentication failed. Please try again."
        break
      case "facebook_auth_failed":
        errorMessage = "Facebook authentication failed. Please try again."
        break
      case "oauth_callback_failed":
        errorMessage = "Authentication callback failed. Please try again."
        break
      case "google_not_configured":
        errorMessage = "Google OAuth is not configured on the server."
        break
      case "facebook_not_configured":
        errorMessage = "Facebook OAuth is not configured on the server."
        break
    }

    showOAuthMessage("error", errorMessage)
    cleanUpURL()
  }
}

function updateUIForLoggedInUser(userData) {
  console.log("Updating UI for logged in user:", userData)

  // Hide login and register forms
  const loginCard = document.getElementById("loginCard")
  const registerCard = document.getElementById("registerCard")
  const chooseAccountCard = document.getElementById("chooseAccountCard")
  const vendorCard = document.getElementById("vendorcard")

  if (loginCard) loginCard.style.display = "none"
  if (registerCard) registerCard.style.display = "none"
  if (chooseAccountCard) chooseAccountCard.style.display = "none"
  if (vendorCard) vendorCard.style.display = "none"

  // Create and show welcome message
  const container = document.querySelector(".container.container-lg")
  if (container) {
    const welcomeDiv = document.createElement("div")
    welcomeDiv.className = "col-xl-6 mx-auto"
    welcomeDiv.innerHTML = `
      <div class="border border-gray-100 rounded-16 px-24 py-40 text-center">
        <div class="mb-24">
          ${
            userData.profilePicture
              ? `<img src="${userData.profilePicture}" alt="Profile" class="rounded-circle mb-16" width="80" height="80" style="object-fit: cover;">`
              : `<div class="w-80 h-80 rounded-circle bg-main-600 text-white flex-center mx-auto mb-16 text-2xl">${userData.firstname.charAt(0).toUpperCase()}</div>`
          }
        </div>
        <h4 class="text-xl mb-16">Welcome, ${userData.firstname} ${userData.lastname}!</h4>
        <p class="text-gray-600 mb-24">You have successfully logged in with ${userData.authProvider}.</p>
        <p class="text-sm text-gray-500 mb-32">Email: ${userData.email}</p>
        <div class="d-flex gap-16 justify-content-center">
          <a href="index.html" class="btn btn-main py-12 px-24">Go to Homepage</a>
          <button onclick="logoutUser()" class="btn btn-outline-main py-12 px-24">Logout</button>
        </div>
      </div>
    `

    // Insert the welcome message
    const firstRow = container.querySelector(".row")
    if (firstRow) {
      firstRow.innerHTML = ""
      firstRow.appendChild(welcomeDiv)
    }
  }
}

function logoutUser() {
  // Clear localStorage
  localStorage.removeItem("token")
  localStorage.removeItem("userId")
  localStorage.removeItem("userType")
  localStorage.removeItem("userFirstName")
  localStorage.removeItem("userLastName")
  localStorage.removeItem("userEmail")
  localStorage.removeItem("authProvider")
  localStorage.removeItem("userProfilePicture")

  console.log("User logged out, localStorage cleared")

  // Reload the page to show login forms again
  window.location.reload()
}

function setupOAuthButtons() {
  // Google OAuth buttons
  const googleButtons = document.querySelectorAll("#google-login-btn, #google-register-btn")
  googleButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      handleOAuthClick(this, "google")
    })
  })

  // Facebook OAuth buttons
  const facebookButtons = document.querySelectorAll("#facebook-login-btn, #facebook-register-btn")
  facebookButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      handleOAuthClick(this, "facebook")
    })
  })
}

function handleOAuthClick(button, provider) {
  console.log(`${provider} OAuth button clicked`)

  // Show loading state
  const loadingElement = button.querySelector(".oauth-loading")
  if (loadingElement) {
    loadingElement.classList.add("active")
  }

  // Disable button to prevent multiple clicks
  button.style.pointerEvents = "none"

  // Store the current page state
  localStorage.setItem("oauthReturnUrl", window.location.href)

  // Navigate to OAuth endpoint
  const authUrl = provider === "google" ? "/auth/google" : "/auth/facebook"

  console.log(`Redirecting to: ${authUrl}`)

  // Add a small delay to show the loading state
  setTimeout(() => {
    window.location.href = authUrl
  }, 500)
}

function showOAuthMessage(type, message) {
  console.log(`Showing ${type} message:`, message)

  const successElement = document.getElementById("oauth-success-message")
  const errorElement = document.getElementById("oauth-error-message")
  const errorTextElement = document.getElementById("oauth-error-text")

  // Hide both messages first
  if (successElement) successElement.style.display = "none"
  if (errorElement) errorElement.style.display = "none"

  if (type === "success" && successElement) {
    successElement.innerHTML = `<strong>Success!</strong> ${message}`
    successElement.style.display = "block"
    successElement.scrollIntoView({ behavior: "smooth", block: "center" })
  } else if (type === "error" && errorElement && errorTextElement) {
    errorTextElement.textContent = message
    errorElement.style.display = "block"
    errorElement.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  // Auto-hide messages after 8 seconds
  setTimeout(() => {
    if (successElement) successElement.style.display = "none"
    if (errorElement) errorElement.style.display = "none"
  }, 8000)
}

function cleanUpURL() {
  // Remove OAuth parameters from URL without refreshing the page
  const url = new URL(window.location)
  url.searchParams.delete("oauth_success")
  url.searchParams.delete("token")
  url.searchParams.delete("user")
  url.searchParams.delete("error")

  window.history.replaceState({}, document.title, url.toString())
}

// Check if user is already logged in when page loads
function checkExistingLogin() {
  const token = localStorage.getItem("token")
  const userId = localStorage.getItem("userId")
  const userFirstName = localStorage.getItem("userFirstName")
  const userLastName = localStorage.getItem("userLastName")
  const userEmail = localStorage.getItem("userEmail")
  const authProvider = localStorage.getItem("authProvider")
  const profilePicture = localStorage.getItem("userProfilePicture")

  if (token && userId) {
    console.log("Existing login found")
    const userData = {
      id: userId,
      firstname: userFirstName || "",
      lastname: userLastName || "",
      email: userEmail || "",
      authProvider: authProvider || "local",
      profilePicture: profilePicture || "",
    }

    updateUIForLoggedInUser(userData)
    return true
  }

  return false
}

// Enhanced login form handler to work with OAuth
function enhanceLoginForm() {
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      // Check if user is already logged in via OAuth
      const authProvider = localStorage.getItem("authProvider")
      if (authProvider && authProvider !== "local") {
        e.preventDefault()
        showOAuthMessage("error", "You are already logged in with " + authProvider + ". Please logout first.")
        return
      }
    })
  }
}

// Export functions for use in other scripts
window.OAuthHandler = {
  checkOAuthCallback,
  setupOAuthButtons,
  handleOAuthClick,
  showOAuthMessage,
  cleanUpURL,
  logoutUser,
  checkExistingLogin,
}
