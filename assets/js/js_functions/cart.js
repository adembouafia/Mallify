document.addEventListener("DOMContentLoaded", function () {
    const qtyButtons = document.querySelectorAll(".btn-qty");
    qtyButtons.forEach(button => {
    button.addEventListener("click", function () {
        const isPlus = this.textContent.trim() === "+";
        const input = this.parentElement.querySelector("input[type='text']");
        let value = parseInt(input.value, 10);
        if (isNaN(value)) value = 1;
        if (isPlus) {
        value++;
        } else if (value > 1) {
        value--;
        }
        input.value = value;
    });
});
const removeButtons = document.querySelectorAll(".btn-remove");
removeButtons.forEach(button => {
    button.addEventListener("click", function () {
        const tr = this.closest("tr");
        if (tr) tr.remove();
        const card = this.closest(".cart-card");
        if (card) card.remove();
        });
    });
});
