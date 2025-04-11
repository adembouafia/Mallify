const question = document.querySelectorAll(".faq-item__title");
const answer = document.querySelectorAll(".faq-item__content");
const arrow = document.querySelectorAll(".arrow");

for(let i = 0; i < question.length; i++) {
  question[i].addEventListener("click", function () {
    answer[i].classList.toggle("faq-item__content-opened");
    arrow[i].classList.toggle("arrow-rotated");
  });
}