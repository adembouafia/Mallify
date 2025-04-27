window.addEventListener("load", function () {
    var preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.transition = "opacity 0.6s ease"; // slow fade
        preloader.style.opacity = "0";
        setTimeout(function () {
            preloader.style.display = "none";
        }, 1600);
    }
});
