
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('show');
}

document.getElementById('logo-upload').addEventListener('change', function(e) {
  const reader = new FileReader();
  reader.onload = function() {
    document.getElementById('shop-logo').src = reader.result;
  }
  reader.readAsDataURL(e.target.files[0]);
});

function updateSidebarInfo() {
  document.getElementById('sidebar-shop-name').textContent = document.getElementById('shop-name').value;
  document.getElementById('sidebar-shop-description').textContent = document.getElementById('shop-description').value;
  document.getElementById('sidebar-address').textContent = "📍 " + document.getElementById('shop-address').value;
  document.getElementById('sidebar-phone').textContent = "📞 " + document.getElementById('shop-phone').value;
}

function saveShopInfo() {
  updateSidebarInfo();
  alert('Settings saved!');
}

function setStockLimit() {
  const limit = document.getElementById('stock-limit').value;
  document.getElementById('sidebar-stock-limit').textContent = `📦 Stock Limit: ${limit}`;
  alert(`Stock limit set to ${limit}`);
}

function showSection(event, sectionId) {
  event.preventDefault();
  document.querySelectorAll('.settings-section').forEach(section => section.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');

  document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
  event.target.classList.add('active');

  if (window.innerWidth <= 768) {
    toggleSidebar();
  }
}