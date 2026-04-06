'use strict';
/**
 * fetch-news.js
 * 複数のRSSフィードを巡回し、最新ニュースを指定件数返す
 * 重複（同タイトル・同URL）は除外する
 */

const Parser = require('rss-parser');
const { RSS_FEEDS } = require('./config');

const parser = new Parser({ timeout: 10000 });

/**
 * @param {number} count - 取得件数（デフォルト3）
 * @returns {Promise<Array<{title, summary, url, pubDate, source}>>}
 */
async function fetchNews(count = 3) {
  const results = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || []).slice(0, 5).map(item => ({
        title:   item.title?.trim() || '',
        summary: stripHTML(item.contentSnippet || item.summary || item.content || '').slice(0, 300),
        url:     item.link || item.guid || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        source:  parsed.title || feed.url,
        lang:    feed.lang,
      })).filter(i => i.title && i.url);

      results.push(...items);
      console.log(`  [RSS] ${feed.url} → ${items.length}件取得`);
    } catch (err) {
      console.warn(`  [RSS] 取得失敗: ${feed.url} — ${err.message}`);
    }
  }

  // 重複除去（URL基準）→ 日付降順 → 先頭N件
  const seen = new Set();
  const unique = results
    .filter(i => {
      if (seen.has(i.url)) return false;
      seen.add(i.url);
      return true;
    })
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (unique.length < count) {
    console.warn(`  [RSS] 取得件数不足: ${unique.length}/${count}件`);
  }

  return unique.slice(0, count);
}

function stripHTML(str) {
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

module.exports = { fetchNews };
