document.addEventListener("DOMContentLoaded", () => {
  getUserDataFromToken();

  showContent("profile-info");
  const sidebar = document.getElementById("customProfileSidebar");
  const toggleButton = document.getElementById("toggleCustomSidebar");
  document.addEventListener("click", (event) => {
    const clickedInsideSidebar = sidebar?.contains(event.target);
    const clickedToggleButton = toggleButton?.contains(event.target);
    if (clickedToggleButton) {
      sidebar?.classList.toggle("active");
    } else if (!clickedInsideSidebar) {
      sidebar?.classList.remove("active");
    }
  });

  document
    .querySelectorAll("#customProfileSidebar .profile-nav__menu a")
    .forEach((link) => {
      link.addEventListener("click", () => {
        sidebar?.classList.remove("active");
      });
    });

  const wishlistContainer = document.getElementById("wishlist-container");
  if (wishlistContainer) {
    loadWishlistFromDatabase();
  }

  initializeProfileEditModal();
  initializeProfileImageUpload();

  setupLogout();
});

let currentUserData = null;

function getUserDataFromToken() {
  try {
    const token = localStorage.getItem("token");

    const userFirstName = localStorage.getItem("userFirstName");
    const userLastName = localStorage.getItem("userLastName");
    const userEmail = localStorage.getItem("userEmail");
    const userId = localStorage.getItem("userId");

    if (userFirstName || userLastName) {
      console.log("Using user data from localStorage directly");
      const userData = {
        id: userId,
        firstname: userFirstName || "",
        lastname: userLastName || "",
        email: userEmail || "",
      };
      currentUserData = userData;
      updateUIWithUserData(userData);

      return userData;
    }

    if (!token) {
      console.error("No token found in local storage");
      loadUserProfileData();
      return null;
    }
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      console.error("Invalid token format");
      const userDataStr = localStorage.getItem("userData");
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          currentUserData = userData;
          updateUIWithUserData(userData);
          return userData;
        } catch (e) {
          console.error("Error parsing userData from localStorage:", e);
        }
      }

      loadUserProfileData();
      return null;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    console.log("User data retrieved from token:", payload);

    if (isTokenExpired(payload)) {
      console.error("Token is expired");

      return null;
    }
    currentUserData = payload;

    // Update UI with token data
    updateUIWithUserData(payload);

    return payload;
  } catch (error) {
    console.error("Error parsing token:", error);

    // Try to get user data from userData in localStorage
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        currentUserData = userData;
        updateUIWithUserData(userData);
        return userData;
      } catch (e) {
        console.error("Error parsing userData from localStorage:", e);
      }
    }

    // If error parsing token and userData, try to load from API
    loadUserProfileData();
    return null;
  }
}

// Check if token is expired
function isTokenExpired(tokenPayload) {
  if (!tokenPayload.exp) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  return tokenPayload.exp < currentTime;
}

function updateUIWithUserData(userData) {
  if (!userData) {
    console.error("No user data provided");
    return;
  }

  console.log("Updating UI with user data:", userData);

  const firstNameField = document.getElementById("firstName");
  const lastNameField = document.getElementById("lastName");
  const emailField = document.getElementById("email");
  const phoneField = document.getElementById("phone");
  const birthdayField = document.getElementById("birthday");
  const genderField = document.getElementById("gender");

  // Try all possible field name variations for first name
  const firstName =
    userData.firstname ||
    userData.firstName ||
    userData.given_name ||
    localStorage.getItem("userFirstName") ||
    "";

  // Try all possible field name variations for last name
  const lastName =
    userData.lastname ||
    userData.lastName ||
    userData.family_name ||
    localStorage.getItem("userLastName") ||
    "";

  // Try all possible field name variations for email
  const email = userData.email || localStorage.getItem("userEmail") || "";

  // Update fields if they exist
  if (firstNameField) firstNameField.value = firstName;
  if (lastNameField) lastNameField.value = lastName;
  if (emailField) emailField.value = email;

  // Handle optional fields - check if they exist in the data from the server
  // If they don't exist, leave them empty
  if (phoneField) {
    // Check if phoneNumber exists in userData or localStorage
    const hasPhoneNumber =
      "phoneNumber" in userData ||
      "phone" in userData ||
      localStorage.getItem("userPhone");
    if (hasPhoneNumber) {
      phoneField.value =
        userData.phoneNumber ||
        userData.phone ||
        localStorage.getItem("userPhone") ||
        "";
    } else {
      phoneField.value = "";
    }
  }

  if (birthdayField) {
    // Check if dateOfBirth exists in userData or localStorage
    const hasDateOfBirth =
      "dateOfBirth" in userData ||
      "birthday" in userData ||
      localStorage.getItem("userBirthday");
    if (hasDateOfBirth) {
      // Format the date if it exists
      if (userData.dateOfBirth) {
        try {
          const date = new Date(userData.dateOfBirth);
          birthdayField.value = date.toISOString().split("T")[0];
        } catch (e) {
          console.error("Error formatting date:", e);
          birthdayField.value = userData.dateOfBirth;
        }
      } else if (userData.birthday) {
        try {
          const date = new Date(userData.birthday);
          birthdayField.value = date.toISOString().split("T")[0];
        } catch (e) {
          console.error("Error formatting date:", e);
          birthdayField.value = userData.birthday;
        }
      } else {
        birthdayField.value = localStorage.getItem("userBirthday") || "";
      }
    } else {
      birthdayField.value = "";
    }
  }

  if (genderField) {
    // Check if gender exists in userData or localStorage
    const hasGender =
      "gender" in userData || localStorage.getItem("userGender");
    if (hasGender) {
      genderField.value =
        userData.gender || localStorage.getItem("userGender") || "";
    } else {
      genderField.value = "";
    }
  }

  // Update display name and email
  const displayName = document.getElementById("profileName");
  const displayEmail = document.getElementById("profileEmail");

  if (displayName) {
    displayName.textContent = `${firstName} ${lastName}`;
  }

  if (displayEmail) displayEmail.textContent = email;

  console.log("Profile updated with user data:", firstName, lastName, email);
}

