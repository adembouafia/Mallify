document.addEventListener("DOMContentLoaded", function () {
document.querySelectorAll(".remove-tr-btn").forEach(button => {
    button.addEventListener("click", function () {
        this.closest("tr").classList.add("d-none");
    });
});
});
