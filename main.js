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
      link: item.link.substring(0, 2000)
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
  var resources = [];
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

  /* --- Language --- */
  function setLanguage(lang) {
    if (!resourcesData) return;

    currentLanguage = lang;
    langSelect.value = lang;
    localStorage.setItem('lang', lang);

    var t = translations[lang];
    var data = resourcesData[lang];

    profileRole.textContent = t.role;
    btnExp.textContent = t.experience;
    btnEdu.textContent = t.education;
    resourcesHeading.textContent = t.resourcesHeading;
    footerText.textContent = t.footer;

    resources = [];
    data.projects.forEach(function (r) {
      resources.push({ title: r.title, desc: r.desc, link: r.link, category: 'projects' });
    });
    data.useful.forEach(function (r) {
      resources.push({ title: r.title, desc: r.desc, link: r.link, category: 'useful' });
    });

    resourcesCount.textContent = t.resourcesCount(resources.length);
    totalPages = Math.ceil(resources.length / perPage);
    currentPage = 1;
    renderResources(currentPage);
    renderPagination();
  }

  langSelect.addEventListener('change', function () {
    setLanguage(langSelect.value);
  });

  /* --- Resources rendering --- */
  function renderResources(page) {
    var section = document.getElementById('resources-section');
    var pagination = document.getElementById('custom-pagination');

    var old = section.querySelectorAll('.resource-link, .section-title');
    for (var i = 0; i < old.length; i++) {
      old[i].remove();
    }

    var start = (page - 1) * perPage;
    var end = Math.min(start + perPage, resources.length);
    var currentCat = null;
    var t = translations[currentLanguage];

    for (var j = start; j < end; j++) {
      var r = resources[j];
      if (r.category !== currentCat) {
        currentCat = r.category;
        var h = document.createElement('h2');
        h.className = 'section-title';
        h.textContent = t[currentCat];
        section.insertBefore(h, pagination);
      }

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
      card.className = 'resource-card';

      var title = document.createElement('div');
      title.className = 'resource-title';
      title.textContent = r.title;

      var desc = document.createElement('div');
      desc.className = 'resource-desc';
      desc.textContent = r.desc;

      card.appendChild(title);
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
        currentPage--;
        renderResources(currentPage);
        renderPagination();
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
        currentPage++;
        renderResources(currentPage);
        renderPagination();
      }
    });
    pag.appendChild(next);
  }

  /* --- Load Data (with sanitization) --- */
  function loadData() {
    var stored = localStorage.getItem('portfolioData');
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        var clean = sanitizeData(parsed);
        if (clean) {
          resourcesData = clean;
          initApp();
          return;
        }
        localStorage.removeItem('portfolioData');
      } catch (e) {
        localStorage.removeItem('portfolioData');
      }
    }

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
})();
