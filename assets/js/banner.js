// banner.js — scroll-scrubbing video-frame banner (canvas draws one of N webp frames based on scroll progress)
//
// Three phases within the scroll track:
//  1. Scrub phase (0 -> SCRUB_END): plays through the frame sequence, text/scrim hidden.
//  2. Reveal phase (SCRUB_END -> REVEAL_END): frame stays on the last one, hero text slides in to
//     center and the dark scrim fades in over the frozen final frame.
//  3. Hold phase (REVEAL_END -> 1): everything stays exactly as the reveal phase left it — this is
//     just extra scroll distance so the fully-revealed text has time to actually be read before the
//     section unpins and the next one scrolls up.
(() => {
  const FRAME_COUNT = 130;
  const FRAME_PATH = (i) => `/assets/images/banner/frame-${String(i).padStart(3, '0')}.webp`;
  const SCRUB_END = 0.65; // fraction of track scroll spent playing frames
  const REVEAL_END = 0.8; // fraction where text/scrim finish revealing; REVEAL_END..1 is the hold/reading phase

  const track = document.getElementById('scrollBanner');
  const canvas = document.getElementById('scrollBannerCanvas');
  if (!track || !canvas) return;

  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('scrollBannerLoader');
  const loaderFill = document.getElementById('scrollBannerLoaderFill');
  const fadeEl = document.getElementById('scrollBannerFade');
  const cueEl = document.getElementById('scrollBannerCue');
  const scrimEl = document.getElementById('scrollBannerScrim');
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
      // (text/scrim still revealed so the hero content stays fully readable).
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
})();
