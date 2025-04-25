// ─── DATA ─────────────────────────────────────────────────────────────────────
const reports = [
    { id: 'REP-3001', title: 'Erreur d’affichage : Smartphone Oppo Reno 8', category: 'bug',     description: 'Les caractéristiques techniques ne s’affichent pas correctement sur la fiche produit.', date: '2024-03-10T11:00:00', status: 'pending' },
    { id: 'REP-3002', title: 'Demande d’ajout : Chaussures Nike Air Force 1',   category: 'feature', description: 'Plusieurs clients ont demandé la version blanche classique en pointure 42-45.',           date: '2024-03-12T14:30:00', status: 'pending' },
    { id: 'REP-3003', title: 'Produit non livré : Casque JBL Tune 510BT',      category: 'bug',     description: 'Le client a signalé que le produit a été marqué comme livré, mais il ne l’a jamais reçu.',  date: '2024-03-15T09:45:00', status: 'resolved' },
    { id: 'REP-3004', title: 'Photo incorrecte : Robe Zara Femme Été',          category: 'bug',     description: 'La photo montre un modèle différent de la robe commandée.',                                 date: '2024-03-17T16:20:00', status: 'pending' },
    { id: 'REP-3005', title: 'Suggestion : Ajouter les parfums Oud',            category: 'feature', description: 'Des utilisateurs ont suggéré d’ajouter une sélection de parfums orientaux (Oud, Musc, etc).', date: '2024-03-18T10:15:00', status: 'pending' },
    { id: 'REP-3006', title: 'Fiche manquante : Micro-ondes Samsung Grill 30L', category: 'bug',     description: 'Le produit est en ligne mais la fiche technique est vide.',                               date: '2024-03-19T13:50:00', status: 'pending' },
    { id: 'REP-3007', title: 'Erreur de stock : Livre “L’Alchimiste”',         category: 'bug',     description: 'Le livre est marqué comme disponible mais est en rupture depuis 2 semaines.',               date: '2024-03-20T12:00:00', status: 'resolved' },
    { id: 'REP-3008', title: 'Demande d’ajout : Écouteurs sans fil Xiaomi Redmi Buds 4', category: 'feature', description: 'Les utilisateurs demandent l’ajout de cette référence au catalogue high-tech.',              date: '2024-03-21T17:30:00', status: 'pending' },
    { id: 'REP-3009', title: 'Produit en double : Crème hydratante Nivea Soft (100ml)', category: 'bug',     description: 'Deux fiches identiques sont disponibles avec des références différentes.',                   date: '2024-03-22T09:10:00', status: 'pending' },
    { id: 'REP-3010', title: 'Ajout de catégorie : Jeux éducatifs pour enfants',       category: 'feature', description: 'Plusieurs parents aimeraient voir une section dédiée aux jeux éducatifs.',                    date: '2024-03-23T15:40:00', status: 'pending' }
  ];
  
  // ─── STATE ────────────────────────────────────────────────────────────────────
  let currentPage       = 1;
  const rowsPerPage     = 10;
  let filteredReports   = [...reports];
  let currentSort       = { column: 'date', direction: 'desc' };
  let currentTab        = 'all';
  let currentDateFilter = 'all';
  let searchTerm        = '';
  let currentReportId   = null;
  
  // ─── DOM ELEMENTS ─────────────────────────────────────────────────────────────
  const reportsTableBody     = document.getElementById('reportsTableBody');
  const pagination           = document.getElementById('pagination');
  const pageInfo             = document.getElementById('pageInfo');
  const totalReportsEl       = document.getElementById('totalReports');
  const pendingReportsEl     = document.getElementById('pendingReports');
  const resolvedReportsEl    = document.getElementById('resolvedReports');
  const searchInput          = document.getElementById('searchInput');
  const dateFilterBtn        = document.getElementById('dateFilterBtn');
  const dateFilterMenu       = document.getElementById('dateFilterMenu');
  const tabs                 = document.querySelectorAll('.tab');
  const sortableHeaders      = document.querySelectorAll('th.sortable');
  
  const reportModalEl        = document.getElementById('reportModal');
  const respondModalEl       = document.getElementById('respondModal');
  const deleteModalEl        = document.getElementById('deleteConfirmModal');
  
  let reportModalInstance, respondModalInstance, deleteModalInstance;
  
  // ─── INITIALIZATION ───────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    reportModalInstance  = new bootstrap.Modal(reportModalEl);
    respondModalInstance = new bootstrap.Modal(respondModalEl);
    deleteModalInstance  = new bootstrap.Modal(deleteModalEl);
  
    init();
  });
  
  // ─── CORE FUNCTIONS ────────────────────────────────────────────────────────────
  function init() {
    updateStats();
    applyFilters();
    renderTable();
    renderPagination();
    setupEventListeners();
  }
  
  function updateStats() {
    totalReportsEl.textContent    = reports.length;
    pendingReportsEl.textContent  = reports.filter(r => r.status === 'pending').length;
    resolvedReportsEl.textContent = reports.filter(r => r.status === 'resolved').length;
  }
  
  function applyFilters() {
  // ─── STATUS TABS FILTER ────────────────────────────────────────────────────────
tabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      // 1️⃣ Highlight active tab
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
  
      // 2️⃣ Set the filter value
      currentTab  = this.dataset.tab;   // "all", "pending", or "resolved"
      currentPage = 1;
  
      // 3️⃣ Re-run filtering & re-render
      applyFilters();
      renderTable();
      renderPagination();
    });
  });
  if (currentTab === 'all') {
    filteredReports = [...reports];
  } else {
    filteredReports = reports.filter(r => r.status === currentTab);
  }
  
  
    // 2. Date filter
    if (currentDateFilter !== 'all') {
      const now         = new Date();
      const today       = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart   = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  
      filteredReports = filteredReports.filter(r => {
        const d = new Date(r.date);
        return  (currentDateFilter === 'today' && d >= today)
             || (currentDateFilter === 'week'  && d >= weekStart)
             || (currentDateFilter === 'month' && d >= monthStart);
      });
    }
  
    // 3. Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredReports = filteredReports.filter(r =>
        r.id.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term)
      );
    }
  
    // 4. Sorting
    filteredReports.sort((a, b) => {
      let va = a[currentSort.column];
      let vb = b[currentSort.column];
  
      if (currentSort.column === 'date') {
        va = new Date(va);
        vb = new Date(vb);
      }
  
      if (va < vb) return currentSort.direction === 'asc' ? -1 : 1;
      if (va > vb) return currentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  
    // 5. Recompute pagination
    totalPages = Math.ceil(filteredReports.length / rowsPerPage);
    if (currentPage > totalPages) {
      currentPage = totalPages || 1;
    }
  }
  
  function renderTable() {
    reportsTableBody.innerHTML = '';
    if (!filteredReports.length) {
      reportsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No reports found</td></tr>`;
      pageInfo.textContent = 'Showing 0 to 0 of 0 entries';
      return;
    }
  
    const start = (currentPage - 1) * rowsPerPage;
    const end   = Math.min(start + rowsPerPage, filteredReports.length);
    const pageItems = filteredReports.slice(start, end);
  
    pageItems.forEach(r => {
      const dateStr = new Date(r.date).toLocaleString();
      const badge   = r.status === 'resolved' ? 'badge-success' : 'badge-primary';
      const row     = document.createElement('tr');
      row.classList.add('table-row');
      row.dataset.id = r.id;
      row.innerHTML = `
        <td>${r.id}</td>
        <td>${r.title}</td>
        <td>${r.category.charAt(0).toUpperCase() + r.category.slice(1)}</td>
        <td>${dateStr}</td>
        <td><span class="badge ${badge}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary view-btn" data-id="${r.id}">
            <i class="bi bi-eye"></i> View
          </button>
        </td>
      `;
      reportsTableBody.appendChild(row);
    });
  
    pageInfo.textContent = `Showing ${start + 1} to ${end} of ${filteredReports.length} entries`;
  }
  
  function renderPagination() {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(filteredReports.length / rowsPerPage);
    if (totalPages <= 1) return;
  
    // Previous
    const prev = document.createElement('button');
    prev.className = 'page-button';
    prev.innerHTML = '<i class="bi bi-chevron-left"></i>';
    prev.disabled  = currentPage === 1;
    prev.onclick   = () => { currentPage--; renderTable(); renderPagination(); };
    pagination.appendChild(prev);
  
    // Page numbers
    const maxBtns   = 5;
    let startPage   = Math.max(1, currentPage - Math.floor(maxBtns/2));
    let endPage     = Math.min(totalPages, startPage + maxBtns - 1);
    if (endPage - startPage + 1 < maxBtns) {
      startPage = Math.max(1, endPage - maxBtns + 1);
    }
  
    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.className = 'page-button' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.onclick     = () => { currentPage = i; renderTable(); renderPagination(); };
      pagination.appendChild(btn);
    }
  
    // Next
    const next = document.createElement('button');
    next.className = 'page-button';
    next.innerHTML = '<i class="bi bi-chevron-right"></i>';
    next.disabled  = currentPage === totalPages;
    next.onclick   = () => { currentPage++; renderTable(); renderPagination(); };
    pagination.appendChild(next);
  }
  
  // ─── MODAL & BUTTON HANDLERS ──────────────────────────────────────────────────
  function setupEventListeners() {
    // View button & row click
    reportsTableBody.addEventListener('click', e => {
      const btn = e.target.closest('.view-btn');
      if (btn) {
        const id = btn.dataset.id;
        openReportDetails(id);
        return;
      }
      const row = e.target.closest('.table-row');
      if (row) {
        openReportDetails(row.dataset.id);
      }
    });
  
    // Respond
    document.getElementById('respondReportBtn').addEventListener('click', () => {
      reportModalInstance.hide();
      const rpt = reports.find(r => r.id === currentReportId);
      document.getElementById('respondReportId').value    = rpt.id;
      document.getElementById('respondReportTitle').value = rpt.title;
      document.getElementById('responseText').value       = '';
      respondModalInstance.show();
    });
  
    // Delete
    document.getElementById('deleteReportBtn').addEventListener('click', () => {
      reportModalInstance.hide();
      deleteModalInstance.show();
    });
  
    // Resolve in Respond modal
    document.getElementById('resolveReportBtn').addEventListener('click', () => {
      const idx = reports.findIndex(r => r.id === currentReportId);
      if (idx > -1) {
        reports[idx].status = 'resolved';
        updateStats(); applyFilters(); renderTable(); renderPagination();
        showToast('Success', 'Report has been resolved', 'success');
        respondModalInstance.hide();
      }
    });
  
    // Confirm Delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      const idx = reports.findIndex(r => r.id === currentReportId);
      if (idx > -1) {
        reports.splice(idx, 1);
        localStorage.setItem('reports', JSON.stringify(reports));
        updateStats(); applyFilters(); renderTable(); renderPagination();
        showToast('Success', 'Report deleted successfully', 'success');
        deleteModalInstance.hide();
      }
    });
  
    // Cancel/close buttons
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
      btn.addEventListener('click', () => {
        reportModalInstance.hide();
        respondModalInstance.hide();
        deleteModalInstance.hide();
      });
    });
  
    // Other filters, tabs, sorting, debounce search...
    // (reuse your existing handlers for searchInput, dateFilterBtn, tabs, sortableHeaders)
  }
  
  // Populate & open the Details modal
  function openReportDetails(id) {
    const rpt = reports.find(r => r.id === id);
    if (!rpt) return console.error('Report not found:', id);
    currentReportId = id;
  
    document.getElementById('reportModalLabel').textContent = `Report Details – ${id}`;
    document.getElementById('reportId').value          = rpt.id;
    document.getElementById('reportTitle').value       = rpt.title;
    document.getElementById('reportCategory').value    = rpt.category.charAt(0).toUpperCase() + rpt.category.slice(1);
    document.getElementById('reportDescription').value = rpt.description;
    document.getElementById('reportStatus').value      = rpt.status.charAt(0).toUpperCase() + rpt.status.slice(1);
    document.getElementById('reportDate').value        = new Date(rpt.date).toLocaleString();
  
    reportModalInstance.show();
  }
  
  // ─── TOAST UTILITIES ───────────────────────────────────────────────────────────
  function showToast(title, message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    let icon = 'bi-info-circle-fill';
    if (type === 'success') icon = 'bi-check-circle-fill';
    if (type === 'warning') icon = 'bi-exclamation-triangle-fill';
    if (type === 'danger')  icon = 'bi-x-circle-fill';
  
    toast.innerHTML = `
      <div class="toast-icon ${type}"><i class="bi ${icon}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close"><i class="bi bi-x"></i></button>
    `;
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    const autoDismiss = setTimeout(() => dismissToast(toast), 5000);
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoDismiss);
      dismissToast(toast);
    });
  }
  function dismissToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }
  
  // ─── DEBOUNCE HELP ─────────────────────────────────────────────────────────────
  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  