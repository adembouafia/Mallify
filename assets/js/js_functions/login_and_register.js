// Import SweetAlert2 if not already defined
if (typeof Swal === "undefined") {
  console.warn(
    "SweetAlert2 is not properly integrated. Using fallback alerts."
  );
}

// Import Bootstrap if not already defined
if (typeof bootstrap === "undefined") {
  console.warn(
    "Bootstrap is not properly integrated. Some features might not work."
  );
}

// Helper function to use SweetAlert with fallback to standard alert
function showToast(title, message, type) {
  // Check if SweetAlert2 is available
  if (typeof window.Swal !== "undefined") {
    // Define custom icons based on type
    let iconHtml = "";
    let iconColor = "";

    switch (type) {
      case "success":
        iconHtml = '<div style="font-size: 24px; font-weight: bold;">✓</div>';
        iconColor = "#00e676";
        break;
      case "error":
        iconHtml = '<div style="font-size: 24px; font-weight: bold;">✕</div>';
        iconColor = "#ff1744";
        break;
      case "warning":
        iconHtml = '<div style="font-size: 24px; font-weight: bold;">!</div>';
        iconColor = "#ff9100";
        break;
      case "info":
      default:
        iconHtml = '<div style="font-size: 24px; font-weight: bold;">i</div>';
        iconColor = "#40c4ff";
        break;
    }

    window.Swal.fire({
      title: `<span style="font-weight:bold;">${title}</span>`,
      html: `
        <div style="display: flex; align-items: center;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${iconColor}; display: flex; justify-content: center; align-items: center; color: white; margin-right: 10px;">
            ${iconHtml}
          </div>
          <p style="margin:0;">${message}</p>
        </div>
      `,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
      timer: 2000,
      timerProgressBar: true,
      background: "#1e1e2f",
      color: "#fff",
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", window.Swal.stopTimer);
        toast.addEventListener("mouseleave", window.Swal.resumeTimer);
      },
      customClass: {
        popup: "cool-toast-popup",
        timerProgressBar: "cool-toast-timer",
      },
    });
  } else {
    // Fallback to console if SweetAlert2 is not available
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  }
}
// Helper function to use SweetAlert with fallback to standard alert
function showAlert(options) {
  if (typeof Swal !== "undefined") {
    if (
      !options.input &&
      !options.showCancelButton &&
      !options.showConfirmButton
    ) {
      showToast(options.title, options.text || "", options.icon || "info");
      if (options.then) {
        setTimeout(() => {
          options.then();
        }, 2000);
      }
      return Promise.resolve();
    } else {
      return Swal.fire(options);
    }
  } else {
    alert(options.text || options.title);
    if (options.then) {
      options.then();
    }
    return Promise.resolve();
  }
}

// Helper function to safely add event listeners only if the element exists
function safeAddEventListener(elementId, eventType, handler) {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener(eventType, handler);
  }
}

//hide and show the card functions
function showchooseAccountCard() {
  const loginCard = document.getElementById("loginCard");
  const chooseAccountCard = document.getElementById("chooseAccountCard");
  if (loginCard && chooseAccountCard) {
    loginCard.style.display = "none";
    chooseAccountCard.style.display = "block";
  }
}

function showVendorCard() {
  const chooseAccountCard = document.getElementById("chooseAccountCard");
  const vendorcard = document.getElementById("vendorcard");
  if (chooseAccountCard && vendorcard) {
    chooseAccountCard.style.display = "none";
    vendorcard.style.display = "block";
  }
}

function showRegisterCard() {
  const chooseAccountCard = document.getElementById("chooseAccountCard");
  const registerCard = document.getElementById("registerCard");
  if (chooseAccountCard && registerCard) {
    chooseAccountCard.style.display = "none";
    registerCard.style.display = "block";
  }
}

function showLogin() {
  const registerCard = document.getElementById("registerCard");
  const loginCard = document.getElementById("loginCard");
  if (registerCard && loginCard) {
    registerCard.style.display = "none";
    loginCard.style.display = "block";
  }
}

function backtologin() {
  const vendorcard = document.getElementById("vendorcard");
  const loginCard = document.getElementById("loginCard");
  if (vendorcard && loginCard) {
    vendorcard.style.display = "none";
    loginCard.style.display = "block";
  }
}

