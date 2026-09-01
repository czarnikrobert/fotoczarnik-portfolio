// banner.js — scroll-scrubbing video-frame banner (canvas draws one of N webp frames based on scroll progress)
(() => {
  const FRAME_COUNT = 140;
  const FRAME_PATH = (i) => `/assets/images/banner/frame-${String(i).padStart(4, '0')}.webp`;

  const track = document.getElementById('scrollBanner');
  const canvas = document.getElementById('scrollBannerCanvas');
  if (!track || !canvas) return;

  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('scrollBannerLoader');
  const loaderFill = document.getElementById('scrollBannerLoaderFill');
  const fadeEl = document.getElementById('scrollBannerFade');
  const cueEl = document.getElementById('scrollBannerCue');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let currentFrame = -1;
  let naturalWidth = 1280;
  let naturalHeight = 720;

  function preloadFrames() {
    return new Promise((resolve) => {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loaderFill) loaderFill.style.width = `${Math.round((loadedCount / FRAME_COUNT) * 100)}%`;
          if (i === 1) {
            naturalWidth = img.naturalWidth || naturalWidth;
            naturalHeight = img.naturalHeight || naturalHeight;
          }
          if (loadedCount === FRAME_COUNT) resolve();
        };
        img.src = FRAME_PATH(i);
        images[i - 1] = img;
      }
    });
  }

  function drawFrame(index, force) {
    if (index === currentFrame && !force) return;
    const img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    currentFrame = index;

    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / naturalWidth, ch / naturalHeight);
    const dw = naturalWidth * scale;
    const dh = naturalHeight * scale;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    drawFrame(Math.max(currentFrame, 0), true);
  }

  function onScroll() {
    const trackHeight = track.offsetHeight - window.innerHeight;
    const progress = trackHeight > 0 ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / trackHeight)) : 0;
    drawFrame(Math.round(progress * (FRAME_COUNT - 1)));

    // Fade the overlaid hero text out early, well before the scrub finishes, so the video takes over.
    if (fadeEl) fadeEl.style.opacity = String(1 - Math.min(1, progress / 0.15));
    if (cueEl) cueEl.style.opacity = String(1 - Math.min(1, progress / 0.05));
  }

  let ticking = false;
  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
  }

  preloadFrames().then(() => {
    resizeCanvas();
    drawFrame(reduceMotion ? FRAME_COUNT - 1 : 0, true);
    if (loader) loader.classList.add('is-hidden');

    window.addEventListener('resize', resizeCanvas);
    if (!reduceMotion) {
      window.addEventListener('scroll', requestTick, { passive: true });
      onScroll();
    }
  });
})();
