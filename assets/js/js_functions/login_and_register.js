//hide and show the card functions
function showchooseAccountCard(){
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('chooseAccountCard').style.display = 'block';
} 
function showVendorCard() {
    document.getElementById('chooseAccountCard').style.display = 'none';
    document.getElementById('vendorcard').style.display = 'block';
}
function showRegisterCard(){
    document.getElementById('chooseAccountCard').style.display = 'none';
    document.getElementById('registerCard').style.display = 'block';
}
function showLogin(){
    document.getElementById('registerCard').style.display = 'none';
    document.getElementById('loginCard').style.display = 'block';

}
function backtologin(){
    document.getElementById('vendorcard').style.display = 'none';
    document.getElementById('loginCard').style.display = 'block';

}  

//Preview the logo 
function previewImage(event) {
    const input = event.target;
    const preview = document.getElementById("preview");
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(input.files[0]);
    }
}



//login form 
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    form.addEventListener("submit", function (event) {
        event.preventDefault();
    
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
    
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
                    superAdmin: "../dashbordA_pages/index.html" // You can set different paths if needed
                },
                idField: "adminId",
                userType: "admin"
            },
            { 
                url: "http://localhost:3000/vendor/login", 
                redirect: "../dashbordBout_pages/index.html",
                idField: "vendorId",
                userType: "vendor"
            },
            { 
                url: "http://localhost:3000/client/login", 
                redirect: "../index.html",
                idField: "clientId",
                userType: "client"
            },
            { 
                url: "http://localhost:3000/moderator/login", 
                redirect: "../dashbordBout_pages/index.html",
                idField: "moderatorId",
                userType: "moderator"
            },
        ];
    
        function tryLogin(index = 0) {
            if (index >= loginEndpoints.length) {
                alert("Échec de la connexion : vérifiez vos identifiants ou votre type de compte.");
                return;
            }
    
            const { url, redirect, idField, userType } = loginEndpoints[index];
            
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: loginData
            })
            .then(response => {
                console.log(`Trying ${url} - Status: ${response.status}`);
                
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Login failed");
                }
            })
            .then(data => {
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
                } else {
                    console.warn(`Could not extract ID for ${userType} user`);
                }
                
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
                
                // Redirect to the appropriate page
                window.location.href = redirectUrl;
            })
            .catch(error => {
                console.error("Error:", error);
                tryLogin(index + 1);
            });
        }

        tryLogin();
    });
});


//login validation 
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required], input[type="file"][required]');
    function displayError(inputElement, errorMessageElement) {
        inputElement.style.border = "2px solid red";
        errorMessageElement.style.display = "block";
        errorMessageElement.innerText = "This field is required.";
        errorMessageElement.classList.add("text-danger");
        setTimeout(() => {
            errorMessageElement.style.display = "none";
        }, 4000);
    }
    function clearError(inputElement, errorMessageElement) {
        inputElement.style.border = "1px solid #ccc";
        errorMessageElement.style.display = "none";
    }
    const isValid = true;
    inputs.forEach(input => {
        const errorMessageElement = document.getElementById(input.id + "ErrorMessage");
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
}

// Envoi du formulaire d'inscription du client
document.getElementById("registerForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Empêche le rechargement de la page

    const email = document.getElementById("emailTwo").value.trim();
    const firstname = document.getElementById("firstname").value.trim();
    const lastname = document.getElementById("lastname").value.trim();
    const password = document.getElementById("enter_password").value.trim();

    // Validation basique (tu peux améliorer les validations ici)
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
    xhr.open("POST", "http://localhost:3000/client/register", true); // Change l'URL pour l'inscription du client
    xhr.setRequestHeader("Content-Type", "application/json"); // Définir le type de contenu en JSON

    xhr.onload = function () {
        if (xhr.status === 201) {
            const response = JSON.parse(xhr.responseText);
            alert("Client enregistré avec succès !");
            console.log(response);
            // Redirige ou réinitialise le formulaire après inscription
            window.location.reload(); // Recharge la page pour réinitialiser l'état du formulaire
            showLogin(); // Affiche le formulaire de connexion après l'inscription
        } else {
            const error = JSON.parse(xhr.responseText);
            alert("Erreur : " + (error.message || "Échec de l'inscription"));
            console.error(error);
        }
    };

    xhr.onerror = function () {
        alert("Erreur de connexion avec le serveur.");
    };

    xhr.send(JSON.stringify(formData)); // Envoie les données sous forme de JSON
});



// Envoi du formulaire d'inscription du vendeur
document.getElementById("vendorForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Empêche le rechargement de la page

    const form = document.getElementById("vendorForm");
    const formData = new FormData(form); // Crée FormData automatiquement avec tous les champs du formulaire

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/vendor/register", true); // Change le port si nécessaire

    xhr.onload = function () {
    if (xhr.status === 201) {
        const response = JSON.parse(xhr.responseText);
        alert("Vendor enregistré avec succès !");
        console.log(response);
        // reset form ou redirection si tu veux
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

    xhr.send(formData); // Envoie les données, y compris l'image
});









// forget password modal 
function validateEmail() {
    const email = document.getElementById('resetEmail').value;
    const emailInput = document.getElementById('resetEmail');

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
                document.getElementById('emailMessage').innerText = `A code has been sent to: ${email}`;
                bootstrap.Modal.getInstance(document.getElementById('emailModal')).hide();
                bootstrap.Modal.getOrCreateInstance(document.getElementById('codeModal')).show();
            } else {
                alert(res.message || "Error sending reset code.");
            }
        }
    };

    xhr.send(JSON.stringify({ email }));
}


let verifiedCode = ''; // Variable pour stocker le code vérifié

function validateCode() {
    const codeInput = document.getElementById('verificationCode');
    const code = codeInput.value;

    if (code.length === 6 && /^[a-zA-Z0-9]+$/.test(code)) {
        verifiedCode = code;
        bootstrap.Modal.getInstance(document.getElementById('codeModal')).hide();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('passwordModal')).show();
    } else {
        codeInput.classList.add('is-invalid');
    }
}



function validatePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword || newPassword.length < 6) {
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
                bootstrap.Modal.getInstance(document.getElementById('passwordModal')).hide();
            } else {
                alert(res.message || "Invalid or expired code.");
            }
        }
    };

    xhr.send(JSON.stringify({
        code: verifiedCode,
        newPassword: newPassword
    }));
}

// Réinitialiser les erreurs quand on modifie les champs
document.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
    });
});

// Password strength indicator
document.getElementById('newPassword').addEventListener('input', function(e) {
    const strengthBar = document.querySelector('.password-strength-bar');
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

//end forget password modal