// banner.js — scroll-scrubbing video-frame banner (canvas draws one of N webp frames based on scroll progress)
//
// Multi-instance: every `[data-scroll-banner]` element on the page initializes itself
// independently, configured entirely through its own data-* attributes. This lets
// different pages (or in principle the same page) run different frame sequences without
// touching this file — see the "Analog" page banner in build.js for a second example
// alongside the homepage hero.
//
// Three phases within each banner's scroll track:
//  1. Scrub phase (0 -> SCRUB_END): plays through the frame sequence, text/scrim hidden.
//  2. Reveal phase (SCRUB_END -> REVEAL_END): frame stays on the last one, overlaid content
//     slides in to center and the dark scrim fades in over the frozen final frame.
//  3. Hold phase (REVEAL_END -> 1): everything stays exactly as the reveal phase left it — this is
//     just extra scroll distance so the fully-revealed content has time to actually be read before
//     the section unpins and the next one scrolls up.
(() => {
  document.querySelectorAll('[data-scroll-banner]').forEach(initBanner);

  function initBanner(track) {
    const canvas = track.querySelector('.scroll-banner__canvas');
    if (!canvas) return;

    const FRAME_COUNT = parseInt(track.dataset.frameCount, 10);
    const FRAME_DIGITS = parseInt(track.dataset.frameDigits || '4', 10);
    const FRAME_PREFIX = track.dataset.framePrefix;
    const FRAME_PATH = (i) => `${FRAME_PREFIX}${String(i).padStart(FRAME_DIGITS, '0')}.webp`;
    const SCRUB_END = parseFloat(track.dataset.scrubEnd || '0.65');
    const REVEAL_END = parseFloat(track.dataset.revealEnd || '0.8');

    const ctx = canvas.getContext('2d');
    const loader = track.querySelector('.scroll-banner__loader');
    const loaderFill = track.querySelector('.scroll-banner__loader-fill');
    const fadeEl = track.querySelector('[data-scroll-banner-fade]');
    const cueEl = track.querySelector('[data-scroll-banner-cue]');
    const scrimEl = track.querySelector('.scroll-banner__scrim');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const images = new Array(FRAME_COUNT);
    let loadedCount = 0;
    let currentFrame = -1;
    let naturalWidth = 1920;
    let naturalHeight = 1080;

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

    function setRevealState(revealProgress) {
      if (fadeEl) {
        fadeEl.style.opacity = String(revealProgress);
        fadeEl.style.transform = `translateY(${(1 - revealProgress) * 24}px)`;
      }
      if (scrimEl) scrimEl.style.opacity = String(revealProgress);
    }

    function onScroll() {
      const trackHeight = track.offsetHeight - window.innerHeight;
      const progress = trackHeight > 0 ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / trackHeight)) : 0;

      const videoProgress = Math.min(1, progress / SCRUB_END);
      drawFrame(Math.round(videoProgress * (FRAME_COUNT - 1)));

      const revealProgress = Math.max(0, Math.min(1, (progress - SCRUB_END) / (REVEAL_END - SCRUB_END)));
      setRevealState(revealProgress);

      // The "scroll to continue" cue only makes sense before the user has started scrolling.
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
      if (reduceMotion) {
        // No forced scroll-jacked motion: show the first frame as a plain static photo
        // (text/scrim still revealed so the overlaid content stays fully readable).
        drawFrame(0, true);
        setRevealState(1);
        if (cueEl) cueEl.style.opacity = '0';
      } else {
        drawFrame(0, true);
      }
      if (loader) loader.classList.add('is-hidden');

      window.addEventListener('resize', resizeCanvas);
      if (!reduceMotion) {
        window.addEventListener('scroll', requestTick, { passive: true });
        onScroll();
      }
    });
  }
})();
