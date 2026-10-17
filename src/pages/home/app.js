import { Text } from '../../i18n/runtime.js';
export function mountOverview() {
  const L = Text;
  const sections = [...document.querySelectorAll('[data-category]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const status = document.getElementById('filter-status');
  const filterKey = 'mind-arcade.overview-category';
  let category = 'all';
  try {
    const saved = sessionStorage.getItem(filterKey);
    if (filters.some((button) => button.dataset.filter === saved)) category = saved;
  } catch {}
  function applyFilter() {
    sections.forEach((section) => {
      section.hidden = category !== 'all' && section.dataset.category !== category;
    });
    filters.forEach((filter) =>
      filter.setAttribute('aria-pressed', String(filter.dataset.filter === category)),
    );
  }
  function updateStatus() {
    const visible = sections.filter((section) => !section.hidden);
    const count = visible.reduce(
      (sum, section) => sum + section.querySelectorAll('.game-card').length,
      0,
    );
    const name =
      category === 'all' ? L.t('game.all-games') : visible[0].querySelector('h2').textContent;
    status.textContent = L.t('game.value-value-games', { name, count });
  }
  function translate() {
    document.title = L.t('game.mind-arcade');
    document.querySelector('meta[name="description"]').content = L.t(
      'game.games-for-working-memory-processing-speed-attention-and-cognitive',
    );
    updateStatus();
  }
  filters.forEach((button) =>
    button.addEventListener('click', () => {
      category = button.dataset.filter;
      applyFilter();
      try {
        sessionStorage.setItem(filterKey, category);
      } catch {}
      updateStatus();
    }),
  );
  window.addEventListener('mindlab-language-change', translate);
  document.querySelector('.filter-count').textContent = String(
    document.querySelectorAll('.game-card').length,
  );
  applyFilter();
  translate();
  document.querySelector('.filters').hidden = false;
}
