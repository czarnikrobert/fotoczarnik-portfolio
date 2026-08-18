// animations.js — scroll reveal (IntersectionObserver) + subtle hero parallax
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-group]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
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
    // (e.g. background/unfocused tabs). Never leave content permanently hidden.
    setTimeout(() => {
      revealTargets.forEach((el) => el.classList.add('is-visible'));
      observer.disconnect();
    }, 2000);
  }

  // Subtle hero parallax on the background image
  if (!reduceMotion) {
    const heroImg = document.querySelector('.hero__bg img');
    if (heroImg) {
      let ticking = false;
      const update = () => {
        const offset = Math.min(window.scrollY * 0.18, 140);
        heroImg.style.transform = `translateY(${offset}px) scale(1.08)`;
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
    }
  }
})();
