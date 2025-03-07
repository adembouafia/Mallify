document.getElementById('showRegister').addEventListener('click', function(event) {
    event.preventDefault(); 
    document.getElementById('loginCard').style.display = 'none'; 
    document.getElementById('registerCard').style.display = 'block'; 
});

// Sélectionne le lien "Log in" et ajoute un événement au clic
document.getElementById('showLogin').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('registerCard').style.display = 'none';
    document.getElementById('loginCard').style.display = 'block'; 
});

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