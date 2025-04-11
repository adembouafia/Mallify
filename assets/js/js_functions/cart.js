document.addEventListener("DOMContentLoaded", function () {
    const minusButtons = document.querySelectorAll(".quantity__minus");
    const plusButtons = document.querySelectorAll(".quantity__plus");

    plusButtons.forEach(button => {
        button.addEventListener("click", function () {
            const input = this.closest("td").querySelector(".quantity__input");
            let value = parseInt(input.value, 10);
            value++;
            input.value = value;
        });
    });
    minusButtons.forEach(button => {
        button.addEventListener("click", function () {
            const input = this.closest("td").querySelector(".quantity__input");
            let value = parseInt(input.value, 10);
            if (value > 1) {
                value--;
            }
            input.value = value;
        });
    });

    document.querySelectorAll(".remove-tr-btn").forEach(button => {
        button.addEventListener("click", function () {
            this.closest("tr").classList.add("d-none");
        });
    });
});
