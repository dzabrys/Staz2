(() => {
  const pref = matchMedia('(prefers-reduced-motion:reduce)');
  if (pref.matches || !Element.prototype.animate) return;
  const running = new Set();
  const track = animation => {
    running.add(animation);
    animation.finished.then(() => running.delete(animation)).catch(() => running.delete(animation));
  };
  const animate = (el, delay = 0) => {
    const base = getComputedStyle(el).transform;
    track(el.animate([
      {transform:`translateY(8px) ${base === 'none' ? '' : base}`},
      {transform:base}
    ], {duration:480, delay, easing:'cubic-bezier(.22,.61,.36,1)'}));
  };
  // Text moves once; images, links and headings are never hidden behind JS.
  document.querySelectorAll('.hero-copy,.audience-copy,.subpage-intro,.subpage-aside,.offer-heading,.selection-heading,.product-heading,.proposal-intro').forEach((el, index) => {
    animate(el, Math.min(index * 45, 135));
  });
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (!pref.matches) animate(entry.target);
      }
    }, {threshold:.08});
    // Animate card contents so entrance and card hover never fight over transform.
    document.querySelectorAll('.game-copy,.catalog-copy,.product-copy,.steps>li,.mission-values>article,.brief-list>li,.benefits h2,.home-footer .competencies,.proposal-format-copy,.proposal-section-heading,.proposal-contact').forEach(el => observer.observe(el));
  }
  pref.addEventListener('change', () => {
    if (!pref.matches) return;
    observer?.disconnect();
    running.forEach(animation => animation.cancel());
    running.clear();
  });
})();
