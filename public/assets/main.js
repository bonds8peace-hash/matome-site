/**
 * main.js
 * トップページ用: 記事一覧・フィルタ・検索
 */

(async () => {
  const { config, articles } = await SITE.init();
  SITE.renderSidebar();

  let currentCategory = 'all';
  let searchQuery = '';

  // カテゴリボタン生成
  const filterBar = document.getElementById('filter-bar');
  const categories = SITE.getCategories();
  const allBtn = createFilterBtn('すべて', 'all', true);
  filterBar.appendChild(allBtn);
  categories.forEach(c => filterBar.appendChild(createFilterBtn(c.name, c.name, false)));

  // 検索ボックス
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    render();
  });

  function createFilterBtn(label, value, active) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (active ? ' active' : '');
    btn.textContent = label;
    btn.dataset.cat = value;
    btn.addEventListener('click', () => {
      currentCategory = value;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
    return btn;
  }

  function getFiltered() {
    return articles
      .filter(a => currentCategory === 'all' || a.category === currentCategory)
      .filter(a => {
        if (!searchQuery) return true;
        return (
          a.title.toLowerCase().includes(searchQuery) ||
          a.summary.toLowerCase().includes(searchQuery)
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, config.articlesPerPage || 20);
  }

  function render() {
    const list = document.getElementById('article-list');
    const filtered = getFiltered();
    if (!filtered.length) {
      list.innerHTML = '<div class="no-results">記事が見つかりませんでした</div>';
      return;
    }
    list.innerHTML = filtered.map(a => `
      <div class="article-card">
        <div class="article-meta">
          <span class="category-badge" data-cat="${escapeHTML(a.category)}">${escapeHTML(a.category)}</span>
          ${formatDate(a.date)}
        </div>
        <h2><a href="./article.html?id=${escapeHTML(a.id)}">${escapeHTML(a.title)}</a></h2>
        <p class="summary">${escapeHTML(a.summary)}</p>
        <a class="read-more" href="./article.html?id=${escapeHTML(a.id)}">続きを読む &rsaquo;</a>
      </div>`).join('');

    // カテゴリバッジクリック
    list.querySelectorAll('.category-badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const cat = badge.dataset.cat;
        currentCategory = cat;
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === cat);
        });
        render();
      });
    });
  }

  render();
})();
