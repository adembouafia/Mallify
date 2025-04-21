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

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("registerForm").addEventListener("submit", async function (event) {
        event.preventDefault(); // Empêcher le rechargement de la page
        // Récupérer les valeurs du formulaire
        const firstname = document.getElementById("firstname").value.trim();
        const lastname = document.getElementById("lastname").value.trim();
        const email = document.getElementById("emailTwo").value.trim();
        const password = document.getElementById("enter_password").value.trim();
        // Vérifier si tous les champs sont remplis
        if (!firstname || !lastname || !email || !password) {
            alert("Tous les champs sont obligatoires !");
            return;
        }

        const userData = { firstname, lastname, email, password };

        try {
            const response = await fetch("http://localhost:3000/client/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                alert("Inscription réussie !");
                window.location.reload()
                showLogin(); // Rediriger vers la page de connexion
            } else {
                alert(`Erreur : ${data.message}`);
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription :", error);
            alert("Une erreur s'est produite lors de l'inscription.");
        }
    });


    document.getElementById("loginForm").addEventListener("submit", function (event) {
        event.preventDefault();
    
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
    
        if (!email || !password) {
            alert("Tous les champs sont obligatoires !");
            return;
        }
    
        const loginData = {
            email: email,
            vendorPassword: password
        };
    
        const xhrClient = new XMLHttpRequest();
        xhrClient.open("POST", "http://localhost:3000/client/login", true);
        xhrClient.setRequestHeader("Content-Type", "application/json");
    
        xhrClient.onload = function () {
            if (xhrClient.status === 200) {
                const clientResponse = JSON.parse(xhrClient.responseText);
                alert("Connexion réussie (client) !");
                console.log("Client :", clientResponse);
                // localStorage.setItem("token", clientResponse.token);
                window.location.href = "wishlist.html";
            } else {
                // Si ce n'est pas un client, on essaye comme vendor
                const xhrVendor = new XMLHttpRequest();
                xhrVendor.open("POST", "http://localhost:3000/vendor/login", true);
                xhrVendor.setRequestHeader("Content-Type", "application/json");
    
                xhrVendor.onload = function () {
                    if (xhrVendor.status === 200) {
                        const vendorResponse = JSON.parse(xhrVendor.responseText);
                        alert("Connexion réussie (vendeur) !");
                        console.log("Vendor :", vendorResponse);
                        // localStorage.setItem("token", vendorResponse.token);
                        window.location.href = "../../frontend/dashbordBout_pages/index.html";
                    } else {
                        const error = JSON.parse(xhrVendor.responseText);
                        alert("Erreur : " + (error.message || "Email ou mot de passe invalide"));
                    }
                };
    
                xhrVendor.onerror = function () {
                    alert("Erreur de connexion avec le serveur (vendor).");
                };
    
                xhrVendor.send(JSON.stringify(loginData));
            }
        };
    
        xhrClient.onerror = function () {
            alert("Erreur de connexion avec le serveur (client).");
        };
    
        xhrClient.send(JSON.stringify(loginData));
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