function showContent(contentId) {
  const contentSections = {
    "profile-info": "profile-info-content",
    "my-orders": "my-orders-content",
    "my-wishlist": "my-wishlist-content",
    "change-password": "change-password-content",
  };

  Object.values(contentSections).forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = "none";
    }
  });

  // Show the selected content section
  const selectedContentId = contentSections[contentId];
  const selectedContent = document.getElementById(selectedContentId);
  if (selectedContent) {
    selectedContent.style.display = "block";
  }

  // Update active state in the menu
  document
    .querySelectorAll("#customProfileSidebar .profile-nav__menu li")
    .forEach((item) => {
      item.classList.remove("active");
    });

  const activeMenuItem = document.getElementById(contentId);
  if (activeMenuItem) {
    activeMenuItem.classList.add("active");
  }
}

function loadWishlistFromDatabase() {
  const wishlistContainer = document.getElementById("wishlist-container");
  if (!wishlistContainer) return;

  // Show loading state
  wishlistContainer.innerHTML =
    '<div class="loading">Loading your wishlist...</div>';

  // Get user ID directly from localStorage
  const clientId = localStorage.getItem("userId");
  console.log("Attempting to fetch wishlist with clientId:", clientId);

  if (!clientId) {
    console.error("User ID not found in localStorage");
    wishlistContainer.innerHTML =
      '<div class="empty-wishlist">Please log in to view your wishlist</div>';
    return;
  }

  // Check if user is logged in by looking for token
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Authentication token not found");
    wishlistContainer.innerHTML =
      '<div class="empty-wishlist">Please log in to view your wishlist</div>';
    return;
  }

  // Create XHR request
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/favoris/${clientId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`); // Add token to request

  xhr.onload = function () {
    console.log("Wishlist API response status:", this.status);
    console.log("Wishlist API response:", this.responseText);

    if (this.status === 200) {
      try {
        const response = JSON.parse(this.responseText);

        // Debug: Log the response structure
        console.log("Parsed response:", response);

        // Clear loading message
        wishlistContainer.innerHTML = "";

        // Check if response has the expected structure
        if (response.favorites && Array.isArray(response.favorites)) {
          console.log(`Found ${response.favorites.length} wishlist items`);

          if (response.favorites.length === 0) {
            wishlistContainer.innerHTML =
              '<div class="empty-wishlist">Your wishlist is empty</div>';
            return;
          }

          if (response.favorites.length > 0) {
            console.log("First item structure:", response.favorites[0]);
          }

          // Add each product to the wishlist
          response.favorites.forEach((item) => {
            if (!item.productId) {
              console.error("Item missing productId:", item);
              return; // Skip this item
            }

            wishlistContainer.appendChild(createProductCard(item));
          });

          // Add event listeners for delete buttons
          wishlistContainer.addEventListener("click", (e) => {
            if (e.target.closest(".delete-btn")) {
              const productId =
                e.target.closest(".delete-btn").dataset.productId;
              const cardElement = e.target.closest(".wishlist-card");

              if (
                confirm(
                  "Are you sure you want to remove this item from your wishlist?"
                )
              ) {
                removeFromWishlist(productId, cardElement, clientId);
              }
            }
          });
        } else {
          console.error("Unexpected response structure:", response);
          wishlistContainer.innerHTML =
            '<div class="empty-wishlist">No items found in your wishlist</div>';
        }
      } catch (e) {
        console.error("Error parsing wishlist data:", e);
        wishlistContainer.innerHTML =
          '<div class="error">Error loading wishlist data</div>';
      }
    } else if (this.status === 401 || this.status === 403) {
      console.error("Authentication error:", this.responseText);
      wishlistContainer.innerHTML =
        '<div class="empty-wishlist">Please log in to view your wishlist</div>';
    } else if (this.status === 404) {
      console.log("No wishlist found for this user");
      wishlistContainer.innerHTML =
        '<div class="empty-wishlist">Your wishlist is empty</div>';
    } else {
      console.error(
        "Failed to fetch wishlist items:",
        this.status,
        this.responseText
      );
      wishlistContainer.innerHTML =
        '<div class="error">Failed to load wishlist</div>';
    }
  };

  xhr.onerror = () => {
    console.error("Network request error");
    wishlistContainer.innerHTML =
      '<div class="error">Network error occurred</div>';
  };

  xhr.send();
}

function createProductCard(item) {
  const card = document.createElement("div");
  card.className = "wishlist-card";

  console.log("Creating card for item:", item);

  const product = item.productId;
  if (!product) {
    console.error("No product data found in item:", item);
    return document.createElement("div");
  }

  console.log("Product data:", product);

  // Extract product details based on your schema
  const productId = product._id;
  const title = product.productName || "Product";
  const description = product.description || "";
  const price = product.productPrice || 0;

  // Construct the image path
  let image = "";
  if (product.mainImage) {
    image = `/uploads/${product.mainImage}`;
  }

  // Format price
  const formattedPrice =
    typeof price === "number" ? `${price.toFixed(2)} DT` : price;

  console.log("Final card data:", {
    productId,
    title,
    price: formattedPrice,
    image,
    description,
  });

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
        <a href="product-details.html?id=${productId}" class="buy-btn"><i class="ph ph-eye"></i> View Details</a>
        <button class="delete-btn" data-product-id="${productId}"><i class="ph ph-trash"></i></button>
      </div>
    `;

  return card;
}

function removeFromWishlist(productId, cardElement, clientId) {
  console.log("Removing product from wishlist:", { clientId, productId });

  // Get token from localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Authentication token not found. Please log in again.");
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("DELETE", `/favoris/remove`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);

  xhr.onload = function () {
    console.log("Remove response status:", this.status);
    console.log("Remove response:", this.responseText);

    if (this.status === 200) {
      try {
        const response = JSON.parse(this.responseText);
        console.log("Remove response parsed:", response);

        // Remove the card from the UI
        cardElement.remove();

        // Check if wishlist is now empty
        const wishlistContainer = document.getElementById("wishlist-container");
        if (
          wishlistContainer &&
          (!wishlistContainer.children.length ||
            (wishlistContainer.children.length === 1 &&
              wishlistContainer.children[0].classList.contains(
                "empty-wishlist"
              )))
        ) {
          wishlistContainer.innerHTML =
            '<div class="empty-wishlist">Your wishlist is empty</div>';
        }

        console.log("Item removed from wishlist successfully");
      } catch (e) {
        console.error("Error parsing response:", e);
        alert("Error removing item from wishlist");
      }
    } else if (this.status === 401 || this.status === 403) {
      console.error("Authentication error:", this.responseText);
      alert("Please log in to remove items from your wishlist");
    } else if (this.status === 404) {
      console.log("Favorite not found:", this.responseText);
      // Remove the card anyway since it doesn't exist on the server
      cardElement.remove();
    } else {
      console.error(
        "Error removing item. Status:",
        this.status,
        "Response:",
        this.responseText
      );
      alert("Error removing item from wishlist");
    }
  };

  xhr.onerror = () => {
    console.error("Network error occurred");
    alert("Network error occurred");
  };

  // Send both clientId and productId in the request body as required by your API
  xhr.send(
    JSON.stringify({
      clientId: clientId,
      productId: productId,
    })
  );
}

