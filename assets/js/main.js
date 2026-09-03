/* ==========================================================================
   Vagner Bom Jesus — Portfolio
   Main logic: navigation, i18n (EN/PT), portfolio (data/data.json),
   contact form (mailto), cookie banner, scroll effects, service worker.
   Vanilla JS, no build step.
   ========================================================================== */
(function () {
  'use strict';

  var DATA_URL = 'data/data.json';
  var STORAGE_LANG = 'lang';
  var STORAGE_COOKIES = 'cookiesAccepted';

  /* ------------------------------------------------------------------ */
  /* Translations                                                        */
  /* ------------------------------------------------------------------ */
  var translations = {
    en: {
      'skip': 'Skip to content',
      'nav.about': 'About me',
      'nav.process': 'Process',
      'nav.skills': 'Skills',
      'nav.portfolio': 'Portfolio',
      'nav.contact': 'Contact me',
      'hero.greeting': 'Hi, I am',
      'hero.role': 'Software Engineer · Flutter Developer · Information Security',
      'hero.cta1': 'See my work',
      'hero.cta2': 'Experience',
      'hero.note': 'Based in Portugal · Open to collaboration',
      'featured.desc': 'TBDB is a multimodal platform for biomimicry research: a web application, an Android app and the VITA chatbot that help researchers, students and designers explore biological strategies and turn them into innovation. Built with Flutter and Dart, documented in academic publications.',
      'featured.cta': 'Read more',
      'featured.apk': 'Android app',
      'about.title': 'About me',
      'about.p1': 'My name is Vagner Bom Jesus. I am a Software Engineer from Portugal, graduate of the Instituto Politécnico da Guarda, working mainly with Flutter and Dart to build cross-platform mobile and web applications.',
      'about.p2': 'I created The Biomimicry Database (TBDB) and I publish academic and technical writing on Medium and Google Scholar. I am passionate about information security, clean architecture and turning research into products people actually use.',
      'about.cta': 'Explore',
      'process.title': 'How I work',
      'process.intro': 'Every project follows the same three steps — from the first sketch to a product that stays secure and up to date.',
      'process.s1.title': 'Design',
      'process.s1.desc': 'I analyse the requirements, model the data and design the interface based on your needs and suggestions. I can also start from an existing design by consulting with you.',
      'process.s2.title': 'Development',
      'process.s2.desc': 'Based on the approved design, I build the application with Flutter, Dart and modern web technologies — fully functional, responsive and version-controlled with Git.',
      'process.s3.title': 'Security & Maintenance',
      'process.s3.desc': 'In case of problems or the need for changes, I introduce new functionalities, review the code for security issues (OWASP) and keep dependencies up to date.',
      'skills.title': 'Skills',
      'skills.now': 'Using now:',
      'skills.learning': 'Learning:',
      'skills.other': 'Other skills:',
      'skills.pt': 'Portuguese<br>Native',
      'skills.en': 'English<br>Professional',
      'skills.sec': 'Information<br>Security',
      'skills.bio': 'Biomimicry<br>Research',
      'portfolio.all': 'All',
      'portfolio.projects': 'Projects',
      'portfolio.useful': 'Useful links',
      'portfolio.empty': 'Nothing here yet.',
      'portfolio.more': 'And many more to come!',
      'portfolio.open': 'Open',
      'portfolio.featured': 'Featured',
      'portfolio.new': 'New',
      'portfolio.loadError': 'Could not load the portfolio right now. Please try again later.',
      'type.apk': 'Android app',
      'type.website': 'Website',
      'type.article': 'Articles',
      'type.pdf': 'Publication',
      'type.default': 'Link',
      'contact.title': 'Contact',
      'contact.intro': 'Have a project in mind, a research collaboration or just want to say hello? Fill in the form and your email client will open with the message ready to send — or write directly to <a href="mailto:vagneripg@gmail.com">vagneripg@gmail.com</a>.',
      'contact.name': 'Enter your name*',
      'contact.email': 'Enter your email*',
      'contact.subject': 'Subject',
      'contact.message': 'Your message*',
      'contact.submit': 'Submit',
      'contact.errRequired': 'Please fill in your name, a valid email and a message.',
      'contact.ok': 'Opening your email client… If nothing happens, write to vagneripg@gmail.com.',
      'contact.subjectDefault': 'Contact from vagnerbomjesus.github.io',
      'footer.top': 'Back to top',
      'footer.rights': 'All rights reserved.',
      'footer.privacy': 'Privacy Policy',
      'footer.terms': 'Terms of Service',
      'cookie.text': 'This site uses cookies for analytics and advertising. By continuing, you accept our <a href="privacy-policy.html">Privacy Policy</a>.',
      'cookie.accept': 'Accept'
    },
    pt: {
      'skip': 'Saltar para o conteúdo',
      'nav.about': 'Sobre mim',
      'nav.process': 'Processo',
      'nav.skills': 'Competências',
      'nav.portfolio': 'Portfólio',
      'nav.contact': 'Contactar',
      'hero.greeting': 'Olá, eu sou',
      'hero.role': 'Engenheiro de Software · Flutter Developer · Segurança da Informação',
      'hero.cta1': 'Ver trabalhos',
      'hero.cta2': 'Experiência',
      'hero.note': 'Portugal · Disponível para colaborações',
      'featured.desc': 'A TBDB é uma plataforma multimodal para investigação em biomimética: uma aplicação web, uma app Android e o chatbot VITA que ajudam investigadores, estudantes e designers a explorar estratégias biológicas e transformá-las em inovação. Construída com Flutter e Dart e documentada em publicações académicas.',
      'featured.cta': 'Saber mais',
      'featured.apk': 'App Android',
      'about.title': 'Sobre mim',
      'about.p1': 'Chamo-me Vagner Bom Jesus. Sou Engenheiro de Software, formado pelo Instituto Politécnico da Guarda, e trabalho sobretudo com Flutter e Dart na construção de aplicações móveis e web multiplataforma.',
      'about.p2': 'Criei a The Biomimicry Database (TBDB) e publico artigos académicos e técnicos no Medium e no Google Scholar. Sou apaixonado por segurança da informação, arquitetura limpa e por transformar investigação em produtos que as pessoas realmente usam.',
      'about.cta': 'Explorar',
      'process.title': 'Como trabalho',
      'process.intro': 'Todos os projetos seguem os mesmos três passos — do primeiro esboço a um produto que se mantém seguro e atualizado.',
      'process.s1.title': 'Design',
      'process.s1.desc': 'Analiso os requisitos, modelo os dados e desenho a interface com base nas tuas necessidades e sugestões. Também posso partir de um design existente, em conjunto contigo.',
      'process.s2.title': 'Desenvolvimento',
      'process.s2.desc': 'Com o design aprovado, construo a aplicação com Flutter, Dart e tecnologias web modernas — totalmente funcional, responsiva e versionada com Git.',
      'process.s3.title': 'Segurança & Manutenção',
      'process.s3.desc': 'Em caso de problemas ou necessidade de alterações, introduzo novas funcionalidades, revejo o código quanto a falhas de segurança (OWASP) e mantenho as dependências atualizadas.',
      'skills.title': 'Competências',
      'skills.now': 'Uso atualmente:',
      'skills.learning': 'A aprender:',
      'skills.other': 'Outras competências:',
      'skills.pt': 'Português<br>Nativo',
      'skills.en': 'Inglês<br>Profissional',
      'skills.sec': 'Segurança da<br>Informação',
      'skills.bio': 'Investigação em<br>Biomimética',
      'portfolio.all': 'Todos',
      'portfolio.projects': 'Projetos',
      'portfolio.useful': 'Links úteis',
      'portfolio.empty': 'Ainda não há nada aqui.',
      'portfolio.more': 'E muitos mais a caminho!',
      'portfolio.open': 'Abrir',
      'portfolio.featured': 'Destaque',
      'portfolio.new': 'Novo',
      'portfolio.loadError': 'Não foi possível carregar o portfólio. Tenta novamente mais tarde.',
      'type.apk': 'App Android',
      'type.website': 'Website',
      'type.article': 'Artigos',
      'type.pdf': 'Publicação',
      'type.default': 'Link',
      'contact.title': 'Contacto',
      'contact.intro': 'Tens um projeto em mente, uma colaboração de investigação ou só queres dizer olá? Preenche o formulário e o teu cliente de email abre com a mensagem pronta a enviar — ou escreve diretamente para <a href="mailto:vagneripg@gmail.com">vagneripg@gmail.com</a>.',
      'contact.name': 'Introduz o teu nome*',
      'contact.email': 'Introduz o teu email*',
      'contact.subject': 'Assunto',
      'contact.message': 'A tua mensagem*',
      'contact.submit': 'Enviar',
      'contact.errRequired': 'Preenche o nome, um email válido e a mensagem.',
      'contact.ok': 'A abrir o teu cliente de email… Se nada acontecer, escreve para vagneripg@gmail.com.',
      'contact.subjectDefault': 'Contacto via vagnerbomjesus.github.io',
      'footer.top': 'Voltar ao topo',
      'footer.rights': 'Todos os direitos reservados.',
      'footer.privacy': 'Política de Privacidade',
      'footer.terms': 'Termos de Serviço',
      'cookie.text': 'Este site usa cookies para análise e publicidade. Ao continuar, aceitas a nossa <a href="privacy-policy.html">Política de Privacidade</a>.',
      'cookie.accept': 'Aceitar'
    }
  };

  /* Keys whose value contains trusted markup authored above (never user data). */
  var HTML_KEYS = { 'skills.pt': 1, 'skills.en': 1, 'skills.sec': 1, 'skills.bio': 1, 'contact.intro': 1, 'cookie.text': 1 };

  var currentLang = 'en';

  function t(key) {
    var dict = translations[currentLang] || translations.en;
    return dict[key] !== undefined ? dict[key] : (translations.en[key] !== undefined ? translations.en[key] : key);
  }

  function applyTranslations() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      var value = t(key);
      if (HTML_KEYS[key]) nodes[i].innerHTML = value; else nodes[i].textContent = value;
    }
    document.documentElement.lang = currentLang === 'pt' ? 'pt-PT' : 'en';
    var btns = document.querySelectorAll('.lang-switch__btn');
    for (var j = 0; j < btns.length; j++) {
      var active = btns[j].getAttribute('data-lang') === currentLang;
      btns[j].classList.toggle('is-active', active);
      btns[j].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    renderPortfolio();
  }

  function setLanguage(lang) {
    currentLang = translations[lang] ? lang : 'en';
    try { localStorage.setItem(STORAGE_LANG, currentLang); } catch (e) { /* storage unavailable */ }
    applyTranslations();
  }

  function detectLanguage() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_LANG); } catch (e) { /* ignore */ }
    if (saved && translations[saved]) return saved;
    var nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return nav.indexOf('pt') === 0 ? 'pt' : 'en';
  }

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');
  var nav = document.getElementById('site-nav');
  var navToggle = document.getElementById('nav-toggle');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', currentLang === 'pt' ? 'Abrir menu' : 'Open menu');
    }
  }

  function openNav() {
    if (!nav) return;
    nav.classList.add('is-open');
    document.body.classList.add('nav-open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', currentLang === 'pt' ? 'Fechar menu' : 'Close menu');
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) closeNav(); else openNav();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
  }

  var langBtns = document.querySelectorAll('.lang-switch__btn');
  for (var l = 0; l < langBtns.length; l++) {
    langBtns[l].addEventListener('click', function () { setLanguage(this.getAttribute('data-lang')); });
  }

  /* Active section highlighting + header shadow + progress + back-to-top */
  var progress = document.getElementById('scroll-progress');
  var backToTop = document.getElementById('back-to-top');
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.site-nav__link');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (progress) progress.style.width = (docH > 0 ? Math.min(100, (y / docH) * 100) : 0) + '%';
    if (backToTop) backToTop.classList.toggle('is-visible', y > 500);

    var currentId = '';
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= 120) currentId = sections[i].id;
    }
    for (var j = 0; j < navLinks.length; j++) {
      navLinks[j].classList.toggle('is-active', navLinks[j].getAttribute('href') === '#' + currentId);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                       */
  /* ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-visible');
          io.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    for (var r = 0; r < revealEls.length; r++) io.observe(revealEls[r]);
  } else {
    document.documentElement.classList.add('no-observer');
  }

  /* ------------------------------------------------------------------ */
  /* Portfolio (data/data.json)                                          */
  /* ------------------------------------------------------------------ */
  var grid = document.getElementById('portfolio-grid');
  var emptyMsg = document.getElementById('portfolio-empty');
  var filterBtns = document.querySelectorAll('.filter-btn');
  var currentFilter = 'all';
  var portfolioData = null; // { en: {projects, useful}, pt: {...} }
  var loadFailed = false;

  var TYPE_ICON = {
    apk: 'fab fa-android',
    website: 'fas fa-globe',
    article: 'fab fa-medium',
    pdf: 'fas fa-file-pdf'
  };

  function isValidURL(str) {
    try {
      var url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) { return false; }
  }

  function sanitizeItem(item, category) {
    if (!item || typeof item !== 'object') return null;
    if (typeof item.title !== 'string' || typeof item.desc !== 'string' || typeof item.link !== 'string') return null;
    if (!isValidURL(item.link)) return null;
    return {
      title: item.title.substring(0, 200),
      desc: item.desc.substring(0, 500),
      link: item.link.substring(0, 2000),
      type: typeof item.type === 'string' ? item.type.substring(0, 20) : '',
      featured: item.featured === true,
      isNew: item.isNew === true,
      category: category
    };
  }

  function sanitizeLang(obj) {
    if (!obj || typeof obj !== 'object') return { projects: [], useful: [] };
    var out = { projects: [], useful: [] };
    var cats = ['projects', 'useful'];
    for (var c = 0; c < cats.length; c++) {
      var arr = Array.isArray(obj[cats[c]]) ? obj[cats[c]] : [];
      for (var i = 0; i < arr.length; i++) {
        var clean = sanitizeItem(arr[i], cats[c]);
        if (clean) out[cats[c]].push(clean);
      }
    }
    return out;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildCard(item) {
    var card = el('article', 'card');
    card.setAttribute('data-category', item.category);

    var head = el('div', 'card__head');
    var type = el('span', 'card__type');
    var icon = el('i', TYPE_ICON[item.type] || 'fas fa-link');
    icon.setAttribute('aria-hidden', 'true');
    type.appendChild(icon);
    type.appendChild(document.createTextNode(t(TYPE_ICON[item.type] ? 'type.' + item.type : 'type.default')));
    head.appendChild(type);

    if (item.featured || item.isNew) {
      var badges = el('div', 'card__badges');
      if (item.featured) badges.appendChild(el('span', 'badge badge--featured', t('portfolio.featured')));
      if (item.isNew) badges.appendChild(el('span', 'badge badge--new', t('portfolio.new')));
      head.appendChild(badges);
    }
    card.appendChild(head);

    card.appendChild(el('h3', 'card__title', item.title));
    card.appendChild(el('p', 'card__desc', item.desc));

    var link = el('a', 'card__link');
    link.href = item.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', t('portfolio.open') + ': ' + item.title);
    link.appendChild(document.createTextNode(t('portfolio.open')));
    var arrow = el('i', 'fas fa-arrow-up-right-from-square');
    arrow.setAttribute('aria-hidden', 'true');
    link.appendChild(arrow);
    card.appendChild(link);
    return card;
  }

  function renderPortfolio() {
    if (!grid) return;
    if (loadFailed) {
      grid.innerHTML = '';
      if (emptyMsg) { emptyMsg.textContent = t('portfolio.loadError'); emptyMsg.hidden = false; }
      return;
    }
    if (!portfolioData) return;

    var data = portfolioData[currentLang] || portfolioData.en;
    var items = [];
    if (currentFilter === 'all' || currentFilter === 'projects') items = items.concat(data.projects);
    if (currentFilter === 'all' || currentFilter === 'useful') items = items.concat(data.useful);

    // Featured first, then new, keep original order otherwise
    items.sort(function (a, b) {
      return (b.featured - a.featured) || (b.isNew - a.isNew);
    });

    grid.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) {
      var card = buildCard(items[i]);
      card.style.animationDelay = Math.min(i * 60, 420) + 'ms';
      frag.appendChild(card);
    }
    grid.appendChild(frag);
    if (emptyMsg) { emptyMsg.textContent = t('portfolio.empty'); emptyMsg.hidden = items.length > 0; }
  }

  function setFilter(filter) {
    currentFilter = filter;
    for (var i = 0; i < filterBtns.length; i++) {
      var active = filterBtns[i].getAttribute('data-filter') === filter;
      filterBtns[i].classList.toggle('is-active', active);
      filterBtns[i].setAttribute('aria-selected', active ? 'true' : 'false');
    }
    renderPortfolio();
  }

  for (var f = 0; f < filterBtns.length; f++) {
    filterBtns[f].addEventListener('click', function () { setFilter(this.getAttribute('data-filter')); });
  }

  function loadPortfolio() {
    if (!grid) return;

    // Local preview published from the admin panel (/admin → "Apply") takes precedence.
    try {
      var stored = localStorage.getItem('portfolioData');
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.en && parsed.pt) {
          portfolioData = { en: sanitizeLang(parsed.en), pt: sanitizeLang(parsed.pt) };
          renderPortfolio();
          return;
        }
      }
    } catch (e) { /* fall through to network */ }

    if (typeof fetch !== 'function') return;
    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function (json) {
        portfolioData = {
          en: sanitizeLang(json && json.en),
          pt: sanitizeLang(json && json.pt)
        };
        renderPortfolio();
      })
      .catch(function () {
        loadFailed = true;
        renderPortfolio();
      });
  }

  /* ------------------------------------------------------------------ */
  /* Contact form (mailto)                                               */
  /* ------------------------------------------------------------------ */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = form.getAttribute('data-email') || '';
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var subject = form.elements.subject.value.trim();
      var message = form.elements.message.value.trim();

      var invalid = false;
      var fields = [form.elements.name, form.elements.email, form.elements.message];
      for (var i = 0; i < fields.length; i++) fields[i].classList.remove('is-invalid');
      if (!name) { form.elements.name.classList.add('is-invalid'); invalid = true; }
      if (!isValidEmail(email)) { form.elements.email.classList.add('is-invalid'); invalid = true; }
      if (!message) { form.elements.message.classList.add('is-invalid'); invalid = true; }

      if (invalid) {
        status.className = 'form-status is-error';
        status.textContent = t('contact.errRequired');
        return;
      }

      var body = name + ' <' + email + '>\n\n' + message;
      var href = 'mailto:' + encodeURIComponent(to) +
        '?subject=' + encodeURIComponent(subject || t('contact.subjectDefault')) +
        '&body=' + encodeURIComponent(body);

      status.className = 'form-status is-ok';
      status.textContent = t('contact.ok');
      window.location.href = href;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Cookie banner                                                       */
  /* ------------------------------------------------------------------ */
  var cookieBanner = document.getElementById('cookie-banner');
  var cookieAccept = document.getElementById('cookie-accept');
  if (cookieBanner) {
    var accepted = false;
    try { accepted = localStorage.getItem(STORAGE_COOKIES) === '1'; } catch (e) { /* ignore */ }
    if (!accepted) cookieBanner.hidden = false;
    if (cookieAccept) {
      cookieAccept.addEventListener('click', function () {
        try { localStorage.setItem(STORAGE_COOKIES, '1'); } catch (e) { /* ignore */ }
        cookieBanner.hidden = true;
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Misc                                                                */
  /* ------------------------------------------------------------------ */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* offline support is optional */ });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                */
  /* ------------------------------------------------------------------ */
  currentLang = detectLanguage();
  applyTranslations();
  loadPortfolio();
  onScroll();
})();
