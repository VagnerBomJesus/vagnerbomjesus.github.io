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

  /* --- State --- */
  var data = null;
  var currentLang = 'en';
  var currentCategory = 'projects';
  var deleteTarget = null;
  var sessionFailCount = 0;
  var tableFilter = '';
  var selectedRows = {};
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

  var langSelect = document.getElementById('admin-lang');
  var themeBtn = document.getElementById('admin-theme');
  var btnLogout = document.getElementById('btn-logout');
  var adminCount = document.getElementById('admin-count');

  var btnAdd = document.getElementById('btn-add');
  var btnImport = document.getElementById('btn-import');
  var btnExport = document.getElementById('btn-export');
  var btnExportPdf = document.getElementById('btn-export-pdf');
  var btnApply = document.getElementById('btn-apply');
  var btnClearLocal = document.getElementById('btn-clear-local');
  var btnUndo = document.getElementById('btn-undo');
  var btnRedo = document.getElementById('btn-redo');
  var fileImport = document.getElementById('file-import');

  var tabBtns = document.querySelectorAll('.tab-btn');
  var itemsTbody = document.getElementById('items-tbody');
  var emptyState = document.getElementById('empty-state');
  var itemsTable = document.getElementById('items-table');
  var tableSearch = document.getElementById('table-search');
  var bulkSelectAll = document.getElementById('bulk-select-all');
  var theadCheckAll = document.getElementById('thead-check-all');
  var btnBulkDelete = document.getElementById('btn-bulk-delete');

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

  var previewArea = document.getElementById('preview-area');
  var breadcrumbCat = document.getElementById('breadcrumb-cat');
  var activityLogEl = document.getElementById('activity-log');
  var btnClearLog = document.getElementById('btn-clear-log');

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
    btnUndo.disabled = !undoStack.length;
    btnRedo.disabled = !redoStack.length;
  }

  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);

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
        '<span class="activity-action">' + entry.detail + '</span>';
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

    fetch('../data.json')
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

  /* --- Language --- */
  langSelect.addEventListener('change', function () {
    currentLang = langSelect.value;
    renderAll();
  });

  /* --- Tabs --- */
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      breadcrumbCat.textContent = currentCategory === 'projects' ? 'Projects' : 'Useful Links';
      selectedRows = {};
      updateBulkUI();
      renderTable();
      renderPreview();
    });
  });

  /* --- Search / Filter --- */
  tableSearch.addEventListener('input', function () {
    tableFilter = tableSearch.value.trim().toLowerCase();
    renderTable();
  });

  /* --- Bulk Select --- */
  function updateBulkUI() {
    var count = Object.keys(selectedRows).filter(function (k) { return selectedRows[k]; }).length;
    btnBulkDelete.hidden = count === 0;
    bulkSelectAll.checked = false;
    if (theadCheckAll) theadCheckAll.checked = false;
  }

  bulkSelectAll.addEventListener('change', function () {
    var items = data[currentLang][currentCategory] || [];
    for (var i = 0; i < items.length; i++) selectedRows[i] = bulkSelectAll.checked;
    if (theadCheckAll) theadCheckAll.checked = bulkSelectAll.checked;
    renderTable();
    updateBulkUI();
  });

  if (theadCheckAll) {
    theadCheckAll.addEventListener('change', function () {
      bulkSelectAll.checked = theadCheckAll.checked;
      bulkSelectAll.dispatchEvent(new Event('change'));
    });
  }

  btnBulkDelete.addEventListener('click', function () {
    var indices = Object.keys(selectedRows).filter(function (k) { return selectedRows[k]; }).map(Number).sort(function (a, b) { return b - a; });
    if (!indices.length) return;
    saveUndoState();
    indices.forEach(function (idx) {
      data.en[currentCategory].splice(idx, 1);
      data.pt[currentCategory].splice(idx, 1);
    });
    selectedRows = {};
    updateBulkUI();
    renderAll();
    logActivity('delete', 'Deleted ' + indices.length + ' items', 'delete');
    showToast(indices.length + ' items deleted', 'success');
  });

  /* --- Render All --- */
  function renderAll() {
    if (!data) return;
    updateCount();
    updateDashboardStats();
    renderTable();
    renderPreview();
  }

  function updateCount() {
    var langData = data[currentLang];
    var total = (langData.projects ? langData.projects.length : 0) + (langData.useful ? langData.useful.length : 0);
    adminCount.textContent = total + ' items';
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

  /* --- Render Table --- */
  function renderTable() {
    if (!data) return;
    var items = data[currentLang][currentCategory] || [];

    while (itemsTbody.firstChild) itemsTbody.removeChild(itemsTbody.firstChild);

    var filtered = items.map(function (item, idx) { return { item: item, idx: idx }; });
    if (tableFilter) {
      filtered = filtered.filter(function (o) {
        return o.item.title.toLowerCase().indexOf(tableFilter) !== -1 ||
               o.item.desc.toLowerCase().indexOf(tableFilter) !== -1;
      });
    }

    if (filtered.length === 0) {
      emptyState.hidden = false;
      itemsTable.hidden = true;
      return;
    }

    emptyState.hidden = true;
    itemsTable.hidden = false;

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
            var arr = data[lang][currentCategory];
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
        updateBulkUI();
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
      tdTitle.addEventListener('dblclick', function () { startInlineEdit(tdTitle, currentLang, currentCategory, idx, 'title'); });
      tr.appendChild(tdTitle);

      // Desc (inline editable)
      var tdDesc = document.createElement('td');
      tdDesc.className = 'col-desc';
      tdDesc.textContent = item.desc;
      tdDesc.addEventListener('dblclick', function () { startInlineEdit(tdDesc, currentLang, currentCategory, idx, 'desc'); });
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
      btnDup.addEventListener('click', (function (i) {
        return function () { duplicateItem(i); };
      })(idx));
      actionsDiv.appendChild(btnDup);

      var btnUp = createIconBtn('fa-chevron-up', 'Move up', 'btn-icon-up');
      btnUp.disabled = idx === 0;
      btnUp.addEventListener('click', (function (i) { return function () { moveItem(i, -1); }; })(idx));
      actionsDiv.appendChild(btnUp);

      var btnDown = createIconBtn('fa-chevron-down', 'Move down', 'btn-icon-down');
      btnDown.disabled = idx === items.length - 1;
      btnDown.addEventListener('click', (function (i) { return function () { moveItem(i, 1); }; })(idx));
      actionsDiv.appendChild(btnDown);

      var btnEdit = createIconBtn('fa-pen', 'Edit');
      btnEdit.addEventListener('click', (function (i) { return function () { openEditModal(i); }; })(idx));
      actionsDiv.appendChild(btnEdit);

      var btnDel = createIconBtn('fa-trash', 'Delete', 'btn-icon-danger');
      btnDel.addEventListener('click', (function (i) { return function () { openDeleteModal(i); }; })(idx));
      actionsDiv.appendChild(btnDel);

      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);
      itemsTbody.appendChild(tr);
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
  function duplicateItem(index) {
    saveUndoState();
    ['en', 'pt'].forEach(function (lang) {
      var arr = data[lang][currentCategory];
      var copy = JSON.parse(JSON.stringify(arr[index]));
      copy.title = copy.title + ' (copy)';
      arr.splice(index + 1, 0, copy);
    });
    logActivity('add', 'Duplicated item at position ' + (index + 1), 'add');
    renderAll();
    showToast('Item duplicated', 'success');
  }

  /* --- Move Item --- */
  function moveItem(index, direction) {
    var items = data[currentLang][currentCategory];
    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    saveUndoState();
    ['en', 'pt'].forEach(function (lang) {
      var arr = data[lang][currentCategory];
      var temp = arr[index];
      arr[index] = arr[newIndex];
      arr[newIndex] = temp;
    });

    logActivity('move', 'Moved item ' + (index + 1) + ' → ' + (newIndex + 1), 'move');
    renderAll();
  }

  /* --- Preview --- */
  function renderPreview() {
    if (!data) return;
    while (previewArea.firstChild) previewArea.removeChild(previewArea.firstChild);

    var items = data[currentLang][currentCategory] || [];
    if (items.length === 0) {
      var emptyP = document.createElement('p');
      emptyP.style.cssText = 'color: var(--text-muted); font-size: 0.85rem;';
      emptyP.textContent = 'No items to preview';
      previewArea.appendChild(emptyP);
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
      previewArea.appendChild(aEl);
    });
  }

  /* --- Add / Edit Modal --- */
  btnAdd.addEventListener('click', openAddModal);

  function openAddModal() {
    modalTitle.textContent = 'Add Item';
    var draft = loadDraft();
    document.getElementById('field-title-en').value = draft ? draft.titleEn : '';
    document.getElementById('field-title-pt').value = draft ? draft.titlePt : '';
    document.getElementById('field-desc-en').value = draft ? draft.descEn : '';
    document.getElementById('field-desc-pt').value = draft ? draft.descPt : '';
    document.getElementById('field-link').value = draft ? draft.link : '';
    document.getElementById('field-type').value = draft ? draft.type : '';
    document.getElementById('field-category').value = currentCategory;
    document.getElementById('field-featured').checked = draft ? draft.featured : false;
    document.getElementById('field-isnew').checked = draft ? draft.isNew : false;
    document.getElementById('field-edit-index').value = '-1';
    document.getElementById('field-edit-cat').value = '';
    clearFieldErrors();
    updateAllCounters();
    itemModal.hidden = false;
  }

  function openEditModal(index) {
    modalTitle.textContent = 'Edit Item';
    var enItem = data.en[currentCategory][index] || {};
    var ptItem = data.pt[currentCategory][index] || {};

    document.getElementById('field-title-en').value = enItem.title || '';
    document.getElementById('field-title-pt').value = ptItem.title || '';
    document.getElementById('field-desc-en').value = enItem.desc || '';
    document.getElementById('field-desc-pt').value = ptItem.desc || '';
    document.getElementById('field-link').value = enItem.link || '';
    document.getElementById('field-type').value = enItem.type || '';
    document.getElementById('field-category').value = currentCategory;
    document.getElementById('field-featured').checked = enItem.featured || false;
    document.getElementById('field-isnew').checked = enItem.isNew || false;
    document.getElementById('field-edit-index').value = index;
    document.getElementById('field-edit-cat').value = currentCategory;
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
        currentCategory = category;
        tabBtns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-category') === category); });
      }
      logActivity('edit', 'Edited "' + titleEn + '"', 'edit');
      showToast('Item updated', 'success');
    } else {
      data.en[category].push(enItem);
      data.pt[category].push(ptItem);
      currentCategory = category;
      tabBtns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-category') === category); });
      logActivity('add', 'Added "' + titleEn + '"', 'add');
      showToast('Item added', 'success');
    }

    closeItemModal();
    renderAll();
  });

  /* --- Delete Modal --- */
  function openDeleteModal(index) {
    deleteTarget = { category: currentCategory, index: index };
    var item = data[currentLang][currentCategory][index];
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
    var items = data[currentLang][currentCategory] || [];
    var title = currentCategory === 'projects' ? 'Projects' : 'Useful Links';

    var win = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><title>' + title + ' - VBJ Portfolio</title>' +
      '<style>body{font-family:Arial,sans-serif;padding:40px;color:#111;}' +
      'h1{font-size:1.5rem;border-bottom:2px solid #1e3a5f;padding-bottom:8px;color:#1e3a5f;}' +
      'table{width:100%;border-collapse:collapse;margin-top:16px;}' +
      'th{background:#1e3a5f;color:#fff;padding:8px 12px;text-align:left;font-size:0.8rem;}' +
      'td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:0.85rem;}' +
      'tr:nth-child(even){background:#f9fafb;}' +
      '.footer{margin-top:24px;font-size:0.7rem;color:#999;text-align:center;}</style></head><body>' +
      '<h1>' + title + ' (' + currentLang.toUpperCase() + ')</h1>' +
      '<table><tr><th>#</th><th>Title</th><th>Description</th><th>Link</th></tr>';

    items.forEach(function (item, i) {
      html += '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(item.title) + '</td><td>' + escapeHtml(item.desc) + '</td><td>' + escapeHtml(item.link) + '</td></tr>';
    });

    html += '</table><div class="footer">Generated from VBJ Admin Panel &middot; ' + new Date().toLocaleDateString() + '</div>' +
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
    // Escape closes modals
    if (e.key === 'Escape') {
      if (!itemModal.hidden) closeItemModal();
      if (!deleteModal.hidden) closeDeleteModal();
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
      openAddModal();
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
      var sel = Object.keys(selectedRows).filter(function (k) { return selectedRows[k]; });
      if (sel.length) btnBulkDelete.click();
    }
  });

})();
