// build.js — reads /content, renders static HTML into /public
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import { layout, postCard, plainTitle, lightboxMarkup, contactForm, timeline, carousel, masonryGrid, scrollBanner, gearCard } from './templates.js';

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

function loadGearTimeline() {
  return fs.readJsonSync(path.join(CONTENT, 'gear-timeline.json'));
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
  ${scrollBanner({
    framePrefix: '/assets/images/banner/frame-',
    frameCount: 130,
    frameDigits: 3,
    eyebrow: site.tagline,
    title: home.title,
    subtitle: home.subtitle,
    motionNotice:
      'Animacja tła jest wyłączona, bo Twoja przeglądarka lub system ma włączoną opcję „Ogranicz ruch” (Reduce Motion). Wyłącz ją w ustawieniach systemowych, aby zobaczyć pełny efekt.',
  })}

  <section class="container">
    <div class="grid-2">
      <div class="parallax-media" data-reveal>
        <img data-parallax src="${home.introImage}" alt="Portret autora" loading="eager">
      </div>
      <div data-reveal>
        <span class="eyebrow">${home.introEyebrow}</span>
        <h2>${home.introTitle}</h2>
        ${home.introText
          .split(/\n\s*\n/)
          .map((p) => `<p>${p.trim()}</p>`)
          .join('\n        ')}
        <a href="/about.html" class="btn" style="margin-top: 1rem;">Poznaj mnie bliżej</a>
      </div>
    </div>
  </section>

  <section class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Portfolio</span>
      <h2>Wybrane kadry</h2>
    </div>
    <div style="margin-top: 2.5rem;">
      ${carousel({ id: 'homeGalleryCarousel', items: featuredPhotos, extraAttrs: 'data-reveal-group' })}
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
    layout({ title: site.name, description: site.description, active: 'home', site, bodyHtml: homeBody })
  );

  // ---------- About ----------
  const about = loadPage('about');
  const gearTimeline = loadGearTimeline();
  const aboutBody = `
  <section class="page-header container">
    <span class="eyebrow">${about.data.eyebrow}</span>
    <h1>${about.data.title}</h1>
  </section>
  <section class="container">
    <div class="grid-2 grid-2--top">
      <div class="parallax-media" data-reveal>
        <img data-parallax src="${about.data.portrait}" alt="Portret" loading="eager">
      </div>
      <div class="post-body about-copy" data-reveal>
        ${marked.parse(about.content)}
      </div>
    </div>
  </section>
  <section class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Od 1978 do dziś</span>
      <h2>Historia sprzętu</h2>
      <p>Chronologiczny przegląd aparatów, które towarzyszyły mi po drodze — od pierwszej sowieckiej „Smieny” po obecnego Canona.</p>
    </div>
    ${timeline(gearTimeline)}
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
          (c) =>
            `<button data-filter="${c === 'Wszystkie' ? 'all' : c}" class="${c === 'Krajobraz' ? 'active' : ''}">${c}</button>`
        )
        .join('\n      ')}
    </div>
    ${masonryGrid({ id: 'galleryGrid', items: gallery.photos, extraAttrs: 'data-reveal-group' })}
  </section>
  ${lightboxMarkup()}`;

  write(
    'portfolio.html',
    layout({ title: 'Portfolio', active: 'portfolio', site, bodyHtml: portfolioBody })
  );

  // ---------- Analog ----------
  const analog = loadPage('analog').data;
  const analogGear = fs.readJsonSync(path.join(CONTENT, 'analog-gear.json'));
  const analogGallery = fs.readJsonSync(path.join(CONTENT, 'analog-gallery.json'));
  const analogBody = `
  ${scrollBanner({
    framePrefix: '/assets/images/banner-analog/frame-',
    frameCount: 85,
    frameDigits: 3,
    eyebrow: analog.eyebrow,
    title: analog.title,
    subtitle: analog.subtitle,
    motionNotice:
      'Animacja tła jest wyłączona, bo Twoja przeglądarka lub system ma włączoną opcję „Ogranicz ruch” (Reduce Motion). Wyłącz ją w ustawieniach systemowych, aby zobaczyć pełny efekt.',
  })}

  <section class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">${analog.introEyebrow}</span>
      <h2>${analog.introTitle}</h2>
      ${analog.introText
        .split(/\n\s*\n/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join('\n      ')}
    </div>
  </section>

  <section class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Sprzęt</span>
      <h2>Aparaty analogowe</h2>
    </div>
    <div class="gear-grid" data-reveal-group>
      ${analogGear.map(gearCard).join('\n')}
    </div>
  </section>

  <section class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Galeria</span>
      <h2>Zdjęcia z filmu</h2>
    </div>
    ${masonryGrid({ id: 'analogGalleryGrid', items: analogGallery, extraAttrs: 'data-reveal-group' })}
  </section>
  ${lightboxMarkup()}`;

  write(
    'analog.html',
    layout({ title: 'Analog', description: 'Aparaty analogowe i zdjęcia z filmu.', active: 'analog', site, bodyHtml: analogBody })
  );

  // ---------- Blog listing ----------
  const blogBody = `
  <section class="page-header container">
    <span class="eyebrow">Blog</span>
    <h1>BLOG</h1>
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
    const postUrl = `${site.url}/blog/${post.slug}`;
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    const title = plainTitle(post.title);
    const titleHtml = post.title
      .split('|')
      .map((line) => line.trim())
      .join('<br>');
    const postBody = `
  <div class="reading-progress" id="readingProgress"></div>
  <article>
    <header class="page-header post-header container">
      <span class="eyebrow">${date}</span>
      <h1>${titleHtml}</h1>
    </header>
    <div class="container">
      <div class="post-cover parallax-media">
        <img data-parallax src="${post.cover}" alt="${title}" loading="eager">
      </div>
      <div class="post-body" data-reveal>
        ${post.bodyHtml}
        <div class="post-footer" style="margin-top: 3rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          <a href="/blog.html" class="btn">← Wróć do bloga</a>
          <a href="${fbShareUrl}" class="btn btn--share" target="_blank" rel="noopener" onclick="window.open(this.href,'fbshare','width=600,height=500');return false;">Udostępnij na Facebooku</a>
        </div>
      </div>
    </div>
  </article>`;

    write(
      `blog/${post.slug}.html`,
      layout({
        title,
        description: post.excerpt,
        active: 'blog',
        site,
        bodyHtml: postBody,
        image: post.cover,
        url: postUrl,
      })
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
