document.addEventListener("DOMContentLoaded", () => {
    getUserDataFromToken()
  
    showContent("profile-info")
    const sidebar = document.getElementById("customProfileSidebar")
    const toggleButton = document.getElementById("toggleCustomSidebar")
    document.addEventListener("click", (event) => {
      const clickedInsideSidebar = sidebar?.contains(event.target)
      const clickedToggleButton = toggleButton?.contains(event.target)
      if (clickedToggleButton) {
        sidebar?.classList.toggle("active")
      } else if (!clickedInsideSidebar) {
        sidebar?.classList.remove("active")
      }
    })
  
    document.querySelectorAll("#customProfileSidebar .profile-nav__menu a").forEach((link) => {
      link.addEventListener("click", () => {
        sidebar?.classList.remove("active")
      })
    })
    document.querySelectorAll(".toggle-password").forEach((icon) => {
      icon.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target")
        const input = document.getElementById(targetId)
        if (input) {
          const isPassword = input.type === "password"
          input.type = isPassword ? "text" : "password"
          this.classList.toggle("ph-eye-slash")
          this.classList.toggle("ph-eye")
        }
      })
    })

    const wishlistContainer = document.getElementById("wishlist-container")
    if (wishlistContainer) {
      loadWishlistFromDatabase()
    }

    initializeProfileEditModal()
    initializeProfileImageUpload()

    setupLogout()
  })
  

  let currentUserData = null

  function getUserDataFromToken() {
    try {
      const token = localStorage.getItem("token")
  
      const userFirstName = localStorage.getItem("userFirstName")
      const userLastName = localStorage.getItem("userLastName")
      const userEmail = localStorage.getItem("userEmail")
      const userId = localStorage.getItem("userId")

      if (userFirstName || userLastName) {
        console.log("Using user data from localStorage directly")
        const userData = {
          id: userId,
          firstname: userFirstName || "",
          lastname: userLastName || "",
          email: userEmail || "",
        }
        currentUserData = userData
        updateUIWithUserData(userData)
  
        return userData
      }
  
      if (!token) {
        console.error("No token found in local storage")
        loadUserProfileData()
        return null
      }
      const tokenParts = token.split(".")
      if (tokenParts.length !== 3) {
        console.error("Invalid token format")
        const userDataStr = localStorage.getItem("userData")
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr)
            currentUserData = userData
            updateUIWithUserData(userData)
            return userData
          } catch (e) {
            console.error("Error parsing userData from localStorage:", e)
          }
        }
  
        loadUserProfileData()
        return null
      }
  
      const payload = JSON.parse(atob(tokenParts[1]))
      console.log("User data retrieved from token:", payload)
  
      if (isTokenExpired(payload)) {
        console.error("Token is expired")
        
        return null
      }
      currentUserData = payload
  
      // Update UI with token data
      updateUIWithUserData(payload)
  
      return payload
    } catch (error) {
      console.error("Error parsing token:", error)
  
      // Try to get user data from userData in localStorage
      const userDataStr = localStorage.getItem("userData")
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr)
          currentUserData = userData
          updateUIWithUserData(userData)
          return userData
        } catch (e) {
          console.error("Error parsing userData from localStorage:", e)
        }
      }
  
      // If error parsing token and userData, try to load from API
      loadUserProfileData()
      return null
    }
  }
  
  // Check if token is expired
  function isTokenExpired(tokenPayload) {
    if (!tokenPayload.exp) return false
  
    const currentTime = Math.floor(Date.now() / 1000) 
    return tokenPayload.exp < currentTime
  }
  function updateUIWithUserData(userData) {
    if (!userData) {
      console.error("No user data provided")
      return
    }
  
    console.log("Updating UI with user data:", userData)
  
    const firstNameField = document.getElementById("firstName")
    const lastNameField = document.getElementById("lastName")
    const emailField = document.getElementById("email")
    const phoneField = document.getElementById("phone")
    const birthdayField = document.getElementById("birthday")
    const genderField = document.getElementById("gender")
  
    // Try all possible field name variations for first name
    const firstName =
      userData.firstname || userData.firstName || userData.given_name || localStorage.getItem("userFirstName") || ""
  
    // Try all possible field name variations for last name
    const lastName =
      userData.lastname || userData.lastName || userData.family_name || localStorage.getItem("userLastName") || ""
  
    // Try all possible field name variations for email
    const email = userData.email || localStorage.getItem("userEmail") || ""
  
    // Update fields if they exist
    if (firstNameField) firstNameField.value = firstName
    if (lastNameField) lastNameField.value = lastName
    if (emailField) emailField.value = email
  
    // Handle optional fields - check if they exist in the data from the server
    // If they don't exist, leave them empty
    if (phoneField) {
      // Check if phoneNumber exists in userData or localStorage
      const hasPhoneNumber = "phoneNumber" in userData || "phone" in userData || localStorage.getItem("userPhone")
      if (hasPhoneNumber) {
        phoneField.value = userData.phoneNumber || userData.phone || localStorage.getItem("userPhone") || ""
      } else {
        phoneField.value = ""
      }
    }
  
    if (birthdayField) {
      // Check if dateOfBirth exists in userData or localStorage
      const hasDateOfBirth = "dateOfBirth" in userData || "birthday" in userData || localStorage.getItem("userBirthday")
      if (hasDateOfBirth) {
        // Format the date if it exists
        if (userData.dateOfBirth) {
          try {
            const date = new Date(userData.dateOfBirth)
            birthdayField.value = date.toISOString().split("T")[0]
          } catch (e) {
            console.error("Error formatting date:", e)
            birthdayField.value = userData.dateOfBirth
          }
        } else if (userData.birthday) {
          try {
            const date = new Date(userData.birthday)
            birthdayField.value = date.toISOString().split("T")[0]
          } catch (e) {
            console.error("Error formatting date:", e)
            birthdayField.value = userData.birthday
          }
        } else {
          birthdayField.value = localStorage.getItem("userBirthday") || ""
        }
      } else {
        birthdayField.value = ""
      }
    }
  
    if (genderField) {
      // Check if gender exists in userData or localStorage
      const hasGender = "gender" in userData || localStorage.getItem("userGender")
      if (hasGender) {
        genderField.value = userData.gender || localStorage.getItem("userGender") || ""
      } else {
        genderField.value = ""
      }
    }
  
    // Update display name and email
    const displayName = document.getElementById("profileName")
    const displayEmail = document.getElementById("profileEmail")
  
    if (displayName) {
      displayName.textContent = `${firstName} ${lastName}`
    }
  
    if (displayEmail) displayEmail.textContent = email
  
    console.log("Profile updated with user data:", firstName, lastName, email)
  }
  function showContent(contentId) {
    const contentSections = {
      "profile-info": "profile-info-content",
      "my-orders": "my-orders-content",
      "my-wishlist": "my-wishlist-content",
      "change-password": "change-password-content",
    }
  
    Object.values(contentSections).forEach((sectionId) => {
      const section = document.getElementById(sectionId)
      if (section) {
        section.style.display = "none"
      }
    })
  
    // Show the selected content section
    const selectedContentId = contentSections[contentId]
    const selectedContent = document.getElementById(selectedContentId)
    if (selectedContent) {
      selectedContent.style.display = "block"
    }
  
    // Update active state in the menu
    document.querySelectorAll("#customProfileSidebar .profile-nav__menu li").forEach((item) => {
      item.classList.remove("active")
    })
  
    const activeMenuItem = document.getElementById(contentId)
    if (activeMenuItem) {
      activeMenuItem.classList.add("active")
    }
  }
  

