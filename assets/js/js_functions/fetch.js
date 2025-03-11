fetch("http://localhost:3000/")
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error("Error:", error));
