/**
 * components.js
 * 共通ヘッダー・フッター・データ読み込み
 */

const SITE = {
  config: null,
  articles: null,

  async init() {
    const [cfg, arts] = await Promise.all([
      fetch('./data/config.json').then(r => r.json()),
      fetch('./data/articles.json').then(r => r.json())
    ]);
    this.config = cfg;
    this.articles = arts;
    this._renderHeader();
    this._renderFooter();
    return { config: cfg, articles: arts };
  },

  _renderHeader() {
    const el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML = `
      <div class="header-inner">
        <div>
          <h1><a href="./index.html">${this.config.siteName}</a></h1>
          <div class="site-desc">${this.config.siteDescription}</div>
        </div>
        <nav>
          <a href="./index.html">トップ</a>
          <a href="./category.html">カテゴリ</a>
        </nav>
      </div>`;
    document.title = document.title
      ? `${document.title} | ${this.config.siteName}`
      : this.config.siteName;
  },

  _renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `<p>&copy; ${new Date().getFullYear()} ${this.config.siteName}</p>`;
  },

  /** カテゴリ一覧を集計して返す */
  getCategories() {
    const map = {};
    (this.articles || []).forEach(a => {
      map[a.category] = (map[a.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  },

  /** サイドバーをレンダリング */
  renderSidebar(activeCategory = null) {
    const el = document.getElementById('sidebar');
    if (!el) return;

    // 人気記事 (views 降順)
    const popular = [...this.articles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, this.config.popularCount || 10);

    const popularHTML = popular.map((a, i) => `
      <li>
        <span class="popular-rank ${i < 3 ? 'top3' : ''}">${i + 1}</span>
        <a href="./article.html?id=${a.id}">${escapeHTML(a.title)}</a>
      </li>`).join('');

    // カテゴリリスト
    const cats = this.getCategories();
    const catHTML = cats.map(c => `
      <li>
        <a href="./category.html?cat=${encodeURIComponent(c.name)}">
          ${escapeHTML(c.name)}<span class="cat-count">${c.count}件</span>
        </a>
      </li>`).join('');

    el.innerHTML = `
      <div class="sidebar-section">
        <h3>人気記事ランキング</h3>
        <ul class="popular-list">${popularHTML}</ul>
      </div>
      <div class="sidebar-section">
        <h3>カテゴリ</h3>
        <ul class="cat-list">${catHTML}</ul>
      </div>`;
  }
};

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}