//Preview the logo
function previewImage(event) {
  const input = event.target;
  const preview = document.getElementById("preview");

  if (input && preview && input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Main initialization function that runs on all pages
document.addEventListener("DOMContentLoaded", () => {
  // Initialize account dropdown functionality
  initializeAccountDropdowns();

  // Initialize login form if it exists
  initializeLoginForm();

  // Initialize register forms if they exist
  initializeRegisterForms();

  // Initialize password reset functionality if elements exist
  initializePasswordReset();
});

// Login form initialization
function initializeLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return; // Skip if form doesn't exist on this page

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Store email in localStorage for later use in checkout
    localStorage.setItem("loginEmail", email);

    if (!email || !password) {
      showToast(
        "Champs obligatoires",
        "Tous les champs sont obligatoires !",
        "warning"
      );
      return;
    }

    const loginData = JSON.stringify({ email, password });

    // Define login endpoints and their corresponding data endpoints based on the routes provided
    const loginEndpoints = [
      {
        url: "http://localhost:3000/admin/login",
        redirect: {
          admin: "../dashbordA_pages/index.html",
          superAdmin: "../dashbordA_pages/index.html",
        },
        idField: "_id",
        userType: "admin",
      },
      {
        url: "http://localhost:3000/vendor/login",
        redirect: "../dashbordBout_pages/index.html",
        idField: "_id",
        userType: "vendor",
      },
      {
        url: "http://localhost:3000/client/login",
        redirect: "../index.html",
        idField: "_id",
        userType: "client",
      },
      {
        url: "http://localhost:3000/moderator/login",
        redirect: "../dashbordBout_pages/index.html",
        idField: "_id",
        userType: "moderator",
      },
    ];

    function tryLogin(index = 0) {
      if (index >= loginEndpoints.length) {
        showToast(
          "Échec de la connexion",
          "Vérifiez vos identifiants ou votre type de compte.",
          "error"
        );
        return;
      }

      const { url, redirect, idField, userType } = loginEndpoints[index];

      // Use XMLHttpRequest instead of fetch
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = () => {
        console.log(`Trying ${url} - Status: ${xhr.status}`);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log("Login Response:", data);

            // Store token
            localStorage.setItem("token", data.token);

            // Store user type
            localStorage.setItem("userType", userType);

            // Extract user data based on response structure
            let userData = null;
            let userId = null;

            // Different APIs might structure the response differently
            if (data.user) {
              userData = data.user;
            } else if (data[userType]) {
              userData = data[userType];
            } else if (data.data && data.data.user) {
              userData = data.data.user;
            } else if (data.data && data.data[userType]) {
              userData = data.data[userType];
            } else {
              // If no nested user object, the data itself might be the user data
              userData = data;
            }

            console.log("Extracted user data:", userData);

            // Extract user ID
            if (userData && userData[idField]) {
              userId = userData[idField];
            } else if (userData && userData._id) {
              userId = userData._id;
            } else if (userData && userData.id) {
              userId = userData.id;
            } else if (data[idField]) {
              userId = data[idField];
            } else if (data._id) {
              userId = data._id;
            } else if (data.id) {
              userId = data.id;
            }

            console.log("Extracted user ID:", userId);

            if (userId) {
              localStorage.setItem("userId", userId);
            }

            // Store user data from login response
            storeUserDataFromResponse(userData || data, userType);

            // If we have a userId and token, fetch additional user data
            if (userId && data.token) {
              fetchAdditionalUserData(userId, userType, data.token, () => {
                // Determine redirect URL based on role for admin users
                let redirectUrl = redirect;
                const role = localStorage.getItem("userRole") || userType;

                if (
                  typeof redirect === "object" &&
                  (role === "admin" || role === "superAdmin")
                ) {
                  redirectUrl = redirect[role] || redirect.admin;
                }

                // Show success message before redirecting
                showLoginSuccess(userType, redirectUrl);
              });
            } else {
              // If we don't have a userId or token, just redirect
              let redirectUrl = redirect;
              const role = localStorage.getItem("userRole") || userType;

              if (
                typeof redirect === "object" &&
                (role === "admin" || role === "superAdmin")
              ) {
                redirectUrl = redirect[role] || redirect.admin;
              }

              // Show success message before redirecting
              showLoginSuccess(userType, redirectUrl);
            }
          } catch (error) {
            console.error("Error parsing response:", error);
            tryLogin(index + 1);
          }
        } else if (xhr.status === 403 && userType === "vendor") {
          // Cas spécial pour les vendeurs: vérifier si c'est lié au statut du shop
          try {
            const response = JSON.parse(xhr.responseText);

            if (response.status === "Pending") {
              showToast(
                "Boutique en attente",
                "Votre boutique est en cours d'étude par l'administration.",
                "warning"
              );
              return;
            }

            if (response.status === "Rejected") {
              showToast(
                "Boutique rejetée",
                `Votre boutique a été rejetée. Raison: ${response.reason || "Non spécifiée"}`,
                "error"
              );
              return;
            }

            if (response.status === "Banned") {
              showToast(
                "Boutique Bannie",
                `Votre boutique a été Bannie. Raison: ${response.reason || response.bannedReason || "Non spécifiée"}`,
                "error"
              );
              return;
            }

            // Si ce n'est pas lié au statut du shop, essayer le prochain endpoint
            tryLogin(index + 1);
          } catch (error) {
            console.error("Error parsing response:", error);
            tryLogin(index + 1);
          }
        } else {
          // Échec - essayer le prochain endpoint
          console.error("Login failed with status:", xhr.status);
          tryLogin(index + 1);
        }
      };

      xhr.onerror = () => {
        console.error("Network error occurred");
        tryLogin(index + 1);
      };

      xhr.send(loginData);
    }

    // Function to store user data from login response
    function storeUserDataFromResponse(data, userType) {
      console.log(`Storing ${userType} data from login response:`, data);

      // Store role if available
      if (data.role) {
        localStorage.setItem("userRole", data.role);
      } else {
        localStorage.setItem("userRole", userType);
      }

      // Store vendor name specifically for vendors
      if (userType === "vendor") {
        if (data.vendorName) {
          localStorage.setItem("vendorName", data.vendorName);
        } else if (data.name) {
          localStorage.setItem("vendorName", data.name);
        }
      }

      // Store name fields - check for different possible field names
      if (data.firstname || data.firstName || data.first_name) {
        localStorage.setItem(
          "userFirstName",
          data.firstname || data.firstName || data.first_name
        );
      }

      if (data.lastname || data.lastName || data.last_name) {
        localStorage.setItem(
          "userLastName",
          data.lastname || data.lastName || data.last_name
        );
      }

      // Store name as a single field if that's how it's provided
      if (data.name && !data.firstname && !data.lastName) {
        const nameParts = data.name.split(" ");
        if (nameParts.length > 1) {
          localStorage.setItem("userFirstName", nameParts[0]);
          localStorage.setItem("userLastName", nameParts.slice(1).join(" "));
        } else {
          localStorage.setItem("userFirstName", data.name);
          localStorage.setItem("userLastName", "");
        }
      }

      // Store email
      if (data.email) {
        localStorage.setItem("userEmail", data.email);
      }

      // Optional fields
      if (data.phoneNumber) {
        localStorage.setItem("userPhone", data.phoneNumber);
      }
      if (data.gender) {
        localStorage.setItem("userGender", data.gender);
      }
      if (data.dateOfBirth) {
        try {
          const date = new Date(data.dateOfBirth);
          localStorage.setItem(
            "userBirthday",
            date.toISOString().split("T")[0]
          );
        } catch (e) {
          localStorage.setItem("userBirthday", data.dateOfBirth);
        }
      }
      localStorage.removeItem("userProfilePicture");
      localStorage.removeItem("shopLogo");
      localStorage.removeItem("adminImage");

      // Store specific user data based on user type
      if (userType === "admin") {
        localStorage.setItem("admin", JSON.stringify(data));
        if (data.adminImage) {
          localStorage.setItem("adminImage", data.adminImage);
        }
      }

      localStorage.setItem("userData", JSON.stringify(data));
    }

    function fetchAdditionalUserData(userId, userType, token, callback) {
      // Define the endpoint based on user type
      let endpoint = null;

      switch (userType) {
        case "client":
          endpoint = `http://localhost:3000/client/${userId}`;
          break;
        case "admin":
          // No specific endpoint for single admin in the routes
          callback();
          return;
        case "vendor":
          // No specific endpoint for single vendor in the routes
          callback();
          return;
        case "moderator":
          callback();
          return;
        default:
          callback();
          return;
      }

      if (!endpoint) {
        callback();
        return;
      }

      console.log(`Fetching additional user data from: ${endpoint}`);

      const xhr = new XMLHttpRequest();
      xhr.open("GET", endpoint, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log("Additional user data response:", response);

            // Extract user data from response
            let userData = null;

            if (response.user) {
              userData = response.user;
            } else if (response[userType]) {
              userData = response[userType];
            } else if (response.data && response.data.user) {
              userData = response.data.user;
            } else if (response.data && response.data[userType]) {
              userData = response.data.data[userType];
            } else {
              userData = response;
            }

            // Update localStorage with the additional data
            storeUserDataFromResponse(userData, userType);

            callback();
          } catch (error) {
            console.error("Error parsing additional user data:", error);
            callback();
          }
        } else {
          console.error("Failed to fetch additional user data:", xhr.status);
          callback();
        }
      };

      xhr.onerror = () => {
        console.error(
          "Network error occurred while fetching additional user data"
        );
        callback();
      };

      xhr.send();
    }

    // Function to show success message before redirecting
    function showLoginSuccess(userType, redirectUrl) {
      // Check if SweetAlert2 is available
      const title = "Connexion réussie!";
      let text = "";

      // Customize message based on user type
      switch (userType) {
        case "admin":
          text = "Bienvenue dans votre tableau de bord administrateur.";
          break;
        case "vendor":
          text = "Bienvenue dans votre tableau de bord vendeur.";
          break;
        case "client":
          text = "Bienvenue sur notre site!";
          break;
        case "moderator":
          text = "Bienvenue dans votre tableau de bord modérateur.";
          break;
      }

      showToast(title, text, "success");

      // Redirect after a delay
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }

    tryLogin();
  });
}

