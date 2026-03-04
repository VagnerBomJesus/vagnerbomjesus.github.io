/* === Portfolio - Main Logic === */

(function () {
  'use strict';

  /* --- Security Utilities --- */
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
      title: item.title.substring(0, 200),
      desc: item.desc.substring(0, 500),
      link: item.link.substring(0, 2000),
      type: typeof item.type === 'string' ? item.type.substring(0, 20) : '',
      featured: item.featured === true
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

  /* --- Data --- */
  var resourcesData = null;

  var translations = {
    en: {
      role: 'Software Engineering | Flutter Developer | Information Security Enthusiast',
      experience: 'Experience',
      education: 'Education',
      projects: 'Projects',
      useful: 'Useful Links',
      prev: '\u2190 Previous',
      next: 'Next \u2192',
      page: function (c, t) { return c + ' / ' + t; },
      resourcesHeading: 'Projects & Resources',
      resourcesCount: function (n) { return n + ' items'; },
      footer: '\u00A9 2026 Vagner Bom Jesus \u00B7 All rights reserved.'
    },
    pt: {
      role: 'Engenharia de Software | Desenvolvedor Flutter | Entusiasta de Seguranca da Informacao',
      experience: 'Experiencia',
      education: 'Formacao academica',
      projects: 'Projetos',
      useful: 'Links uteis',
      prev: '\u2190 Anterior',
      next: 'Proxima \u2192',
      page: function (c, t) { return c + ' / ' + t; },
      resourcesHeading: 'Projetos e Recursos',
      resourcesCount: function (n) { return n + ' itens'; },
      footer: '\u00A9 2026 Vagner Bom Jesus \u00B7 Todos os direitos reservados.'
    }
  };

  /* --- State --- */
  var currentLanguage = 'en';
  var currentCategory = 'projects';
  var projectItems = [];
  var usefulItems = [];
  var perPage = 4;
  var currentPage = 1;
  var totalPages = 1;

  /* --- DOM refs --- */
  var themeBtn = document.getElementById('toggle-theme');
  var langSelect = document.getElementById('language-select');
  var btnExp = document.getElementById('btn-experience');
  var btnEdu = document.getElementById('btn-education');
  var profileRole = document.getElementById('profile-role');
  var resourcesHeading = document.getElementById('resources-heading');
  var resourcesCount = document.getElementById('resources-count');
  var footerText = document.getElementById('footer-text');
  var tabProjects = document.getElementById('tab-projects');
  var tabUseful = document.getElementById('tab-useful');
  var searchInput = document.getElementById('resource-search');

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

  /* --- Category / Tabs --- */
  var searchQuery = '';

  function getActiveItems() {
    var items = currentCategory === 'projects' ? projectItems : usefulItems;
    if (!searchQuery) return items;
    var q = searchQuery.toLowerCase();
    return items.filter(function (r) {
      return r.title.toLowerCase().indexOf(q) !== -1 || r.desc.toLowerCase().indexOf(q) !== -1;
    });
  }

  function setCategory(cat) {
    currentCategory = cat;
    currentPage = 1;

    // Update tab active state
    tabProjects.classList.toggle('active', cat === 'projects');
    tabUseful.classList.toggle('active', cat === 'useful');

    // Update count
    var t = translations[currentLanguage];
    var items = getActiveItems();
    resourcesCount.textContent = t.resourcesCount(items.length);

    totalPages = Math.max(1, Math.ceil(items.length / perPage));
    renderResources(currentPage);
    renderPagination();
  }

  tabProjects.addEventListener('click', function () {
    setCategory('projects');
  });

  tabUseful.addEventListener('click', function () {
    setCategory('useful');
  });

  searchInput.addEventListener('input', function () {
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    var items = getActiveItems();
    var t = translations[currentLanguage];
    resourcesCount.textContent = t.resourcesCount(items.length);
    totalPages = Math.max(1, Math.ceil(items.length / perPage));
    renderResources(currentPage);
    renderPagination();
  });

  /* --- Language --- */
  function setLanguage(lang) {
    if (!resourcesData) return;

    currentLanguage = lang;
    langSelect.value = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    var t = translations[lang];
    var data = resourcesData[lang];

    profileRole.textContent = t.role;
    btnExp.textContent = t.experience;
    btnEdu.textContent = t.education;
    resourcesHeading.textContent = t.resourcesHeading;
    footerText.textContent = t.footer;

    // Translate tab labels
    tabProjects.textContent = t.projects;
    tabUseful.textContent = t.useful;

    // Store items by category
    projectItems = data.projects.map(function (r) {
      return { title: r.title, desc: r.desc, link: r.link, type: r.type || '', featured: r.featured || false };
    });
    usefulItems = data.useful.map(function (r) {
      return { title: r.title, desc: r.desc, link: r.link, type: r.type || '', featured: r.featured || false };
    });

    // Re-apply category (updates count, pagination, rendering)
    setCategory(currentCategory);
  }

  langSelect.addEventListener('change', function () {
    setLanguage(langSelect.value);
  });

  /* --- Smooth page transition --- */
  function transitionResources(callback) {
    var section = document.getElementById('resources-section');
    section.classList.add('fading');
    setTimeout(function () {
      callback();
      section.classList.remove('fading');
    }, 200);
  }

  /* --- Resources rendering --- */
  function renderResources(page) {
    var section = document.getElementById('resources-section');
    var pagination = document.getElementById('custom-pagination');

    var old = section.querySelectorAll('.resource-link, .section-title');
    for (var i = 0; i < old.length; i++) {
      old[i].remove();
    }

    var items = getActiveItems();
    var start = (page - 1) * perPage;
    var end = Math.min(start + perPage, items.length);

    for (var j = start; j < end; j++) {
      var r = items[j];

      var a = document.createElement('a');
      // Safe href - only http/https
      if (isValidURL(r.link)) {
        a.href = r.link;
      } else {
        a.href = '#';
      }
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'resource-link';

      var card = document.createElement('div');
      card.className = 'resource-card' + (r.featured ? ' resource-featured' : '');

      var title = document.createElement('div');
      title.className = 'resource-title';
      title.textContent = r.title;

      var desc = document.createElement('div');
      desc.className = 'resource-desc';
      desc.textContent = r.desc;

      var titleRow = document.createElement('div');
      titleRow.className = 'resource-title-row';
      titleRow.appendChild(title);

      if (r.type) {
        var badge = document.createElement('span');
        badge.className = 'resource-type-badge';
        badge.textContent = r.type.toUpperCase();
        titleRow.appendChild(badge);
      }

      card.appendChild(titleRow);
      card.appendChild(desc);
      a.appendChild(card);
      section.insertBefore(a, pagination);
    }
  }

  /* --- Pagination --- */
  function renderPagination() {
    var pag = document.getElementById('custom-pagination');
    // Clear safely
    while (pag.firstChild) {
      pag.removeChild(pag.firstChild);
    }
    var t = translations[currentLanguage];

    var prev = document.createElement('button');
    prev.className = 'page-btn-custom';
    prev.textContent = t.prev;
    prev.disabled = currentPage === 1;
    prev.addEventListener('click', function () {
      if (currentPage > 1) {
        transitionResources(function () {
          currentPage--;
          renderResources(currentPage);
          renderPagination();
        });
      }
    });
    pag.appendChild(prev);

    var info = document.createElement('span');
    info.className = 'page-info-custom';
    info.textContent = t.page(currentPage, totalPages);
    pag.appendChild(info);

    var next = document.createElement('button');
    next.className = 'page-btn-custom';
    next.textContent = t.next;
    next.disabled = currentPage === totalPages;
    next.addEventListener('click', function () {
      if (currentPage < totalPages) {
        transitionResources(function () {
          currentPage++;
          renderResources(currentPage);
          renderPagination();
        });
      }
    });
    pag.appendChild(next);
  }

  /* --- Load Data (with sanitization) --- */
  function loadData() {
    fetch('data.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var clean = sanitizeData(data);
        resourcesData = clean || { en: { projects: [], useful: [] }, pt: { projects: [], useful: [] } };
        initApp();
      })
      .catch(function () {
        resourcesData = { en: { projects: [], useful: [] }, pt: { projects: [], useful: [] } };
        initApp();
      });
  }

  /* --- Init --- */
  function initApp() {
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme(true);
    } else {
      setTheme(false);
    }

    var savedLang = localStorage.getItem('lang') || 'en';
    setLanguage(savedLang);
  }

  // Theme can be set immediately (no data dependency)
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
  } else {
    setTheme(false);
  }

  loadData();

  /* --- Check for hover capability (skip animations on touch devices) --- */
  var hasHover = window.matchMedia('(hover: hover)').matches;

  /* --- Profile elements flee from cursor --- */
  var glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?';
  var returnTimer = null;

  function scrambleText(el) {
    var original = el.dataset.original || el.textContent;
    el.dataset.original = original;
    var chars = original.split('');
    var iterations = 0;
    var maxIterations = chars.length * 2;

    var interval = setInterval(function () {
      el.textContent = chars.map(function (char, i) {
        if (char === ' ' || char === '|') return char;
        if (iterations / 2 > i) return original[i];
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }).join('');
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        el.textContent = original;
      }
    }, 30);
  }

  var profileCard = document.querySelector('.profile-card');
  var fleeElements = profileCard ? [
    profileCard.querySelector('.avatar-wrapper'),
    profileCard.querySelector('.profile-name'),
    profileCard.querySelector('.profile-username'),
    document.getElementById('profile-role')
  ].filter(function (el) { return el; }) : [];

  // Setup elements for animation
  fleeElements.forEach(function (el) {
    el.style.position = 'relative';
    el.style.transition = 'transform 0.25s ease-out';
    el.style.willChange = 'transform';
  });

  function returnToPlace() {
    fleeElements.forEach(function (el) {
      el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = 'translate(0, 0)';
    });

    // Scramble text on return
    fleeElements.forEach(function (el) {
      if (el.classList.contains('avatar-wrapper')) return;
      scrambleText(el);
    });
  }

  if (profileCard && hasHover) {
    profileCard.addEventListener('mousemove', function (e) {
      var cardRect = profileCard.getBoundingClientRect();
      var cursorX = e.clientX;
      var cursorY = e.clientY;

      // Clear return timer while cursor is inside
      if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
      }

      fleeElements.forEach(function (el) {
        var elRect = el.getBoundingClientRect();
        var elCenterX = elRect.left + elRect.width / 2;
        var elCenterY = elRect.top + elRect.height / 2;

        var dx = elCenterX - cursorX;
        var dy = elCenterY - cursorY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          var force = (150 - dist) / 150;
          var angle = Math.atan2(dy, dx);
          var moveX = Math.cos(angle) * force * 50;
          var moveY = Math.sin(angle) * force * 35;

          // Clamp within card bounds
          var maxX = (cardRect.width - elRect.width) / 2;
          var maxY = 40;
          moveX = Math.max(-maxX, Math.min(maxX, moveX));
          moveY = Math.max(-maxY, Math.min(maxY, moveY));

          el.style.transition = 'transform 0.15s ease-out';
          el.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px)';
        }
      });
    });

    profileCard.addEventListener('mouseleave', function () {
      returnTimer = setTimeout(function () {
        returnToPlace();
        returnTimer = null;
      }, 1500);
    });
  }

  /* --- Ripple effect on cursor --- */
  var lastRipple = 0;
  var speed = 0;
  var prevX = 0;
  var prevY = 0;
  var activeRipples = 0;
  var MAX_RIPPLES = 20;

  function createRipple(x, y, size, opacity, cls) {
    if (activeRipples >= MAX_RIPPLES) return;
    activeRipples++;
    var r = document.createElement('div');
    r.className = 'ripple ' + cls;
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    r.style.setProperty('--ripple-size', size + 'px');
    r.style.setProperty('--ripple-opacity', opacity);
    document.body.appendChild(r);
    r.addEventListener('animationend', function () { r.remove(); activeRipples--; });
  }

  document.addEventListener('mousemove', function (e) {
    if (!hasHover) return;
    var now = Date.now();
    if (now - lastRipple < 80) return;
    if (e.target.closest('.profile-card')) return;

    var dx = e.clientX - prevX;
    var dy = e.clientY - prevY;
    speed = Math.sqrt(dx * dx + dy * dy);
    prevX = e.clientX;
    prevY = e.clientY;
    lastRipple = now;

    // Inner ripple - always
    var innerSize = Math.min(60 + speed * 0.8, 150);
    createRipple(e.clientX, e.clientY, innerSize, 0.35, 'ripple-inner');

    // Outer ripple - on faster movement
    if (speed > 15) {
      var outerSize = Math.min(90 + speed, 200);
      createRipple(e.clientX, e.clientY, outerSize, 0.15, 'ripple-outer');
    }
  });
})();
