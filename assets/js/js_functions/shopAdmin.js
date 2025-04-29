// Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const CLASS_NAME_SIDEBAR_COLLAPSE = 'sidebar-collapse';
  const CLASS_NAME_SIDEBAR_OPEN = 'sidebar-open';
  const SELECTOR_SIDEBAR_TOGGLE = '[data-lte-toggle="sidebar"]';
  const SELECTOR_APP_SIDEBAR = '.app-sidebar';

  class PushMenu {
    constructor(element) {
      this._element = element;
      this._sidebar = document.querySelector(SELECTOR_APP_SIDEBAR);
    }

    toggle() {
      if (document.body.classList.contains(CLASS_NAME_SIDEBAR_COLLAPSE)) {
        this.expand();
      } else {
        this.collapse();
      }
    }

    expand() {
      document.body.classList.remove(CLASS_NAME_SIDEBAR_COLLAPSE);
      document.body.classList.add(CLASS_NAME_SIDEBAR_OPEN);
    }

    collapse() {
      document.body.classList.remove(CLASS_NAME_SIDEBAR_OPEN);
      document.body.classList.add(CLASS_NAME_SIDEBAR_COLLAPSE);
    }
  }

  const pushMenuInstances = [];

  document.querySelectorAll(SELECTOR_SIDEBAR_TOGGLE).forEach(btn => {
    const pushMenu = new PushMenu(btn);
    pushMenuInstances.push(pushMenu);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      pushMenu.toggle();
    });
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector(SELECTOR_APP_SIDEBAR);
    const toggleBtn = document.querySelector(SELECTOR_SIDEBAR_TOGGLE);

    const isClickInsideSidebar = sidebar.contains(e.target);
    const isClickOnToggle = toggleBtn.contains(e.target);

    if (
      !isClickInsideSidebar &&
      !isClickOnToggle &&
      document.body.classList.contains(CLASS_NAME_SIDEBAR_OPEN)
    ) {
      document.body.classList.remove(CLASS_NAME_SIDEBAR_OPEN);
      document.body.classList.add(CLASS_NAME_SIDEBAR_COLLAPSE);
    }
  });
});


// nav-treeview
document.addEventListener('DOMContentLoaded', () => {
  const treeviewToggles = document.querySelectorAll('.nav-item > .nav-link');
  treeviewToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
          const parentItem = toggle.closest('.nav-item');
          const submenu = parentItem.querySelector('.nav-treeview');
          if (submenu) {
              e.preventDefault();
              submenu.classList.toggle('show');
              parentItem.classList.toggle('menu-open');
              const arrow = toggle.querySelector('.nav-arrow');
              if (arrow) {
                  arrow.classList.toggle('bi-chevron-down');
              }
          }
      });
  });

  const activeSubItems = document.querySelectorAll('.nav-treeview .nav-link.active');
  activeSubItems.forEach(item => {
      const treeview = item.closest('.nav-treeview');
      if (treeview) {
          treeview.classList.add('show');
          const parentItem = treeview.closest('.nav-item');
          if (parentItem) {
              parentItem.classList.add('menu-open');
              const arrow = parentItem.querySelector('.nav-arrow');
              if (arrow) {
                  arrow.classList.add('bi-chevron-down');
              }
          }
      }
  });
});

// report cards toggle
document.addEventListener('DOMContentLoaded', () => {
  const SELECTOR_COLLAPSE = '[data-lte-toggle="card-collapse"]';
  const SELECTOR_REMOVE = '[data-lte-toggle="card-remove"]';
  const SELECTOR_MAXIMIZE = '[data-lte-toggle="card-maximize"]';

  document.querySelectorAll(SELECTOR_COLLAPSE).forEach(button => {
      button.addEventListener('click', () => {
          const card = button.closest('.card');
          card.classList.toggle('collapsed-card');
      });
  });

  document.querySelectorAll(SELECTOR_REMOVE).forEach(button => {
      button.addEventListener('click', () => {
          const card = button.closest('.card');
          card.remove();
      });
  });

  document.querySelectorAll(SELECTOR_MAXIMIZE).forEach(button => {
      button.addEventListener('click', () => {
          const card = button.closest('.card');
          card.classList.toggle('maximized-card');
          document.documentElement.classList.toggle('maximized-card');
      });
  });
});

// Slick carousel
document.addEventListener('DOMContentLoaded', function () {
  jQuery('.slider-for').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      fade: false,
      asNavFor: '.slider-nav'
  });

  jQuery('.slider-nav').slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      asNavFor: '.slider-for',
      dots: false,
      focusOnSelect: true
  });
});