// Initialize register forms
function initializeRegisterForms() {
  // Client registration form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Empêche le rechargement de la page

      const email = document.getElementById("emailTwo").value.trim();
      const firstname = document.getElementById("firstname").value.trim();
      const lastname = document.getElementById("lastname").value.trim();
      const password = document.getElementById("enter_password").value.trim();

      // Validation basique
      if (!firstname || !lastname || !email || !password) {
        showToast(
          "Champs obligatoires",
          "Tous les champs sont obligatoires !",
          "warning"
        );
        return;
      }

      // Création de l'objet avec les données du formulaire
      const formData = {
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: password,
      };

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:3000/client/register", true);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          showToast(
            "Inscription réussie !",
            "Client enregistré avec succès !",
            "success"
          );
          setTimeout(() => {
            window.location.reload();
            showLogin();
          }, 2000);
          console.log(response);
          // Redirige ou réinitialise le formulaire après inscription
          window.location.reload();
          showLogin();
        } else {
          const error = JSON.parse(xhr.responseText);
          showToast(
            "Erreur d'inscription",
            error.message || "Échec de l'inscription",
            "error"
          );
          console.error(error);
        }
      };

      xhr.onerror = () => {
        showToast(
          "Erreur de connexion",
          "Erreur de connexion avec le serveur.",
          "error"
        );
      };

      xhr.send(JSON.stringify(formData));
    });
  }

  // Vendor registration form
  const vendorForm = document.getElementById("vendorForm");
  if (vendorForm) {
    vendorForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(vendorForm);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:3000/vendor/register", true);

      xhr.onload = () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          showToast(
            "Inscription réussie !",
            "Vendor enregistré avec succès !",
            "success"
          );
          setTimeout(() => {
            window.location.reload();
            showLogin();
          }, 2000);
          console.log(response);
          window.location.reload();
          showLogin();
        } else {
          const error = JSON.parse(xhr.responseText);
          showToast(
            "Erreur d'inscription",
            error.message || "Échec de l'inscription",
            "error"
          );
          console.error(error);
        }
      };

      xhr.onerror = () => {
        showToast(
          "Erreur de connexion",
          "Erreur de connexion avec le serveur.",
          "error"
        );
      };

      xhr.send(formData);
    });
  }
}

