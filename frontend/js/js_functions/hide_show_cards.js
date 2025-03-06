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