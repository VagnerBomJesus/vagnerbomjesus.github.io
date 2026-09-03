/* ==========================================================================
   Vagner Bom Jesus | Portfolio
   Main logic: navigation, i18n (EN/PT), portfolio (data/data.json),
   contact form (mailto), cookie banner, scroll effects, service worker.
   Vanilla JS, no build step.
   ========================================================================== */
(function () {
  'use strict';

  var DATA_URL = 'data/data.json';
  var STORAGE_LANG = 'lang';
  var STORAGE_COOKIES = 'cookieConsent'; // 'granted' | 'denied' (unset = not decided yet)
  var ADSENSE_CLIENT = 'ca-pub-2308250412069180';

  function gtagSafe() {
    if (typeof window.gtag === 'function') window.gtag.apply(window, arguments);
    else { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }
  }

  /* Report a custom event to GA4 (no-op if analytics is blocked). */
  function track(name, params) {
    try { gtagSafe('event', name, params || {}); } catch (e) { /* ignore */ }
  }

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
      'about.p1': 'My name is Vagner Bom Jesus and I am a Software Engineer based in Portugal, graduate of the Instituto Politécnico da Guarda (IPG). I work mainly with Flutter and Dart to design and build cross-platform applications that run from a single codebase on Android, iOS and the web, with a strong focus on clean architecture, maintainability and a careful user experience.',
      'about.p2': 'My path brings together software engineering and applied research. I am the creator of The Biomimicry Database (TBDB), a multimodal platform that helps researchers, students and designers explore biological strategies and translate them into real-world innovation. The project spans a web application, an Android app and the VITA chatbot, and its development is documented in an academic dissertation and in peer-reviewed and technical publications.',
      'about.p3': 'Alongside development, I care deeply about information security. I follow OWASP best practices, review code for common vulnerabilities and treat privacy and data protection as first-class requirements rather than afterthoughts. I believe software should be not only functional and beautiful, but also safe and trustworthy for the people who use it.',
      'about.p4': 'I also enjoy sharing what I learn. I write technical and scientific articles on Medium, publish academic work indexed on Google Scholar, and contribute to open knowledge whenever I can. When I take on a project, my goal is always the same: to turn ideas and research into products that people genuinely find useful.',
      'about.cta': 'Explore',
      'exp.title': 'What I do',
      'exp.intro': 'Three areas where I focus my work, combining engineering discipline with research and a security-first mindset.',
      'exp.a.title': 'Cross-platform development',
      'exp.a.text': 'Using Flutter and Dart I build mobile and web apps from one codebase, keeping performance, accessibility and a consistent design across devices. From data modelling and state management to release and store publishing, I follow clean-architecture principles so the code stays readable and easy to evolve. I also work with Firebase, REST APIs and Git-based workflows.',
      'exp.b.title': 'Information security',
      'exp.b.text': 'Security is part of how I build, not a step at the end. I apply OWASP guidance, validate and sanitise input, protect against common web and mobile vulnerabilities, and design with privacy and GDPR in mind. My interest in cybersecurity also feeds my writing and continuous learning, from secure coding to threat awareness.',
      'exp.c.title': 'Research & biomimicry',
      'exp.c.text': 'Through The Biomimicry Database I connect software with nature-inspired innovation, helping people discover how biological strategies can solve human problems. This work sits at the intersection of academic research and product development, and it is documented in publications and a dissertation, with a multimodal platform and the VITA chatbot as tangible outcomes.',
      'process.title': 'How I work',
      'process.intro': 'Every project follows the same three steps: from the first sketch to a product that stays secure and up to date.',
      'process.s1.title': 'Design',
      'process.s1.desc': 'I analyse the requirements, model the data and design the interface based on your needs and suggestions. I can also start from an existing design by consulting with you.',
      'process.s2.title': 'Development',
      'process.s2.desc': 'Based on the approved design, I build the application with Flutter, Dart and modern web technologies, fully functional, responsive and version-controlled with Git.',
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
      'contact.intro': 'Have a project in mind, a research collaboration or just want to say hello? Fill in the form and your email client will open with the message ready to send, or write directly to <a href="mailto:vagneripg@gmail.com">vagneripg@gmail.com</a>.',
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
      'cookie.title': 'Cookies',
      'cookie.text': 'This site uses cookies for analytics (Google Analytics) and advertising (Google AdSense). You can accept or reject them; essential settings such as language are always stored. See the <a href="privacy-policy.html">Privacy Policy</a>.',
      'cookie.accept': 'Accept all',
      'cookie.reject': 'Reject',
      'ads.label': 'Advertisement',
      'footer.cookies': 'Cookie settings'
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
      'about.p1': 'Chamo-me Vagner Bom Jesus e sou Engenheiro de Software em Portugal, formado pelo Instituto Politécnico da Guarda (IPG). Trabalho sobretudo com Flutter e Dart para desenhar e construir aplicações multiplataforma a partir de um único código-base, correndo em Android, iOS e web, com forte foco em arquitetura limpa, manutenibilidade e uma experiência de utilizador cuidada.',
      'about.p2': 'O meu percurso junta engenharia de software e investigação aplicada. Sou o criador da The Biomimicry Database (TBDB), uma plataforma multimodal que ajuda investigadores, estudantes e designers a explorar estratégias biológicas e a traduzi-las em inovação real. O projeto inclui uma aplicação web, uma app Android e o chatbot VITA, e o seu desenvolvimento está documentado numa dissertação académica e em publicações científicas e técnicas.',
      'about.p3': 'A par do desenvolvimento, dou muita importância à segurança da informação. Sigo as boas práticas da OWASP, revejo o código quanto a vulnerabilidades comuns e trato a privacidade e a proteção de dados como requisitos de primeira ordem, e não como algo secundário. Acredito que o software deve ser não só funcional e bonito, mas também seguro e de confiança para quem o usa.',
      'about.p4': 'Gosto também de partilhar o que aprendo. Escrevo artigos técnicos e científicos no Medium, publico trabalho académico indexado no Google Scholar e contribuo para o conhecimento aberto sempre que posso. Quando abraço um projeto, o objetivo é sempre o mesmo: transformar ideias e investigação em produtos que as pessoas realmente considerem úteis.',
      'about.cta': 'Explorar',
      'exp.title': 'O que faço',
      'exp.intro': 'Três áreas onde concentro o meu trabalho, combinando disciplina de engenharia com investigação e uma mentalidade de segurança em primeiro lugar.',
      'exp.a.title': 'Desenvolvimento multiplataforma',
      'exp.a.text': 'Com Flutter e Dart construo apps móveis e web a partir de um só código-base, mantendo desempenho, acessibilidade e um design consistente entre dispositivos. Da modelação de dados e gestão de estado à publicação nas lojas, sigo princípios de arquitetura limpa para o código se manter legível e fácil de evoluir. Trabalho também com Firebase, APIs REST e fluxos de trabalho com Git.',
      'exp.b.title': 'Segurança da informação',
      'exp.b.text': 'A segurança faz parte da forma como construo, não é um passo no fim. Aplico as orientações da OWASP, valido e sanitizo dados de entrada, protejo contra vulnerabilidades comuns na web e em mobile, e desenho a pensar na privacidade e no RGPD. O meu interesse por cibersegurança alimenta também a minha escrita e aprendizagem contínua, do código seguro à consciência de ameaças.',
      'exp.c.title': 'Investigação & biomimética',
      'exp.c.text': 'Através da The Biomimicry Database ligo o software à inovação inspirada na natureza, ajudando as pessoas a descobrir como as estratégias biológicas podem resolver problemas humanos. Este trabalho situa-se no cruzamento entre a investigação académica e o desenvolvimento de produto, e está documentado em publicações e numa dissertação, tendo como resultados concretos uma plataforma multimodal e o chatbot VITA.',
      'process.title': 'Como trabalho',
      'process.intro': 'Todos os projetos seguem os mesmos três passos: do primeiro esboço a um produto que se mantém seguro e atualizado.',
      'process.s1.title': 'Design',
      'process.s1.desc': 'Analiso os requisitos, modelo os dados e desenho a interface com base nas tuas necessidades e sugestões. Também posso partir de um design existente, em conjunto contigo.',
      'process.s2.title': 'Desenvolvimento',
      'process.s2.desc': 'Com o design aprovado, construo a aplicação com Flutter, Dart e tecnologias web modernas, totalmente funcional, responsiva e versionada com Git.',
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
      'contact.intro': 'Tens um projeto em mente, uma colaboração de investigação ou só queres dizer olá? Preenche o formulário e o teu cliente de email abre com a mensagem pronta a enviar, ou escreve diretamente para <a href="mailto:vagneripg@gmail.com">vagneripg@gmail.com</a>.',
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
      'cookie.title': 'Cookies',
      'cookie.text': 'Este site usa cookies para análise (Google Analytics) e publicidade (Google AdSense). Podes aceitar ou recusar; definições essenciais como o idioma são sempre guardadas. Consulta a <a href="privacy-policy.html">Política de Privacidade</a>.',
      'cookie.accept': 'Aceitar tudo',
      'cookie.reject': 'Recusar',
      'ads.label': 'Publicidade',
      'footer.cookies': 'Definições de cookies'
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
      track('contact_submit', { event_category: 'engagement' });
      window.location.href = href;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Cookie consent (Google Consent Mode v2) + ads                       */
  /* ------------------------------------------------------------------ */
  var cookieBanner = document.getElementById('cookie-banner');
  var cookieAccept = document.getElementById('cookie-accept');
  var cookieReject = document.getElementById('cookie-reject');
  var cookieSettings = document.getElementById('cookie-settings');
  var adsLoaded = false;

  function storeConsent(value) {
    try { localStorage.setItem(STORAGE_COOKIES, value); } catch (e) { /* ignore */ }
  }
  function readConsent() {
    try { return localStorage.getItem(STORAGE_COOKIES); } catch (e) { return null; }
  }

  /* Inject the AdSense script and reveal the ad slots that have a unit id. */
  function loadAds() {
    if (adsLoaded) return;
    adsLoaded = true;
    var sc = document.createElement('script');
    sc.async = true;
    sc.crossOrigin = 'anonymous';
    sc.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
    sc.onload = function () {
      var slots = document.querySelectorAll('.ad-slot');
      for (var i = 0; i < slots.length; i++) {
        var slotId = slots[i].getAttribute('data-ad-slot');
        if (!slotId) continue; // no unit configured yet -> stays hidden
        var ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
        ins.setAttribute('data-ad-slot', slotId);
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
        slots[i].appendChild(ins);
        slots[i].hidden = false;
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      }
    };
    document.head.appendChild(sc);
  }

  function applyConsent(granted, persist) {
    var state = granted ? 'granted' : 'denied';
    gtagSafe('consent', 'update', {
      ad_storage: state, ad_user_data: state, ad_personalization: state, analytics_storage: state
    });
    if (persist) storeConsent(state);
    if (granted) loadAds();
    if (cookieBanner) cookieBanner.hidden = true;
  }

  if (cookieBanner) {
    var saved = readConsent();
    if (saved === 'granted') applyConsent(true, false);
    else if (saved === 'denied') applyConsent(false, false);
    else cookieBanner.hidden = false; // first visit: ask

    if (cookieAccept) cookieAccept.addEventListener('click', function () { applyConsent(true, true); track('cookie_consent', { choice: 'accept' }); });
    if (cookieReject) cookieReject.addEventListener('click', function () { applyConsent(false, true); });
    if (cookieSettings) cookieSettings.addEventListener('click', function () { cookieBanner.hidden = false; });
  }

  /* ------------------------------------------------------------------ */
  /* Outbound + CTA click tracking                                       */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href], [data-track]') : null;
    if (!a) return;
    var label = a.getAttribute('data-track-label');
    if (a.hasAttribute('data-track')) {
      track('cta_click', { event_category: 'engagement', event_label: label || a.textContent.trim().slice(0, 60) });
    }
    var href = a.getAttribute('href');
    if (href && /^https?:\/\//i.test(href) && a.hostname !== location.hostname) {
      track('outbound_click', { event_category: 'outbound', event_label: href, transport_type: 'beacon' });
    }
  });

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
