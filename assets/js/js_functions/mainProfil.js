function showContent(sectionId) {
    const menuItems = document.querySelectorAll('.profile-nav__menu li');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    const clickedMenuItem = document.getElementById(sectionId);
    clickedMenuItem.classList.add('active');
    const contentSections = document.querySelectorAll('#content-container > div');
    contentSections.forEach(section => {
        section.style.display = 'none';
    });
    const contentToShow = document.getElementById(`${sectionId}-content`);
    if (contentToShow) {
        contentToShow.style.display = 'block';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const contentSections = document.querySelectorAll('#content-container > div');
    contentSections.forEach(section => {
        section.style.display = 'none';
    });
    showContent('profile-info');
});

/*hide and show password  */
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        this.classList.toggle('ph-eye-slash');
        this.classList.toggle('ph-eye');
    });
  });
