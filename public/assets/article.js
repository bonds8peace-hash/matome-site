/**
 * article.js
 * 記事詳細ページ用: URLパラメータ ?id= で記事を取得・描画
 */

(async () => {
  const { config, articles } = await SITE.init();

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const article = articles.find(a => a.id === id);
  const main = document.getElementById('article-main');

  if (!article) {
    main.innerHTML = '<div class="no-results">記事が見つかりませんでした</div>';
    SITE.renderSidebar();
    return;
  }

  document.title = article.title;

  main.innerHTML = `
    <div class="article-detail">
      <h1>${escapeHTML(article.title)}</h1>
      <div class="detail-meta">
        <span class="category-badge">
          <a href="./category.html?cat=${encodeURIComponent(article.category)}">${escapeHTML(article.category)}</a>
        </span>
        &nbsp;${formatDate(article.date)}
      </div>
      <div class="body">${article.body}</div>
      <div class="source-link">
        出典: <a href="${escapeHTML(article.source_url)}" target="_blank" rel="noopener">
          ${escapeHTML(article.source_url)}
        </a>
      </div>
      ${article.affiliate_html ? `
      <div class="affiliate-block">
        <div class="affiliate-label">※ 広告リンク</div>
        ${article.affiliate_html}
      </div>` : ''}
    </div>`;

  SITE.renderSidebar(article.category);
})();
