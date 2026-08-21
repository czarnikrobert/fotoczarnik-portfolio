// animations.js — scroll reveal, hero depth parallax, in-view image parallax, reading progress
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Scroll reveal ----------
  const revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-group]');

  const revealAll = () => revealTargets.forEach((el) => el.classList.add('is-visible'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach((el) => observer.observe(el));

    // Safety net: some browsers delay/throttle IntersectionObserver callbacks
    // (e.g. background/unfocused tabs, or elements already in view on load).
    // Never leave content permanently hidden.
    setTimeout(revealAll, 1200);
    window.addEventListener('load', revealAll, { once: true });

    // Safari/iOS can restore a page from the back-forward cache without
    // re-running scripts mid-animation, freezing content at opacity:0.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) revealAll();
    });
  }

  if (reduceMotion) return;

  // ---------- Hero depth parallax: bg pans, content sinks + fades ----------
  const hero = document.querySelector('.hero');
  const heroImg = document.querySelector('.hero__bg img');
  const heroContent = document.querySelector('.hero__content');

  // ---------- In-view parallax for standalone images (about portrait, intro, post cover) ----------
  const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));

  let ticking = false;

  const update = () => {
    const vh = window.innerHeight;

    if (hero && heroImg) {
      const offset = Math.min(window.scrollY * 0.18, 140);
      heroImg.style.transform = `translateY(${offset}px) scale(1.08)`;
      if (heroContent) {
        const heroRect = hero.getBoundingClientRect();
        const fade = Math.max(0, 1 - (-heroRect.top / (heroRect.height * 0.7)));
        heroContent.style.opacity = String(fade);
        heroContent.style.transform = `translateY(${Math.min(-heroRect.top * 0.25, 90)}px)`;
      }
    }

    parallaxEls.forEach((img) => {
      const rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (vh - rect.top) / (vh + rect.height);
      const offset = (progress - 0.5) * 60;
      img.style.transform = `translateY(${offset.toFixed(1)}px) scale(1.15)`;
    });

    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
  update();

  // ---------- Reading progress bar (blog post pages) ----------
  const progressBar = document.getElementById('readingProgress');
  if (progressBar) {
    const updateProgress = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
      progressBar.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }
})();
