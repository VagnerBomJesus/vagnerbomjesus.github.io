/* === Admin Panel Logic === */

(function () {
  'use strict';

  /* --- Config --- */
  var PASSWORD_HASH = '0cfeb89b1013588625f57bf3a405d0e5dd10f5cc3ad66d1c5bd613162f111e25';
  var PBKDF2_ITERATIONS = 100000;
  var PBKDF2_SALT = 'VBJ-admin-salt-2026';
  var MAX_ATTEMPTS = 5;
  var LOCKOUT_MINUTES = 15;
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  var MAX_TITLE_LEN = 200;
  var MAX_DESC_LEN = 500;
  var MAX_LINK_LEN = 2000;

  /* --- i18n Translations --- */
  var i18n = {
    en: {
      dashboard: 'Dashboard',
      projects: 'Projects',
      usefulLinks: 'Useful Links',
      activity: 'Activity',
      settings: 'Settings',
      administrator: 'Administrator',
      viewAll: 'View All',
      addProject: 'Add Project',
      addLink: 'Add Link',
      selectAll: 'Select all',
      deleteSelected: 'Delete Selected',
      filterProjects: 'Filter projects...',
      filterLinks: 'Filter links...',
      livePreview: 'Live Preview',
      previewHint: 'Updates in real-time as you make changes',
      activityLog: 'Activity Log',
      clearLog: 'Clear Log',
      noActivity: 'No activity yet.',
      noProjects: 'No projects yet',
      noUseful: 'No useful links yet',
      noPreview: 'No items to preview',
      addProjectHint: 'Click <strong>"+ Add Project"</strong> to create one or <strong>Import JSON</strong> to load existing data.',
      addLinkHint: 'Click <strong>"+ Add Link"</strong> to create one or <strong>Import JSON</strong> to load existing data.',
      language: 'Language',
      langDesc: 'Choose the editing language for your content.',
      theme: 'Theme',
      themeDesc: 'Toggle between light and dark mode.',
      toggleTheme: 'Toggle Theme',
      exportData: 'Export Data',
      exportDesc: 'Download all data as a JSON file.',
      exportJson: 'Export JSON',
      exportPdf: 'Export PDF',
      importData: 'Import Data',
      importDesc: 'Load data from a JSON file.',
      importJson: 'Import JSON',
      applyToSite: 'Apply to Site',
      applyDesc: 'Save current data to localStorage so the portfolio site uses it.',
      applyChanges: 'Apply Changes',
      clearData: 'Clear Data',
      clearDesc: 'Remove all locally saved data. The site will reload from the default JSON.',
      clearLocal: 'Clear Local Data',
      totalItems: 'Total Items',
      lastUpdate: 'Last Update',
      items: function (n) { return n + ' items'; },
      logout: 'Logout',
      password: 'Password',
      login: 'Login',
      addItem: 'Add Item',
      editItem: 'Edit Item',
      save: 'Save',
      cancel: 'Cancel',
      confirmDelete: 'Confirm Delete',
      confirmDeleteMsg: function (name) { return 'Are you sure you want to delete "' + name + '"?'; },
      delete: 'Delete'
    },
    pt: {
      dashboard: 'Painel',
      projects: 'Projetos',
      usefulLinks: 'Links &Uacute;teis',
      activity: 'Atividade',
      settings: 'Defini&ccedil;&otilde;es',
      administrator: 'Administrador',
      viewAll: 'Ver Todos',
      addProject: 'Adicionar Projeto',
      addLink: 'Adicionar Link',
      selectAll: 'Selecionar tudo',
      deleteSelected: 'Eliminar Selecionados',
      filterProjects: 'Filtrar projetos...',
      filterLinks: 'Filtrar links...',
      livePreview: 'Pr&eacute;-visualiza&ccedil;&atilde;o',
      previewHint: 'Atualiza em tempo real conforme as altera&ccedil;&otilde;es',
      activityLog: 'Registo de Atividade',
      clearLog: 'Limpar Registo',
      noActivity: 'Sem atividade ainda.',
      noProjects: 'Sem projetos ainda',
      noUseful: 'Sem links &uacute;teis ainda',
      noPreview: 'Sem itens para pr&eacute;-visualizar',
      addProjectHint: 'Clique em <strong>"+ Adicionar Projeto"</strong> para criar um ou <strong>Importar JSON</strong> para carregar dados.',
      addLinkHint: 'Clique em <strong>"+ Adicionar Link"</strong> para criar um ou <strong>Importar JSON</strong> para carregar dados.',
      language: 'Idioma',
      langDesc: 'Escolha o idioma de edi&ccedil;&atilde;o do conte&uacute;do.',
      theme: 'Tema',
      themeDesc: 'Alternar entre modo claro e escuro.',
      toggleTheme: 'Alternar Tema',
      exportData: 'Exportar Dados',
      exportDesc: 'Descarregar todos os dados como ficheiro JSON.',
      exportJson: 'Exportar JSON',
      exportPdf: 'Exportar PDF',
      importData: 'Importar Dados',
      importDesc: 'Carregar dados a partir de um ficheiro JSON.',
      importJson: 'Importar JSON',
      applyToSite: 'Aplicar ao Site',
      applyDesc: 'Guardar dados no localStorage para o site usar.',
      applyChanges: 'Aplicar Altera&ccedil;&otilde;es',
      clearData: 'Limpar Dados',
      clearDesc: 'Remover todos os dados locais. O site recarrega do JSON padr&atilde;o.',
      clearLocal: 'Limpar Dados Locais',
      totalItems: 'Total de Itens',
      lastUpdate: '&Uacute;ltima Atualiza&ccedil;&atilde;o',
      items: function (n) { return n + ' itens'; },
      logout: 'Sair',
      password: 'Palavra-passe',
      login: 'Entrar',
      addItem: 'Adicionar Item',
      editItem: 'Editar Item',
      save: 'Guardar',
      cancel: 'Cancelar',
      confirmDelete: 'Confirmar Elimina&ccedil;&atilde;o',
      confirmDeleteMsg: function (name) { return 'Tem a certeza que quer eliminar "' + name + '"?'; },
      delete: 'Eliminar'
    }
  };

  function t(key) { return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.en[key]) || key; }

  /* --- State --- */
  var data = null;
  var currentLang = 'en';
  var currentPage = 'dashboard';
  var currentCategory = 'projects'; // synced with page
  var deleteTarget = null;
  var sessionFailCount = 0;
  var tableFilterProjects = '';
  var tableFilterUseful = '';
  var selectedRowsProjects = {};
  var selectedRowsUseful = {};
  var activityLog = [];
  var autosaveTimer = null;

  // Undo/Redo
  var undoStack = [];
  var redoStack = [];
  var MAX_UNDO = 30;

  /* --- DOM refs --- */
  var loginScreen = document.getElementById('login-screen');
  var loginForm = document.getElementById('login-form');
  var loginPassword = document.getElementById('login-password');
  var loginError = document.getElementById('login-error');
  var adminPanel = document.getElementById('admin-panel');

  // Language dropdowns (flag-based, same as main page)
  var adminLangDropdown = document.getElementById('admin-lang-dropdown');
  var adminLangTrigger = document.getElementById('admin-lang-trigger');
  var adminLangMenu = document.getElementById('admin-lang-menu');
  var adminLangFlag = document.getElementById('admin-lang-flag');
  var adminLangLabel = document.getElementById('admin-lang-label');

  var settingsLangDropdown = document.getElementById('settings-lang-dropdown');
  var settingsLangTrigger = document.getElementById('settings-lang-trigger');
  var settingsLangMenu = document.getElementById('settings-lang-menu');
  var settingsLangFlag = document.getElementById('settings-lang-flag');
  var settingsLangLabel = document.getElementById('settings-lang-label');

  var themeBtn = document.getElementById('admin-theme');
  var settingsThemeBtn = document.getElementById('settings-theme-toggle');
  var btnLogout = document.getElementById('btn-logout');

  var btnAddProject = document.getElementById('btn-add-project');
  var btnAddUseful = document.getElementById('btn-add-useful');
  var btnImport = document.getElementById('btn-import');
  var btnExport = document.getElementById('btn-export');
  var btnExportPdf = document.getElementById('btn-export-pdf');
  var btnApply = document.getElementById('btn-apply');
  var btnClearLocal = document.getElementById('btn-clear-local');
  var btnUndo = document.getElementById('btn-undo');
  var btnRedo = document.getElementById('btn-redo');
  var btnUndoUseful = document.getElementById('btn-undo-useful');
  var btnRedoUseful = document.getElementById('btn-redo-useful');
  var fileImport = document.getElementById('file-import');

  // Per-category table elements
  var tables = {
    projects: {
      tbody: document.getElementById('items-tbody-projects'),
      table: document.getElementById('items-table-projects'),
      empty: document.getElementById('empty-state-projects'),
      search: document.getElementById('table-search-projects'),
      bulkAll: document.getElementById('bulk-select-all-projects'),
      theadCheck: document.getElementById('thead-check-projects'),
      bulkDelete: document.getElementById('btn-bulk-delete-projects'),
      preview: document.getElementById('preview-area-projects'),
      count: document.getElementById('count-projects')
    },
    useful: {
      tbody: document.getElementById('items-tbody-useful'),
      table: document.getElementById('items-table-useful'),
      empty: document.getElementById('empty-state-useful'),
      search: document.getElementById('table-search-useful'),
      bulkAll: document.getElementById('bulk-select-all-useful'),
      theadCheck: document.getElementById('thead-check-useful'),
      bulkDelete: document.getElementById('btn-bulk-delete-useful'),
      preview: document.getElementById('preview-area-useful'),
      count: document.getElementById('count-useful')
    }
  };

  var itemModal = document.getElementById('item-modal');
  var modalTitle = document.getElementById('modal-title');
  var itemForm = document.getElementById('item-form');
  var modalClose = document.getElementById('modal-close');
  var modalCancel = document.getElementById('modal-cancel');

  var deleteModal = document.getElementById('delete-modal');
  var deleteItemName = document.getElementById('delete-item-name');
  var deleteCancel = document.getElementById('delete-cancel');
  var deleteConfirm = document.getElementById('delete-confirm');
  var deleteModalClose = document.getElementById('delete-modal-close');

  var breadcrumbPage = document.getElementById('breadcrumb-page');
  var activityLogEl = document.getElementById('activity-log');
  var btnClearLog = document.getElementById('btn-clear-log');

  // Sidebar
  var sidebar = document.getElementById('admin-sidebar');
  var sidebarOverlay = document.getElementById('sidebar-overlay');
  var btnHamburger = document.getElementById('btn-hamburger');
  var btnCollapseSidebar = document.getElementById('btn-collapse-sidebar');
  var sidebarItems = document.querySelectorAll('.sidebar-item');

  // Dashboard previews
  var dashPreviewProjects = document.getElementById('dashboard-preview-projects');
  var dashPreviewUseful = document.getElementById('dashboard-preview-useful');

  /* ================================================================
     NAVIGATION
     ================================================================ */

  var pageLangKeys = {
    dashboard: 'dashboard',
    projects: 'projects',
    useful: 'usefulLinks',
    activity: 'activity',
    settings: 'settings'
  };

  function navigateTo(pageId) {
    currentPage = pageId;

    // Sync currentCategory
    if (pageId === 'projects') currentCategory = 'projects';
    else if (pageId === 'useful') currentCategory = 'useful';

    // Update pages
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }
    var target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    // Update sidebar active
    for (var j = 0; j < sidebarItems.length; j++) {
      sidebarItems[j].classList.toggle('active', sidebarItems[j].getAttribute('data-page') === pageId);
    }

    // Update breadcrumb
    breadcrumbPage.innerHTML = t(pageLangKeys[pageId] || pageId);

    // Close mobile sidebar
    closeSidebar();

    // Render relevant content
    if (data) {
      applyTranslations();
      if (pageId === 'dashboard') renderDashboard();
      else if (pageId === 'projects') renderCategoryPage('projects');
      else if (pageId === 'useful') renderCategoryPage('useful');
      else if (pageId === 'activity') renderActivityLog();
    }
  }

  // Sidebar click handlers
  for (var si = 0; si < sidebarItems.length; si++) {
    (function (item) {
      item.addEventListener('click', function () {
        navigateTo(item.getAttribute('data-page'));
      });
    })(sidebarItems[si]);
  }

  // "View All" buttons on dashboard
  var gotoBtns = document.querySelectorAll('.btn-goto');
  for (var gi = 0; gi < gotoBtns.length; gi++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        navigateTo(btn.getAttribute('data-goto'));
      });
    })(gotoBtns[gi]);
  }

  // Mobile sidebar toggle
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }

  btnHamburger.addEventListener('click', function () {
    if (sidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
  });

  sidebarOverlay.addEventListener('click', closeSidebar);

  /* --- Sidebar Collapse (desktop) --- */
  function toggleSidebarCollapse() {
    sidebar.classList.toggle('collapsed');
    var isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
  }

  btnCollapseSidebar.addEventListener('click', toggleSidebarCollapse);

  // Restore collapsed state
  if (localStorage.getItem('sidebarCollapsed') === '1') {
    sidebar.classList.add('collapsed');
  }

  /* ================================================================
     SECURITY UTILITIES
     ================================================================ */

  function pbkdf2Hash(password) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    ).then(function (key) {
      return crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: enc.encode(PBKDF2_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        key, 256
      );
    }).then(function (bits) {
      var arr = new Uint8Array(bits);
      var hex = '';
      for (var i = 0; i < arr.length; i++) {
        hex += ('00' + arr[i].toString(16)).slice(-2);
      }
      return hex;
    });
  }

  function constantTimeCompare(a, b) {
    if (a.length !== b.length) return false;
    var result = 0;
    for (var i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  function isValidURL(str) {
    try {
      var url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function sanitizeItem(item) {
    if (!item || typeof item !== 'object') return null;
    if (typeof item.title !== 'string' || typeof item.desc !== 'string' || typeof item.link !== 'string') return null;
    if (!isValidURL(item.link)) return null;
    return {
      title: item.title.substring(0, MAX_TITLE_LEN),
      desc: item.desc.substring(0, MAX_DESC_LEN),
      link: item.link.substring(0, MAX_LINK_LEN),
      type: (typeof item.type === 'string') ? item.type.substring(0, 20) : '',
      featured: !!item.featured,
      isNew: !!item.isNew
    };
  }

  function sanitizeItems(items) {
    if (!Array.isArray(items)) return [];
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var clean = sanitizeItem(items[i]);
      if (clean) result.push(clean);
    }
    return result;
  }

  function sanitizeData(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (!obj.en || !obj.pt) return null;
    if (!Array.isArray(obj.en.projects) || !Array.isArray(obj.en.useful)) return null;
    if (!Array.isArray(obj.pt.projects) || !Array.isArray(obj.pt.useful)) return null;
    return {
      en: { projects: sanitizeItems(obj.en.projects), useful: sanitizeItems(obj.en.useful) },
      pt: { projects: sanitizeItems(obj.pt.projects), useful: sanitizeItems(obj.pt.useful) }
    };
  }

  function setSafeHref(element, url) {
    if (isValidURL(url)) { element.href = url; }
    else { element.href = '#'; element.removeAttribute('target'); }
  }

  /* --- Undo / Redo --- */
  function saveUndoState() {
    undoStack.push(JSON.stringify(data));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
    updateUndoRedoBtns();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(data));
    data = JSON.parse(undoStack.pop());
    updateUndoRedoBtns();
    renderAll();
    showToast('Undo', 'info');
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(data));
    data = JSON.parse(redoStack.pop());
    updateUndoRedoBtns();
    renderAll();
    showToast('Redo', 'info');
  }

  function updateUndoRedoBtns() {
    var undoDisabled = !undoStack.length;
    var redoDisabled = !redoStack.length;
    btnUndo.disabled = undoDisabled;
    btnRedo.disabled = redoDisabled;
    btnUndoUseful.disabled = undoDisabled;
    btnRedoUseful.disabled = redoDisabled;
  }

  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);
  btnUndoUseful.addEventListener('click', undo);
  btnRedoUseful.addEventListener('click', redo);

  /* --- Activity Log --- */
  function logActivity(action, detail, tag) {
    var now = new Date();
    var time = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    activityLog.unshift({ time: time, action: action, detail: detail, tag: tag || 'edit' });
    if (activityLog.length > 50) activityLog.pop();
    renderActivityLog();
  }

  function renderActivityLog() {
    activityLogEl.innerHTML = '';
    if (!activityLog.length) {
      activityLogEl.innerHTML = '<p class="activity-empty">No activity yet.</p>';
      return;
    }
    activityLog.forEach(function (entry) {
      var div = document.createElement('div');
      div.className = 'activity-entry';
      div.innerHTML = '<span class="activity-time">' + entry.time + '</span>' +
        '<span class="activity-tag-' + entry.tag + '">[' + entry.tag.toUpperCase() + ']</span> ' +
        '<span class="activity-action">' + escapeHtml(entry.detail) + '</span>';
      activityLogEl.appendChild(div);
    });
  }

  btnClearLog.addEventListener('click', function () {
    activityLog = [];
    renderActivityLog();
  });

  /* --- Toast (enhanced) --- */
  function showToast(msg, type) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    type = type || 'success';
    var icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon toast-icon-animated"><i class="fas ' + (icons[type] || icons.info) + '"></i></span>' +
      '<span>' + msg + '</span>' +
      '<div class="toast-progress"></div>';
    document.body.appendChild(toast);

    requestAnimationFrame(function () { toast.classList.add('show'); });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 200);
    }, 2500);
  }

  /* --- Theme (slider) --- */
  function setTheme(dark) {
    var thumbIcon = themeBtn.querySelector('.toggle-thumb .toggle-icon');
    var bgIcon = themeBtn.querySelector('.toggle-bg-icon .toggle-icon');
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (thumbIcon) thumbIcon.className = 'fas fa-moon toggle-icon';
      if (bgIcon) bgIcon.className = 'fas fa-sun toggle-icon';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (thumbIcon) thumbIcon.className = 'fas fa-sun toggle-icon';
      if (bgIcon) bgIcon.className = 'fas fa-moon toggle-icon';
      localStorage.setItem('theme', 'light');
    }
  }

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  themeBtn.addEventListener('click', function () { setTheme(!isDark()); });
  settingsThemeBtn.addEventListener('click', function () { setTheme(!isDark()); });

  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
  }

  /* ================================================================
     AUTH
     ================================================================ */
  function getAttemptData() {
    try { var raw = localStorage.getItem('adminAttempts'); if (raw) return JSON.parse(raw); } catch (e) {}
    return { count: 0, lockedUntil: 0 };
  }
  function setAttemptData(obj) { localStorage.setItem('adminAttempts', JSON.stringify(obj)); }
  function clearAttemptData() { localStorage.removeItem('adminAttempts'); sessionFailCount = 0; }

  function isLockedOut() {
    if (sessionFailCount >= MAX_ATTEMPTS) return true;
    var ad = getAttemptData();
    if (ad.lockedUntil && Date.now() < ad.lockedUntil) return true;
    if (ad.lockedUntil && Date.now() >= ad.lockedUntil) setAttemptData({ count: 0, lockedUntil: 0 });
    return false;
  }

  function getRemainingLockTime() {
    var ad = getAttemptData();
    return ad.lockedUntil ? Math.max(0, Math.ceil((ad.lockedUntil - Date.now()) / 1000 / 60)) : 0;
  }

  function recordFailedAttempt() {
    sessionFailCount++;
    var ad = getAttemptData();
    ad.count++;
    if (ad.count >= MAX_ATTEMPTS) ad.lockedUntil = Date.now() + (LOCKOUT_MINUTES * 60 * 1000);
    setAttemptData(ad);
    return ad;
  }

  function getDelayForAttempt() {
    var count = Math.max(sessionFailCount, getAttemptData().count);
    return count === 0 ? 0 : Math.min(Math.pow(2, count - 1) * 1000, 10000);
  }

  function isLoggedIn() { return sessionStorage.getItem('adminAuth') === PASSWORD_HASH; }
  function showAdmin() { loginScreen.hidden = true; adminPanel.hidden = false; }
  function showLogin() { loginScreen.hidden = false; adminPanel.hidden = true; sessionStorage.removeItem('adminAuth'); }

  function updateLoginError(msg) { loginError.textContent = msg; loginError.hidden = false; }

  if (isLoggedIn()) { showAdmin(); loadData(); }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isLockedOut()) {
      var mins = getRemainingLockTime();
      if (sessionFailCount >= MAX_ATTEMPTS) updateLoginError('Session locked. Reload and wait ' + LOCKOUT_MINUTES + ' minutes.');
      else updateLoginError('Account locked. Try again in ' + (mins || 1) + ' minute(s).');
      loginPassword.value = '';
      return;
    }
    var pwd = loginPassword.value;
    var submitBtn = loginForm.querySelector('button[type="submit"]');
    var delay = getDelayForAttempt();
    submitBtn.disabled = true;
    loginPassword.disabled = true;

    setTimeout(function () {
      pbkdf2Hash(pwd).then(function (hash) {
        submitBtn.disabled = false;
        loginPassword.disabled = false;
        if (constantTimeCompare(hash, PASSWORD_HASH)) {
          clearAttemptData();
          sessionStorage.setItem('adminAuth', PASSWORD_HASH);
          loginError.hidden = true;
          loginPassword.value = '';
          showAdmin();
          loadData();
        } else {
          var ad = recordFailedAttempt();
          loginPassword.value = '';
          loginPassword.focus();
          if (ad.count >= MAX_ATTEMPTS || sessionFailCount >= MAX_ATTEMPTS) {
            updateLoginError('Too many attempts. Locked for ' + LOCKOUT_MINUTES + ' minutes.');
          } else {
            var remaining = MAX_ATTEMPTS - Math.max(ad.count, sessionFailCount);
            updateLoginError('Incorrect password. ' + remaining + ' attempt(s) remaining.');
          }
        }
      });
    }, delay);
  });

  btnLogout.addEventListener('click', showLogin);

  var sessionTimeout;
  function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    if (isLoggedIn()) {
      sessionTimeout = setTimeout(function () {
        showLogin();
        showToast('Session expired due to inactivity', 'warning');
      }, SESSION_TIMEOUT_MS);
    }
  }
  document.addEventListener('click', resetSessionTimeout);
  document.addEventListener('keydown', resetSessionTimeout);
  resetSessionTimeout();

  /* ================================================================
     DATA LOADING
     ================================================================ */
  function loadData() {
    var stored = localStorage.getItem('portfolioData');
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        var clean = sanitizeData(parsed);
        if (clean) { data = clean; renderAll(); return; }
        localStorage.removeItem('portfolioData');
      } catch (e) { localStorage.removeItem('portfolioData'); }
    }

    fetch('../data/data.json')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var clean = sanitizeData(json);
        data = clean || { en: { projects: [], useful: [] }, pt: { projects: [], useful: [] } };
        renderAll();
      })
      .catch(function () {
        data = { en: { projects: [], useful: [] }, pt: { projects: [], useful: [] } };
        renderAll();
      });
  }

  /* --- Language (flag dropdown, synced with main page) --- */
  var FLAG_EN_SVG = '<clipPath id="ae"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="af"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#ae)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#af)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g>';
  var FLAG_PT_SVG = '<rect width="600" height="400" fill="#DA291C"/><rect width="240" height="400" fill="#006600"/><circle cx="240" cy="200" r="70" fill="#FFCC00"/><circle cx="240" cy="200" r="55" fill="#DA291C"/><path d="M240,150 L240,250 M195,185 L285,185 M195,215 L285,215" stroke="#fff" stroke-width="4" fill="none"/>';

  function updateLangDropdownUI(lang) {
    var isEN = lang === 'en';
    var label = isEN ? 'EN' : 'PT';

    // Update trigger flag + label for both dropdowns
    [{ flag: adminLangFlag, lbl: adminLangLabel, menu: adminLangMenu },
     { flag: settingsLangFlag, lbl: settingsLangLabel, menu: settingsLangMenu }].forEach(function (d) {
      if (d.flag) {
        if (isEN) {
          d.flag.setAttribute('viewBox', '0 0 60 30');
          d.flag.setAttribute('height', '10');
          d.flag.innerHTML = FLAG_EN_SVG;
        } else {
          d.flag.setAttribute('viewBox', '0 0 600 400');
          d.flag.setAttribute('height', '13');
          d.flag.innerHTML = FLAG_PT_SVG;
        }
      }
      if (d.lbl) d.lbl.textContent = label;

      // Update active state on options
      if (d.menu) {
        var opts = d.menu.querySelectorAll('.lang-option');
        for (var i = 0; i < opts.length; i++) {
          opts[i].classList.toggle('active', opts[i].getAttribute('data-lang') === lang);
        }
      }
    });
  }

  function syncLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    updateLangDropdownUI(lang);
    renderAll();
  }

  // Toggle dropdown open/close
  function setupLangDropdown(dropdown, trigger, menu) {
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      // Close the other dropdown
      if (dropdown === adminLangDropdown) settingsLangDropdown.classList.remove('open');
      else adminLangDropdown.classList.remove('open');
      dropdown.classList.toggle('open');
    });

    var opts = menu.querySelectorAll('.lang-option');
    for (var i = 0; i < opts.length; i++) {
      opts[i].addEventListener('click', function () {
        syncLang(this.getAttribute('data-lang'));
        dropdown.classList.remove('open');
      });
    }
  }

  setupLangDropdown(adminLangDropdown, adminLangTrigger, adminLangMenu);
  setupLangDropdown(settingsLangDropdown, settingsLangTrigger, settingsLangMenu);

  // Close dropdowns on outside click
  document.addEventListener('click', function (e) {
    if (!adminLangDropdown.contains(e.target)) adminLangDropdown.classList.remove('open');
    if (!settingsLangDropdown.contains(e.target)) settingsLangDropdown.classList.remove('open');
  });

  // Restore saved language (synced with main page via localStorage)
  var savedLang = localStorage.getItem('lang') || 'en';
  currentLang = savedLang;
  updateLangDropdownUI(savedLang);

  /* --- Search / Filter --- */
  tables.projects.search.addEventListener('input', function () {
    tableFilterProjects = tables.projects.search.value.trim().toLowerCase();
    renderTable('projects');
  });

  tables.useful.search.addEventListener('input', function () {
    tableFilterUseful = tables.useful.search.value.trim().toLowerCase();
    renderTable('useful');
  });

  /* --- Bulk Select --- */
  function getSelectedRows(cat) {
    return cat === 'projects' ? selectedRowsProjects : selectedRowsUseful;
  }

  function setSelectedRows(cat, val) {
    if (cat === 'projects') selectedRowsProjects = val;
    else selectedRowsUseful = val;
  }

  function updateBulkUI(cat) {
    var sel = getSelectedRows(cat);
    var t = tables[cat];
    var count = Object.keys(sel).filter(function (k) { return sel[k]; }).length;
    t.bulkDelete.hidden = count === 0;
    t.bulkAll.checked = false;
    if (t.theadCheck) t.theadCheck.checked = false;
  }

  ['projects', 'useful'].forEach(function (cat) {
    var t = tables[cat];

    t.bulkAll.addEventListener('change', function () {
      var items = data ? (data[currentLang][cat] || []) : [];
      var sel = {};
      for (var i = 0; i < items.length; i++) sel[i] = t.bulkAll.checked;
      setSelectedRows(cat, sel);
      if (t.theadCheck) t.theadCheck.checked = t.bulkAll.checked;
      renderTable(cat);
      updateBulkUI(cat);
    });

    if (t.theadCheck) {
      t.theadCheck.addEventListener('change', function () {
        t.bulkAll.checked = t.theadCheck.checked;
        t.bulkAll.dispatchEvent(new Event('change'));
      });
    }

    t.bulkDelete.addEventListener('click', function () {
      var sel = getSelectedRows(cat);
      var indices = Object.keys(sel).filter(function (k) { return sel[k]; }).map(Number).sort(function (a, b) { return b - a; });
      if (!indices.length) return;
      saveUndoState();
      indices.forEach(function (idx) {
        data.en[cat].splice(idx, 1);
        data.pt[cat].splice(idx, 1);
      });
      setSelectedRows(cat, {});
      updateBulkUI(cat);
      renderAll();
      logActivity('delete', 'Deleted ' + indices.length + ' items from ' + cat, 'delete');
      showToast(indices.length + ' items deleted', 'success');
    });
  });

  /* --- Render All --- */
  function renderAll() {
    if (!data) return;
    applyTranslations();
    updateDashboardStats();
    updateBadges();
    updateCounts();

    // Render based on current page
    if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'projects') renderCategoryPage('projects');
    else if (currentPage === 'useful') renderCategoryPage('useful');
    else if (currentPage === 'activity') renderActivityLog();
  }

  function applyTranslations() {
    // Sidebar nav labels + tooltips
    var sidebarMap = { dashboard: 'dashboard', projects: 'projects', useful: 'usefulLinks', activity: 'activity', settings: 'settings' };
    for (var si = 0; si < sidebarItems.length; si++) {
      var pg = sidebarItems[si].getAttribute('data-page');
      var lbl = sidebarItems[si].querySelector('.sidebar-label');
      if (lbl && sidebarMap[pg]) {
        var translated = t(sidebarMap[pg]);
        lbl.innerHTML = translated;
        sidebarItems[si].setAttribute('data-tooltip', translated);
      }
    }

    // Collapse button label
    var collapseLabel = document.querySelector('.sidebar-collapse-label');
    if (collapseLabel) collapseLabel.textContent = currentLang === 'pt' ? 'Minimizar' : 'Collapse';

    // Sidebar shortcuts labels
    var shortcutLabels = document.querySelectorAll('.sidebar-shortcut-label');
    var shortcutKeys = currentLang === 'pt'
      ? ['Novo', 'Guardar', 'Desfazer', 'Refazer']
      : ['New', 'Save', 'Undo', 'Redo'];
    for (var ski = 0; ski < shortcutLabels.length && ski < shortcutKeys.length; ski++) {
      shortcutLabels[ski].textContent = shortcutKeys[ski];
    }

    // Sidebar profile role
    var roleEl = document.querySelector('.sidebar-profile-role');
    if (roleEl) roleEl.textContent = t('administrator');

    // Breadcrumb page label
    var pageLabelMap = { dashboard: 'dashboard', projects: 'projects', useful: 'usefulLinks', activity: 'activity', settings: 'settings' };
    if (breadcrumbPage && pageLabelMap[currentPage]) breadcrumbPage.innerHTML = t(pageLabelMap[currentPage]);

    // Page titles
    var pageTitleDash = document.querySelector('#page-dashboard > .page-title');
    if (pageTitleDash) pageTitleDash.innerHTML = t('dashboard');

    // Projects page
    var projHeading = document.querySelector('#page-projects .admin-heading');
    if (projHeading) projHeading.innerHTML = t('projects');
    if (btnAddProject) btnAddProject.innerHTML = '<i class="fas fa-plus"></i> ' + t('addProject');
    var projSearchEl = tables.projects.search;
    if (projSearchEl) projSearchEl.placeholder = t('filterProjects');
    var projBulkLabel = document.querySelector('#page-projects .bulk-label');
    if (projBulkLabel) projBulkLabel.textContent = t('selectAll');
    var projEmptyText = document.querySelector('#empty-state-projects .empty-state-text');
    if (projEmptyText) projEmptyText.textContent = t('noProjects');
    var projEmptyHint = document.querySelector('#empty-state-projects .empty-state-hint');
    if (projEmptyHint) projEmptyHint.innerHTML = t('addProjectHint');

    // Useful page
    var usefulHeading = document.querySelector('#page-useful .admin-heading');
    if (usefulHeading) usefulHeading.innerHTML = t('usefulLinks');
    if (btnAddUseful) btnAddUseful.innerHTML = '<i class="fas fa-plus"></i> ' + t('addLink');
    var usefulSearchEl = tables.useful.search;
    if (usefulSearchEl) usefulSearchEl.placeholder = t('filterLinks');
    var usefulBulkLabel = document.querySelector('#page-useful .bulk-label');
    if (usefulBulkLabel) usefulBulkLabel.textContent = t('selectAll');
    var usefulEmptyText = document.querySelector('#empty-state-useful .empty-state-text');
    if (usefulEmptyText) usefulEmptyText.textContent = t('noUseful');
    var usefulEmptyHint = document.querySelector('#empty-state-useful .empty-state-hint');
    if (usefulEmptyHint) usefulEmptyHint.innerHTML = t('addLinkHint');

    // Preview headers
    var previewTitles = document.querySelectorAll('.preview-title');
    for (var pi = 0; pi < previewTitles.length; pi++) {
      previewTitles[pi].innerHTML = '<i class="fas fa-eye"></i> ' + t('livePreview');
    }
    var previewHints = document.querySelectorAll('.preview-hint');
    for (var phi = 0; phi < previewHints.length; phi++) {
      previewHints[phi].innerHTML = t('previewHint');
    }

    // Activity
    var actTitle = document.querySelector('#page-activity .page-title');
    if (actTitle) actTitle.innerHTML = '<i class="fas fa-history"></i> ' + t('activityLog');
    if (btnClearLog) btnClearLog.textContent = t('clearLog');

    // Dashboard section titles
    var dashProjTitle = document.querySelector('#page-dashboard .dashboard-section:first-of-type .dashboard-section-title');
    if (dashProjTitle) dashProjTitle.innerHTML = '<i class="fas fa-project-diagram"></i> ' + t('projects');
    var dashUsefulTitle = document.querySelector('#page-dashboard .dashboard-section:last-of-type .dashboard-section-title');
    if (dashUsefulTitle) dashUsefulTitle.innerHTML = '<i class="fas fa-link"></i> ' + t('usefulLinks');
    var viewAllBtns = document.querySelectorAll('.btn-goto');
    for (var vi = 0; vi < viewAllBtns.length; vi++) {
      viewAllBtns[vi].textContent = t('viewAll');
    }

    // Dashboard stat labels
    var statLabels = document.querySelectorAll('.stat-card-label');
    if (statLabels.length >= 4) {
      statLabels[0].innerHTML = t('projects');
      statLabels[1].innerHTML = t('usefulLinks');
      statLabels[2].innerHTML = t('totalItems');
      statLabels[3].innerHTML = t('lastUpdate');
    }

    // Settings page
    var settingsTitle = document.querySelector('#page-settings > .page-title');
    if (settingsTitle) settingsTitle.innerHTML = t('settings');

    // Settings cards - update titles and descriptions
    var settingsCards = document.querySelectorAll('#page-settings .settings-card');
    var cardTranslations = [
      { title: 'language', desc: 'langDesc', icon: 'fa-language' },
      { title: 'theme', desc: 'themeDesc', icon: 'fa-palette' },
      { title: 'exportData', desc: 'exportDesc', icon: 'fa-file-export' },
      { title: 'importData', desc: 'importDesc', icon: 'fa-file-import' },
      { title: 'applyToSite', desc: 'applyDesc', icon: 'fa-check-circle' },
      { title: 'clearData', desc: 'clearDesc', icon: 'fa-trash-alt' }
    ];
    for (var ci = 0; ci < settingsCards.length && ci < cardTranslations.length; ci++) {
      var cardTitle = settingsCards[ci].querySelector('.settings-card-title');
      var cardDesc = settingsCards[ci].querySelector('.settings-card-desc');
      if (cardTitle) cardTitle.innerHTML = '<i class="fas ' + cardTranslations[ci].icon + '"></i> ' + t(cardTranslations[ci].title);
      if (cardDesc) cardDesc.innerHTML = t(cardTranslations[ci].desc);
    }

    // Settings buttons
    if (settingsThemeBtn) settingsThemeBtn.innerHTML = '<i class="fas fa-adjust"></i> ' + t('toggleTheme');
    if (btnExport) btnExport.innerHTML = '<i class="fas fa-file-export"></i> ' + t('exportJson');
    if (btnExportPdf) btnExportPdf.innerHTML = '<i class="fas fa-file-pdf"></i> ' + t('exportPdf');
    if (btnImport) btnImport.innerHTML = '<i class="fas fa-file-import"></i> ' + t('importJson');
    if (btnApply) btnApply.innerHTML = '<i class="fas fa-check"></i> ' + t('applyChanges');
    if (btnClearLocal) btnClearLocal.innerHTML = '<i class="fas fa-trash"></i> ' + t('clearLocal');

    // Logout button
    if (btnLogout) btnLogout.textContent = t('logout');
  }

  function updateDashboardStats() {
    var langData = data[currentLang];
    var pCount = langData.projects ? langData.projects.length : 0;
    var uCount = langData.useful ? langData.useful.length : 0;
    document.getElementById('stat-projects').textContent = pCount;
    document.getElementById('stat-useful').textContent = uCount;
    document.getElementById('stat-total').textContent = pCount + uCount;

    var stored = localStorage.getItem('portfolioDataUpdated');
    document.getElementById('stat-updated').textContent = stored || '--';
  }

  function updateBadges() {
    var langData = data[currentLang];
    document.getElementById('badge-projects').textContent = langData.projects ? langData.projects.length : 0;
    document.getElementById('badge-useful').textContent = langData.useful ? langData.useful.length : 0;
  }

  function updateCounts() {
    var langData = data[currentLang];
    tables.projects.count.textContent = (langData.projects ? langData.projects.length : 0) + ' items';
    tables.useful.count.textContent = (langData.useful ? langData.useful.length : 0) + ' items';
  }

  /* --- Render Dashboard --- */
  function renderDashboard() {
    if (!data) return;
    renderPreviewInto(dashPreviewProjects, 'projects', 5);
    renderPreviewInto(dashPreviewUseful, 'useful', 5);
  }

  /* --- Render Category Page --- */
  function renderCategoryPage(cat) {
    renderTable(cat);
    renderPreviewInto(tables[cat].preview, cat);
  }

  /* --- Render Table --- */
  function renderTable(cat) {
    if (!data) return;
    var t = tables[cat];
    var items = data[currentLang][cat] || [];
    var filter = cat === 'projects' ? tableFilterProjects : tableFilterUseful;
    var selectedRows = getSelectedRows(cat);

    while (t.tbody.firstChild) t.tbody.removeChild(t.tbody.firstChild);

    var filtered = items.map(function (item, idx) { return { item: item, idx: idx }; });
    if (filter) {
      filtered = filtered.filter(function (o) {
        return o.item.title.toLowerCase().indexOf(filter) !== -1 ||
               o.item.desc.toLowerCase().indexOf(filter) !== -1;
      });
    }

    if (filtered.length === 0) {
      t.empty.hidden = false;
      t.table.hidden = true;
      return;
    }

    t.empty.hidden = true;
    t.table.hidden = false;

    filtered.forEach(function (o) {
      var item = o.item;
      var idx = o.idx;
      var tr = document.createElement('tr');
      tr.setAttribute('draggable', 'true');
      tr.setAttribute('data-idx', idx);
      if (selectedRows[idx]) tr.classList.add('selected');

      // Drag & Drop
      tr.addEventListener('dragstart', function (e) {
        tr.classList.add('dragging');
        e.dataTransfer.setData('text/plain', idx);
        e.dataTransfer.setData('text/category', cat);
      });
      tr.addEventListener('dragend', function () { tr.classList.remove('dragging'); });
      tr.addEventListener('dragover', function (e) { e.preventDefault(); tr.classList.add('drag-over'); });
      tr.addEventListener('dragleave', function () { tr.classList.remove('drag-over'); });
      tr.addEventListener('drop', function (e) {
        e.preventDefault();
        tr.classList.remove('drag-over');
        var fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        var toIdx = idx;
        if (fromIdx !== toIdx) {
          saveUndoState();
          ['en', 'pt'].forEach(function (lang) {
            var arr = data[lang][cat];
            var moved = arr.splice(fromIdx, 1)[0];
            arr.splice(toIdx, 0, moved);
          });
          logActivity('move', 'Reordered item to position ' + (toIdx + 1), 'move');
          renderAll();
        }
      });

      // Checkbox
      var tdCheck = document.createElement('td');
      tdCheck.className = 'col-check';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!selectedRows[idx];
      cb.addEventListener('change', function () {
        selectedRows[idx] = cb.checked;
        tr.classList.toggle('selected', cb.checked);
        updateBulkUI(cat);
      });
      tdCheck.appendChild(cb);
      tr.appendChild(tdCheck);

      var tdOrder = document.createElement('td');
      tdOrder.className = 'col-order';
      tdOrder.textContent = idx + 1;
      tr.appendChild(tdOrder);

      // Title (inline editable)
      var tdTitle = document.createElement('td');
      tdTitle.className = 'col-title';
      tdTitle.textContent = item.title;
      tdTitle.addEventListener('dblclick', function () { startInlineEdit(tdTitle, currentLang, cat, idx, 'title'); });
      tr.appendChild(tdTitle);

      // Desc (inline editable)
      var tdDesc = document.createElement('td');
      tdDesc.className = 'col-desc';
      tdDesc.textContent = item.desc;
      tdDesc.addEventListener('dblclick', function () { startInlineEdit(tdDesc, currentLang, cat, idx, 'desc'); });
      tr.appendChild(tdDesc);

      var tdLink = document.createElement('td');
      tdLink.className = 'col-link td-link';
      var a = document.createElement('a');
      setSafeHref(a, item.link);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = item.link;
      tdLink.appendChild(a);
      tr.appendChild(tdLink);

      var tdActions = document.createElement('td');
      tdActions.className = 'col-actions';
      var actionsDiv = document.createElement('div');
      actionsDiv.className = 'row-actions';

      // Duplicate
      var btnDup = createIconBtn('fa-copy', 'Duplicate');
      btnDup.addEventListener('click', (function (i, c) {
        return function () { duplicateItem(i, c); };
      })(idx, cat));
      actionsDiv.appendChild(btnDup);

      var btnUp = createIconBtn('fa-chevron-up', 'Move up', 'btn-icon-up');
      btnUp.disabled = idx === 0;
      btnUp.addEventListener('click', (function (i, c) { return function () { moveItem(i, -1, c); }; })(idx, cat));
      actionsDiv.appendChild(btnUp);

      var btnDown = createIconBtn('fa-chevron-down', 'Move down', 'btn-icon-down');
      btnDown.disabled = idx === items.length - 1;
      btnDown.addEventListener('click', (function (i, c) { return function () { moveItem(i, 1, c); }; })(idx, cat));
      actionsDiv.appendChild(btnDown);

      var btnEdit = createIconBtn('fa-pen', 'Edit');
      btnEdit.addEventListener('click', (function (i, c) { return function () { openEditModal(i, c); }; })(idx, cat));
      actionsDiv.appendChild(btnEdit);

      var btnDel = createIconBtn('fa-trash', 'Delete', 'btn-icon-danger');
      btnDel.addEventListener('click', (function (i, c) { return function () { openDeleteModal(i, c); }; })(idx, cat));
      actionsDiv.appendChild(btnDel);

      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);
      t.tbody.appendChild(tr);
    });
  }

  function createIconBtn(icon, title, extraClass) {
    var btn = document.createElement('button');
    btn.className = 'btn-icon' + (extraClass ? ' ' + extraClass : '');
    btn.title = title;
    btn.innerHTML = '<i class="fas ' + icon + '"></i>';
    return btn;
  }

  /* --- Inline Edit --- */
  function startInlineEdit(td, lang, cat, idx, field) {
    if (td.querySelector('.inline-edit')) return;
    var original = data[lang][cat][idx][field];
    var input = document.createElement('input');
    input.className = 'inline-edit';
    input.value = original;
    td.textContent = '';
    td.appendChild(input);
    input.focus();
    input.select();

    function save() {
      var val = input.value.trim();
      if (val && val !== original) {
        saveUndoState();
        data[lang][cat][idx][field] = val.substring(0, field === 'title' ? MAX_TITLE_LEN : MAX_DESC_LEN);
        logActivity('edit', 'Inline edited ' + field + ': "' + val.substring(0, 30) + '"', 'edit');
        renderAll();
      } else {
        td.textContent = original;
      }
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { td.textContent = original; }
    });
  }

  /* --- Duplicate Item --- */
  function duplicateItem(index, cat) {
    saveUndoState();
    ['en', 'pt'].forEach(function (lang) {
      var arr = data[lang][cat];
      var copy = JSON.parse(JSON.stringify(arr[index]));
      copy.title = copy.title + ' (copy)';
      arr.splice(index + 1, 0, copy);
    });
    logActivity('add', 'Duplicated item at position ' + (index + 1), 'add');
    renderAll();
    showToast('Item duplicated', 'success');
  }

  /* --- Move Item --- */
  function moveItem(index, direction, cat) {
    var items = data[currentLang][cat];
    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    saveUndoState();
    ['en', 'pt'].forEach(function (lang) {
      var arr = data[lang][cat];
      var temp = arr[index];
      arr[index] = arr[newIndex];
      arr[newIndex] = temp;
    });

    logActivity('move', 'Moved item ' + (index + 1) + ' → ' + (newIndex + 1), 'move');
    renderAll();
  }

  /* --- Preview Rendering --- */
  function renderPreviewInto(container, cat, limit) {
    if (!data || !container) return;
    while (container.firstChild) container.removeChild(container.firstChild);

    var items = data[currentLang][cat] || [];
    if (limit) items = items.slice(0, limit);

    if (items.length === 0) {
      var emptyP = document.createElement('p');
      emptyP.style.cssText = 'color: var(--text-muted); font-size: 0.85rem;';
      emptyP.textContent = 'No items to preview';
      container.appendChild(emptyP);
      return;
    }

    items.forEach(function (item) {
      var aEl = document.createElement('a');
      setSafeHref(aEl, item.link);
      aEl.target = '_blank';
      aEl.rel = 'noopener noreferrer';
      aEl.className = 'resource-link';

      var card = document.createElement('div');
      card.className = 'resource-card' + (item.featured ? ' resource-featured' : '');

      var titleRow = document.createElement('div');
      titleRow.className = 'resource-title-row';

      var titleEl = document.createElement('div');
      titleEl.className = 'resource-title';
      titleEl.textContent = item.title;
      titleRow.appendChild(titleEl);

      if (item.isNew) {
        var newBadge = document.createElement('span');
        newBadge.className = 'resource-new-badge';
        newBadge.textContent = 'NEW';
        titleRow.appendChild(newBadge);
      }

      if (item.type) {
        var badge = document.createElement('span');
        badge.className = 'resource-type-badge';
        badge.setAttribute('data-type', item.type.toLowerCase());
        badge.textContent = item.type.toUpperCase();
        titleRow.appendChild(badge);
      }

      var desc = document.createElement('div');
      desc.className = 'resource-desc';
      desc.textContent = item.desc;

      card.appendChild(titleRow);
      card.appendChild(desc);
      aEl.appendChild(card);
      container.appendChild(aEl);
    });
  }

  /* --- Add / Edit Modal --- */
  btnAddProject.addEventListener('click', function () { openAddModal('projects'); });
  btnAddUseful.addEventListener('click', function () { openAddModal('useful'); });

  function openAddModal(cat) {
    modalTitle.textContent = cat === 'projects' ? 'Add Project' : 'Add Link';
    var draft = loadDraft();
    document.getElementById('field-title-en').value = draft ? draft.titleEn : '';
    document.getElementById('field-title-pt').value = draft ? draft.titlePt : '';
    document.getElementById('field-desc-en').value = draft ? draft.descEn : '';
    document.getElementById('field-desc-pt').value = draft ? draft.descPt : '';
    document.getElementById('field-link').value = draft ? draft.link : '';
    document.getElementById('field-type').value = draft ? draft.type : '';
    document.getElementById('field-category').value = cat;
    document.getElementById('field-featured').checked = draft ? draft.featured : false;
    document.getElementById('field-isnew').checked = draft ? draft.isNew : false;
    document.getElementById('field-edit-index').value = '-1';
    document.getElementById('field-edit-cat').value = '';
    clearFieldErrors();
    updateAllCounters();
    itemModal.hidden = false;
  }

  function openEditModal(index, cat) {
    modalTitle.textContent = 'Edit Item';
    var enItem = data.en[cat][index] || {};
    var ptItem = data.pt[cat][index] || {};

    document.getElementById('field-title-en').value = enItem.title || '';
    document.getElementById('field-title-pt').value = ptItem.title || '';
    document.getElementById('field-desc-en').value = enItem.desc || '';
    document.getElementById('field-desc-pt').value = ptItem.desc || '';
    document.getElementById('field-link').value = enItem.link || '';
    document.getElementById('field-type').value = enItem.type || '';
    document.getElementById('field-category').value = cat;
    document.getElementById('field-featured').checked = enItem.featured || false;
    document.getElementById('field-isnew').checked = enItem.isNew || false;
    document.getElementById('field-edit-index').value = index;
    document.getElementById('field-edit-cat').value = cat;
    clearFieldErrors();
    updateAllCounters();
    itemModal.hidden = false;
  }

  function closeItemModal() {
    itemModal.hidden = true;
    clearDraft();
  }

  modalClose.addEventListener('click', closeItemModal);
  modalCancel.addEventListener('click', closeItemModal);
  itemModal.addEventListener('click', function (e) { if (e.target === itemModal) closeItemModal(); });

  /* --- Character Counters --- */
  var counterFields = [
    { input: 'field-title-en', counter: 'counter-title-en', max: MAX_TITLE_LEN },
    { input: 'field-title-pt', counter: 'counter-title-pt', max: MAX_TITLE_LEN },
    { input: 'field-desc-en', counter: 'counter-desc-en', max: MAX_DESC_LEN },
    { input: 'field-desc-pt', counter: 'counter-desc-pt', max: MAX_DESC_LEN }
  ];

  counterFields.forEach(function (cf) {
    var input = document.getElementById(cf.input);
    var counter = document.getElementById(cf.counter);
    if (input && counter) {
      input.addEventListener('input', function () {
        var len = input.value.length;
        counter.textContent = len;
        var parent = counter.parentElement;
        parent.classList.remove('near-limit', 'at-limit');
        if (len >= cf.max) parent.classList.add('at-limit');
        else if (len >= cf.max * 0.8) parent.classList.add('near-limit');
        scheduleDraftSave();
      });
    }
  });

  function updateAllCounters() {
    counterFields.forEach(function (cf) {
      var input = document.getElementById(cf.input);
      var counter = document.getElementById(cf.counter);
      if (input && counter) {
        counter.textContent = input.value.length;
        var parent = counter.parentElement;
        parent.classList.remove('near-limit', 'at-limit');
      }
    });
  }

  /* --- Validation Visual --- */
  function clearFieldErrors() {
    var invalids = itemForm.querySelectorAll('.field-invalid');
    for (var i = 0; i < invalids.length; i++) invalids[i].classList.remove('field-invalid');
    var linkErr = document.getElementById('link-error');
    if (linkErr) linkErr.hidden = true;
  }

  /* --- Auto-save Draft --- */
  function scheduleDraftSave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(function () {
      saveDraft();
      var indicator = document.getElementById('form-autosave');
      if (indicator) {
        indicator.hidden = false;
        setTimeout(function () { indicator.hidden = true; }, 2000);
      }
    }, 1500);
  }

  function saveDraft() {
    var draft = {
      titleEn: document.getElementById('field-title-en').value,
      titlePt: document.getElementById('field-title-pt').value,
      descEn: document.getElementById('field-desc-en').value,
      descPt: document.getElementById('field-desc-pt').value,
      link: document.getElementById('field-link').value,
      type: document.getElementById('field-type').value,
      featured: document.getElementById('field-featured').checked,
      isNew: document.getElementById('field-isnew').checked
    };
    sessionStorage.setItem('adminDraft', JSON.stringify(draft));
  }

  function loadDraft() {
    try {
      var raw = sessionStorage.getItem('adminDraft');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearDraft() { sessionStorage.removeItem('adminDraft'); }

  // Auto-save on all form inputs
  ['field-title-en', 'field-title-pt', 'field-desc-en', 'field-desc-pt', 'field-link'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', scheduleDraftSave);
  });

  /* --- Form Submit --- */
  itemForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearFieldErrors();

    var titleEn = document.getElementById('field-title-en').value.trim().substring(0, MAX_TITLE_LEN);
    var titlePt = document.getElementById('field-title-pt').value.trim().substring(0, MAX_TITLE_LEN);
    var descEn = document.getElementById('field-desc-en').value.trim().substring(0, MAX_DESC_LEN);
    var descPt = document.getElementById('field-desc-pt').value.trim().substring(0, MAX_DESC_LEN);
    var link = document.getElementById('field-link').value.trim().substring(0, MAX_LINK_LEN);
    var type = document.getElementById('field-type').value;
    var category = document.getElementById('field-category').value;
    var featured = document.getElementById('field-featured').checked;
    var isNew = document.getElementById('field-isnew').checked;
    var editIndex = parseInt(document.getElementById('field-edit-index').value, 10);
    var editCat = document.getElementById('field-edit-cat').value;

    // Validate URL with visual feedback
    if (!isValidURL(link)) {
      document.getElementById('field-link').classList.add('field-invalid');
      var linkErr = document.getElementById('link-error');
      if (linkErr) linkErr.hidden = false;
      showToast('Invalid URL. Only http/https allowed.', 'error');
      return;
    }

    if (category !== 'projects' && category !== 'useful') {
      showToast('Invalid category', 'error');
      return;
    }

    saveUndoState();

    var enItem = { title: titleEn, desc: descEn, link: link, type: type, featured: featured, isNew: isNew };
    var ptItem = { title: titlePt, desc: descPt, link: link, type: type, featured: featured, isNew: isNew };

    if (editIndex >= 0 && editCat) {
      if (editCat === category) {
        data.en[category][editIndex] = enItem;
        data.pt[category][editIndex] = ptItem;
      } else {
        data.en[editCat].splice(editIndex, 1);
        data.pt[editCat].splice(editIndex, 1);
        data.en[category].push(enItem);
        data.pt[category].push(ptItem);
      }
      logActivity('edit', 'Edited "' + titleEn + '"', 'edit');
      showToast('Item updated', 'success');
    } else {
      data.en[category].push(enItem);
      data.pt[category].push(ptItem);
      logActivity('add', 'Added "' + titleEn + '"', 'add');
      showToast('Item added', 'success');
    }

    // Navigate to the category page if not already there
    if (currentPage !== category) {
      navigateTo(category);
    }

    closeItemModal();
    renderAll();
  });

  /* --- Delete Modal --- */
  function openDeleteModal(index, cat) {
    deleteTarget = { category: cat, index: index };
    var item = data[currentLang][cat][index];
    deleteItemName.textContent = item.title;
    deleteModal.hidden = false;
  }

  function closeDeleteModal() { deleteModal.hidden = true; deleteTarget = null; }

  deleteModalClose.addEventListener('click', closeDeleteModal);
  deleteCancel.addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', function (e) { if (e.target === deleteModal) closeDeleteModal(); });

  deleteConfirm.addEventListener('click', function () {
    if (!deleteTarget) return;
    saveUndoState();
    var name = data[currentLang][deleteTarget.category][deleteTarget.index].title;
    data.en[deleteTarget.category].splice(deleteTarget.index, 1);
    data.pt[deleteTarget.category].splice(deleteTarget.index, 1);
    closeDeleteModal();
    logActivity('delete', 'Deleted "' + name + '"', 'delete');
    renderAll();
    showToast('Item deleted', 'success');
  });

  /* --- Export JSON --- */
  btnExport.addEventListener('click', function () {
    if (!data) return;
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('JSON exported', 'success');
  });

  /* --- Export PDF --- */
  btnExportPdf.addEventListener('click', function () {
    if (!data) return;
    // Export both categories
    var cats = ['projects', 'useful'];
    var win = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><title>Portfolio Data - VBJ</title>' +
      '<style>body{font-family:Arial,sans-serif;padding:40px;color:#111;}' +
      'h1{font-size:1.5rem;border-bottom:2px solid #1e3a5f;padding-bottom:8px;color:#1e3a5f;}' +
      'h2{font-size:1.1rem;color:#1e3a5f;margin-top:24px;}' +
      'table{width:100%;border-collapse:collapse;margin-top:8px;}' +
      'th{background:#1e3a5f;color:#fff;padding:8px 12px;text-align:left;font-size:0.8rem;}' +
      'td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:0.85rem;}' +
      'tr:nth-child(even){background:#f9fafb;}' +
      '.footer{margin-top:24px;font-size:0.7rem;color:#999;text-align:center;}</style></head><body>' +
      '<h1>Portfolio Data (' + currentLang.toUpperCase() + ')</h1>';

    cats.forEach(function (cat) {
      var items = data[currentLang][cat] || [];
      var title = cat === 'projects' ? 'Projects' : 'Useful Links';
      html += '<h2>' + title + ' (' + items.length + ')</h2>';
      html += '<table><tr><th>#</th><th>Title</th><th>Description</th><th>Link</th></tr>';
      items.forEach(function (item, i) {
        html += '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(item.title) + '</td><td>' + escapeHtml(item.desc) + '</td><td>' + escapeHtml(item.link) + '</td></tr>';
      });
      html += '</table>';
    });

    html += '<div class="footer">Generated from VBJ Admin Panel &middot; ' + new Date().toLocaleDateString() + '</div>' +
      '<script>window.print();<\/script></body></html>';

    win.document.write(html);
    win.document.close();
    showToast('PDF export ready', 'info');
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* --- Import JSON --- */
  btnImport.addEventListener('click', function () { fileImport.click(); });

  fileImport.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 1048576) { showToast('File too large (max 1MB)', 'error'); fileImport.value = ''; return; }

    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var imported = JSON.parse(ev.target.result);
        var clean = sanitizeData(imported);
        if (!clean) { showToast('Invalid JSON structure', 'error'); return; }
        saveUndoState();
        data = clean;
        renderAll();
        logActivity('import', 'Imported JSON data', 'import');
        showToast('JSON imported', 'success');
      } catch (err) { showToast('Invalid JSON file', 'error'); }
    };
    reader.readAsText(file);
    fileImport.value = '';
  });

  /* --- Apply to Site --- */
  btnApply.addEventListener('click', function () {
    if (!data) return;
    localStorage.setItem('portfolioData', JSON.stringify(data));
    localStorage.setItem('portfolioDataUpdated', new Date().toLocaleString());
    logActivity('apply', 'Applied changes to site', 'apply');
    updateDashboardStats();
    showToast('Applied to site', 'success');
  });

  /* --- Clear localStorage --- */
  btnClearLocal.addEventListener('click', function () {
    localStorage.removeItem('portfolioData');
    localStorage.removeItem('portfolioDataUpdated');
    updateDashboardStats();
    showToast('Local data cleared', 'warning');
  });

  /* --- Keyboard Shortcuts --- */
  document.addEventListener('keydown', function (e) {
    // Escape closes modals / sidebar
    if (e.key === 'Escape') {
      if (!itemModal.hidden) closeItemModal();
      if (!deleteModal.hidden) closeDeleteModal();
      closeSidebar();
    }

    // Skip shortcuts if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      // Ctrl+S in modal saves
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !itemModal.hidden) {
        e.preventDefault();
        itemForm.dispatchEvent(new Event('submit'));
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      if (currentPage === 'useful') openAddModal('useful');
      else openAddModal('projects');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }
    if (e.key === 'Delete') {
      var cat = currentPage === 'useful' ? 'useful' : 'projects';
      var sel = getSelectedRows(cat);
      var selected = Object.keys(sel).filter(function (k) { return sel[k]; });
      if (selected.length && tables[cat].bulkDelete) tables[cat].bulkDelete.click();
    }
  });

  // Start on dashboard
  navigateTo('dashboard');

})();
