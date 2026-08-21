// timeline.js — expand/collapse full gear descriptions on click
(() => {
  const toggles = document.querySelectorAll('.timeline__toggle:not(:disabled)');
  if (!toggles.length) return;

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.timeline__item');
      const expanded = item.classList.toggle('is-expanded');
      btn.setAttribute('aria-expanded', String(expanded));
    });
  });
})();
