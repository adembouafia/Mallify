/**
 * Enhanced login_and_register.js
 * Includes account dropdown functionality and user data fetching
 */

// Helper function to safely add event listeners only if the element exists
function safeAddEventListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(eventType, handler);
    }
  }
  
  //hide and show the card functions
  function showchooseAccountCard(){
      const loginCard = document.getElementById('loginCard');
      const chooseAccountCard = document.getElementById('chooseAccountCard');
      if (loginCard && chooseAccountCard) {
          loginCard.style.display = 'none';
          chooseAccountCard.style.display = 'block';
      }
  } 
  
  function showVendorCard() {
      const chooseAccountCard = document.getElementById('chooseAccountCard');
      const vendorcard = document.getElementById('vendorcard');
      if (chooseAccountCard && vendorcard) {
          chooseAccountCard.style.display = 'none';
          vendorcard.style.display = 'block';
      }
  }
  
  function showRegisterCard(){
      const chooseAccountCard = document.getElementById('chooseAccountCard');
      const registerCard = document.getElementById('registerCard');
      if (chooseAccountCard && registerCard) {
          chooseAccountCard.style.display = 'none';
          registerCard.style.display = 'block';
      }
  }
  
  function showLogin(){
      const registerCard = document.getElementById('registerCard');
      const loginCard = document.getElementById('loginCard');
      if (registerCard && loginCard) {
          registerCard.style.display = 'none';
          loginCard.style.display = 'block';
      }
  }
  
  function backtologin(){
      const vendorcard = document.getElementById('vendorcard');
      const loginCard = document.getElementById('loginCard');
      if (vendorcard && loginCard) {
          vendorcard.style.display = 'none';
          loginCard.style.display = 'block';
      }
  }  
  
  //Preview the logo 
  function previewImage(event) {
      const input = event.target;
      const preview = document.getElementById("preview");
      
      if (input && preview && input.files && input.files[0]) {
          const reader = new FileReader();
          reader.onload = function(e) {
              preview.src = e.target.result;
              preview.style.display = "block";
          };
          reader.readAsDataURL(input.files[0]);
      }
  }
  
  // Main initialization function that runs on all pages
  document.addEventListener("DOMContentLoaded", function() {
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
      
      form.addEventListener("submit", function (event) {
          event.preventDefault();
  
          const email = document.getElementById("email").value.trim();
          const password = document.getElementById("password").value.trim();
  
          // Store email in localStorage for later use in checkout
          localStorage.setItem('loginEmail', email);
  
          if (!email || !password) {
              alert("Tous les champs sont obligatoires !");
              return;
          }
  
          const loginData = JSON.stringify({ email, password });
  
          const loginEndpoints = [
              { 
                  url: "http://localhost:3000/admin/login", 
                  redirect: {
                      admin: "../dashbordA_pages/index.html",
                      superAdmin: "../dashbordA_pages/index.html" 
                  },
                  idField: "adminId",
                  userType: "admin",
                  dataEndpoint: "http://localhost:3000/admin/profile/"
              },
              { 
                  url: "http://localhost:3000/vendor/login", 
                  redirect: "../dashbordBout_pages/index.html",
                  idField: "vendorId",
                  userType: "vendor",
                  dataEndpoint: "http://localhost:3000/vendor/profile/"
              },
              { 
                  url: "http://localhost:3000/client/login", 
                  redirect: "../index.html",
                  idField: "clientId",
                  userType: "client",
                  dataEndpoint: "http://localhost:3000/client/profile/"
              },
              { 
                  url: "http://localhost:3000/moderator/login", 
                  redirect: "../dashbordBout_pages/index.html",
                  idField: "moderatorId",
                  userType: "moderator",
                  dataEndpoint: "http://localhost:3000/moderator/profile/"
              },
          ];
  
          function tryLogin(index = 0) {
              if (index >= loginEndpoints.length) {
                  alert("Échec de la connexion : vérifiez vos identifiants ou votre type de compte.");
                  return;
              }
  
              const { url, redirect, idField, userType, dataEndpoint } = loginEndpoints[index];
              
              // Use XMLHttpRequest instead of fetch
              const xhr = new XMLHttpRequest();
              xhr.open('POST', url, true);
              xhr.setRequestHeader('Content-Type', 'application/json');
              
              xhr.onload = function() {
                  console.log(`Trying ${url} - Status: ${xhr.status}`);
                  
                  if (xhr.status >= 200 && xhr.status < 300) {
                      try {
                          const data = JSON.parse(xhr.responseText);
                          console.log("Response:", data);
                          
                          // Store token
                          localStorage.setItem("token", data.token);
                          
                          // Store user type
                          localStorage.setItem("userType", userType);
                          
                          // Get the correct ID based on user type and response structure
                          let userId = null;
                          
                          // Check all possible locations for the ID
                          if (data[idField]) {
                              // If ID is directly in the response with the specified field name
                              userId = data[idField];
                          } else if (userType === "admin" && data.admin && data.admin.id) {
                              // For admin users with nested admin object
                              userId = data.admin.id;
                          } else if (data[userType] && data[userType].id) {
                              // For responses with nested user objects like data.vendor.id
                              userId = data[userType].id;
                          } else if (data.id) {
                              // Fallback to generic id field
                              userId = data.id;
                          } else if (data._id) {
                              // MongoDB often uses _id
                              userId = data._id;
                          }
                          
                          // Log the extracted ID for debugging
                          console.log(`Extracted ${userType} ID:`, userId);
                          
                          if (userId) {
                              localStorage.setItem("userId", userId);
                              
                              // Fetch additional user data from the database
                              fetchUserData(dataEndpoint + userId, userType, data.token, function() {
                                  // Handle role - specifically check for admin types
                                  let role = userType; // Default to the user type
                                  
                                  if (userType === "admin") {
                                      // For admin endpoint, check for specific role
                                      if (data.admin && data.admin.role) {
                                          role = data.admin.role; // This will be "admin" or "superAdmin"
                                      } else if (data.role) {
                                          role = data.role;
                                      }
                                  } else if (data.role) {
                                      // For other user types that might have roles
                                      role = data.role;
                                  }
                                  
                                  // Store the role
                                  localStorage.setItem("userRole", role);
                                  
                                  // Determine redirect URL based on role for admin users
                                  let redirectUrl = redirect;
                                  if (typeof redirect === 'object' && (role === 'admin' || role === 'superAdmin')) {
                                      redirectUrl = redirect[role] || redirect.admin;
                                  }
                                  
                                  // Log the role for debugging
                                  console.log(`User logged in as: ${role}`);
                                  
                                  // Show success message before redirecting
                                  showLoginSuccess(userType, redirectUrl);
                              });
                          } else {
                              console.warn(`Could not extract ID for ${userType} user`);
                              
                              // Determine redirect URL based on role for admin users
                              let redirectUrl = redirect;
                              if (typeof redirect === 'object' && (data.role === 'admin' || data.role === 'superAdmin')) {
                                  redirectUrl = redirect[data.role] || redirect.admin;
                              }
                              
                              // Show success message before redirecting
                              showLoginSuccess(userType, redirectUrl);
                          }
                      } catch (error) {
                          console.error("Error parsing response:", error);
                          tryLogin(index + 1);
                      }
                  } else {
                      console.error("Login failed with status:", xhr.status);
                      tryLogin(index + 1);
                  }
              };
              
              xhr.onerror = function() {
                  console.error("Network error occurred");
                  tryLogin(index + 1);
              };
              
              xhr.send(loginData);
          }
          
          // Function to fetch additional user data from the database
          function fetchUserData(endpoint, userType, token, callback) {
              console.log(`Fetching user data from: ${endpoint}`);
              
              const xhr = new XMLHttpRequest();
              xhr.open('GET', endpoint, true);
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              xhr.setRequestHeader('Content-Type', 'application/json');
              
              xhr.onload = function() {
                  if (xhr.status >= 200 && xhr.status < 300) {
                      try {
                          const userData = JSON.parse(xhr.responseText);
                          console.log("User data fetched:", userData);
                          
                          // Store user data in localStorage
                          storeUserDataInLocalStorage(userData, userType);
                          
                          // Call the callback function
                          if (typeof callback === 'function') {
                              callback();
                          }
                      } catch (error) {
                          console.error("Error parsing user data:", error);
                          if (typeof callback === 'function') {
                              callback();
                          }
                      }
                  } else {
                      console.error("Failed to fetch user data:", xhr.status);
                      if (typeof callback === 'function') {
                          callback();
                      }
                  }
              };
              
              xhr.onerror = function() {
                  console.error("Network error occurred while fetching user data");
                  if (typeof callback === 'function') {
                      callback();
                  }
              };
              
              xhr.send();
          }
          
          // Function to store all user data in localStorage
          function storeUserDataInLocalStorage(userData, userType) {
              console.log("Storing user data in localStorage:", userData);
              
              // Extract the actual user data object
              let userDataObj = userData;
              
              // Some APIs nest the user data under a property named after the user type
              if (userData[userType]) {
                  userDataObj = userData[userType];
              }
              
              // Store each field individually
              for (const [key, value] of Object.entries(userDataObj)) {
                  if (value !== null && value !== undefined) {
                      // Skip storing the password
                      if (key !== 'password') {
                          // Store the value
                          localStorage.setItem(`user_${key}`, typeof value === 'object' ? JSON.stringify(value) : value);
                          console.log(`Stored user_${key}:`, value);
                      }
                  }
              }
              
              // Store specific fields with more accessible names
              if (userDataObj.firstname) localStorage.setItem('userFirstName', userDataObj.firstname);
              if (userDataObj.lastname) localStorage.setItem('userLastName', userDataObj.lastname);
              if (userDataObj.email) localStorage.setItem('userEmail', userDataObj.email);
              if (userDataObj._id) localStorage.setItem('userId', userDataObj._id);
              
              // Store profile picture or logo based on user type
              if (userType === 'client' && userDataObj.profilePicture) {
                  localStorage.setItem('userProfilePicture', userDataObj.profilePicture);
              } else if ((userType === 'vendor' || userType === 'moderator') && userDataObj.logo) {
                  localStorage.setItem('shopLogo', userDataObj.logo);
              }
              
              // Store the complete user data object
              localStorage.setItem('userData', JSON.stringify(userDataObj));
              console.log("Complete user data stored in localStorage");
              
              // For client users, prepare checkout data
              if (userType === 'client') {
                  // Create a standardized object for checkout
                  const checkoutData = {
                      // Store both camelCase and lowercase versions for maximum compatibility
                      firstname: userDataObj.firstname || '',
                      firstName: userDataObj.firstname || '',
                      lastname: userDataObj.lastname || '',
                      lastName: userDataObj.lastname || '',
                      email: userDataObj.email || '',
                      governorate: userDataObj.governorate || '',
                      city: userDataObj.city || '',
                      address: userDataObj.address || '',
                      phone: userDataObj.phone || '',
                      postCode: userDataObj.postCode || ''
                  };
                  
                  // Store the checkout data
                  localStorage.setItem('checkoutClientData', JSON.stringify(checkoutData));
                  console.log("Checkout data saved to localStorage:", checkoutData);
              }
          }
  
          // Function to show success message before redirecting
          function showLoginSuccess(userType, redirectUrl) {
              // Check if SweetAlert2 is available
              if (typeof Swal !== 'undefined') {
                  let title = "Connexion réussie!";
                  let text = "";
                  
                  // Customize message based on user type
                  switch(userType) {
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
                  
                  Swal.fire({
                      icon: 'success',
                      title: title,
                      text: text,
                      timer: 2000,
                      showConfirmButton: false
                  }).then(() => {
                      // Redirect after the alert is closed
                      window.location.href = redirectUrl;
                  });
              } else {
                  // Fallback if SweetAlert is not available
                  alert("Connexion réussie!");
                  window.location.href = redirectUrl;
              }
          }
  
          tryLogin();
      });
  }
  
  // Initialize register forms
  function initializeRegisterForms() {
      // Client registration form
      const registerForm = document.getElementById("registerForm");
      if (registerForm) {
          registerForm.addEventListener("submit", function (e) {
              e.preventDefault(); // Empêche le rechargement de la page
  
              const email = document.getElementById("emailTwo").value.trim();
              const firstname = document.getElementById("firstname").value.trim();
              const lastname = document.getElementById("lastname").value.trim();
              const password = document.getElementById("enter_password").value.trim();
  
              // Validation basique
              if (!firstname || !lastname || !email || !password) {
                  alert("Tous les champs sont obligatoires !");
                  return;
              }
  
              // Création de l'objet avec les données du formulaire
              const formData = {
                  firstname: firstname,
                  lastname: lastname,
                  email: email,
                  password: password
              };
  
              const xhr = new XMLHttpRequest();
              xhr.open("POST", "http://localhost:3000/client/register", true);
              xhr.setRequestHeader("Content-Type", "application/json");
  
              xhr.onload = function () {
                  if (xhr.status === 201) {
                      const response = JSON.parse(xhr.responseText);
                      alert("Client enregistré avec succès !");
                      console.log(response);
                      // Redirige ou réinitialise le formulaire après inscription
                      window.location.reload();
                      showLogin();
                  } else {
                      const error = JSON.parse(xhr.responseText);
                      alert("Erreur : " + (error.message || "Échec de l'inscription"));
                      console.error(error);
                  }
              };
  
              xhr.onerror = function () {
                  alert("Erreur de connexion avec le serveur.");
              };
  
              xhr.send(JSON.stringify(formData));
          });
      }
  
      // Vendor registration form
      const vendorForm = document.getElementById("vendorForm");
      if (vendorForm) {
          vendorForm.addEventListener("submit", function (e) {
              e.preventDefault();
  
              const formData = new FormData(vendorForm);
  
              const xhr = new XMLHttpRequest();
              xhr.open("POST", "http://localhost:3000/vendor/register", true);
  
              xhr.onload = function () {
                  if (xhr.status === 201) {
                      const response = JSON.parse(xhr.responseText);
                      alert("Vendor enregistré avec succès !");
                      console.log(response);
                      window.location.reload();
                      showLogin();
                  } else {
                      const error = JSON.parse(xhr.responseText);
                      alert("Erreur : " + (error.message || "Échec de l'inscription"));
                      console.error(error);
                  }
              };
  
              xhr.onerror = function () {
                  alert("Erreur de connexion avec le serveur.");
              };
  
              xhr.send(formData);
          });
      }
  }
  
  // Form validation function
  function validateForm(formId) {
      const form = document.getElementById(formId);
      if (!form) return false;
      
      const inputs = form.querySelectorAll('input[required], select[required], textarea[required], input[type="file"][required]');
      
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
      inputs.forEach(input => {
          const errorMessageElement = document.getElementById(input.id + "ErrorMessage");
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
      const resetEmailInput = document.getElementById('resetEmail');
      if (resetEmailInput) {
          resetEmailInput.addEventListener('input', function() {
              this.classList.remove('is-invalid');
          });
      }
      
      const codeInput = document.getElementById('verificationCode');
      if (codeInput) {
          codeInput.addEventListener('input', function() {
              this.classList.remove('is-invalid');
          });
      }
      
      const newPasswordInput = document.getElementById('newPassword');
      if (newPasswordInput) {
          newPasswordInput.addEventListener('input', function(e) {
              const strengthBar = document.querySelector('.password-strength-bar');
              if (!strengthBar) return;
              
              const password = e.target.value;
              
              let strength = 0;
              if (password.match(/[a-z]+/)) strength++;
              if (password.match(/[A-Z]+/)) strength++;
              if (password.match(/[0-9]+/)) strength++;
              if (password.match(/[$@#&!]+/)) strength++;
              
              strengthBar.style.width = (strength * 25) + '%';
              strengthBar.style.backgroundColor = 
                  strength < 2 ? '#e53e3e' : 
                  strength < 4 ? '#d69e2e' : '#48bb78';
          });
      }
  }
  
  // Password reset functions
  let verifiedCode = ''; // Variable pour stocker le code vérifié
  
  function validateEmail() {
      const emailInput = document.getElementById('resetEmail');
      if (!emailInput) return;
      
      const email = emailInput.value;
  
      // Validation simple
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          emailInput.classList.add('is-invalid');
          return;
      }
  
      emailInput.classList.remove('is-invalid');
  
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:3000/client/forgotPassword', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
              const res = JSON.parse(xhr.responseText);
              if (xhr.status === 200) {
                  const emailMessage = document.getElementById('emailMessage');
                  if (emailMessage) {
                      emailMessage.innerText = `A code has been sent to: ${email}`;
                  }
                  
                  const emailModal = document.getElementById('emailModal');
                  const codeModal = document.getElementById('codeModal');
                  
                  if (emailModal && codeModal && typeof bootstrap !== 'undefined') {
                      bootstrap.Modal.getInstance(emailModal).hide();
                      bootstrap.Modal.getOrCreateInstance(codeModal).show();
                  }
              } else {
                  alert(res.message || "Error sending reset code.");
              }
          }
      };
  
      xhr.send(JSON.stringify({ email }));
  }
  
  function validateCode() {
      const codeInput = document.getElementById('verificationCode');
      if (!codeInput) return;
      
      const code = codeInput.value;
  
      if (code.length === 6 && /^[a-zA-Z0-9]+$/.test(code)) {
          verifiedCode = code;
          
          const codeModal = document.getElementById('codeModal');
          const passwordModal = document.getElementById('passwordModal');
          
          if (codeModal && passwordModal && typeof bootstrap !== 'undefined') {
              bootstrap.Modal.getInstance(codeModal).hide();
              bootstrap.Modal.getOrCreateInstance(passwordModal).show();
          }
      } else {
          codeInput.classList.add('is-invalid');
      }
  }
  
  function validatePassword() {
      const newPassword = document.getElementById('newPassword');
      const confirmPassword = document.getElementById('confirmPassword');
      
      if (!newPassword || !confirmPassword) return;
      
      const newPasswordValue = newPassword.value;
      const confirmPasswordValue = confirmPassword.value;
  
      if (newPasswordValue !== confirmPasswordValue || newPasswordValue.length < 6) {
          alert("Passwords must match and be at least 6 characters.");
          return;
      }
  
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:3000/client/reset-password', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
              const res = JSON.parse(xhr.responseText);
              if (xhr.status === 200) {
                  alert("Password successfully reset!");
                  
                  const passwordModal = document.getElementById('passwordModal');
                  if (passwordModal && typeof bootstrap !== 'undefined') {
                      bootstrap.Modal.getInstance(passwordModal).hide();
                  }
              } else {
                  alert(res.message || "Invalid or expired code.");
              }
          }
      };
  
      xhr.send(JSON.stringify({
          code: verifiedCode,
          newPassword: newPasswordValue
      }));
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
          const wrapperDiv = document.createElement('div');
          wrapperDiv.className = 'account-dropdown-wrapper position-relative';
          
          // Create a button element instead of a link
          const newBtn = document.createElement('button');
          newBtn.className = originalClasses + ' account-btn-logged-in'; // Keep original styling + add logged-in class
          newBtn.type = 'button';
          
          // Get user info from localStorage
          const firstName = localStorage.getItem('userFirstName') || 'User';
          const lastName = localStorage.getItem('userLastName') || '';
          
          // Create new button content with user info
          newBtn.innerHTML = `
              <div class="d-flex align-items-center">
                  <div class="account-btn-avatar me-2">
                      <span>${firstName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div class="account-btn-text">
                      <span class="d-none d-md-inline">${firstName}</span>
                  </div>
              </div>
          `;
          
          // Remove any link-specific classes and add button styling
          newBtn.classList.remove('href');
          newBtn.style.border = 'none';
          newBtn.style.cursor = 'pointer';
          newBtn.style.background = 'transparent';
          
          // Create the dropdown menu with enhanced styling
          const dropdownMenu = document.createElement('div');
          dropdownMenu.className = 'account-dropdown-menu position-absolute bg-white shadow-lg rounded-4 py-0 mt-3 d-none';
          dropdownMenu.style.minWidth = isMobile ? '260px' : '320px';
          dropdownMenu.style.right = '0';
          dropdownMenu.style.zIndex = '1000';
          
          // Get user email from localStorage
          const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
          
          // Add decorative top bar
          const topBar = document.createElement('div');
          topBar.className = 'account-dropdown-top-bar rounded-top-4';
          dropdownMenu.appendChild(topBar);
          
          // Add user info to dropdown with improved styling
          const userInfo = document.createElement('div');
          userInfo.className = 'px-4 py-4 border-bottom';
          
          // Determine avatar/image based on user type
          let avatarHTML = '';
          
          if (userType === 'client') {
              // For clients: Try to get profile picture from localStorage
              const profilePicture = localStorage.getItem('userProfilePicture') || '';
              
              if (profilePicture && profilePicture !== 'null' && profilePicture !== 'undefined') {
                  // If profile picture exists, use it
                  avatarHTML = `
                      <div class="user-avatar-circle me-3 overflow-hidden">
                          <img src="${profilePicture}" alt="${firstName}" class="w-100 h-100 object-fit-cover">
                      </div>
                  `;
              } else {
                  // Otherwise use first letter avatar
                  const avatarLetter = (firstName.charAt(0) || 'U').toUpperCase();
                  avatarHTML = `
                      <div class="user-avatar-circle me-3 d-flex align-items-center justify-content-center">
                          ${avatarLetter}
                      </div>
                  `;
              }
          } else if (userType === 'vendor' || userType === 'moderator') {
              // For vendors and moderators: Try to get shop logo
              const shopLogo = localStorage.getItem('shopLogo') || '';
              
              if (shopLogo && shopLogo !== 'null' && shopLogo !== 'undefined') {
                  // If shop logo exists, use it
                  avatarHTML = `
                      <div class="user-avatar-circle me-3 overflow-hidden">
                          <img src="${shopLogo}" alt="Shop Logo" class="w-100 h-100 object-fit-cover">
                      </div>
                  `;
              } else {
                  // Otherwise use shop icon
                  avatarHTML = `
                      <div class="user-avatar-circle me-3 d-flex align-items-center justify-content-center shop-avatar">
                          <i class="ph ph-storefront"></i>
                      </div>
                  `;
              }
          } else if (userType === 'admin') {
              // For admins and super admins: Use default admin avatar
              avatarHTML = `
                  <div class="user-avatar-circle me-3 d-flex align-items-center justify-content-center admin-avatar">
                      <i class="ph ph-shield"></i>
                  </div>
              `;
          }
          
          userInfo.innerHTML = `
              <div class="d-flex align-items-center mb-2">
                  ${avatarHTML}
                  <div class="flex-grow-1">
                      <div class="fw-bold fs-5 text-truncate">${firstName} ${lastName}</div>
                      <div class="text-muted small text-truncate">${userEmail}</div>
                  </div>
              </div>
          `;
          dropdownMenu.appendChild(userInfo);
          
          // Create menu items container
          const menuItems = document.createElement('div');
          menuItems.className = 'py-2';
          
          // Add profile link - pointing to profil.html
          const profileLink = document.createElement('a');
          profileLink.href = 'profil.html';
          profileLink.className = 'dropdown-menu-item';
          profileLink.innerHTML = `
              <div class="dropdown-menu-item-icon">
                  <i class="ph ph-user-circle"></i>
              </div>
              <div class="dropdown-menu-item-content">
                  <span class="dropdown-menu-item-title">Profile</span>
                  <span class="dropdown-menu-item-description">View and edit your profile</span>
              </div>
          `;
          menuItems.appendChild(profileLink);
          
          dropdownMenu.appendChild(menuItems);
          
          // Add footer with logout button
          const dropdownFooter = document.createElement('div');
          dropdownFooter.className = 'account-dropdown-footer rounded-bottom-4';
          
          // Add logout link with improved styling
          const logoutLink = document.createElement('a');
          logoutLink.href = 'javascript:void(0)';
          logoutLink.className = 'dropdown-menu-item dropdown-menu-item-logout';
          logoutLink.innerHTML = `
              <div class="dropdown-menu-item-icon">
                  <i class="ph ph-sign-out"></i>
              </div>
              <div class="dropdown-menu-item-content">
                  <span class="dropdown-menu-item-title">Logout</span>
                  <span class="dropdown-menu-item-description">Sign out of your account</span>
              </div>
          `;
          logoutLink.addEventListener('click', handleLogout);
          
          dropdownFooter.appendChild(logoutLink);
          dropdownMenu.appendChild(dropdownFooter);
          
          // Add the button and dropdown to the wrapper
          wrapperDiv.appendChild(newBtn);
          wrapperDiv.appendChild(dropdownMenu);
          
          // Replace the original link with our new dropdown
          accountBtn.parentNode.replaceChild(wrapperDiv, accountBtn);
          
          // Toggle dropdown on click - ONLY toggles dropdown, no navigation
          newBtn.addEventListener('click', function(e) {
              e.preventDefault(); // Prevent any default action
              e.stopPropagation(); // Stop event bubbling
              
              // Toggle active class on button
              this.classList.toggle('active');
              
              // Toggle dropdown visibility with animation
              if (dropdownMenu.classList.contains('d-none')) {
                  dropdownMenu.classList.remove('d-none');
                  dropdownMenu.classList.add('dropdown-menu-visible');
                  
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
          const backdrop = document.createElement('div');
          backdrop.className = 'account-dropdown-backdrop';
          document.body.appendChild(backdrop);
          
          // Animate backdrop in
          setTimeout(() => {
              backdrop.classList.add('active');
          }, 10);
          
          // Close dropdown when backdrop is clicked
          backdrop.addEventListener('click', function() {
              removeDropdownBackdrops();
              document.querySelectorAll('.account-dropdown-menu').forEach(menu => {
                  closeDropdown(menu);
              });
              document.querySelectorAll('.account-dropdown-toggle').forEach(toggle => {
                  toggle.classList.remove('active');
              });
          });
      }
      
      // Function to remove all dropdown backdrops
      function removeDropdownBackdrops() {
          document.querySelectorAll('.account-dropdown-backdrop').forEach(backdrop => {
              backdrop.classList.remove('active');
              setTimeout(() => {
                  backdrop.remove();
              }, 300);
          });
      }
      
      // Function to close dropdown with animation
      function closeDropdown(dropdownMenu) {
          dropdownMenu.classList.remove('dropdown-menu-visible');
          dropdownMenu.classList.add('dropdown-menu-hidden');
          
          // Remove backdrop if it exists
          removeDropdownBackdrops();
          
          // After animation completes, hide the dropdown
          setTimeout(() => {
              dropdownMenu.classList.remove('dropdown-menu-hidden');
              dropdownMenu.classList.add('d-none');
          }, 300);
      }
      
      // Try multiple possible selectors for account buttons
      const accountSelectors = [
          // Desktop account buttons
          '.header-middle .header-right a[href="account.html"]',
          '.header-right a[href="account.html"]',
          'a[href="account.html"].d-flex',
          'a[href="account.html"]:not(.flex-align)',
          
          // Mobile account buttons
          '.header .header-two-activities a[href="account.html"]',
          '.header-two-activities a[href="account.html"]',
          'a[href="account.html"].flex-align'
      ];
      
      // Track which buttons we've already processed
      const processedButtons = new Set();
      
      // Try each selector
      accountSelectors.forEach(selector => {
          try {
              // Try to find all matching elements
              const buttons = document.querySelectorAll(selector);
              
              buttons.forEach(btn => {
                  // Skip if we've already processed this button
                  if (processedButtons.has(btn)) return;
                  
                  // Mark as processed
                  processedButtons.add(btn);
                  
                  // Determine if it's a mobile button based on classes
                  const isMobile = btn.classList.contains('flex-align') || 
                                  btn.closest('.header-two-activities') !== null;
                  
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
          document.addEventListener('click', function(e) {
              // Skip if the click is on a dropdown or its children
              if (e.target.closest('.account-dropdown-wrapper')) return;
              
              // Close all dropdowns
              document.querySelectorAll('.account-dropdown-menu').forEach(menu => {
                  if (!menu.classList.contains('d-none')) {
                      closeDropdown(menu);
                  }
              });
              
              // Remove active class from all toggles
              document.querySelectorAll('.account-btn-logged-in').forEach(toggle => {
                  toggle.classList.remove('active');
              });
              
              // Remove any backdrops
              removeDropdownBackdrops();
          });
          
          // Add CSS for dropdown styling if not already present
          if (!document.getElementById('account-dropdown-styles')) {
              const styleEl = document.createElement('style');
              styleEl.id = 'account-dropdown-styles';
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
      // Clear all localStorage items
      localStorage.clear();
      
      // Show logout success message if SweetAlert2 is available
      if (typeof Swal !== 'undefined') {
          Swal.fire({
              icon: 'success',
              title: 'Déconnexion réussie',
              text: 'Vous avez été déconnecté avec succès.',
              timer: 2000,
              showConfirmButton: false
          }).then(() => {
              // Redirect to home page
              window.location.href = 'index.html';
          });
      } else {
          // Fallback if SweetAlert is not available
          alert('Déconnexion réussie');
          window.location.href = 'index.html';
      }
  }