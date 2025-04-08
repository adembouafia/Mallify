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


    document.getElementById("loginForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
    
        if (!email || !password) {
            alert("Tous les champs sont obligatoires !");
            return;
        }
    
        try {
            const response = await fetch("http://localhost:3000/client/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });
    
            const data = await response.json();
            console.log("Réponse du serveur :", data); // Vérification en console
    
            if (response.ok) {
                alert("Connexion réussie !");
                // localStorage.setItem("token", data.token); // 🔥 Stocker le token
                window.location.href = "wishlist.html"; // Rediriger vers la page souhaitée
            } else {
                alert(`Erreur : ${data.message}`);
            }
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
            alert("Une erreur s'est produite lors de la connexion.");
        }
    });
    
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("vendorRegisterForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);  

        // Validation: Check if all fields are filled
        if (!formData.get("vendorname") || !formData.get("shopname") || !formData.get("phone") || !formData.get("shoplogo") || !formData.get("vendorpassword")) {
            alert("Tous les champs sont obligatoires !");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/vendor/register", {
                method: "POST",
                body: formData 
            });

            const data = await response.json();

            if (response.ok) {
                alert("Inscription du vendeur réussie !");
                window.location.reload();
            } else {
                alert(`Erreur : ${data.message}`);
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription du vendeur :", error);
            alert("Une erreur s'est produite lors de l'inscription.");
        }
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

// //eyesplach 
// document.addEventListener("DOMContentLoaded", function () {
//     const passwordInput = document.getElementById("vendorpassword");
//     const togglePassword = document.getElementById("togglePassword");

//     togglePassword.addEventListener("click", function () {
//         // Toggle password visibility
//         if (passwordInput.type === "password") {
//             passwordInput.type = "text";
//             togglePassword.classList.remove("ph-eye-slash");
//             togglePassword.classList.add("ph-eye");
//         } else {
//             passwordInput.type = "password";
//             togglePassword.classList.remove("ph-eye");
//             togglePassword.classList.add("ph-eye-slash");
//         }
//     });
// });







