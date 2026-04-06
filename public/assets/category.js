/**
 * category.js
 * カテゴリ一覧ページ用
 * ?cat=カテゴリ名 があればそのカテゴリの記事一覧を表示
 * なければ全カテゴリのカードを表示
 */

(async () => {
  const { articles } = await SITE.init();
  SITE.renderSidebar();

  const params = new URLSearchParams(location.search);
  const selectedCat = params.get('cat');
  const main = document.getElementById('category-main');

  if (selectedCat) {
    // カテゴリ別記事一覧
    const filtered = articles
      .filter(a => a.category === selectedCat)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    main.innerHTML = `
      <div class="page-heading">カテゴリ: ${escapeHTML(selectedCat)}（${filtered.length}件）</div>
      ${filtered.length === 0
        ? '<div class="no-results">記事がありません</div>'
        : filtered.map(a => `
          <div class="article-card">
            <div class="article-meta">${formatDate(a.date)}</div>
            <h2><a href="./article.html?id=${escapeHTML(a.id)}">${escapeHTML(a.title)}</a></h2>
            <p class="summary">${escapeHTML(a.summary)}</p>
            <a class="read-more" href="./article.html?id=${escapeHTML(a.id)}">続きを読む &rsaquo;</a>
          </div>`).join('')
      }
      <p style="margin-top:10px;font-size:12px;"><a href="./category.html">&laquo; カテゴリ一覧に戻る</a></p>`;
  } else {
    // 全カテゴリカード
    const cats = SITE.getCategories();
    main.innerHTML = `
      <div class="page-heading">カテゴリ一覧</div>
      <div class="category-grid">
        ${cats.map(c => `
          <a class="category-card" href="./category.html?cat=${encodeURIComponent(c.name)}">
            <span class="cat-name">${escapeHTML(c.name)}</span>
            <span class="cat-count-badge">${c.count}件</span>
          </a>`).join('')}
      </div>`;
  }
})();
