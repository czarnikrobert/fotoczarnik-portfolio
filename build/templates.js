// templates.js — pure string-template functions used by build.js

const NAV_ITEMS = [
  { href: '/index.html', label: 'Start', key: 'home' },
  { href: '/portfolio.html', label: 'Portfolio', key: 'portfolio' },
  { href: '/blog.html', label: 'Blog', key: 'blog' },
  { href: '/about.html', label: 'O mnie', key: 'about' },
  { href: '/contact.html', label: 'Kontakt', key: 'contact' },
];

export function nav(active, site) {
  const links = NAV_ITEMS.map(
    (item) =>
      `<li><a href="${item.href}"${item.key === active ? ' class="active"' : ''}>${item.label}</a></li>`
  ).join('\n      ');

  return `
  <nav class="nav" id="nav">
    <a href="/index.html" class="nav__logo">
      <img src="/assets/images/brand/logo.png" alt="" class="nav__logo-mark">
      <span class="nav__logo-text">${site.name}</span>
    </a>
    <ul class="nav__links" id="navLinks">
      ${links}
    </ul>
    <button class="nav__burger" id="navBurger" aria-label="Menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </nav>`;
}

export function footer(site) {
  return `
  <footer class="footer">
    <span>© ${new Date().getFullYear()} ${site.name} — ${site.author}</span>
    <div class="footer__social">
      ${site.social.instagram ? `<a href="${site.social.instagram}" target="_blank" rel="noopener">Instagram</a>` : ''}
      ${site.social.facebook ? `<a href="${site.social.facebook}" target="_blank" rel="noopener">Facebook</a>` : ''}
    </div>
  </footer>`;
}

export function layout({ title, description, active, site, bodyHtml, bodyClass = '', image, url }) {
  const ogDescription = description || site.description;
  const ogImage = image ? `${site.url}${image}` : `${site.url}/assets/images/brand/logo.png`;
  const ogUrl = url || site.url;
  const pageTitle = title === site.name ? site.name : `${title} — ${site.name}`;
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${pageTitle}</title>
<meta name="description" content="${ogDescription}">
<meta property="og:type" content="article">
<meta property="og:title" content="${pageTitle}">
<meta property="og:description" content="${ogDescription}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${ogUrl}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/images/brand/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/images/brand/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/images/brand/apple-touch-icon.png">
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/assets/css/main.css">
<link rel="stylesheet" href="/assets/css/components.css">
<link rel="stylesheet" href="/assets/css/animations.css">
</head>
<body class="${bodyClass}">
${nav(active, site)}
${bodyHtml}
${footer(site)}
<script src="/assets/js/core.js" defer></script>
<script src="/assets/js/animations.js" defer></script>
<script src="/assets/js/gallery.js" defer></script>
<script src="/assets/js/timeline.js" defer></script>
</body>
</html>`;
}

export function timeline(items) {
  return `
      <div class="timeline">
        <div class="timeline__line" aria-hidden="true"></div>
        ${items.map(timelineItem).join('\n')}
      </div>`;
}

function timelineItem(entry) {
  const hasMore = Boolean(entry.quote) || (entry.fullDescription && entry.fullDescription.length > 0);
  return `
        <div class="timeline__item" data-reveal>
          <span class="timeline__dot" aria-hidden="true"></span>
          <span class="timeline__year">${entry.year}</span>
          <div class="timeline__content">
            <button type="button" class="timeline__toggle" aria-expanded="false" ${hasMore ? '' : 'disabled'}>
              <span class="timeline__toggle-text">
                <span class="timeline__category">${entry.category}</span>
                <h3 class="timeline__name">${entry.name}</h3>
              </span>
              ${hasMore ? '<span class="timeline__chevron" aria-hidden="true"></span>' : ''}
            </button>
            <p class="timeline__desc">${entry.description}</p>
            ${
              hasMore
                ? `<div class="timeline__full">
              <div class="timeline__full-inner">
                ${entry.quote ? `<p class="timeline__quote">„${entry.quote}”</p>` : ''}
                ${(entry.fullDescription || []).map((p) => `<p>${p}</p>`).join('\n                ')}
              </div>
            </div>`
                : ''
            }
          </div>
        </div>`;
}

// Post titles may contain "|" to mark intended line breaks in the large post-page <h1>.
// Everywhere else (meta tags, card titles, alt text) that marker is just a space.
export function plainTitle(title) {
  return title.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
}

export function postCard(post) {
  const date = new Date(post.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const title = plainTitle(post.title);
  return `
      <a class="post-card" href="/blog/${post.slug}.html" data-reveal>
        <div class="post-card__media">
          <img src="${post.cover}" alt="${title}" loading="lazy">
        </div>
        <span class="post-card__date">${date}</span>
        <h3 class="post-card__title">${title}</h3>
        <p class="post-card__excerpt">${post.excerpt}</p>
      </a>`;
}

export function carousel({ id, items, extraClass = '', extraAttrs = '' }) {
  return `
    <div class="carousel">
      <button class="carousel__arrow carousel__arrow--prev" data-carousel-prev aria-label="Poprzednie zdjęcia">‹</button>
      <div class="gallery-grid ${extraClass}" id="${id}" ${extraAttrs}>
        ${items.map(galleryItem).join('\n')}
      </div>
      <button class="carousel__arrow carousel__arrow--next" data-carousel-next aria-label="Następne zdjęcia">›</button>
    </div>`;
}

export function masonryGrid({ id, items, extraAttrs = '' }) {
  return `
    <div class="gallery-grid gallery-grid--masonry" id="${id}" ${extraAttrs}>
      ${items.map(galleryItem).join('\n')}
    </div>`;
}

export function galleryItem(photo) {
  return `
      <div class="gallery-item" data-reveal data-category="${photo.category}" data-full="${photo.src}" data-caption="${photo.caption}" data-alt="${photo.alt}">
        <img src="${photo.src}" alt="${photo.alt}" loading="lazy">
        <div class="gallery-item__caption">${photo.caption}</div>
      </div>`;
}

export function lightboxMarkup() {
  return `
  <div class="lightbox" id="lightbox" aria-hidden="true">
    <button class="lightbox__prev" id="lightboxPrev" aria-label="Poprzednie zdjęcie">‹</button>
    <figure class="lightbox__figure">
      <img id="lightboxImage" src="" alt="">
      <figcaption class="lightbox__caption" id="lightboxCaption"></figcaption>
    </figure>
    <button class="lightbox__next" id="lightboxNext" aria-label="Następne zdjęcie">›</button>
    <button class="lightbox__close" id="lightboxClose" aria-label="Zamknij">✕</button>
  </div>`;
}

export function contactForm(site) {
  return `
      <form class="form" name="contact" method="POST" data-netlify="true" netlify-honeypot="company" action="/thanks.html">
        <input type="hidden" name="form-name" value="contact">
        <p class="form__honeypot">
          <label>Nie wypełniaj tego pola: <input name="company" tabindex="-1" autocomplete="off"></label>
        </p>
        <div class="form__field">
          <label for="name">Imię</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div class="form__field">
          <label for="email">E-mail</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form__field">
          <label for="message">Wiadomość</label>
          <textarea id="message" name="message" required></textarea>
        </div>
        <button type="submit" class="btn btn--primary">Wyślij wiadomość</button>
      </form>`;
}