function loadWishlistFromDatabase() {
    const wishlistContainer = document.getElementById("wishlist-container")
    if (!wishlistContainer) return
  
    // Show loading state
    wishlistContainer.innerHTML = '<div class="loading">Loading your wishlist...</div>'
  
    // Get user ID directly from localStorage
    const clientId = localStorage.getItem("userId")
    console.log("Attempting to fetch wishlist with clientId:", clientId)
  
    if (!clientId) {
      console.error("User ID not found in localStorage")
      wishlistContainer.innerHTML = '<div class="empty-wishlist">Please log in to view your wishlist</div>'
      return
    }
  
    // Check if user is logged in by looking for token
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("Authentication token not found")
      wishlistContainer.innerHTML = '<div class="empty-wishlist">Please log in to view your wishlist</div>'
      return
    }
  
    // Create XHR request
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `/favoris/${clientId}`, true)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.setRequestHeader("Authorization", `Bearer ${token}`) // Add token to request
  
    xhr.onload = function () {
      console.log("Wishlist API response status:", this.status)
      console.log("Wishlist API response:", this.responseText)
  
      if (this.status === 200) {
        try {
          const response = JSON.parse(this.responseText)
  
          // Debug: Log the response structure
          console.log("Parsed response:", response)
  
          // Clear loading message
          wishlistContainer.innerHTML = ""
  
          // Check if response has the expected structure
          if (response.favorites && Array.isArray(response.favorites)) {
            console.log(`Found ${response.favorites.length} wishlist items`)
  
            if (response.favorites.length === 0) {
              wishlistContainer.innerHTML = '<div class="empty-wishlist">Your wishlist is empty</div>'
              return
            }
  
            if (response.favorites.length > 0) {
              console.log("First item structure:", response.favorites[0])
            }
  
            // Add each product to the wishlist
            response.favorites.forEach((item) => {
              if (!item.productId) {
                console.error("Item missing productId:", item)
                return // Skip this item
              }
  
              wishlistContainer.appendChild(createProductCard(item))
            })
  
            // Add event listeners for delete buttons
            wishlistContainer.addEventListener("click", (e) => {
              if (e.target.closest(".delete-btn")) {
                const productId = e.target.closest(".delete-btn").dataset.productId
                const cardElement = e.target.closest(".wishlist-card")
  
                if (confirm("Are you sure you want to remove this item from your wishlist?")) {
                  removeFromWishlist(productId, cardElement, clientId)
                }
              }
            })
          } else {
            console.error("Unexpected response structure:", response)
            wishlistContainer.innerHTML = '<div class="empty-wishlist">No items found in your wishlist</div>'
          }
        } catch (e) {
          console.error("Error parsing wishlist data:", e)
          wishlistContainer.innerHTML = '<div class="error">Error loading wishlist data</div>'
        }
      } else if (this.status === 401 || this.status === 403) {
        console.error("Authentication error:", this.responseText)
        wishlistContainer.innerHTML = '<div class="empty-wishlist">Please log in to view your wishlist</div>'
      } else if (this.status === 404) {
        console.log("No wishlist found for this user")
        wishlistContainer.innerHTML = '<div class="empty-wishlist">Your wishlist is empty</div>'
      } else {
        console.error("Failed to fetch wishlist items:", this.status, this.responseText)
        wishlistContainer.innerHTML = '<div class="error">Failed to load wishlist</div>'
      }
    }
  
    xhr.onerror = () => {
      console.error("Network request error")
      wishlistContainer.innerHTML = '<div class="error">Network error occurred</div>'
    }
  
    xhr.send()
  }

  function createProductCard(item) {
    const card = document.createElement("div")
    card.className = "wishlist-card"

    console.log("Creating card for item:", item)
  
    const product = item.productId
    if (!product) {
      console.error("No product data found in item:", item)
      return document.createElement("div")
    }
  
    console.log("Product data:", product)
  
    // Extract product details based on your schema
    const productId = product._id
    const title = product.productName || "Product"
    const description = product.description || ""
    const price = product.productPrice || 0
  
    // Construct the image path
    let image = ""
    if (product.mainImage) {
      image = `/uploads/${product.mainImage}`
    }
  
    // Format price
    const formattedPrice = typeof price === "number" ? `${price.toFixed(2)} DT` : price
  
    console.log("Final card data:", { productId, title, price: formattedPrice, image, description })
  
    card.innerHTML = `
      <div class="product-image">
        <img src="${image}" alt="${title}" style="width: 100%; height: 200px; object-fit: contain;">
      </div>
      <div class="card-content">
        <h3>${title}</h3>
        <p>${description}</p>
        <div class="price">${formattedPrice}</div>
      </div>
      <div class="card-actions">
        <a href="product-details.html?id=${productId}" class="buy-btn"><i class="ph ph-shopping-cart"></i> Acheter</a>
        <button class="delete-btn" data-product-id="${productId}"><i class="ph ph-trash"></i></button>
      </div>
    `
  
    return card
  }

  function removeFromWishlist(productId, cardElement, clientId) {
    console.log("Removing product from wishlist:", { clientId, productId })
  
    // Get token from localStorage
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Authentication token not found. Please log in again.")
      return
    }
  
    const xhr = new XMLHttpRequest()
    xhr.open("DELETE", `/favoris/remove`, true)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
  
    xhr.onload = function () {
      console.log("Remove response status:", this.status)
      console.log("Remove response:", this.responseText)
  
      if (this.status === 200) {
        try {
          const response = JSON.parse(this.responseText)
          console.log("Remove response parsed:", response)
  
          // Remove the card from the UI
          cardElement.remove()
  
          // Check if wishlist is now empty
          const wishlistContainer = document.getElementById("wishlist-container")
          if (
            wishlistContainer &&
            (!wishlistContainer.children.length ||
              (wishlistContainer.children.length === 1 &&
                wishlistContainer.children[0].classList.contains("empty-wishlist")))
          ) {
            wishlistContainer.innerHTML = '<div class="empty-wishlist">Your wishlist is empty</div>'
          }
  
          console.log("Item removed from wishlist successfully")
        } catch (e) {
          console.error("Error parsing response:", e)
          alert("Error removing item from wishlist")
        }
      } else if (this.status === 401 || this.status === 403) {
        console.error("Authentication error:", this.responseText)
        alert("Please log in to remove items from your wishlist")
      } else if (this.status === 404) {
        console.log("Favorite not found:", this.responseText)
        // Remove the card anyway since it doesn't exist on the server
        cardElement.remove()
      } else {
        console.error("Error removing item. Status:", this.status, "Response:", this.responseText)
        alert("Error removing item from wishlist")
      }
    }
  
    xhr.onerror = () => {
      console.error("Network error occurred")
      alert("Network error occurred")
    }
  
    // Send both clientId and productId in the request body as required by your API
    xhr.send(
      JSON.stringify({
        clientId: clientId,
        productId: productId,
      }),
    )
  }
  
  // Initialize profile edit modal
  function initializeProfileEditModal() {
    const modalEl = document.getElementById("editProfileModal")
    if (!modalEl) return
  
    modalEl.addEventListener("show.bs.modal", () => {
      const fields = [
        { id: "firstName", modalId: "editFirstName" },
        { id: "lastName", modalId: "editLastName" },
        { id: "email", modalId: "editEmail" },
        { id: "phone", modalId: "editPhone" },
        { id: "birthday", modalId: "editBirthday" },
        { id: "gender", modalId: "editGender" },
      ]
  
      fields.forEach((field) => {
        const input = document.getElementById(field.id)
        const modalInput = document.getElementById(field.modalId)
        if (input && modalInput) {
          modalInput.value = input.value
        }
      })
    })
  
    const saveChangesBtn = document.getElementById("saveChanges")
    if (saveChangesBtn) {
      saveChangesBtn.addEventListener("click", () => {
        let firstname = ""
        let lastname = ""
        let email = ""
        const userId =
          currentUserData?.id || currentUserData?._id || currentUserData?.userId || localStorage.getItem("userId")
  
        if (!userId) {
          alert("User ID not found. Please log in again.")
          return
        }
  
        // Collect form data
        const profileData = {
          firstname: document.getElementById("editFirstName").value,
          lastname: document.getElementById("editLastName").value,
          email: document.getElementById("editEmail").value,
        }
  
        // Only add optional fields if they have values
        const phoneValue = document.getElementById("editPhone").value
        if (phoneValue && phoneValue.trim() !== "") {
          profileData.phoneNumber = phoneValue
        }
  
        const genderValue = document.getElementById("editGender").value
        if (genderValue && genderValue.trim() !== "") {
          profileData.gender = genderValue
        }
        const dateInput = document.getElementById("editBirthday")
        if (dateInput && dateInput.value && dateInput.value.trim() !== "") {
          try {
            const date = new Date(dateInput.value)
            const formattedDate = date.toISOString().split("T")[0]
            profileData.dateOfBirth = formattedDate
          } catch (e) {
            console.error("Error formatting date:", e)
            profileData.dateOfBirth = dateInput.value
          }
        }
  
        firstname = profileData.firstname
        lastname = profileData.lastname
        email = profileData.email
  
        updateUIAfterProfileUpdate(firstname, lastname, email, modalEl)
        const xhr = new XMLHttpRequest()
        xhr.open("PUT", `/client/update/${userId}`, true)
        xhr.setRequestHeader("Content-Type", "application/json")
        const token = localStorage.getItem("token")
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`)
          console.log("Authorization header set:", `Bearer ${token}`)
        } else {
          console.error("No token found for authorization")
        }
  
        xhr.onload = function () {
          if (this.status === 200) {
            try {
              const response = JSON.parse(this.responseText)
              console.log("Profile update successful:", response)
              alert("Profile updated successfully")

              document.getElementById("firstName").value = firstname
              document.getElementById("lastName").value = lastname
              document.getElementById("email").value = email
              if (profileData.phoneNumber) {
                document.getElementById("phone").value = profileData.phoneNumber
                localStorage.setItem("userPhone", profileData.phoneNumber)
              }
  
              if (profileData.dateOfBirth) {
                document.getElementById("birthday").value = profileData.dateOfBirth
                localStorage.setItem("userBirthday", profileData.dateOfBirth)
              }
  
              if (profileData.gender) {
                document.getElementById("gender").value = profileData.gender
                localStorage.setItem("userGender", profileData.gender)
              }
  
              if (currentUserData) {
                currentUserData.firstname = firstname
                currentUserData.lastname = lastname
                currentUserData.email = email
  
                if (profileData.phoneNumber) currentUserData.phoneNumber = profileData.phoneNumber
                if (profileData.dateOfBirth) currentUserData.dateOfBirth = profileData.dateOfBirth
                if (profileData.gender) currentUserData.gender = profileData.gender
              }
            } catch (e) {
              console.error("Error parsing response:", e)
              alert("Error updating profile")
            }
          } else if (this.status === 401) {
            alert("Unauthorized. Please log in again.")
            console.error("401 Unauthorized response:", this.responseText)
          } else if (this.status === 403) {
            alert("Forbidden. You don't have permission to update this profile.")
            console.error("403 Forbidden response:", this.responseText)

            console.log("User ID from localStorage:", userId)
            console.log("Token payload:", getTokenPayload())
          } else if (this.status === 400) {
            try {
              const response = JSON.parse(this.responseText)
              alert("Error: " + (response.message || "Unknown error"))
            } catch (e) {
              alert("Error updating profile")
            }
          } else {
            console.error("Error updating profile. Status:", this.status)
            console.error("Response:", this.responseText)
            alert("Error updating profile")
          }
        }
  
        xhr.onerror = () => {
          console.error("Network error occurred")
          alert("Network error occurred")
        }
  
        console.log("Sending profile update:", profileData)
        xhr.send(JSON.stringify(profileData))
      })
    }
  }
  function getTokenPayload() {
    try {
      const token = localStorage.getItem("token")
      if (!token) return null
  
      const tokenParts = token.split(".")
      if (tokenParts.length !== 3) return null
  
      return JSON.parse(atob(tokenParts[1]))
    } catch (e) {
      console.error("Error decoding token:", e)
      return null
    }
  }
  function updateUIAfterProfileUpdate(firstname, lastname, email, modalEl) {
    const displayName = document.getElementById("profileName")
    const displayEmail = document.getElementById("profileEmail")
  
    if (displayName) displayName.textContent = `${firstname} ${lastname}`
    if (displayEmail) displayEmail.textContent = email
  
    // Close the modal if it exists
    try {
      if (window.bootstrap && modalEl) {
        const modal = window.bootstrap.Modal.getInstance(modalEl)
        if (modal) modal.hide()
      }
    } catch (e) {
      console.error("Error closing modal:", e)
    }
  
    localStorage.setItem("userFirstName", firstname)
    localStorage.setItem("userLastName", lastname)
    localStorage.setItem("userEmail", email)
  
    // Update userData in localStorage if it exists
    try {
      const userDataStr = localStorage.getItem("userData")
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)
        userData.firstname = firstname
        userData.lastname = lastname
        userData.email = email
        localStorage.setItem("userData", JSON.stringify(userData))
      }
    } catch (e) {
      console.error("Error updating userData in localStorage:", e)
    }
  }
  
  function loadUserProfileData() {
    const userId =
      currentUserData?.id || currentUserData?._id || currentUserData?.userId || localStorage.getItem("userId")
    if (!userId) {
      console.error("No user ID available to load profile data")
  
      // Try to create user data from localStorage
      const userFirstName = localStorage.getItem("userFirstName")
      const userLastName = localStorage.getItem("userLastName")
      const userEmail = localStorage.getItem("userEmail")
  
      if (userFirstName || userLastName || userEmail) {
        const userData = {
          firstname: userFirstName || "",
          lastname: userLastName || "",
          email: userEmail || "",
        }
  
        currentUserData = userData
        updateUIWithUserData(userData)
      }
  
      return
    }
  
    const xhr = new XMLHttpRequest()
    xhr.open("GET", `/client/${userId}`, true)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("token")}`)
  
    xhr.onload = function () {
      if (this.status === 200) {
        try {
          const userData = JSON.parse(this.responseText)
          console.log("User data loaded from API:", userData)

          currentUserData = userData

          updateUIWithUserData(userData)

          localStorage.setItem("userFirstName", userData.firstname || "")
          localStorage.setItem("userLastName", userData.lastname || "")
          localStorage.setItem("userEmail", userData.email || "")

          if (userData.phoneNumber) {
            localStorage.setItem("userPhone", userData.phoneNumber)
          }
  
          if (userData.dateOfBirth) {
            try {
              const date = new Date(userData.dateOfBirth)
              localStorage.setItem("userBirthday", date.toISOString().split("T")[0])
            } catch (e) {
              console.error("Error formatting date for localStorage:", e)
              localStorage.setItem("userBirthday", userData.dateOfBirth)
            }
          }
  
          if (userData.gender) {
            localStorage.setItem("userGender", userData.gender)
          }
        } catch (e) {
          console.error("Error parsing user data:", e)
          alert("Error loading user profile data")
        }
      } else if (this.status === 401) {
        console.error("Unauthorized access to profile")
        // Could redirect to login page here
      } else {
        console.error("Error loading user data. Status:", this.status)
        alert("Error loading user profile data")
      }
    }
  
    xhr.onerror = () => {
      console.error("Network error occurred")
      alert("Network error occurred while loading profile")
    }
  
    xhr.send()
  }
  
  function initializeProfileImageUpload() {
    const imageInput = document.getElementById("profileImageInput")
    const profileImage = document.getElementById("profileImage")
    const editBtn = document.getElementById("editImageBtn")
  
    if (!imageInput || !profileImage || !editBtn) return
    editBtn.addEventListener("click", () => {
      imageInput.click()
    })

    imageInput.addEventListener("change", function () {
      const file = this.files[0]
      if (file) {
        const reader = new FileReader()
  
        reader.onload = (e) => {
          profileImage.src = e.target.result

          localStorage.setItem("userProfileImage", e.target.result)

          alert(
            "Profile image updated locally. Note: The image is not saved to the server as the upload API is not available.",
          )
        }
  
        reader.readAsDataURL(file)
      }
    })
  }
  function setupLogout() {
    const logoutLink = document.querySelector("#logout a")
    if (logoutLink) {
      logoutLink.addEventListener("click", function (e) {
        e.preventDefault()
        localStorage.clear()
        currentUserData = null
        showToast("Déconnexion réussie", "Vous avez été déconnecté avec succès.", "success")
        setTimeout(() => {
          window.location.href = this.getAttribute("href") || "index.html"
        }, 1000)
      })
    }
  }
  
  // Function to handle password change
 // passwordManager.js - Client-side code
document.addEventListener("DOMContentLoaded", () => {
    // Get form element
    const passwordForm = document.querySelector(".password-form");
    
    // Setup password visibility toggles
    setupPasswordToggles();
    
    // Handle form submission
    if (passwordForm) {
      passwordForm.addEventListener("submit", handlePasswordChange);
    }
    
    // Load profile image if available
    loadProfileImage();
  });
  
  /**
   * Set up password visibility toggle functionality
   */
  function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll(".toggle-password");
    
    toggleButtons.forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const passwordInput = document.getElementById(targetId);
        
        // Toggle between password and text type
        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          button.classList.remove("ph-eye-slash");
          button.classList.add("ph-eye");
        } else {
          passwordInput.type = "password";
          button.classList.remove("ph-eye");
          button.classList.add("ph-eye-slash");
        }
      });
    });
  }
  
  /**
   * Handle password change form submission
   * @param {Event} e - Form submit event
   */
  async function handlePasswordChange(e) {
    e.preventDefault();
    
    // Get password values
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    
    // Validate form inputs
    if (!validatePasswordInputs(currentPassword, newPassword, confirmPassword)) {
      return;
    }
    
    // Get user ID and auth token
    const userId = getUserId();
    const token = getAuthToken();
    
    if (!userId || !token) {
      showNotification("Authentication information missing. Please log in again.", "error");
      return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector(".submit-btn");
    setButtonLoading(submitBtn, true);
    
    try {
      // Send password change request
      const response = await fetch("/client/changePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });
      
      // Handle response
      const data = await response.json();
      
      if (response.ok && data.success) {
        showNotification("Password changed successfully!", "success");
        e.target.reset(); // Clear form
      } else {
        const errorMessage = data.message || "An error occurred";
        showNotification(`Error: ${errorMessage}`, "error");
        
        // Handle specific error cases
        if (response.status === 401) {
          console.error("Authentication failed. Current password may be incorrect.");
        }
      }
    } catch (error) {
      console.error("Password change request failed:", error);
      showNotification("Network or server error. Please try again later.", "error");
    } finally {
      // Reset button state
      setButtonLoading(submitBtn, false);
    }
  }
  
  /**
   * Validate password inputs
   * @param {string} current - Current password
   * @param {string} newPass - New password
   * @param {string} confirm - Confirm password
   * @returns {boolean} - Whether validation passed
   */
  function validatePasswordInputs(current, newPass, confirm) {
    // Check if all fields are filled
    if (!current || !newPass || !confirm) {
      showNotification("All password fields are required", "error");
      return false;
    }
    
    // Check if new passwords match
    if (newPass !== confirm) {
      showNotification("New passwords do not match", "error");
      return false;
    }
    
    // Check password strength
    if (newPass.length < 8) {
      showNotification("New password must be at least 8 characters long", "error");
      return false;
    }
    
    return true;
  }
  
  /**
   * Set button loading state
   * @param {HTMLElement} button - Button element
   * @param {boolean} isLoading - Whether button is in loading state
   */
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.originalText = button.innerHTML;
      button.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';
      button.disabled = true;
    } else {
      button.innerHTML = button.originalText || '<i class="ph ph-arrow-clockwise"></i> Update Password';
      button.disabled = false;
    }
  }
  
  /**
   * Show notification to user
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  function showNotification(message, type = "info") {
    // You can replace this with a custom notification system
    if (type === "error") {
      alert(message);
    } else {
      alert(message);
    }
  }
  
  /**
   * Get current user ID from available sources
   * @returns {string|null} - User ID or null if not found
   */
  function getUserId() {
    // Try multiple sources for user ID
    if (window.currentUserData) {
      return currentUserData.id || currentUserData._id || currentUserData.userId;
    }
    
    return localStorage.getItem("userId") || sessionStorage.getItem("userId");
  }
  
  /**
   * Get authentication token
   * @returns {string} - Auth token or empty string
   */
  function getAuthToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  }
  
  /**
   * Load profile image if available
   */
  function loadProfileImage() {
    const profileImage = document.getElementById("profileImage");
    if (profileImage) {
      const savedImage = localStorage.getItem("userProfileImage");
      if (savedImage) {
        profileImage.src = savedImage;
      }
    }
  }