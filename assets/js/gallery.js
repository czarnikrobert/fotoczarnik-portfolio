// gallery.js — category filters, tilt-on-hover, lightbox with cross-fade + keyboard nav
(() => {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const filters = document.getElementById('galleryFilters');
  const carouselWrap = grid.closest('.carousel');
  const prevArrow = carouselWrap?.querySelector('[data-carousel-prev]');
  const nextArrow = carouselWrap?.querySelector('[data-carousel-next]');
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
    render(false);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function render(crossFade = true) {
    const visible = getVisibleItems();
    const item = visible[currentIndex];
    if (!item) return;

    const swap = () => {
      lightboxImage.src = item.dataset.full;
      lightboxImage.alt = item.dataset.alt || '';
      lightboxCaption.textContent = item.dataset.caption || '';
      if (crossFade) requestAnimationFrame(() => (lightboxImage.style.opacity = '1'));
    };

    if (crossFade && !reduceMotion) {
      lightboxImage.style.opacity = '0';
      setTimeout(swap, 180);
    } else {
      swap();
    }
  }

  function step(delta) {
    const visible = getVisibleItems();
    currentIndex = (currentIndex + delta + visible.length) % visible.length;
    render(true);
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
  function applyFilter(filter) {
    getItems().forEach((item) => {
      const match = filter === 'all' || item.dataset.category === filter;
      item.style.display = match ? '' : 'none';
    });
  }

  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;

      filters.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      applyFilter(btn.dataset.filter);
      grid.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      updateArrows();
    });

    const defaultBtn = filters.querySelector('button.active');
    if (defaultBtn) applyFilter(defaultBtn.dataset.filter);
  }

  // Carousel: manual scroll via arrow buttons + disable at the ends
  function updateArrows() {
    if (!prevArrow || !nextArrow) return;
    const max = grid.scrollWidth - grid.clientWidth;
    prevArrow.disabled = grid.scrollLeft <= 4;
    nextArrow.disabled = grid.scrollLeft >= max - 4;
  }

  if (prevArrow && nextArrow) {
    const scrollByPage = (dir) => {
      grid.scrollBy({ left: dir * grid.clientWidth * 0.85, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    prevArrow.addEventListener('click', () => scrollByPage(-1));
    nextArrow.addEventListener('click', () => scrollByPage(1));

    let ticking = false;
    grid.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updateArrows();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', updateArrows);
    updateArrows();
  }

  // Subtle 3D tilt-on-hover (desktop pointer devices only)
  if (canHover && !reduceMotion) {
    getItems().forEach((item) => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        item.style.setProperty('--tilt-x', `${(-py * 8).toFixed(2)}deg`);
        item.style.setProperty('--tilt-y', `${(px * 8).toFixed(2)}deg`);
      });
      item.addEventListener('mouseleave', () => {
        item.style.setProperty('--tilt-x', '0deg');
        item.style.setProperty('--tilt-y', '0deg');
      });
    });
  }
})();
