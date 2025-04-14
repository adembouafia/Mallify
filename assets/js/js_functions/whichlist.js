document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".btn-remove").forEach(button => {
      button.addEventListener("click", function () {
        const row = this.closest("tr");
        if (row) {
          row.remove();
        }
  
        const card = this.closest(".wishlist-card");
        if (card) {
          card.remove();
        }
      });
    });
  });
  