// Initialize profile edit modal
function initializeProfileEditModal() {
  const modalEl = document.getElementById("editProfileModal");
  if (!modalEl) return;

  modalEl.addEventListener("show.bs.modal", () => {
    const fields = [
      { id: "firstName", modalId: "editFirstName" },
      { id: "lastName", modalId: "editLastName" },
      { id: "email", modalId: "editEmail" },
      { id: "phone", modalId: "editPhone" },
      { id: "birthday", modalId: "editBirthday" },
      { id: "gender", modalId: "editGender" },
    ];

    fields.forEach((field) => {
      const input = document.getElementById(field.id);
      const modalInput = document.getElementById(field.modalId);
      if (input && modalInput) {
        modalInput.value = input.value;
      }
    });
  });

  const saveChangesBtn = document.getElementById("saveChanges");
  if (saveChangesBtn) {
    saveChangesBtn.addEventListener("click", () => {
      let firstname = "";
      let lastname = "";
      let email = "";
      const userId =
        currentUserData?.id ||
        currentUserData?._id ||
        currentUserData?.userId ||
        localStorage.getItem("userId");

      if (!userId) {
        alert("User ID not found. Please log in again.");
        return;
      }

      // Collect form data
      const profileData = {
        firstname: document.getElementById("editFirstName").value,
        lastname: document.getElementById("editLastName").value,
        email: document.getElementById("editEmail").value,
      };

      // Only add optional fields if they have values
      const phoneValue = document.getElementById("editPhone").value;
      if (phoneValue && phoneValue.trim() !== "") {
        profileData.phoneNumber = phoneValue;
      }

      const genderValue = document.getElementById("editGender").value;
      if (genderValue && genderValue.trim() !== "") {
        profileData.gender = genderValue;
      }
      const dateInput = document.getElementById("editBirthday");
      if (dateInput && dateInput.value && dateInput.value.trim() !== "") {
        try {
          const date = new Date(dateInput.value);
          const formattedDate = date.toISOString().split("T")[0];
          profileData.dateOfBirth = formattedDate;
        } catch (e) {
          console.error("Error formatting date:", e);
          profileData.dateOfBirth = dateInput.value;
        }
      }

      firstname = profileData.firstname;
      lastname = profileData.lastname;
      email = profileData.email;

      updateUIAfterProfileUpdate(firstname, lastname, email, modalEl);
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `/client/update/${userId}`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      const token = localStorage.getItem("token");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        console.log("Authorization header set:", `Bearer ${token}`);
      } else {
        console.error("No token found for authorization");
      }

      xhr.onload = function () {
        if (this.status === 200) {
          try {
            const response = JSON.parse(this.responseText);
            console.log("Profile update successful:", response);
            alert("Profile updated successfully");

            document.getElementById("firstName").value = firstname;
            document.getElementById("lastName").value = lastname;
            document.getElementById("email").value = email;
            if (profileData.phoneNumber) {
              document.getElementById("phone").value = profileData.phoneNumber;
              localStorage.setItem("userPhone", profileData.phoneNumber);
            }

            if (profileData.dateOfBirth) {
              document.getElementById("birthday").value =
                profileData.dateOfBirth;
              localStorage.setItem("userBirthday", profileData.dateOfBirth);
            }

            if (profileData.gender) {
              document.getElementById("gender").value = profileData.gender;
              localStorage.setItem("userGender", profileData.gender);
            }

            if (currentUserData) {
              currentUserData.firstname = firstname;
              currentUserData.lastname = lastname;
              currentUserData.email = email;

              if (profileData.phoneNumber)
                currentUserData.phoneNumber = profileData.phoneNumber;
              if (profileData.dateOfBirth)
                currentUserData.dateOfBirth = profileData.dateOfBirth;
              if (profileData.gender)
                currentUserData.gender = profileData.gender;
            }
          } catch (e) {
            console.error("Error parsing response:", e);
            alert("Error updating profile");
          }
        } else if (this.status === 401) {
          alert("Unauthorized. Please log in again.");
          console.error("401 Unauthorized response:", this.responseText);
        } else if (this.status === 403) {
          alert("Forbidden. You don't have permission to update this profile.");
          console.error("403 Forbidden response:", this.responseText);

          console.log("User ID from localStorage:", userId);
          console.log("Token payload:", getTokenPayload());
        } else if (this.status === 400) {
          try {
            const response = JSON.parse(this.responseText);
            alert("Error: " + (response.message || "Unknown error"));
          } catch (e) {
            alert("Error updating profile");
          }
        } else {
          console.error("Error updating profile. Status:", this.status);
          console.error("Response:", this.responseText);
          alert("Error updating profile");
        }
      };

      xhr.onerror = () => {
        console.error("Network error occurred");
        alert("Network error occurred");
      };

      console.log("Sending profile update:", profileData);
      xhr.send(JSON.stringify(profileData));
    });
  }
}

function getTokenPayload() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) return null;

    return JSON.parse(atob(tokenParts[1]));
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}

