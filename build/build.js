// build.js — reads /content, renders static HTML into /public
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import { layout, postCard, galleryItem, lightboxMarkup, contactForm } from './templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const ASSETS = path.join(ROOT, 'assets');
const PUBLIC = path.join(ROOT, 'public');

function readMd(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return matter(raw);
}

function loadPage(name) {
  return readMd(path.join(CONTENT, 'pages', `${name}.md`));
}

function loadPosts() {
  const dir = path.join(CONTENT, 'blog');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const { data, content } = readMd(path.join(dir, file));
      const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
      return { ...data, slug, bodyHtml: marked.parse(content) };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function loadGallery() {
  return fs.readJsonSync(path.join(CONTENT, 'gallery.json'));
}

function write(relPath, html) {
  const outPath = path.join(PUBLIC, relPath);
  fs.ensureDirSync(path.dirname(outPath));
  fs.writeFileSync(outPath, html, 'utf-8');
}

function build() {
  fs.emptyDirSync(PUBLIC);
  fs.copySync(ASSETS, path.join(PUBLIC, 'assets'));

  const site = fs.readJsonSync(path.join(CONTENT, 'site.json'));
  const posts = loadPosts();
  const gallery = loadGallery();
  const featuredPhotos = gallery.photos.filter((p) => p.featured);

  // ---------- Home ----------
  const home = loadPage('home').data;
  const homeBody = `
  <section class="hero">
    <div class="hero__bg"><img src="${home.heroImage}" alt="" loading="eager"></div>
    <div class="hero__content" data-reveal>
      <span class="eyebrow">${site.tagline}</span>
      <h1>${home.title}</h1>
      <p style="margin: 0 auto; max-width: 46ch; font-size: 1.15rem;">${home.subtitle}</p>
    </div>
    <div class="hero__scroll">Przewiń</div>
  </section>

  <section class="container">
    <div class="grid-2">
      <div data-reveal>
        <img src="${home.introImage}" alt="Portret autora" style="border-radius: var(--radius-lg);" loading="lazy">
      </div>
      <div data-reveal>
        <span class="eyebrow">${home.introEyebrow}</span>
        <h2>${home.introTitle}</h2>
        <p>${home.introText}</p>
        <a href="/about.html" class="btn" style="margin-top: 1rem;">Poznaj mnie bliżej</a>
      </div>
    </div>
  </section>

  <section class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Portfolio</span>
      <h2>Wybrane kadry</h2>
    </div>
    <div class="gallery-grid" data-reveal-group style="margin-top: 2.5rem;">
      ${featuredPhotos.map(galleryItem).join('\n')}
    </div>
    <a href="/portfolio.html" class="btn" style="margin-top: 2.5rem;">Zobacz całe portfolio</a>
  </section>

  <section class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Blog</span>
      <h2>Najnowsze historie</h2>
    </div>
    <div class="post-grid">
      ${posts.slice(0, 3).map(postCard).join('\n')}
    </div>
  </section>
  ${lightboxMarkup()}`;

  write(
    'index.html',
    layout({ title: home.title, description: site.description, active: 'home', site, bodyHtml: homeBody })
  );

  // ---------- About ----------
  const about = loadPage('about');
  const aboutBody = `
  <section class="page-header container">
    <span class="eyebrow">${about.data.eyebrow}</span>
    <h1>${about.data.title}</h1>
  </section>
  <section class="container">
    <div class="grid-2">
      <div data-reveal>
        <img src="${about.data.portrait}" alt="Portret" style="border-radius: var(--radius-lg);" loading="lazy">
      </div>
      <div class="post-body" data-reveal>
        ${marked.parse(about.content)}
      </div>
    </div>
  </section>`;

  write(
    'about.html',
    layout({ title: about.data.title, active: 'about', site, bodyHtml: aboutBody })
  );

  // ---------- Portfolio / gallery ----------
  const categories = ['Wszystkie', ...gallery.categories];
  const portfolioBody = `
  <section class="page-header container">
    <span class="eyebrow">Portfolio</span>
    <h1>Wybrane zdjęcia</h1>
  </section>
  <section class="container">
    <div class="gallery-filters" id="galleryFilters">
      ${categories
        .map(
          (c, i) =>
            `<button data-filter="${c === 'Wszystkie' ? 'all' : c}" class="${i === 0 ? 'active' : ''}">${c}</button>`
        )
        .join('\n      ')}
    </div>
    <div class="gallery-grid" id="galleryGrid" data-reveal-group>
      ${gallery.photos.map(galleryItem).join('\n')}
    </div>
  </section>
  ${lightboxMarkup()}`;

  write(
    'portfolio.html',
    layout({ title: 'Portfolio', active: 'portfolio', site, bodyHtml: portfolioBody })
  );

  // ---------- Blog listing ----------
  const blogBody = `
  <section class="page-header container">
    <span class="eyebrow">Blog</span>
    <h1>Historie z drogi</h1>
  </section>
  <section class="container">
    <div class="post-grid">
      ${posts.map(postCard).join('\n')}
    </div>
  </section>`;

  write('blog.html', layout({ title: 'Blog', active: 'blog', site, bodyHtml: blogBody }));

  // ---------- Blog posts ----------
  posts.forEach((post) => {
    const date = new Date(post.date).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const postBody = `
  <article>
    <header class="page-header post-header container">
      <span class="eyebrow">${date}</span>
      <h1>${post.title}</h1>
    </header>
    <div class="container">
      <div class="post-cover">
        <img src="${post.cover}" alt="${post.title}" loading="eager">
      </div>
      <div class="post-body" data-reveal>
        ${post.bodyHtml}
        <p style="margin-top: 3rem;"><a href="/blog.html" class="btn">← Wróć do bloga</a></p>
      </div>
    </div>
  </article>`;

    write(
      `blog/${post.slug}.html`,
      layout({ title: post.title, description: post.excerpt, active: 'blog', site, bodyHtml: postBody })
    );
  });

  // ---------- Contact ----------
  const contact = loadPage('contact');
  const contactBody = `
  <section class="page-header container">
    <span class="eyebrow">${contact.data.eyebrow}</span>
    <h1>${contact.data.title}</h1>
  </section>
  <section class="container" style="padding-top: 0;">
    <p>${contact.data.intro}</p>
    ${contactForm(site)}
  </section>`;

  write(
    'contact.html',
    layout({ title: contact.data.title, active: 'contact', site, bodyHtml: contactBody })
  );

  // ---------- Thanks (Netlify form redirect target) ----------
  const thanksBody = `
  <section class="container" style="min-height: 60dvh; display: flex; flex-direction: column; justify-content: center; text-align: center;">
    <span class="eyebrow">Dziękuję</span>
    <h1>Wiadomość wysłana</h1>
    <p style="margin: 0 auto;">Dzięki za kontakt — odpowiem najszybciej jak mogę.</p>
    <a href="/index.html" class="btn" style="margin: 2rem auto 0;">Wróć na stronę główną</a>
  </section>`;

  write('thanks.html', layout({ title: 'Dziękuję', active: '', site, bodyHtml: thanksBody }));

  // ---------- 404 ----------
  const notFoundBody = `
  <section class="container" style="min-height: 60dvh; display: flex; flex-direction: column; justify-content: center; text-align: center;">
    <span class="eyebrow">404</span>
    <h1>Nie znaleziono strony</h1>
    <a href="/index.html" class="btn" style="margin: 2rem auto 0;">Wróć na stronę główną</a>
  </section>`;

  write('404.html', layout({ title: 'Nie znaleziono', active: '', site, bodyHtml: notFoundBody }));

  console.log(`✔ Zbudowano ${posts.length} wpisów, ${gallery.photos.length} zdjęć → public/`);
}

build();