// Form validation function
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const inputs = form.querySelectorAll(
    'input[required], select[required], textarea[required], input[type="file"][required]'
  );

  function displayError(inputElement, errorMessageElement) {
    if (!inputElement || !errorMessageElement) return;

    inputElement.style.border = "2px solid red";
    errorMessageElement.style.display = "block";
    errorMessageElement.innerText = "This field is required.";
    errorMessageElement.classList.add("text-danger");
    setTimeout(() => {
      errorMessageElement.style.display = "none";
    }, 4000);
  }

  function clearError(inputElement, errorMessageElement) {
    if (!inputElement || !errorMessageElement) return;

    inputElement.style.border = "1px solid #ccc";
    errorMessageElement.style.display = "none";
  }

  let isValid = true;
  inputs.forEach((input) => {
    const errorMessageElement = document.getElementById(
      input.id + "ErrorMessage"
    );
    if (!errorMessageElement) return;

    if (input.type === "file" && input.files.length === 0) {
      displayError(input, errorMessageElement);
      isValid = false;
    }
    // Check if other inputs are empty
    else if (input.value.trim() === "") {
      displayError(input, errorMessageElement);
      isValid = false;
    } else {
      clearError(input, errorMessageElement);
    }
  });

  if (isValid) {
    window.location.reload();
  }

  return isValid;
}

// Initialize password reset functionality
function initializePasswordReset() {
  // Add event listeners for form fields if they exist
  const resetEmailInput = document.getElementById("resetEmail");
  if (resetEmailInput) {
    resetEmailInput.addEventListener("input", function () {
      this.classList.remove("is-invalid");
    });
  }

  const codeInput = document.getElementById("verificationCode");
  if (codeInput) {
    codeInput.addEventListener("input", function () {
      this.classList.remove("is-invalid");
    });
  }

  const newPasswordInput = document.getElementById("newPassword");
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", (e) => {
      const strengthBar = document.querySelector(".password-strength-bar");
      if (!strengthBar) return;

      const password = e.target.value;

      let strength = 0;
      if (password.match(/[a-z]+/)) strength++;
      if (password.match(/[A-Z]+/)) strength++;
      if (password.match(/[0-9]+/)) strength++;
      if (password.match(/[$@#&!]+/)) strength++;

      strengthBar.style.width = strength * 25 + "%";
      strengthBar.style.backgroundColor =
        strength < 2 ? "#e53e3e" : strength < 4 ? "#d69e2e" : "#48bb78";
    });
  }

  // Add user type selection dropdown for password reset
  const userTypeSelect = document.getElementById("userTypeSelect");
  if (userTypeSelect) {
    userTypeSelect.addEventListener("change", function () {
      // Update the reset process based on selected user type
      localStorage.setItem("resetUserType", this.value);
    });
  }
}

// Password reset functions
let verifiedCode = ""; // Variable pour stocker le code vérifié
let resetUserType = "client"; // Default to client