function updateUIAfterProfileUpdate(firstname, lastname, email, modalEl) {
  const displayName = document.getElementById("profileName");
  const displayEmail = document.getElementById("profileEmail");

  if (displayName) displayName.textContent = `${firstname} ${lastname}`;
  if (displayEmail) displayEmail.textContent = email;

  // Close the modal if it exists
  try {
    if (window.bootstrap && modalEl) {
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
  } catch (e) {
    console.error("Error closing modal:", e);
  }

  localStorage.setItem("userFirstName", firstname);
  localStorage.setItem("userLastName", lastname);
  localStorage.setItem("userEmail", email);

  // Update userData in localStorage if it exists
  try {
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      userData.firstname = firstname;
      userData.lastname = lastname;
      userData.email = email;
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  } catch (e) {
    console.error("Error updating userData in localStorage:", e);
  }
}

function loadUserProfileData() {
  const userId =
    currentUserData?.id ||
    currentUserData?._id ||
    currentUserData?.userId ||
    localStorage.getItem("userId");
  if (!userId) {
    console.error("No user ID available to load profile data");

    // Try to create user data from localStorage
    const userFirstName = localStorage.getItem("userFirstName");
    const userLastName = localStorage.getItem("userLastName");
    const userEmail = localStorage.getItem("userEmail");

    if (userFirstName || userLastName || userEmail) {
      const userData = {
        firstname: userFirstName || "",
        lastname: userLastName || "",
        email: userEmail || "",
      };

      currentUserData = userData;
      updateUIWithUserData(userData);
    }

    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/client/${userId}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader(
    "Authorization",
    `Bearer ${localStorage.getItem("token")}`
  );

  xhr.onload = function () {
    if (this.status === 200) {
      try {
        const userData = JSON.parse(this.responseText);
        console.log("User data loaded from API:", userData);

        currentUserData = userData;

        updateUIWithUserData(userData);

        localStorage.setItem("userFirstName", userData.firstname || "");
        localStorage.setItem("userLastName", userData.lastname || "");
        localStorage.setItem("userEmail", userData.email || "");

        if (userData.phoneNumber) {
          localStorage.setItem("userPhone", userData.phoneNumber);
        }

        if (userData.dateOfBirth) {
          try {
            const date = new Date(userData.dateOfBirth);
            localStorage.setItem(
              "userBirthday",
              date.toISOString().split("T")[0]
            );
          } catch (e) {
            console.error("Error formatting date for localStorage:", e);
            localStorage.setItem("userBirthday", userData.dateOfBirth);
          }
        }

        if (userData.gender) {
          localStorage.setItem("userGender", userData.gender);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
        alert("Error loading user profile data");
      }
    } else if (this.status === 401) {
      console.error("Unauthorized access to profile");
      // Could redirect to login page here
    } else {
      console.error("Error loading user data. Status:", this.status);
      alert("Error loading user profile data");
    }
  };

  xhr.onerror = () => {
    console.error("Network error occurred");
    alert("Network error occurred while loading profile");
  };

  xhr.send();
}

function setupLogout() {
  const logoutLink = document.querySelector("#logout a");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.clear();
      currentUserData = null;
      showToast(
        "Déconnexion réussie",
        "Vous avez été déconnecté avec succès.",
        "success"
      );
      setTimeout(() => {
        window.location.href = this.getAttribute("href") || "index.html";
      }, 1000);
    });
  }
}

