/* Progressive enhancement: all games and links remain available without JS. */
(() => {
  const page = document.querySelector('.school-polished');
  if (!page) return;
  const bar = page.querySelector('.school-filter-bar');
  const buttons = [...page.querySelectorAll('[data-grade]')];
  const cards = [...page.querySelectorAll('.game-card[data-grade-min]')];
  const count = page.querySelector('.school-result-count');
  if (!bar || !buttons.length || !cards.length || !count) return;

  function selectGrade(button) {
    const value = button.dataset.grade;
    const range = value === 'all' ? [1, 8] : value.split('-').map(Number);
    let visible = 0;
    cards.forEach(card => {
      const matches = Number(card.dataset.gradeMin) <= range[1] && Number(card.dataset.gradeMax) >= range[0];
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    count.textContent = `${visible} ${visible === 1 ? 'gra' : visible >= 2 && visible <= 4 ? 'gry' : 'gier'}`;
  }
  buttons.forEach(button => button.addEventListener('click', () => selectGrade(button)));
  bar.hidden = false;
})();