function validateEmail() {
  const emailInput = document.getElementById("resetEmail");
  if (!emailInput) return;

  const email = emailInput.value;

  // Get the user type from select dropdown if exists, otherwise use default client
  const userTypeSelect = document.getElementById("userTypeSelect");
  if (userTypeSelect) {
    resetUserType = userTypeSelect.value;
  } else {
    resetUserType = localStorage.getItem("resetUserType") || "client";
  }

  // Store the user type for later use
  localStorage.setItem("resetUserType", resetUserType);

  // Validation simple
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailInput.classList.add("is-invalid");
    return;
  }

  emailInput.classList.remove("is-invalid");

  // Define the endpoint based on user type
  let endpoint = "";
  switch (resetUserType) {
    case "admin":
      endpoint = "http://localhost:3000/admin/forgotPassword";
      break;
    case "vendor":
      endpoint = "http://localhost:3000/vendor/forgotPassword";
      break;
    case "moderator":
      endpoint = "http://localhost:3000/moderator/forgotPassword";
      break;
    case "client":
    default:
      endpoint = "http://localhost:3000/client/forgotPassword";
      break;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("POST", endpoint, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          const emailMessage = document.getElementById("emailMessage");
          if (emailMessage) {
            emailMessage.innerText = `A code has been sent to: ${email}`;
          }

          const emailModal = document.getElementById("emailModal");
          const codeModal = document.getElementById("codeModal");

          if (emailModal && codeModal && typeof bootstrap !== "undefined") {
            const bootstrapInstance = bootstrap.Modal.getInstance(emailModal);
            if (bootstrapInstance) {
              bootstrapInstance.hide();
            }
            const codeModalInstance = new bootstrap.Modal(codeModal);
            codeModalInstance.show();
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: res.message || "Error sending reset code.",
            confirmButtonColor: "#3085d6",
          });
        }
      } catch (error) {
        console.error("Error parsing response:", error);
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "An unexpected error occurred. Please try again.",
          confirmButtonColor: "#3085d6",
        });
      }
    }
  };

  xhr.send(JSON.stringify({ email }));
}

function validateCode() {
  const codeInput = document.getElementById("verificationCode");
  if (!codeInput) return;

  const code = codeInput.value;

  if (code.length === 6 && /^[a-zA-Z0-9]+$/.test(code)) {
    verifiedCode = code;

    const codeModal = document.getElementById("codeModal");
    const passwordModal = document.getElementById("passwordModal");

    if (codeModal && passwordModal && typeof bootstrap !== "undefined") {
      const codeModalInstance = bootstrap.Modal.getInstance(codeModal);
      if (codeModalInstance) {
        codeModalInstance.hide();
      }
      const passwordModalInstance = new bootstrap.Modal(passwordModal);
      passwordModalInstance.show();
    }
  } else {
    codeInput.classList.add("is-invalid");
  }
}

function validatePassword() {
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  if (!newPassword || !confirmPassword) return;

  const newPasswordValue = newPassword.value;
  const confirmPasswordValue = confirmPassword.value;

  // Get the stored user type
  resetUserType = localStorage.getItem("resetUserType") || "client";

  if (
    newPasswordValue !== confirmPasswordValue ||
    newPasswordValue.length < 6
  ) {
    showToast(
      "Validation du mot de passe",
      "Les mots de passe doivent correspondre et comporter au moins 6 caractères.",
      "warning"
    );
    return;
  }

  // Define the endpoint based on user type
  let endpoint = "";
  switch (resetUserType) {
    case "admin":
      endpoint = "http://localhost:3000/admin/reset-password";
      break;
    case "vendor":
      endpoint = "http://localhost:3000/vendor/reset-password";
      break;
    case "moderator":
      endpoint = "http://localhost:3000/moderator/reset-password";
      break;
    case "client":
    default:
      endpoint = "http://localhost:3000/client/reset-password";
      break;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("POST", endpoint, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          showToast(
            "Réinitialisation réussie",
            "Votre mot de passe a été réinitialisé avec succès !",
            "success"
          );

          const passwordModal = document.getElementById("passwordModal");
          if (passwordModal && typeof bootstrap !== "undefined") {
            const passwordModalInstance =
              bootstrap.Modal.getInstance(passwordModal);
            if (passwordModalInstance) {
              passwordModalInstance.hide();
            }
          }
        } else {
          showToast(
            "Erreur de validation",
            res.message || "Code invalide ou expiré.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error parsing response:", error);
        showToast(
          "Erreur",
          "Une erreur inattendue s'est produite. Veuillez réessayer.",
          "error"
        );
      }
    }
  };

  xhr.send(
    JSON.stringify({
      code: verifiedCode,
      newPassword: newPasswordValue,
    })
  );
}