function initializeProfileImageUpload() {
  const imageInput = document.getElementById("profileImageInput");
  const profileImage = document.getElementById("profileImage");
  const editBtn = document.getElementById("editImageBtn");

  if (!imageInput || !profileImage || !editBtn) return;

  // Load profile image from database when page loads
  loadProfileImageFromDatabase();

  // Set up event listeners
  editBtn.addEventListener("click", () => {
    imageInput.click();
  });

  imageInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      // Validate file type and size
      if (!validateImageFile(file)) {
        return;
      }

      // Show preview immediately for better UX
      const reader = new FileReader();
      reader.onload = (e) => {
        profileImage.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload to server using XHR
      uploadProfileImageToServer(file);
    }
  });

  function validateImageFile(file) {
    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPEG, PNG, etc.)");
      return false;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file is too large. Please select an image under 5MB.");
      return false;
    }

    return true;
  }

  function loadProfileImageFromDatabase() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("User ID not found");
      profileImage.src = "/images/default-profile.png"; // Default image
      return;
    }

    console.log("Loading profile image for user ID:", userId);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/client/${userId}`, true);

    // Add authentication token
    const token = localStorage.getItem("token");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const userData = JSON.parse(xhr.responseText);
            console.log("User data received for profile image:", userData);

            // Check for profile picture in the user data
            let profilePictureName = null;

            if (userData.profilePicture) {
              profilePictureName = userData.profilePicture;
            } else if (userData.client && userData.client.profilePicture) {
              profilePictureName = userData.client.profilePicture;
            }

            if (profilePictureName) {
              // Construct the path to the image in the uploads directory
              profileImage.src = `/uploads/${profilePictureName}`;
              console.log(
                "Profile image path:",
                `/uploads/${profilePictureName}`
              );

              // Add error handler in case the image doesn't load
              profileImage.onerror = function () {
                console.error(
                  "Failed to load profile image from path:",
                  profileImage.src
                );
                profileImage.src = "/images/default-profile.png";
              };
            } else {
              // No profile picture found
              profileImage.src = "/images/default-profile.png";
              console.log("No profile picture found in user data");
            }
          } catch (error) {
            console.error("Error parsing user data:", error);
            profileImage.src = "/images/default-profile.png";
          }
        } else if (xhr.status === 403) {
          console.error("Error loading profile image. Status:", xhr.status);
          console.error("Response:", xhr.responseText);
          profileImage.src = "/images/default-profile.png";
        } else {
          console.error("Error loading profile image. Status:", xhr.status);
          profileImage.src = "/images/default-profile.png";
        }
      }
    };

    xhr.onerror = function () {
      console.error("Request error while loading profile image");
      profileImage.src = "/images/default-profile.png";
    };

    xhr.send();
  } // Function to load profile image from database using XHR

  function setProfileImage(imagePath) {
    if (!imagePath) {
      profileImage.src = "/images/default-profile.png";
      return;
    }

    console.log("Setting profile image with path:", imagePath);

    // Handle different path formats
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      // Full URL
      profileImage.src = imagePath;
    } else if (imagePath.startsWith("/")) {
      // Absolute path
      profileImage.src = imagePath;
    } else {
      // Relative path - assume it's a filename in the uploads directory
      profileImage.src = `/uploads/${imagePath}`;
    }
  }

  function uploadProfileImageToServer(file) {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("User ID not found");
      alert("Cannot upload image: User ID not found");
      return;
    }

    console.log("Uploading profile image for user ID:", userId);
    console.log("File to upload:", file.name, file.type, file.size);

    // Show loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "profile-image-loading";
    loadingIndicator.innerHTML = "Uploading...";
    profileImage.parentNode.appendChild(loadingIndicator);

    const xhr = new XMLHttpRequest();
    // Use the dedicated profile picture endpoint
    xhr.open("POST", `/client/profile-picture/${userId}`, true);

    // Add authentication token
    const token = localStorage.getItem("token");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        // Remove loading indicator
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }

        console.log("Upload response status:", xhr.status);
        console.log("Upload response text:", xhr.responseText);

        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log("Profile image update successful:", result);

            // Get the profile picture filename from the response
            let profilePictureName = null;

            if (result.client && result.client.profilePicture) {
              profilePictureName = result.client.profilePicture;
            } else if (result.profilePicture) {
              profilePictureName = result.profilePicture;
            }

            if (profilePictureName) {
              // Construct the path to the image in the uploads directory
              profileImage.src = `/uploads/${profilePictureName}`;
              console.log(
                "Updated profile image path:",
                `/uploads/${profilePictureName}`
              );
            }

            alert("Profile image updated successfully!");
          } catch (error) {
            console.error("Error parsing server response:", error);
            alert("Error updating profile image. Please try again.");
          }
        } else if (xhr.status === 403) {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error("Authorization error:", errorResponse);
            alert(
              "Authorization error: " +
                (errorResponse.message ||
                  "You don't have permission to update this profile")
            );
          } catch (e) {
            alert(
              "Authorization error: You don't have permission to update this profile"
            );
          }
        } else if (xhr.status === 500) {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error("Server error:", errorResponse);
            alert(
              "Server error: " + (errorResponse.message || "Unknown error")
            );
          } catch (e) {
            alert("Server error occurred. Please try again later.");
          }
        } else {
          console.error("Error uploading profile image. Status:", xhr.status);
          alert("Failed to upload profile image. Please try again.");
        }
      }
    };

    xhr.onerror = function () {
      // Remove loading indicator
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }

      console.error("Network error occurred while uploading profile image");
      alert("Network error while uploading profile image. Please try again.");
    };

    // Create FormData and append the file
    const formData = new FormData();
    formData.append("profilePicture", file);

    // Send the request
    xhr.send(formData);
  }
}

// Orders management script
function initializeOrdersSection() {
  // DOM elements
  const ordersListContainer = document.querySelector(".orders-list");
  const searchInput = document.getElementById("my-orders-search");
  const filterSelect = document.getElementById("my-orders-filter");
  const prevButton = document.getElementById("my-orders-prev");
  const nextButton = document.getElementById("my-orders-next");
  const pageNumbers = document.querySelector(".page-numbers");

  // State variables
  let allOrders = [];
  let filteredOrders = [];
  let currentPage = 1;
  const ordersPerPage = 2;

  // Initialize
  loadOrders();

  // Add event listeners
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", handleFilter);
  }

  if (prevButton) {
    prevButton.addEventListener("click", goToPreviousPage);
  }

  if (nextButton) {
    nextButton.addEventListener("click", goToNextPage);
  }

  // Function to load orders from the database using the new endpoint
  function loadOrders() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      showError("User ID not found. Please log in again.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showError("Authentication token not found. Please log in again.");
      return;
    }

    // Show loading state
    if (ordersListContainer) {
      ordersListContainer.innerHTML =
        '<div class="loading-orders">Loading your orders...</div>';
    }

    console.log(`Fetching orders for client ID: ${userId}`);

    const xhr = new XMLHttpRequest();
    // Use the new endpoint you've created
    xhr.open("GET", `/client/${userId}/orders`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        console.log(`Response received. Status: ${xhr.status}`);

        if (xhr.status === 200) {
          try {
            const orders = JSON.parse(xhr.responseText);
            console.log("Orders loaded successfully:", orders);

            if (orders && Array.isArray(orders)) {
              if (orders.length === 0) {
                if (ordersListContainer) {
                  ordersListContainer.innerHTML =
                    '<div class="no-orders-found">You have no orders yet.</div>';
                }
                return;
              }

              // Sort orders by date (newest first)
              orders.sort((a, b) => {
                const dateA = new Date(
                  a.dateCommande || a.createdAt || a.date || 0
                );
                const dateB = new Date(
                  b.dateCommande || b.createdAt || b.date || 0
                );
                return dateB - dateA; // Descending order (newest first)
              });

              allOrders = orders;
              filteredOrders = [...allOrders];

              // Initial render
              renderOrders();
              setupPagination();
            } else {
              console.error("Invalid order data format:", orders);
              showError("Invalid order data format received from server.");
            }
          } catch (error) {
            console.error("Error parsing orders data:", error);
            showError("Error loading orders. Please try again later.");
          }
        } else if (xhr.status === 403 || xhr.status === 401) {
          console.error("Authentication error:", xhr.responseText);
          showError("Authentication error. Please log in again.");
        } else {
          console.error("Error loading orders. Status:", xhr.status);
          showError("Error loading orders. Please try again later.");
        }
      }
    };

    xhr.onerror = function () {
      console.error("Network error while loading orders");
      showError("Network error. Please check your connection and try again.");
    };

    xhr.send();
  }

  // Function to render orders
  function renderOrders() {
    if (!ordersListContainer) return;

    // Clear the container
    ordersListContainer.innerHTML = "";

    // Calculate pagination
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToDisplay = filteredOrders.slice(startIndex, endIndex);

    if (ordersToDisplay.length === 0) {
      ordersListContainer.innerHTML =
        '<div class="no-orders-found">No orders found.</div>';
      return;
    }

    // Render each order
    ordersToDisplay.forEach((order) => {
      const orderCard = createOrderCard(order);
      ordersListContainer.appendChild(orderCard);
    });

    // Add event listeners to the newly created buttons
    addOrderButtonListeners();
  }

  // Function to create an order card
  function createOrderCard(order) {
    const orderCard = document.createElement("div");
    orderCard.className = "order-card";
    orderCard.id = `my-order-${order._id}`;
    let shopName = "Unknown Shop";

    try {
      if (typeof order.shop === "object" && order.shop !== null) {
        if (order.shop.shopName) {
          shopName = order.shop.shopName;
          console.log("Found shopName in order.shop.shopName:", shopName);
        }
      }

      // Autres vérifications possibles
      if (shopName === "Unknown Shop" && order.shopName) {
        shopName = order.shopName;
        console.log("Found shopName in order.shopName:", shopName);
      }
    } catch (error) {
      console.error("Error extracting shop name:", error);
    }

    console.log("Final shop name extracted:", shopName);

    // Format date
    const orderDate = new Date(
      order.dateCommande || order.createdAt || order.date || new Date()
    );
    const formattedDate = orderDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Determine the status
    const orderStatus = order.orderStatus || order.status || "pending";
    const statusLower = orderStatus.toLowerCase(); // Create order header
    const orderHeader = document.createElement("div");
    orderHeader.className = "order-header";
    orderHeader.innerHTML = `
    <span class="order-id">#ORD-${order._id.substring(0, 5)}</span>
    <span class="order-shop styled-shop"><i class="ph ph-storefront"></i> ${shopName}</span>
    <span class="order-date">${formattedDate}</span>
    <span class="order-status ${statusLower}">${capitalizeFirstLetter(orderStatus)}</span>
  `;

    // Create products list
    const productsListContainer = document.createElement("div");
    productsListContainer.className = "order-products-list";

    // Handle the different product structures in the API response
    let products = [];
    if (order.products && Array.isArray(order.products)) {
      products = order.products;
    } else if (
      order.cartData &&
      order.cartData.items &&
      Array.isArray(order.cartData.items)
    ) {
      products = order.cartData.items;
    }

    // Add each product
    products.forEach((product, index) => {
      const productItem = document.createElement("div");
      productItem.className = "order-product-item";
      productItem.id = `my-order-item-${index}-${order._id}`;

      // Get product details based on the API structure
      let productName, productSku, productPrice, productQty, imagePath;

      if (product.productId) {
        // Format from the sample API response
        productName = product.productId.productName || "Product";
        productSku = product.productId._id
          ? product.productId._id.substring(0, 8)
          : "N/A";
        productPrice = product.productId.productPrice || 0;
        productQty = product.quantity || 1;
        imagePath = product.productId.mainImage
          ? `/uploads/${product.productId.mainImage}`
          : "../assets/images/products/placeholder.png";
      } else {
        // Alternative format
        productName =
          product.name || (product.product ? product.product.name : "Product");
        productSku =
          product.sku || (product.product ? product.product.sku : "N/A");
        productPrice =
          product.price || (product.product ? product.product.price : 0);
        productQty = product.quantity || 1;
        imagePath =
          product.image ||
          (product.product
            ? product.product.image
            : "../assets/images/products/placeholder.png");
      }

      productItem.innerHTML = `
      <div class="product-image">
        <img src="${imagePath}" alt="${productName}">
      </div>
      <div class="product-info">
        <h3>${productName}</h3>
        <p class="product-sku">SKU: ${productSku}</p>
        <div class="product-meta">
          <span class="product-price">${productPrice.toFixed(2)} DT</span>
          <span class="product-qty">Qty: ${productQty}</span>
        </div>
      </div>
    `;

      productsListContainer.appendChild(productItem);
    });

    // Calculate totals
    const total = order.orderTotal || order.totalAmount || 0;
    const subtotal = total; // We can use the same value if no separate subtotal is provided

    // Create order summary
    const orderSummary = document.createElement("div");
    orderSummary.className = "order-summary";
    orderSummary.innerHTML = `
    <div class="summary-row">
      <span>Subtotal</span>
      <span>${subtotal.toFixed(2)} DT</span>
    </div>
    <div class="summary-row total">
      <span>Total</span>
      <span>${total.toFixed(2)} DT</span>
    </div>
  `;

    // Create order footer with appropriate buttons based on status
    const orderFooter = document.createElement("div");
    orderFooter.className = "order-footer";

    // Different buttons based on order status
    if (statusLower === "delivered" || statusLower === "completed") {
      orderFooter.innerHTML = `
      <button class="order-action review" id="review-order-${order._id}">
        <i class="ph ph-star"></i> Leave Review
      </button>
      <button class="order-action receipt" id="receipt-order-${order._id}">
        <i class="ph ph-file-text"></i> View Receipt
      </button>
    `;
    } else if (statusLower === "cancelled") {
      // Afficher la raison d'annulation si disponible
      const cancellationReason = order.refusalReason
        ? `<div class="cancellation-reason">
          <div class="reason-label">Raison d'annulation:</div>
          <div class="reason-text">${order.refusalReason}</div>
         </div>`
        : "";

      orderFooter.innerHTML = `
      ${cancellationReason}
      <button class="order-action receipt" id="receipt-order-${order._id}">
        <i class="ph ph-file-text"></i> View Receipt
      </button>
    `;
    } else if (
      statusLower === "pending" ||
      statusLower === "accepted" ||
      statusLower === "shipped"
    ) {
      // For pending or accepted orders, show track, receipt and cancel buttons
      orderFooter.innerHTML = `
      <button class="order-action track" id="track-order-${order._id}">
        <i class="ph ph-map-pin"></i> Track Order
      </button>
      <button class="order-action receipt" id="receipt-order-${order._id}">
        <i class="ph ph-file-text"></i> Receipt
      </button>
      <button class="order-action cancel" id="cancel-order-${order._id}">
        <i class="ph ph-x"></i> Cancel Order
      </button>
    `;
    } else {
      // Default for other statuses
      orderFooter.innerHTML = `
      <button class="order-action track" id="track-order-${order._id}">
        <i class="ph ph-map-pin"></i> Track Order
      </button>
      <button class="order-action receipt" id="receipt-order-${order._id}">
        <i class="ph ph-file-text"></i> Receipt
      </button>
    `;
    }

    // Assemble the order card
    orderCard.appendChild(orderHeader);
    orderCard.appendChild(productsListContainer);
    orderCard.appendChild(orderSummary);
    orderCard.appendChild(orderFooter);

    return orderCard;
  }

  // Function to calculate subtotal
  function calculateSubtotal(products) {
    return products.reduce((total, product) => {
      const price =
        product.price || (product.product ? product.product.price : 0);
      const quantity = product.quantity || 1;
      return total + price * quantity;
    }, 0);
  }

  // Function to add event listeners to order buttons
  function addOrderButtonListeners() {
    // Track order buttons
    document.querySelectorAll(".order-action.track").forEach((button) => {
      button.addEventListener("click", function () {
        const orderId = this.id.replace("track-order-", "");
        trackOrder(orderId);
      });
    });

    // Receipt buttons
    document.querySelectorAll(".order-action.receipt").forEach((button) => {
      button.addEventListener("click", function () {
        const orderId = this.id.replace("receipt-order-", "");
        viewReceipt(orderId);
      });
    });

    // Review buttons
    document.querySelectorAll(".order-action.review").forEach((button) => {
      button.addEventListener("click", function () {
        const orderId = this.id.replace("review-order-", "");
        leaveReview(orderId);
      });
    });

    // Cancel order buttons
    document.querySelectorAll(".order-action.cancel").forEach((button) => {
      button.addEventListener("click", function () {
        const orderId = this.id.replace("cancel-order-", "");
        cancelOrder(orderId);
      });
    });
  }

  // Function to handle search
  function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === "") {
      // If search is empty, just apply the current filter
      handleFilter();
      return;
    }

    // Filter orders based on search term and current filter
    const currentFilter = filterSelect.value;

    filteredOrders = allOrders.filter((order) => {
      // Check if order matches the current filter
      if (
        currentFilter !== "all" &&
        order.status.toLowerCase() !== currentFilter
      ) {
        return false;
      }

      // Search in order ID
      if (order._id.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in products
      for (const product of order.products || []) {
        const productName =
          product.name || (product.product ? product.product.name : "");
        const productSku =
          product.sku || (product.product ? product.product.sku : "");

        if (
          productName.toLowerCase().includes(searchTerm) ||
          productSku.toLowerCase().includes(searchTerm)
        ) {
          return true;
        }
      }

      return false;
    });

    // Reset to first page and render
    currentPage = 1;
    renderOrders();
    setupPagination();
  }

  // Function to handle filter
  function handleFilter() {
    const filterValue = filterSelect.value;
    const searchTerm = searchInput
      ? searchInput.value.toLowerCase().trim()
      : "";

    if (filterValue === "all" && searchTerm === "") {
      filteredOrders = [...allOrders];
    } else {
      filteredOrders = allOrders.filter((order) => {
        // Apply status filter
        if (
          filterValue !== "all" &&
          order.status.toLowerCase() !== filterValue
        ) {
          return false;
        }

        // Apply search filter if there's a search term
        if (searchTerm !== "") {
          // Search in order ID
          if (order._id.toLowerCase().includes(searchTerm)) {
            return true;
          }

          // Search in products
          let productMatch = false;
          for (const product of order.products || []) {
            const productName =
              product.name || (product.product ? product.product.name : "");
            const productSku =
              product.sku || (product.product ? product.product.sku : "");

            if (
              productName.toLowerCase().includes(searchTerm) ||
              productSku.toLowerCase().includes(searchTerm)
            ) {
              productMatch = true;
              break;
            }
          }

          return productMatch;
        }

        return true;
      });
    }

    // Reset to first page and render
    currentPage = 1;
    renderOrders();
    setupPagination();
  }

  // Function to set up pagination
  function setupPagination() {
    if (!pageNumbers) return;

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    // Update page numbers
    pageNumbers.innerHTML = "";

    // Determine which page numbers to show
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    // Adjust if we're at the end
    if (endPage - startPage < 2 && startPage > 1) {
      startPage = Math.max(1, endPage - 2);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageNumber = document.createElement("span");
      pageNumber.className = `page-number ${i === currentPage ? "active" : ""}`;
      pageNumber.id = `my-orders-page-${i}`;
      pageNumber.textContent = i;
      pageNumber.addEventListener("click", () => goToPage(i));
      pageNumbers.appendChild(pageNumber);
    }

    // Update button states
    if (prevButton) {
      prevButton.classList.toggle("disabled", currentPage === 1);
    }

    if (nextButton) {
      nextButton.classList.toggle(
        "disabled",
        currentPage === totalPages || totalPages === 0
      );
    }
  }

  // Function to go to a specific page
  function goToPage(page) {
    currentPage = page;
    renderOrders();
    setupPagination();
  }

  // Function to go to the previous page
  function goToPreviousPage() {
    if (currentPage > 1) {
      currentPage--;
      renderOrders();
      setupPagination();
    }
  }

  // Function to go to the next page
  function goToNextPage() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderOrders();
      setupPagination();
    }
  }

  // Function to track an order
  function trackOrder(orderId) {
    console.log(`Tracking order: ${orderId}`);
    // Implement your tracking logic here
    alert(`Tracking information for order #${orderId} will be displayed here.`);
  }

  // Function to view a receipt
  function viewReceipt(orderId) {
    console.log(`Viewing receipt for order: ${orderId}`);

    // Find the order
    const order = allOrders.find((o) => o._id === orderId);
    if (!order) {
      alert("Order not found");
      return;
    }

    // You could open a modal or navigate to a receipt page
    // For now, we'll just show an alert with some order details
    const orderDate = new Date(
      order.createdAt || order.date || new Date()
    ).toLocaleDateString("en-US");

    alert(`Receipt for Order #${orderId.substring(0, 5)}
Date: ${orderDate}
Total Amount: ${order.orderTotal || order.totalAmount || 0} DT
Status: ${order.orderStatus || order.status || "N/A"}
    `);
  }

  // Function to cancel an order
  function cancelOrder(orderId) {
    const order = allOrders.find((o) => o._id === orderId);
    if (!order) {
      Swal.fire("Erreur", "Commande introuvable", "error");
      return;
    }

    const status = (order.orderStatus || order.status || "").toLowerCase();
    if (status !== "pending" && status !== "accepted") {
      Swal.fire(
        "Non autorisé",
        "Seules les commandes en attente ou acceptées peuvent être annulées.",
        "warning"
      );
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire(
        "Erreur d'authentification",
        "Veuillez vous reconnecter.",
        "error"
      );
      return;
    }

    Swal.fire({
      title: "Annuler la commande",
      input: "textarea",
      inputLabel: "Veuillez indiquer la raison de l'annulation (obligatoire)",
      inputPlaceholder: "Raison de l'annulation...",
      inputAttributes: {
        "aria-label": "Raison de l'annulation",
      },
      showCancelButton: true,
      confirmButtonText: "Annuler la commande",
      cancelButtonText: "Annuler",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "La raison d'annulation est obligatoire.";
        }
      },
    }).then((result) => {
      if (!result.isConfirmed) return;

      const refusalReason = result.value;

      // Afficher le chargement
      const orderCard = document.getElementById(`my-order-${orderId}`);
      if (orderCard) {
        const loadingOverlay = document.createElement("div");
        loadingOverlay.className = "loading-overlay";
        loadingOverlay.innerHTML =
          '<div class="loading-spinner"></div><div class="loading-text">Annulation en cours...</div>';
        loadingOverlay.id = `loading-overlay-${orderId}`;
        orderCard.style.position = "relative";
        orderCard.appendChild(loadingOverlay);
      }

      // Requête AJAX
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `/order/${orderId}/status`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          const loadingOverlay = document.getElementById(
            `loading-overlay-${orderId}`
          );
          if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
          }

          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              const index = allOrders.findIndex((o) => o._id === orderId);
              if (index !== -1) {
                allOrders[index].orderStatus = "cancelled";
                allOrders[index].status = "cancelled";
                allOrders[index].refusalReason = refusalReason;

                const filteredIndex = filteredOrders.findIndex(
                  (o) => o._id === orderId
                );
                if (filteredIndex !== -1) {
                  filteredOrders[filteredIndex].orderStatus = "cancelled";
                  filteredOrders[filteredIndex].status = "cancelled";
                  filteredOrders[filteredIndex].refusalReason = refusalReason;
                }
              }

              renderOrders();

              Swal.fire("Succès", "La commande a bien été annulée.", "success");
            } catch (error) {
              console.error("Erreur de parsing:", error);
              Swal.fire(
                "Erreur",
                "Erreur lors de l'annulation de la commande.",
                "error"
              );
            }
          } else if (xhr.status === 403 || xhr.status === 401) {
            console.error("Erreur d'authentification:", xhr.responseText);
            Swal.fire(
              "Erreur d'authentification",
              "Veuillez vous reconnecter.",
              "error"
            );
          } else {
            console.error("Erreur serveur:", xhr.status);
            Swal.fire(
              "Erreur",
              "Impossible d'annuler la commande. Veuillez réessayer.",
              "error"
            );
          }
        }
      };

      xhr.onerror = function () {
        const loadingOverlay = document.getElementById(
          `loading-overlay-${orderId}`
        );
        if (loadingOverlay && loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }

        console.error("Erreur réseau");
        Swal.fire(
          "Erreur réseau",
          "Veuillez vérifier votre connexion.",
          "error"
        );
      };

      xhr.send(
        JSON.stringify({
          status: "cancelled",
          refusalReason: refusalReason,
        })
      );
    });
  }

  // Function to leave a review
  function leaveReview(orderId) {
    console.log(`Leaving review for order: ${orderId}`);
    // Implement your review logic here
    alert(`You can leave a review for order #${orderId} here.`);
  }

  // Helper function to show errors
  function showError(message) {
    if (ordersListContainer) {
      ordersListContainer.innerHTML = `<div class="error-message">${message}</div>`;
    } else {
      console.error(message);
    }
  }

  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
}

