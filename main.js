/* === Portfolio - Main Logic === */

(function () {
  'use strict';

  /* --- Data --- */
  var resourcesData = {
    en: {
      projects: [
        { title: 'TBDB - The Biomimicry Database (Android)', desc: 'Official APK for the biomimicry platform', link: 'https://apkpure.com/th/t-b-d-b/pt.tbdb.bjtech/' },
        { title: 'The Biomimicry Database', desc: 'Multimodal platform for biomimicry research', link: 'https://thebiomimicrydb.vercel.app/' },
        { title: 'Blog on Medium', desc: 'Technical and scientific articles', link: 'https://vagnerbomjesus.medium.com/' },
        { title: 'TBDB | VITA ChatBot', desc: 'Development documentation of a multimodal knowledge sharing platform', link: 'https://bdigital.ipg.pt/dspace/bitstream/10314/10107/1/CM%20-%20Vagner%20B%20Jesus.pdf' },
        { title: 'Google Scholar', desc: 'Academic publications and citations', link: 'https://scholar.google.com/citations?user=K-IfdJoAAAAJ&hl=pt-PT&oi=ao' }
      ],
      useful: [
        { title: 'ENISA - EU Agency for Cybersecurity', desc: 'European Union Agency for Cybersecurity', link: 'https://www.enisa.europa.eu/' }
      ]
    },
    pt: {
      projects: [
        { title: 'TBDB - The Biomimicry Database (Android)', desc: 'APK oficial da plataforma de biomimetica', link: 'https://apkpure.com/th/t-b-d-b/pt.tbdb.bjtech/' },
        { title: 'The Biomimicry Database', desc: 'Plataforma multimodal para investigacao em biomimetica', link: 'https://thebiomimicrydb.vercel.app/' },
        { title: 'Blog no Medium', desc: 'Artigos tecnicos e cientificos', link: 'https://vagnerbomjesus.medium.com/' },
        { title: 'TBDB | ChatBot VITA', desc: 'Documentacao do desenvolvimento de uma plataforma multimodal para partilha de conhecimento', link: 'https://bdigital.ipg.pt/dspace/bitstream/10314/10107/1/CM%20-%20Vagner%20B%20Jesus.pdf' },
        { title: 'Google Scholar', desc: 'Publicacoes academicas e citacoes', link: 'https://scholar.google.com/citations?user=K-IfdJoAAAAJ&hl=pt-PT&oi=ao' }
      ],
      useful: [
        { title: 'ENISA - Agencia da UE para a Ciberseguranca', desc: 'Agencia da Uniao Europeia para a Ciberseguranca', link: 'https://www.enisa.europa.eu/' }
      ]
    }
  };

  var translations = {
    en: {
      role: 'Software Engineering | Flutter Developer | Information Security Enthusiast',
      bio: 'I create ideas and develop solutions in the form of software, with a particular focus on information security, data protection and the development of innovative applications.',
      experience: 'Experience',
      education: 'Education',
      projects: 'Projects',
      useful: 'Useful Links',
      prev: '\u2190 Previous',
      next: 'Next \u2192',
      page: function (c, t) { return c + ' / ' + t; },
      followers: 'followers',
      repos: 'repos',
      gists: 'gists',
      resourcesHeading: 'Projects & Resources',
      resourcesCount: function (n) { return n + ' items'; },
      footer: '\u00A9 2026 Vagner Bom Jesus \u00B7 All rights reserved.'
    },
    pt: {
      role: 'Engenharia de Software | Desenvolvedor Flutter | Entusiasta de Seguranca da Informacao',
      bio: 'Eu crio ideias e desenvolvo solucoes na forma de software, com foco particular em seguranca da informacao, protecao de dados e desenvolvimento de aplicacoes inovadoras.',
      experience: 'Experiencia',
      education: 'Formacao academica',
      projects: 'Projetos',
      useful: 'Links uteis',
      prev: '\u2190 Anterior',
      next: 'Proxima \u2192',
      page: function (c, t) { return c + ' / ' + t; },
      followers: 'seguidores',
      repos: 'repos',
      gists: 'gists',
      resourcesHeading: 'Projetos e Recursos',
      resourcesCount: function (n) { return n + ' itens'; },
      footer: '\u00A9 2026 Vagner Bom Jesus \u00B7 Todos os direitos reservados.'
    }
  };

  /* --- State --- */
  var currentLanguage = 'en';
  var resources = [];
  var perPage = 5;
  var currentPage = 1;
  var totalPages = 1;

  /* --- DOM refs --- */
  var themeBtn = document.getElementById('toggle-theme');
  var langSelect = document.getElementById('language-select');
  var btnExp = document.getElementById('btn-experience');
  var btnEdu = document.getElementById('btn-education');
  var profileBio = document.getElementById('profile-bio');
  var profileRole = document.getElementById('profile-role');
  var statFollowersLabel = document.getElementById('stat-followers-label');
  var statReposLabel = document.getElementById('stat-repos-label');
  var statGistsLabel = document.getElementById('stat-gists-label');
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
    currentLanguage = lang;
    langSelect.value = lang;
    localStorage.setItem('lang', lang);

    var t = translations[lang];
    var data = resourcesData[lang];

    profileRole.textContent = t.role;
    profileBio.textContent = t.bio;
    btnExp.textContent = t.experience;
    btnEdu.textContent = t.education;
    statFollowersLabel.textContent = t.followers;
    statReposLabel.textContent = t.repos;
    statGistsLabel.textContent = t.gists;
    resourcesHeading.textContent = t.resourcesHeading;
    footerText.innerHTML = t.footer;

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
      a.href = r.link;
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
    pag.innerHTML = '';
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

  /* --- Init --- */
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
  } else {
    setTheme(false);
  }

  var savedLang = localStorage.getItem('lang') || 'en';
  setLanguage(savedLang);
})();
