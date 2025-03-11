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

//login validation 
// function validateForm(formId) {
//     const form = document.getElementById(formId);
//     const inputs = form.querySelectorAll('input[required], select[required], textarea[required], input[type="file"][required]');
//     function displayError(inputElement, errorMessageElement) {
//         inputElement.style.border = "2px solid red";
//         errorMessageElement.style.display = "block";
//         errorMessageElement.innerText = "This field is required.";
//         errorMessageElement.classList.add("text-danger");
//         setTimeout(() => {
//             errorMessageElement.style.display = "none";
//         }, 4000);
//     }
//     function clearError(inputElement, errorMessageElement) {
//         inputElement.style.border = "1px solid #ccc";
//         errorMessageElement.style.display = "none";
//     }
//     const isValid = true;
//     inputs.forEach(input => {
//         const errorMessageElement = document.getElementById(input.id + "ErrorMessage");
//         if (input.type === "file" && input.files.length === 0) {
//             displayError(input, errorMessageElement);
//             isValid = false;
//         } 
//         // Check if other inputs are empty
//         else if (input.value.trim() === "") {
//             displayError(input, errorMessageElement);
//             isValid = false;
//         } else {
//             clearError(input, errorMessageElement);
//         }
//     });
//     if (isValid) {
//         window.location.reload();
//     }
// }

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