// Call the initialization function when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on the orders section
  if (document.querySelector(".orders-list")) {
    initializeOrdersSection();
  }
});

// Change password function
function initializePasswordChange() {
  const passwordForm = document.querySelector(".password-form");

  if (!passwordForm) return;

  // Fix toggle password visibility functionality
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        this.classList.toggle("ph-eye-slash");
        this.classList.toggle("ph-eye");
      }
    });
  });

  // Add submit handler
  passwordForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form values
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Error", "All fields are required", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Error", "New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast(
        "Error",
        "New password must be at least 6 characters long",
        "error"
      );
      return;
    }

    // Get user ID
    const userId = localStorage.getItem("userId");
    if (!userId) {
      showToast("Error", "User ID not found. Please log in again.", "error");
      return;
    }

    // Get token
    const token = localStorage.getItem("token");
    if (!token) {
      showToast(
        "Error",
        "Authentication token not found. Please log in again.",
        "error"
      );
      return;
    }

    // Show loading state
    const submitBtn = passwordForm.querySelector(".submit-btn");
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Updating...';
    submitBtn.disabled = true;

    // Create request
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/client/change-password/${userId}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;

        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log("Password change successful:", response);

            // Clear form
            passwordForm.reset();

            // Show success message
            showToast(
              "Success",
              "Your password has been updated successfully",
              "success"
            );
          } catch (e) {
            console.error("Error parsing response:", e);
            showToast("Error", "Error updating password", "error");
          }
        } else if (xhr.status === 401) {
          try {
            const response = JSON.parse(xhr.responseText);
            showToast(
              "Error",
              response.message || "Current password is incorrect",
              "error"
            );
          } catch (e) {
            showToast("Error", "Current password is incorrect", "error");
          }
        } else if (xhr.status === 403) {
          showToast(
            "Error",
            "You do not have permission to change this password",
            "error"
          );
        } else {
          console.error("Error changing password. Status:", xhr.status);
          console.error("Response:", xhr.responseText);
          showToast(
            "Error",
            "Error updating password. Please try again.",
            "error"
          );
        }
      }
    };

    xhr.onerror = function () {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      showToast("Error", "Network error occurred. Please try again.", "error");
    };

    // Prepare data
    const passwordData = {
      currentPassword: currentPassword,
      newPassword: newPassword,
    };

    // Send request
    xhr.send(JSON.stringify(passwordData));
  });
}

// Toast notification function (if not already defined)
function showToast(title, message, type = "info") {
  // Check if Toastify is available
  if (typeof Toastify === "function") {
    Toastify({
      text: `${title}: ${message}`,
      duration: 3000,
      gravity: "top",
      position: "right",
      className: `toast-${type}`,
      style: {
        background:
          type === "success"
            ? "#4CAF50"
            : type === "error"
              ? "#F44336"
              : type === "warning"
                ? "#FF9800"
                : "#2196F3",
      },
    }).showToast();
  } else {
    // Fallback to alert if Toastify is not available
    alert(`${title}: ${message}`);
  }
}

// Call the initialization function when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize password change form
  initializePasswordChange();
});
