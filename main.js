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
      featured: item.featured === true,
      isNew: item.isNew === true
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
      footer: '\u00A9 2026 Vagner Bom Jesus \u00B7 All rights reserved.',
      footerNews: [
        'Software Engineering',
        'Flutter & Dart Development',
        'Information Security',
        'Biomimicry Research',
        'Academic Publications'
      ]
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
      footer: '\u00A9 2026 Vagner Bom Jesus \u00B7 Todos os direitos reservados.',
      footerNews: [
        'Engenharia de Software',
        'Desenvolvimento Flutter & Dart',
        'Seguranca da Informacao',
        'Investigacao em Biomimetica',
        'Publicacoes Academicas'
      ]
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
  function updateFavicon(dark) {
    var canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    var ctx = canvas.getContext('2d');
    // Background circle
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fillStyle = dark ? '#7baaf7' : '#1e3a5f';
    ctx.fill();
    // Text
    ctx.fillStyle = dark ? '#0f1117' : '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', 16, 17);
    // Apply
    var link = document.querySelector('link[rel="icon"]');
    if (link) link.href = canvas.toDataURL('image/png');
  }

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
    updateFavicon(dark);
  }

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  // Theme transition overlay
  var themeOverlay = document.createElement('div');
  themeOverlay.className = 'theme-transition-overlay';
  document.body.appendChild(themeOverlay);

  themeBtn.addEventListener('click', function () {
    themeOverlay.classList.add('active');
    setTimeout(function () {
      setTheme(!isDark());
      setTimeout(function () {
        themeOverlay.classList.remove('active');
      }, 150);
    }, 150);
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

  function setCategory(cat, skipTransition) {
    var prevCat = currentCategory;
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

    if (skipTransition || prevCat === cat) {
      renderResources(currentPage);
      renderPagination();
      return;
    }

    // Slide transition based on tab direction
    var section = document.getElementById('resources-section');
    var slideOut = cat === 'useful' ? 'slide-left' : 'slide-right';
    var slideIn = cat === 'useful' ? 'slide-right' : 'slide-left';
    section.classList.add(slideOut);
    setTimeout(function () {
      renderResources(currentPage);
      renderPagination();
      section.classList.remove(slideOut);
      section.classList.add(slideIn);
      // Force reflow
      void section.offsetWidth;
      section.classList.remove(slideIn);
    }, 200);
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

    typeText(profileRole, t.role, 25);
    btnExp.textContent = t.experience;
    btnEdu.textContent = t.education;
    resourcesHeading.textContent = t.resourcesHeading;
    // Build marquee footer content (duplicated for seamless loop)
    var marquee = document.getElementById('footer-marquee');
    if (marquee) {
      var sep = ' \u00B7 ';
      var items = [t.footer].concat(t.footerNews);
      var text = items.join(sep) + sep;
      marquee.innerHTML = '';
      for (var mi = 0; mi < 4; mi++) {
        var span = document.createElement('span');
        span.textContent = text;
        marquee.appendChild(span);
      }
    }

    // Update cookie banner text
    if (cookieText) {
      cookieText.textContent = lang === 'pt'
        ? 'Este site usa cookies para analytics. Ao continuar, aceita o uso de cookies.'
        : 'This site uses cookies for analytics. By continuing, you accept our use of cookies.';
    }

    // Update meta tags for language
    var metaDesc = document.querySelector('meta[name="description"]');
    var ogTitle = document.querySelector('meta[property="og:title"]');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (lang === 'pt') {
      if (metaDesc) metaDesc.setAttribute('content', 'Vagner Bom Jesus - Engenheiro de Software, Desenvolvedor Flutter e Entusiasta de Seguranca da Informacao em Portugal. Criador da The Biomimicry Database (TBDB). Projetos, publicacoes e recursos.');
      if (ogTitle) ogTitle.setAttribute('content', 'Vagner Bom Jesus - Engenheiro de Software, Desenvolvedor Flutter e Especialista em Ciberseguranca');
      if (ogDesc) ogDesc.setAttribute('content', 'Portfolio de Vagner Bom Jesus: Engenheiro de Software e Desenvolvedor Flutter em Portugal. Criador da The Biomimicry Database. Publicacoes academicas, projetos e recursos.');
      document.title = 'Vagner Bom Jesus - Engenheiro de Software, Desenvolvedor Flutter e Seguranca da Informacao | Portugal';
    } else {
      if (metaDesc) metaDesc.setAttribute('content', 'Vagner Bom Jesus - Software Engineer, Flutter Developer and Information Security Enthusiast based in Portugal. Creator of The Biomimicry Database (TBDB). Academic researcher, published author, and cybersecurity specialist. Explore projects, publications, and resources.');
      if (ogTitle) ogTitle.setAttribute('content', 'Vagner Bom Jesus - Software Engineer, Flutter Developer & Cybersecurity Specialist');
      if (ogDesc) ogDesc.setAttribute('content', 'Portfolio of Vagner Bom Jesus: Software Engineer and Flutter Developer based in Portugal. Creator of The Biomimicry Database. Academic publications, projects, and resources in software engineering, cybersecurity, and biomimicry research.');
      document.title = 'Vagner Bom Jesus - Software Engineer, Flutter Developer & Information Security | Portugal';
    }

    // Translate tab labels
    tabProjects.textContent = t.projects;
    tabUseful.textContent = t.useful;

    // Store items by category
    projectItems = data.projects.map(function (r) {
      return { title: r.title, desc: r.desc, link: r.link, type: r.type || '', featured: r.featured || false, isNew: r.isNew || false };
    });
    usefulItems = data.useful.map(function (r) {
      return { title: r.title, desc: r.desc, link: r.link, type: r.type || '', featured: r.featured || false, isNew: r.isNew || false };
    });

    // Re-apply category (updates count, pagination, rendering)
    setCategory(currentCategory, true);
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

    var old = section.querySelectorAll('.resource-link, .section-title, .empty-state');
    for (var i = 0; i < old.length; i++) {
      old[i].remove();
    }

    var items = getActiveItems();
    var start = (page - 1) * perPage;
    var end = Math.min(start + perPage, items.length);

    if (items.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = currentLanguage === 'pt' ? 'Nenhum resultado encontrado.' : 'No results found.';
      section.insertBefore(empty, pagination);
      return;
    }

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

      if (r.isNew) {
        var newBadge = document.createElement('span');
        newBadge.className = 'resource-new-badge';
        newBadge.textContent = 'NEW';
        titleRow.appendChild(newBadge);
      }

      if (r.type) {
        var badge = document.createElement('span');
        badge.className = 'resource-type-badge';
        badge.setAttribute('data-type', r.type.toLowerCase());
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

  /* --- Skeleton Loading --- */
  function showSkeleton() {
    var section = document.getElementById('resources-section');
    var pagination = document.getElementById('custom-pagination');
    for (var i = 0; i < perPage; i++) {
      var card = document.createElement('div');
      card.className = 'skeleton-card';
      card.innerHTML = '<div class="skeleton-line title"></div><div class="skeleton-line desc"></div>';
      section.insertBefore(card, pagination);
    }
  }

  function clearSkeleton() {
    var skeletons = document.querySelectorAll('.skeleton-card');
    for (var i = 0; i < skeletons.length; i++) skeletons[i].remove();
  }

  /* --- Error State --- */
  function showErrorState() {
    var section = document.getElementById('resources-section');
    var pagination = document.getElementById('custom-pagination');
    var msg = document.createElement('div');
    msg.className = 'error-state';
    msg.innerHTML = '<div class="error-state-icon">&#9888;</div><div class="error-state-text">' +
      (currentLanguage === 'pt' ? 'Erro ao carregar recursos. Tente recarregar a pagina.' : 'Failed to load resources. Try refreshing the page.') +
      '</div>';
    section.insertBefore(msg, pagination);
  }

  /* --- Load Data (with sanitization) --- */
  function loadData() {
    showSkeleton();
    fetch('data.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var clean = sanitizeData(data);
        resourcesData = clean || { en: { projects: [], useful: [] }, pt: { projects: [], useful: [] } };
        clearSkeleton();
        initApp();
        loadMediumPosts();
      })
      .catch(function () {
        resourcesData = { en: { projects: [], useful: [] }, pt: { projects: [], useful: [] } };
        clearSkeleton();
        showErrorState();
        initApp();
      });
  }

  /* --- Medium RSS Feed --- */
  function loadMediumPosts() {
    var rssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https://vagnerbomjesus.medium.com/feed';
    fetch(rssUrl)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status !== 'ok' || !data.items || !data.items.length) return;
        var posts = data.items.slice(0, 3);
        posts.forEach(function (post) {
          var item = {
            title: post.title.substring(0, 200),
            desc: post.description ? post.description.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '',
            link: post.link,
            type: 'article',
            featured: false
          };
          if (isValidURL(item.link)) {
            // Add to both languages (Medium posts are in original language)
            if (resourcesData && resourcesData.en) {
              resourcesData.en.projects.push(item);
            }
            if (resourcesData && resourcesData.pt) {
              resourcesData.pt.projects.push(item);
            }
          }
        });
        // Refresh current view
        var lang = currentLanguage;
        var data2 = resourcesData[lang];
        projectItems = data2.projects.map(function (r) {
          return { title: r.title, desc: r.desc, link: r.link, type: r.type || '', featured: r.featured || false };
        });
        if (currentCategory === 'projects') {
          setCategory('projects', true);
        }
      })
      .catch(function () { /* RSS feed optional */ });
  }

  /* --- Typing animation for role --- */
  function typeText(el, text, speed) {
    el.textContent = '';
    var i = 0;
    el.classList.add('typing-active');
    function tick() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(tick, speed || 30);
      } else {
        el.classList.remove('typing-active');
      }
    }
    tick();
  }

  /* --- Auto theme by time of day --- */
  function shouldBeDarkByTime() {
    var hour = new Date().getHours();
    return hour >= 19 || hour < 7;
  }

  /* --- Init --- */
  function initApp() {
    var savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches || shouldBeDarkByTime()) {
      setTheme(true);
    } else {
      setTheme(false);
    }

    var savedLang = localStorage.getItem('lang') || 'en';
    setLanguage(savedLang);
  }

  // Theme can be set immediately (no data dependency)
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme === 'dark');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches || shouldBeDarkByTime()) {
    setTheme(true);
  } else {
    setTheme(false);
  }

  loadData();

  /* --- GitHub Stats --- */
  (function () {
    var statsEl = document.getElementById('github-stats');
    if (!statsEl) return;
    fetch('https://api.github.com/users/VagnerBomJesus')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.message) return;
        statsEl.innerHTML =
          '<div class="github-stat"><span class="github-stat-value">' + (data.public_repos || 0) + '</span><span class="github-stat-label">Repos</span></div>' +
          '<div class="github-stat"><span class="github-stat-value">' + (data.followers || 0) + '</span><span class="github-stat-label">Followers</span></div>' +
          '<div class="github-stat"><span class="github-stat-value">' + (data.following || 0) + '</span><span class="github-stat-label">Following</span></div>';
        statsEl.classList.add('loaded');
      })
      .catch(function () {});
  })();

  /* --- Cookie Consent --- */
  var cookieBanner = document.getElementById('cookie-banner');
  var cookieAccept = document.getElementById('cookie-accept');
  var cookieText = document.getElementById('cookie-text');

  if (cookieBanner && !localStorage.getItem('cookie-consent')) {
    setTimeout(function () { cookieBanner.classList.add('visible'); }, 1000);
  }

  if (cookieAccept) {
    cookieAccept.addEventListener('click', function () {
      localStorage.setItem('cookie-consent', '1');
      cookieBanner.classList.remove('visible');
    });
  }

  /* --- Visitor Counter --- */
  (function () {
    var badge = document.getElementById('visitor-badge');
    if (!badge) return;
    fetch('https://api.countapi.xyz/hit/vagnerbomjesus.github.io/visits')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.value) {
          badge.textContent = data.value.toLocaleString() + ' visitors';
          badge.classList.add('loaded');
        }
      })
      .catch(function () {});
  })();

  /* --- Service Worker registration --- */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  /* --- Scroll reveal for resource cards --- */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, root: mainContainer || null });

    // Observe after render
    var origRender = renderResources;
    renderResources = function (page) {
      origRender(page);
      var cards = document.querySelectorAll('.resource-link');
      cards.forEach(function (card) {
        card.classList.add('scroll-reveal');
        revealObserver.observe(card);
      });
    };
  }

  /* --- Swipe pagination on mobile --- */
  var touchStartX = 0;
  var touchEndX = 0;
  var resourcesSection = document.getElementById('resources-section');

  if (resourcesSection) {
    resourcesSection.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    resourcesSection.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentPage < totalPages) {
          // Swipe left → next
          transitionResources(function () {
            currentPage++;
            renderResources(currentPage);
            renderPagination();
          });
        } else if (diff < 0 && currentPage > 1) {
          // Swipe right → prev
          transitionResources(function () {
            currentPage--;
            renderResources(currentPage);
            renderPagination();
          });
        }
      }
    }, { passive: true });
  }

  /* --- Subtle parallax on mobile scroll --- */
  var profileCol = document.querySelector('.profile-col');
  if (mainContainer && profileCol) {
    mainContainer.addEventListener('scroll', function () {
      var scrollY = mainContainer.scrollTop;
      profileCol.style.transform = 'translateY(' + (scrollY * 0.08) + 'px)';
    }, { passive: true });
  }

  /* --- Back to top (mobile) --- */
  var backToTopBtn = document.getElementById('back-to-top');
  var mainContainer = document.querySelector('.main-container');
  if (backToTopBtn && mainContainer) {
    mainContainer.addEventListener('scroll', function () {
      if (mainContainer.scrollTop > 200) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });
    backToTopBtn.addEventListener('click', function () {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Keyboard navigation --- */
  document.addEventListener('keydown', function (e) {
    // Skip if user is typing in search
    if (document.activeElement === searchInput) return;
    if (e.key === 'ArrowRight' && currentPage < totalPages) {
      transitionResources(function () {
        currentPage++;
        renderResources(currentPage);
        renderPagination();
      });
    } else if (e.key === 'ArrowLeft' && currentPage > 1) {
      transitionResources(function () {
        currentPage--;
        renderResources(currentPage);
        renderPagination();
      });
    } else if (e.key === '1') {
      setCategory('projects');
    } else if (e.key === '2') {
      setCategory('useful');
    }
  });

  /* --- Command Palette (Ctrl+K) --- */
  var cmdPalette = document.getElementById('command-palette');
  var cmdInput = document.getElementById('cmd-input');
  var cmdResults = document.getElementById('cmd-results');
  var cmdActiveIndex = -1;

  function openCmdPalette() {
    cmdPalette.classList.add('open');
    cmdInput.value = '';
    cmdActiveIndex = -1;
    renderCmdResults('');
    setTimeout(function () { cmdInput.focus(); }, 50);
  }

  function closeCmdPalette() {
    cmdPalette.classList.remove('open');
  }

  function getAllCmdItems() {
    var items = [];
    projectItems.forEach(function (r) { items.push({ label: r.title, type: 'project', link: r.link }); });
    usefulItems.forEach(function (r) { items.push({ label: r.title, type: 'link', link: r.link }); });
    items.push({ label: currentLanguage === 'pt' ? 'Mudar tema' : 'Toggle theme', type: 'action', action: function () { setTheme(!isDark()); } });
    items.push({ label: currentLanguage === 'pt' ? 'Mudar idioma' : 'Switch language', type: 'action', action: function () { setLanguage(currentLanguage === 'en' ? 'pt' : 'en'); } });
    return items;
  }

  function renderCmdResults(q) {
    var items = getAllCmdItems();
    if (q) {
      var ql = q.toLowerCase();
      items = items.filter(function (i) { return i.label.toLowerCase().indexOf(ql) !== -1; });
    }
    cmdResults.innerHTML = '';
    cmdActiveIndex = -1;
    items.slice(0, 8).forEach(function (item, idx) {
      var div = document.createElement('div');
      div.className = 'cmd-result-item';
      div.innerHTML = '<span class="cmd-result-type">' + item.type.toUpperCase() + '</span><span class="cmd-result-label">' + item.label + '</span>';
      div.addEventListener('click', function () {
        closeCmdPalette();
        if (item.action) { item.action(); }
        else if (item.link) { window.open(item.link, '_blank'); }
      });
      cmdResults.appendChild(div);
    });
  }

  if (cmdInput) {
    cmdInput.addEventListener('input', function () {
      renderCmdResults(cmdInput.value.trim());
    });
    cmdInput.addEventListener('keydown', function (e) {
      var items = cmdResults.querySelectorAll('.cmd-result-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdActiveIndex = Math.min(cmdActiveIndex + 1, items.length - 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cmdActiveIndex = Math.max(cmdActiveIndex - 1, 0); }
      else if (e.key === 'Enter' && cmdActiveIndex >= 0 && items[cmdActiveIndex]) { items[cmdActiveIndex].click(); return; }
      else if (e.key === 'Escape') { closeCmdPalette(); return; }
      for (var xi = 0; xi < items.length; xi++) items[xi].classList.toggle('active', xi === cmdActiveIndex);
    });
  }

  if (cmdPalette) {
    cmdPalette.querySelector('.cmd-palette-backdrop').addEventListener('click', closeCmdPalette);
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (cmdPalette.classList.contains('open')) closeCmdPalette();
      else openCmdPalette();
    }
  });

  /* --- Easter Egg: Konami Code --- */
  var konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  var konamiIndex = 0;
  document.addEventListener('keydown', function (e) {
    if (e.keyCode === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        konamiIndex = 0;
        activateEasterEgg();
      }
    } else {
      konamiIndex = 0;
    }
  });

  function activateEasterEgg() {
    var el = document.createElement('div');
    el.className = 'easter-egg';
    el.textContent = currentLanguage === 'pt' ? 'Encontraste o segredo! \u{1F680}' : 'You found the secret! \u{1F680}';
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('visible'); }, 10);
    setTimeout(function () {
      el.classList.remove('visible');
      setTimeout(function () { el.remove(); }, 500);
    }, 3000);
    // Bonus: rainbow avatar
    var avatar = document.querySelector('.avatar');
    if (avatar) {
      avatar.style.animation = 'rainbow-ring 1s linear 3';
      setTimeout(function () { avatar.style.animation = ''; }, 3000);
    }
  }

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

  /* --- Matrix Rain (activated by triple-click on brand) --- */
  var matrixCanvas = null;
  var matrixActive = false;

  function startMatrix() {
    if (matrixActive) { stopMatrix(); return; }
    matrixActive = true;
    matrixCanvas = document.createElement('canvas');
    matrixCanvas.className = 'matrix-canvas';
    document.body.appendChild(matrixCanvas);
    var ctx = matrixCanvas.getContext('2d');
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    var cols = Math.floor(matrixCanvas.width / 14);
    var drops = [];
    for (var ci = 0; ci < cols; ci++) drops[ci] = Math.random() * -100;

    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()';
    var accentColor = isDark() ? '#7baaf7' : '#1e3a5f';

    function draw() {
      if (!matrixActive) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      ctx.fillStyle = accentColor;
      ctx.font = '12px monospace';
      for (var mi = 0; mi < drops.length; mi++) {
        var ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, mi * 14, drops[mi] * 14);
        if (drops[mi] * 14 > matrixCanvas.height && Math.random() > 0.975) {
          drops[mi] = 0;
        }
        drops[mi]++;
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  function stopMatrix() {
    matrixActive = false;
    if (matrixCanvas) { matrixCanvas.remove(); matrixCanvas = null; }
  }

  var brand = document.querySelector('.toolbar-brand');
  if (brand) {
    var clickCount = 0;
    var clickTimer = null;
    brand.addEventListener('click', function () {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(function () { clickCount = 0; }, 500);
      if (clickCount >= 3) {
        clickCount = 0;
        startMatrix();
      }
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

  var pendingRipple = null;
  document.addEventListener('mousemove', function (e) {
    if (!hasHover) return;
    pendingRipple = e;
  });

  function processRipple() {
    requestAnimationFrame(processRipple);
    if (!pendingRipple) return;
    var e = pendingRipple;
    pendingRipple = null;

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
  }
  requestAnimationFrame(processRipple);
})();