// Account dropdown functionality
function initializeAccountDropdowns() {
  // Check if user is logged in by looking for token in localStorage
  const isLoggedIn = localStorage.getItem("token") !== null;

  // Get user type from localStorage
  const userType = localStorage.getItem("userType") || "client";
  const userRole = localStorage.getItem("userRole") || "";

  // Function to create account dropdown
  function createAccountDropdown(accountBtn, isMobile = false) {
    if (!accountBtn) return; // Skip if button doesn't exist on this page

    // If not logged in, keep the original button as is
    if (!isLoggedIn) {
      return;
    }

    // Store the original button HTML and styling
    const originalBtnHTML = accountBtn.innerHTML;
    const originalClasses = accountBtn.className;

    // Create wrapper div for positioning the dropdown
    const wrapperDiv = document.createElement("div");
    wrapperDiv.className = "account-dropdown-wrapper position-relative";

    // Create a button element instead of a link
    const newBtn = document.createElement("button");
    newBtn.className = originalClasses + " account-btn-logged-in"; // Keep original styling + add logged-in class
    newBtn.type = "button";

    // Get user info from localStorage based on user type
    let displayName = "";
    let firstLetter = "";

    const userType = localStorage.getItem("userType") || "client";

    if (userType === "vendor") {
      // For vendors, use vendorName
      displayName = localStorage.getItem("vendorName") || "Vendor";
      firstLetter = displayName.charAt(0).toUpperCase();
    } else {
      // For other users, use firstName
      displayName = localStorage.getItem("userFirstName") || "User";
      firstLetter = displayName.charAt(0).toUpperCase();
    }

    // Create new button content with user info
    newBtn.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="account-btn-avatar me-2">
        <span>${firstLetter}</span>
      </div>
      <div class="account-btn-text">
        <span class="d-none d-md-inline">${displayName}</span>
      </div>
    </div>
  `;

    // Remove any link-specific classes and add button styling
    newBtn.classList.remove("href");
    newBtn.style.border = "none";
    newBtn.style.cursor = "pointer";
    newBtn.style.background = "transparent";

    // Create the dropdown menu with enhanced styling
    const dropdownMenu = document.createElement("div");
    dropdownMenu.className =
      "account-dropdown-menu position-absolute bg-white shadow-lg rounded-4 py-0 mt-3 d-none";
    dropdownMenu.style.minWidth = isMobile ? "260px" : "320px";
    dropdownMenu.style.right = "0";
    dropdownMenu.style.zIndex = "1000";

    // Get user email from localStorage
    const userEmail = localStorage.getItem("userEmail") || "user@example.com";

    // Add decorative top bar
    const topBar = document.createElement("div");
    topBar.className = "account-dropdown-top-bar rounded-top-4";
    dropdownMenu.appendChild(topBar);

    // Add user info to dropdown with improved styling
    const userInfo = document.createElement("div");
    userInfo.className = "px-4 py-4 border-bottom";

    // Get last name if available
    const lastName = localStorage.getItem("userLastName") || "";

    // Create avatar with first letter for all user types
    let avatarClass =
      "user-avatar-circle me-3 d-flex align-items-center justify-content-center";

    // Add specific class based on user type
    if (userType === "vendor" || userType === "moderator") {
      avatarClass += " shop-avatar";
    } else if (userType === "admin") {
      avatarClass += " admin-avatar";
    }

    // Create avatar HTML with first letter
    const avatarHTML = `
    <div class="${avatarClass}">
      ${firstLetter}
    </div>
  `;

    userInfo.innerHTML = `
    <div class="d-flex align-items-center mb-2">
      ${avatarHTML}
      <div class="flex-grow-1">
        <div class="fw-bold fs-5 text-truncate">${displayName} ${lastName}</div>
        <div class="text-muted small text-truncate">${userEmail}</div>
      </div>
    </div>
  `;
    dropdownMenu.appendChild(userInfo);

    // Create menu items container
    const menuItems = document.createElement("div");
    menuItems.className = "py-2";

    // Determine if we should show Dashboard or Profile based on user role
    let menuItemTitle = "Profile";
    let menuItemDescription = "View and edit your profile";
    let menuItemHref = "profil.html";
    let menuItemIcon = "ph ph-user-circle";

    // For admin, vendor, moderator, or superAdmin, show Dashboard instead
    if (
      userType === "admin" ||
      userType === "vendor" ||
      userType === "moderator" ||
      userRole === "superAdmin"
    ) {
      menuItemTitle = "Dashboard";
      menuItemDescription = "Access your dashboard";
      menuItemIcon = "ph ph-house-line";

      // Set the appropriate dashboard URL based on user type
      if (userType === "admin" || userRole === "superAdmin") {
        menuItemHref = "../dashbordA_pages/index.html";
      } else if (userType === "vendor" || userType === "moderator") {
        menuItemHref = "../dashbordBout_pages/index.html";
      }
    }

    // Add profile/dashboard link
    const profileLink = document.createElement("a");
    profileLink.href = menuItemHref;
    profileLink.className = "dropdown-menu-item";
    profileLink.innerHTML = `
      <div class="dropdown-menu-item-icon">
        <i class="${menuItemIcon}"></i>
      </div>
      <div class="dropdown-menu-item-content">
        <span class="dropdown-menu-item-title">${menuItemTitle}</span>
        <span class="dropdown-menu-item-description">${menuItemDescription}</span>
      </div>
    `;
    menuItems.appendChild(profileLink);

    dropdownMenu.appendChild(menuItems);

    // Add footer with logout button
    const dropdownFooter = document.createElement("div");
    dropdownFooter.className = "account-dropdown-footer rounded-bottom-4";

    // Add logout link with improved styling
    const logoutLink = document.createElement("a");
    logoutLink.href = "javascript:void(0)";
    logoutLink.className = "dropdown-menu-item dropdown-menu-item-logout";
    logoutLink.innerHTML = `
              <div class="dropdown-menu-item-icon">
                  <i class="ph ph-sign-out"></i>
              </div>
              <div class="dropdown-menu-item-content">
                  <span class="dropdown-menu-item-title">Logout</span>
                  <span class="dropdown-menu-item-description">Sign out of your account</span>
              </div>
          `;
    logoutLink.addEventListener("click", handleLogout);

    dropdownFooter.appendChild(logoutLink);
    dropdownMenu.appendChild(dropdownFooter);

    // Add the button and dropdown to the wrapper
    wrapperDiv.appendChild(newBtn);
    wrapperDiv.appendChild(dropdownMenu);

    // Replace the original link with our new dropdown
    accountBtn.parentNode.replaceChild(wrapperDiv, accountBtn);

    // Toggle dropdown on click - ONLY toggles dropdown, no navigation
    newBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation(); // Stop event bubbling

      // Toggle active class on button
      this.classList.toggle("active");

      // Toggle dropdown visibility with animation
      if (dropdownMenu.classList.contains("d-none")) {
        dropdownMenu.classList.remove("d-none");
        dropdownMenu.classList.add("dropdown-menu-visible");

        // Add backdrop for mobile
        if (window.innerWidth < 992) {
          addDropdownBackdrop(wrapperDiv);
        }
      } else {
        closeDropdown(dropdownMenu);
      }
    });

    return wrapperDiv;
  }

  // Function to add a backdrop behind the dropdown on mobile
  function addDropdownBackdrop(wrapperDiv) {
    // Remove any existing backdrops
    removeDropdownBackdrops();

    // Create backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "account-dropdown-backdrop";
    document.body.appendChild(backdrop);

    // Animate backdrop in
    setTimeout(() => {
      backdrop.classList.add("active");
    }, 10);

    // Close dropdown when backdrop is clicked
    backdrop.addEventListener("click", () => {
      removeDropdownBackdrops();
      document.querySelectorAll(".account-dropdown-menu").forEach((menu) => {
        closeDropdown(menu);
      });
      document.querySelectorAll(".account-btn-logged-in").forEach((toggle) => {
        toggle.classList.remove("active");
      });
    });
  }

  // Function to remove all dropdown backdrops
  function removeDropdownBackdrops() {
    document
      .querySelectorAll(".account-dropdown-backdrop")
      .forEach((backdrop) => {
        backdrop.classList.remove("active");
        setTimeout(() => {
          backdrop.remove();
        }, 300);
      });
  }

  // Function to close dropdown with animation
  function closeDropdown(dropdownMenu) {
    dropdownMenu.classList.remove("dropdown-menu-visible");
    dropdownMenu.classList.add("dropdown-menu-hidden");

    // Remove backdrop if it exists
    removeDropdownBackdrops();

    // After animation completes, hide the dropdown
    setTimeout(() => {
      dropdownMenu.classList.remove("dropdown-menu-hidden");
      dropdownMenu.classList.add("d-none");
    }, 300);
  }
  const accountSelectors = [
    '.header-middle .header-right a[href="account.html"]',
    '.header-right a[href="account.html"]',
    'a[href="account.html"].d-flex',
    'a[href="account.html"]:not(.flex-align)',

    // Mobile account buttons
    '.header .header-two-activities a[href="account.html"]',
    '.header-two-activities a[href="account.html"]',
    'a[href="account.html"].flex-align',
  ];

  // Track which buttons we've already processed
  const processedButtons = new Set();

  // Try each selector
  accountSelectors.forEach((selector) => {
    try {
      // Try to find all matching elements
      const buttons = document.querySelectorAll(selector);

      buttons.forEach((btn) => {
        // Skip if we've already processed this button
        if (processedButtons.has(btn)) return;

        // Mark as processed
        processedButtons.add(btn);

        // Determine if it's a mobile button based on classes
        const isMobile =
          btn.classList.contains("flex-align") ||
          btn.closest(".header-two-activities") !== null;

        // Create dropdown for this button
        createAccountDropdown(btn, isMobile);
      });
    } catch (error) {
      console.log(`Error processing selector ${selector}:`, error);
    }
  });

  // Only add event listeners and styles if logged in
  if (isLoggedIn) {
    // Close all dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      // Skip if the click is on a dropdown or its children
      if (e.target.closest(".account-dropdown-wrapper")) return;

      // Close all dropdowns
      document.querySelectorAll(".account-dropdown-menu").forEach((menu) => {
        if (!menu.classList.contains("d-none")) {
          closeDropdown(menu);
        }
      });

      // Remove active class from all toggles
      document.querySelectorAll(".account-btn-logged-in").forEach((toggle) => {
        toggle.classList.remove("active");
      });

      // Remove any backdrops
      removeDropdownBackdrops();
    });

    // Add CSS for dropdown styling if not already present
    if (!document.getElementById("account-dropdown-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "account-dropdown-styles";
      styleEl.textContent = `
                    /* Wrapper styling */
                    .account-dropdown-wrapper {
                        display: inline-block;
                    }
                    
                    /* Toggle button styling */
                    .account-btn-logged-in {
                        position: relative;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        padding: 8px 16px;
                        border-radius: 50px;
                        background-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1) !important;
                    }
                    
                    .account-btn-logged-in:hover {
                        background-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.15) !important;
                    }
                    
                    .account-btn-logged-in.active {
                        background-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.2) !important;
                    }
                    
                    .account-btn-avatar {
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: linear-gradient(to bottom right, var(--bs-primary, #0d6efd), var(--bs-info, #0dcaf0));
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                    }
                    
                    .account-btn-text {
                        font-weight: 500;
                    }
                    
                    /* Dropdown menu styling */
                    .account-dropdown-menu {
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                        border: 1px solid rgba(0, 0, 0, 0.08);
                        overflow: hidden;
                        transform-origin: top center;
                        transition: transform 0.3s ease, opacity 0.3s ease;
                    }
                    
                    /* Dropdown animation classes */
                    .dropdown-menu-visible {
                        animation: dropdownFadeIn 0.3s ease forwards;
                    }
                    
                    .dropdown-menu-hidden {
                        animation: dropdownFadeOut 0.3s ease forwards;
                    }
                    
                    @keyframes dropdownFadeIn {
                        from { 
                            opacity: 0; 
                            transform: translateY(-10px) scale(0.98); 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0) scale(1); 
                        }
                    }
                    
                    @keyframes dropdownFadeOut {
                        from { 
                            opacity: 1; 
                            transform: translateY(0) scale(1); 
                        }
                        to { 
                            opacity: 0; 
                            transform: translateY(-10px) scale(0.98); 
                        }
                    }
                    
                    /* Decorative top bar */
                    .account-dropdown-top-bar {
                        height: 6px;
                        background: linear-gradient(to right, var(--bs-primary, #0d6efd), var(--bs-info, #0dcaf0));
                    }
                    
                    /* User avatar styling */
                    .user-avatar-circle {
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: linear-gradient(to bottom right, var(--bs-primary, #0d6efd), var(--bs-info, #0dcaf0));
                        color: white;
                        font-size: 20px;
                        font-weight: bold;
                        flex-shrink: 0;
                        overflow: hidden;
                    }
                    
                    /* Shop avatar styling */
                    .shop-avatar {
                        background: linear-gradient(to bottom right, #ff7043, #ff9800);
                    }
                    
                    /* Admin avatar styling */
                    .admin-avatar {
                        background: linear-gradient(to bottom right, #5c6bc0, #3949ab);
                    }
                    
                    /* Menu items styling */
                    .dropdown-menu-item {
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        color: #333;
                        text-decoration: none;
                        transition: all 0.2s ease;
                    }
                    
                    .dropdown-menu-item:hover {
                        background-color: rgba(0, 0, 0, 0.03);
                        transform: translateX(5px);
                    }
                    
                    .dropdown-menu-item-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                        background-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1);
                        margin-right: 12px;
                        color: var(--bs-primary, #0d6efd);
                        font-size: 18px;
                        flex-shrink: 0;
                    }
                    
                    .dropdown-menu-item-content {
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .dropdown-menu-item-title {
                        font-weight: 500;
                        margin-bottom: 2px;
                    }
                    
                    .dropdown-menu-item-description {
                        font-size: 12px;
                        color: #6c757d;
                    }
                    
                    /* Footer styling */
                    .account-dropdown-footer {
                        background-color: rgba(0, 0, 0, 0.02);
                        border-top: 1px solid rgba(0, 0, 0, 0.08);
                    }
                    
                    /* Logout item styling */
                    .dropdown-menu-item-logout .dropdown-menu-item-icon {
                        background-color: rgba(220, 53, 69, 0.1);
                        color: #dc3545;
                    }
                    
                    /* Mobile backdrop */
                    .account-dropdown-backdrop {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.5);
                        z-index: 999;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    
                    .account-dropdown-backdrop.active {
                        opacity: 1;
                    }
                    
                    /* Responsive adjustments */
                    @media (max-width: 576px) {
                        .account-dropdown-menu {
                            position: fixed !important;
                            top: auto !important;
                            bottom: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                            border-radius: 16px 16px 0 0 !important;
                            transform-origin: bottom center !important;
                        }
                        
                        .dropdown-menu-visible {
                            animation: slideUpIn 0.3s ease forwards !important;
                        }
                        
                        .dropdown-menu-hidden {
                            animation: slideDownOut 0.3s ease forwards !important;
                        }
                        
                        @keyframes slideUpIn {
                            from { 
                                transform: translateY(100%); 
                            }
                            to { 
                                transform: translateY(0); 
                            }
                        }
                        
                        @keyframes slideDownOut {
                            from { 
                                transform: translateY(0); 
                            }
                            to { 
                                transform: translateY(100%); 
                            }
                        }
                    }
                `;
      document.head.appendChild(styleEl);
    }
  }
}

// Logout handler function
function handleLogout() {
  localStorage.clear();
  showToast(
    "Déconnexion réussie",
    "Vous avez été déconnecté avec succès.",
    "success"
  );
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}
