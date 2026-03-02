/* === Admin Panel Logic === */

(function () {
  'use strict';

  /* --- Config --- */
  // PBKDF2-derived key (not plain SHA-256) for offline attack resistance
  var PASSWORD_HASH = '0cfeb89b1013588625f57bf3a405d0e5dd10f5cc3ad66d1c5bd613162f111e25';
  var PBKDF2_ITERATIONS = 100000;
  var PBKDF2_SALT = 'VBJ-admin-salt-2026';
  var MAX_ATTEMPTS = 5;
  var LOCKOUT_MINUTES = 15;
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min inactivity
  var MAX_TITLE_LEN = 200;
  var MAX_DESC_LEN = 500;
  var MAX_LINK_LEN = 2000;

  /* --- State --- */
  var data = null;
  var currentLang = 'en';
  var currentCategory = 'projects';
  var deleteTarget = null;
  var sessionFailCount = 0; // in-memory counter (cannot be cleared via localStorage)

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
  var btnApply = document.getElementById('btn-apply');
  var btnClearLocal = document.getElementById('btn-clear-local');
  var fileImport = document.getElementById('file-import');

  var tabBtns = document.querySelectorAll('.tab-btn');
  var itemsTbody = document.getElementById('items-tbody');
  var emptyState = document.getElementById('empty-state');
  var itemsTable = document.getElementById('items-table');

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

  /* ================================================================
     SECURITY UTILITIES
     ================================================================ */

  /** PBKDF2 hash - slow by design to resist offline brute force */
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

  /** Constant-time string comparison to prevent timing attacks */
  function constantTimeCompare(a, b) {
    if (a.length !== b.length) return false;
    var result = 0;
    for (var i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /** Validate URL - only http/https allowed (blocks javascript:, data:, etc.) */
  function isValidURL(str) {
    try {
      var url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  /** Sanitize a single data item - enforce types, lengths, safe URLs */
  function sanitizeItem(item) {
    if (!item || typeof item !== 'object') return null;
    if (typeof item.title !== 'string' || typeof item.desc !== 'string' || typeof item.link !== 'string') return null;
    if (!isValidURL(item.link)) return null;

    return {
      title: item.title.substring(0, MAX_TITLE_LEN),
      desc: item.desc.substring(0, MAX_DESC_LEN),
      link: item.link.substring(0, MAX_LINK_LEN)
    };
  }

  /** Sanitize an array of items */
  function sanitizeItems(items) {
    if (!Array.isArray(items)) return [];
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var clean = sanitizeItem(items[i]);
      if (clean) result.push(clean);
    }
    return result;
  }

  /** Sanitize full data object */
  function sanitizeData(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (!obj.en || !obj.pt) return null;
    if (!Array.isArray(obj.en.projects) || !Array.isArray(obj.en.useful)) return null;
    if (!Array.isArray(obj.pt.projects) || !Array.isArray(obj.pt.useful)) return null;

    return {
      en: {
        projects: sanitizeItems(obj.en.projects),
        useful: sanitizeItems(obj.en.useful)
      },
      pt: {
        projects: sanitizeItems(obj.pt.projects),
        useful: sanitizeItems(obj.pt.useful)
      }
    };
  }

  /** Safe link setter - only sets href if URL is valid */
  function setSafeHref(element, url) {
    if (isValidURL(url)) {
      element.href = url;
    } else {
      element.href = '#';
      element.removeAttribute('target');
    }
  }

  /* --- Toast --- */
  function showToast(msg, isError) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' toast-error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 200);
    }, 2500);
  }

  /* --- Theme --- */
  function setTheme(dark) {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeBtn.textContent = '\u2600';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeBtn.textContent = '\u263E';
      localStorage.setItem('theme', 'light');
    }
  }

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  themeBtn.addEventListener('click', function () {
    setTheme(!isDark());
  });

  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
  }

  /* ================================================================
     AUTH WITH BRUTE-FORCE PROTECTION
     ================================================================ */

  // Dual-layer rate limiting: localStorage (persists) + in-memory (cannot be cleared via console)
  function getAttemptData() {
    try {
      var raw = localStorage.getItem('adminAttempts');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { count: 0, lockedUntil: 0 };
  }

  function setAttemptData(obj) {
    localStorage.setItem('adminAttempts', JSON.stringify(obj));
  }

  function clearAttemptData() {
    localStorage.removeItem('adminAttempts');
    sessionFailCount = 0;
  }

  function isLockedOut() {
    // In-memory lockout (cannot be bypassed via console)
    if (sessionFailCount >= MAX_ATTEMPTS) return true;

    var ad = getAttemptData();
    if (ad.lockedUntil && Date.now() < ad.lockedUntil) return true;
    if (ad.lockedUntil && Date.now() >= ad.lockedUntil) {
      setAttemptData({ count: 0, lockedUntil: 0 });
    }
    return false;
  }

  function getRemainingLockTime() {
    var ad = getAttemptData();
    if (!ad.lockedUntil) return 0;
    return Math.max(0, Math.ceil((ad.lockedUntil - Date.now()) / 1000 / 60));
  }

  function recordFailedAttempt() {
    sessionFailCount++;
    var ad = getAttemptData();
    ad.count++;
    if (ad.count >= MAX_ATTEMPTS) {
      ad.lockedUntil = Date.now() + (LOCKOUT_MINUTES * 60 * 1000);
    }
    setAttemptData(ad);
    return ad;
  }

  function getDelayForAttempt() {
    // Use the higher of the two counters
    var count = Math.max(sessionFailCount, getAttemptData().count);
    if (count === 0) return 0;
    return Math.min(Math.pow(2, count - 1) * 1000, 10000);
  }

  // Session auth stores the hash (not just 'true') - harder to guess
  function isLoggedIn() {
    return sessionStorage.getItem('adminAuth') === PASSWORD_HASH;
  }

  function showAdmin() {
    loginScreen.hidden = true;
    adminPanel.hidden = false;
  }

  function showLogin() {
    loginScreen.hidden = false;
    adminPanel.hidden = true;
    sessionStorage.removeItem('adminAuth');
  }

  function updateLoginError(msg) {
    loginError.textContent = msg;
    loginError.hidden = false;
  }

  if (isLoggedIn()) {
    showAdmin();
    loadData();
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (isLockedOut()) {
      var mins = getRemainingLockTime();
      if (sessionFailCount >= MAX_ATTEMPTS) {
        updateLoginError('Session locked. Reload the page and wait ' + LOCKOUT_MINUTES + ' minutes.');
      } else {
        updateLoginError('Account locked. Try again in ' + (mins || 1) + ' minute' + (mins !== 1 ? 's' : '') + '.');
      }
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
            updateLoginError('Incorrect password. ' + remaining + ' attempt' + (remaining !== 1 ? 's' : '') + ' remaining.');
          }
        }
      });
    }, delay);
  });

  btnLogout.addEventListener('click', function () {
    showLogin();
  });

  // Auto-expire session after inactivity
  var sessionTimeout;
  function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    if (isLoggedIn()) {
      sessionTimeout = setTimeout(function () {
        showLogin();
        showToast('Session expired due to inactivity', true);
      }, SESSION_TIMEOUT_MS);
    }
  }

  document.addEventListener('click', resetSessionTimeout);
  document.addEventListener('keydown', resetSessionTimeout);
  resetSessionTimeout();

  /* ================================================================
     DATA LOADING WITH VALIDATION
     ================================================================ */
  function loadData() {
    var stored = localStorage.getItem('portfolioData');
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        var clean = sanitizeData(parsed);
        if (clean) {
          data = clean;
          renderAll();
          return;
        }
        localStorage.removeItem('portfolioData');
      } catch (e) {
        localStorage.removeItem('portfolioData');
      }
    }

    fetch('data.json')
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
      renderTable();
      renderPreview();
    });
  });

  /* --- Render All --- */
  function renderAll() {
    if (!data) return;
    updateCount();
    renderTable();
    renderPreview();
  }

  function updateCount() {
    var langData = data[currentLang];
    var total = (langData.projects ? langData.projects.length : 0) +
                (langData.useful ? langData.useful.length : 0);
    adminCount.textContent = total + ' items';
  }

  /* --- Render Table --- */
  function renderTable() {
    if (!data) return;

    var items = data[currentLang][currentCategory] || [];

    // Clear safely
    while (itemsTbody.firstChild) {
      itemsTbody.removeChild(itemsTbody.firstChild);
    }

    if (items.length === 0) {
      emptyState.hidden = false;
      itemsTable.hidden = true;
      return;
    }

    emptyState.hidden = true;
    itemsTable.hidden = false;

    items.forEach(function (item, idx) {
      var tr = document.createElement('tr');

      var tdOrder = document.createElement('td');
      tdOrder.className = 'col-order';
      tdOrder.textContent = idx + 1;
      tr.appendChild(tdOrder);

      var tdTitle = document.createElement('td');
      tdTitle.className = 'col-title';
      tdTitle.textContent = item.title;
      tr.appendChild(tdTitle);

      var tdDesc = document.createElement('td');
      tdDesc.className = 'col-desc';
      tdDesc.textContent = item.desc;
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

      var btnUp = document.createElement('button');
      btnUp.className = 'btn-icon btn-icon-up';
      btnUp.textContent = '\u25B2';
      btnUp.title = 'Move up';
      btnUp.disabled = idx === 0;
      btnUp.addEventListener('click', (function (i) {
        return function () { moveItem(i, -1); };
      })(idx));
      actionsDiv.appendChild(btnUp);

      var btnDown = document.createElement('button');
      btnDown.className = 'btn-icon btn-icon-down';
      btnDown.textContent = '\u25BC';
      btnDown.title = 'Move down';
      btnDown.disabled = idx === items.length - 1;
      btnDown.addEventListener('click', (function (i) {
        return function () { moveItem(i, 1); };
      })(idx));
      actionsDiv.appendChild(btnDown);

      var btnEdit = document.createElement('button');
      btnEdit.className = 'btn-icon';
      btnEdit.textContent = '\u270E';
      btnEdit.title = 'Edit';
      btnEdit.addEventListener('click', (function (i) {
        return function () { openEditModal(i); };
      })(idx));
      actionsDiv.appendChild(btnEdit);

      var btnDel = document.createElement('button');
      btnDel.className = 'btn-icon btn-icon-danger';
      btnDel.textContent = '\u2715';
      btnDel.title = 'Delete';
      btnDel.addEventListener('click', (function (i) {
        return function () { openDeleteModal(i); };
      })(idx));
      actionsDiv.appendChild(btnDel);

      tdActions.appendChild(actionsDiv);
      tr.appendChild(tdActions);
      itemsTbody.appendChild(tr);
    });
  }

  /* --- Move Item --- */
  function moveItem(index, direction) {
    var items = data[currentLang][currentCategory];
    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    var otherLang = currentLang === 'en' ? 'pt' : 'en';
    var otherItems = data[otherLang][currentCategory];

    var temp = items[index];
    items[index] = items[newIndex];
    items[newIndex] = temp;

    if (otherItems && otherItems.length > Math.max(index, newIndex)) {
      var otherTemp = otherItems[index];
      otherItems[index] = otherItems[newIndex];
      otherItems[newIndex] = otherTemp;
    }

    renderAll();
  }

  /* --- Preview (safe rendering, no innerHTML with data) --- */
  function renderPreview() {
    if (!data) return;

    // Clear safely
    while (previewArea.firstChild) {
      previewArea.removeChild(previewArea.firstChild);
    }

    var items = data[currentLang][currentCategory] || [];
    if (items.length === 0) {
      var emptyP = document.createElement('p');
      emptyP.style.cssText = 'color: var(--text-muted); font-size: 0.85rem;';
      emptyP.textContent = 'No items to preview';
      previewArea.appendChild(emptyP);
      return;
    }

    items.forEach(function (item) {
      var a = document.createElement('a');
      setSafeHref(a, item.link);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'resource-link';

      var card = document.createElement('div');
      card.className = 'resource-card';

      var title = document.createElement('div');
      title.className = 'resource-title';
      title.textContent = item.title;

      var desc = document.createElement('div');
      desc.className = 'resource-desc';
      desc.textContent = item.desc;

      card.appendChild(title);
      card.appendChild(desc);
      a.appendChild(card);
      previewArea.appendChild(a);
    });
  }

  /* --- Add / Edit Modal --- */
  btnAdd.addEventListener('click', function () {
    openAddModal();
  });

  function openAddModal() {
    modalTitle.textContent = 'Add Item';
    document.getElementById('field-title-en').value = '';
    document.getElementById('field-title-pt').value = '';
    document.getElementById('field-desc-en').value = '';
    document.getElementById('field-desc-pt').value = '';
    document.getElementById('field-link').value = '';
    document.getElementById('field-category').value = currentCategory;
    document.getElementById('field-edit-index').value = '-1';
    document.getElementById('field-edit-cat').value = '';
    itemModal.hidden = false;
  }

  function openEditModal(index) {
    modalTitle.textContent = 'Edit Item';
    var enItem = data.en[currentCategory][index];
    var ptItem = data.pt[currentCategory][index];

    document.getElementById('field-title-en').value = enItem ? enItem.title : '';
    document.getElementById('field-title-pt').value = ptItem ? ptItem.title : '';
    document.getElementById('field-desc-en').value = enItem ? enItem.desc : '';
    document.getElementById('field-desc-pt').value = ptItem ? ptItem.desc : '';
    document.getElementById('field-link').value = enItem ? enItem.link : '';
    document.getElementById('field-category').value = currentCategory;
    document.getElementById('field-edit-index').value = index;
    document.getElementById('field-edit-cat').value = currentCategory;
    itemModal.hidden = false;
  }

  function closeItemModal() {
    itemModal.hidden = true;
  }

  modalClose.addEventListener('click', closeItemModal);
  modalCancel.addEventListener('click', closeItemModal);

  itemModal.addEventListener('click', function (e) {
    if (e.target === itemModal) closeItemModal();
  });

  itemForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var titleEn = document.getElementById('field-title-en').value.trim().substring(0, MAX_TITLE_LEN);
    var titlePt = document.getElementById('field-title-pt').value.trim().substring(0, MAX_TITLE_LEN);
    var descEn = document.getElementById('field-desc-en').value.trim().substring(0, MAX_DESC_LEN);
    var descPt = document.getElementById('field-desc-pt').value.trim().substring(0, MAX_DESC_LEN);
    var link = document.getElementById('field-link').value.trim().substring(0, MAX_LINK_LEN);
    var category = document.getElementById('field-category').value;
    var editIndex = parseInt(document.getElementById('field-edit-index').value, 10);
    var editCat = document.getElementById('field-edit-cat').value;

    // Validate URL
    if (!isValidURL(link)) {
      showToast('Invalid URL. Only http/https allowed.', true);
      return;
    }

    // Validate category
    if (category !== 'projects' && category !== 'useful') {
      showToast('Invalid category', true);
      return;
    }

    var enItem = { title: titleEn, desc: descEn, link: link };
    var ptItem = { title: titlePt, desc: descPt, link: link };

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
        tabBtns.forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-category') === category);
        });
      }
      showToast('Item updated');
    } else {
      data.en[category].push(enItem);
      data.pt[category].push(ptItem);
      currentCategory = category;
      tabBtns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-category') === category);
      });
      showToast('Item added');
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

  function closeDeleteModal() {
    deleteModal.hidden = true;
    deleteTarget = null;
  }

  deleteModalClose.addEventListener('click', closeDeleteModal);
  deleteCancel.addEventListener('click', closeDeleteModal);

  deleteModal.addEventListener('click', function (e) {
    if (e.target === deleteModal) closeDeleteModal();
  });

  deleteConfirm.addEventListener('click', function () {
    if (!deleteTarget) return;

    data.en[deleteTarget.category].splice(deleteTarget.index, 1);
    data.pt[deleteTarget.category].splice(deleteTarget.index, 1);

    closeDeleteModal();
    renderAll();
    showToast('Item deleted');
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

    showToast('JSON exported');
  });

  /* --- Import JSON (with full validation) --- */
  btnImport.addEventListener('click', function () {
    fileImport.click();
  });

  fileImport.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;

    // Limit file size (1MB max)
    if (file.size > 1048576) {
      showToast('File too large (max 1MB)', true);
      fileImport.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var imported = JSON.parse(ev.target.result);
        var clean = sanitizeData(imported);

        if (!clean) {
          showToast('Invalid JSON structure or unsafe URLs detected', true);
          return;
        }

        data = clean;
        renderAll();
        showToast('JSON imported and validated');
      } catch (err) {
        showToast('Invalid JSON file', true);
      }
    };
    reader.readAsText(file);
    fileImport.value = '';
  });

  /* --- Apply to Site (localStorage) --- */
  btnApply.addEventListener('click', function () {
    if (!data) return;
    localStorage.setItem('portfolioData', JSON.stringify(data));
    showToast('Applied to site (localStorage)');
  });

  /* --- Clear localStorage --- */
  btnClearLocal.addEventListener('click', function () {
    localStorage.removeItem('portfolioData');
    showToast('Local data cleared. Site will use data.json.');
  });

  /* --- Keyboard shortcuts --- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!itemModal.hidden) closeItemModal();
      if (!deleteModal.hidden) closeDeleteModal();
    }
  });

})();
