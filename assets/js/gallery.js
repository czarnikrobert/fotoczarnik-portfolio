// gallery.js — category filters + lightbox with keyboard/prev/next navigation
(() => {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const filters = document.getElementById('galleryFilters');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  const getItems = () => Array.from(grid.querySelectorAll('.gallery-item'));
  const getVisibleItems = () => getItems().filter((item) => item.style.display !== 'none');

  let currentIndex = 0;

  function openLightbox(item) {
    const visible = getVisibleItems();
    currentIndex = visible.indexOf(item);
    render();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function render() {
    const visible = getVisibleItems();
    const item = visible[currentIndex];
    if (!item) return;
    lightboxImage.src = item.dataset.full;
    lightboxImage.alt = item.dataset.alt || '';
    lightboxCaption.textContent = item.dataset.caption || '';
  }

  function step(delta) {
    const visible = getVisibleItems();
    currentIndex = (currentIndex + delta + visible.length) % visible.length;
    render();
  }

  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (item) openLightbox(item);
  });

  closeBtn?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // Category filters (portfolio page only)
  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;

      filters.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      getItems().forEach((item) => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.style.display = match ? '' : 'none';
      });
    });
  }
})();
