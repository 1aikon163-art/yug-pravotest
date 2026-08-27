// Interactive Cases & Judicial Practice Filter for ЮГ-Право
document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('.case-filter-btn');
  const caseCards = document.querySelectorAll('.case-card-item');
  const searchInput = document.getElementById('case-search-input');
  const countDisplay = document.getElementById('visible-cases-count');

  if (!filterButtons.length && !caseCards.length) return;

  let activeCategory = 'all';
  let searchQuery = '';

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => {
        b.classList.remove('bg-[#001F3F]', 'text-white', 'shadow-md');
        b.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
      });

      btn.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');
      btn.classList.add('bg-[#001F3F]', 'text-white', 'shadow-md');

      activeCategory = btn.getAttribute('data-filter') || 'all';
      filterCases();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterCases();
    });
  }

  function filterCases() {
    let visibleCount = 0;

    caseCards.forEach((card) => {
      const category = card.getAttribute('data-category');
      const title = (card.querySelector('.case-title')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('.case-desc')?.textContent || '').toLowerCase();
      const court = (card.querySelector('.case-court')?.textContent || '').toLowerCase();

      const matchesCategory = activeCategory === 'all' || category === activeCategory;
      const matchesSearch = !searchQuery || title.includes(searchQuery) || desc.includes(searchQuery) || court.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        card.classList.remove('hidden');
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    if (countDisplay) {
      countDisplay.textContent = visibleCount;
    }
  }

  // Case Modal Details Trigger
  document.querySelectorAll('[data-case-detail]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.case-card-item');
      if (!card) return;

      const title = card.querySelector('.case-title')?.textContent || 'Дело ЮГ-Право';
      const court = card.querySelector('.case-court')?.textContent || 'Судебный акт';
      const result = card.querySelector('.case-result')?.textContent || 'Решение в пользу заявителя';
      const desc = card.querySelector('.case-desc')?.textContent || '';
      const actNumber = card.getAttribute('data-act') || 'А32-58192/2025';

      const modalTitle = document.getElementById('case-modal-title');
      const modalCourt = document.getElementById('case-modal-court');
      const modalResult = document.getElementById('case-modal-result');
      const modalDesc = document.getElementById('case-modal-desc');
      const modalAct = document.getElementById('case-modal-act');
      const modal = document.getElementById('case-details-modal');

      if (modalTitle) modalTitle.textContent = title;
      if (modalCourt) modalCourt.textContent = court;
      if (modalResult) modalResult.textContent = result;
      if (modalDesc) modalDesc.textContent = desc;
      if (modalAct) modalAct.textContent = actNumber;

      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
      }
    });
  });
});
