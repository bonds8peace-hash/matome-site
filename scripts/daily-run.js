'use strict';
/**
 * daily-run.js
 * メインオーケストレーター
 *
 * 使い方:
 *   node scripts/daily-run.js morning   # ニュース取得→記事生成→キュー保存→朝ツイート
 *   node scripts/daily-run.js noon      # キューから昼ツイート
 *   node scripts/daily-run.js evening   # キューから夜ツイート
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs   = require('fs');
const path = require('path');
const { fetchNews }       = require('./fetch-news');
const { generateArticle } = require('./generate-article');
const { postTweet }       = require('./post-to-x');
const { PATHS, MAX_ARTICLES } = require('./config');

const slot = process.argv[2] || 'morning';
if (!['morning', 'noon', 'evening'].includes(slot)) {
  console.error('引数は morning / noon / evening のいずれかを指定してください');
  process.exit(1);
}

(async () => {
  console.log(`\n===== daily-run [${slot}] ${new Date().toISOString()} =====`);

  try {
    if (slot === 'morning') {
      await runMorning();
    } else {
      await runFromQueue(slot);
    }
    console.log('===== 完了 =====\n');
  } catch (err) {
    console.error('===== エラー =====', err);
    process.exit(1);
  }
})();

/* ─── morning: 取得→生成→保存→朝ツイート ─── */
async function runMorning() {
  console.log('[1/4] ニュース取得中...');
  const newsItems = await fetchNews(3);
  if (newsItems.length === 0) throw new Error('ニュースが1件も取得できませんでした');

  console.log(`[2/4] 記事生成中... (${newsItems.length}件)`);
  const slots = ['morning', 'noon', 'evening'];
  const generated = [];

  for (let i = 0; i < newsItems.length; i++) {
    const s = slots[i] || 'morning';
    console.log(`  → [${s}] "${newsItems[i].title.slice(0, 40)}..."`);
    try {
      const result = await generateArticle(newsItems[i], s);
      generated.push({ slot: s, ...result });
    } catch (err) {
      console.warn(`  [スキップ] 生成失敗: ${err.message}`);
    }
  }

  if (generated.length === 0) throw new Error('記事を1件も生成できませんでした');

  console.log('[3/4] articles.json / post-queue.json 更新中...');
  updateArticlesJson(generated.map(g => g.article));
  saveQueue(generated.map(g => ({ slot: g.slot, tweet: g.tweet, posted: false })));

  console.log('[4/4] 朝ツイート投稿中...');
  const morningItem = generated.find(g => g.slot === 'morning') || generated[0];
  await postTweet(morningItem.tweet);
  markPosted('morning');

  logRun(generated);
}

/* ─── noon / evening: キューから投稿 ─── */
async function runFromQueue(s) {
  const queue = loadQueue();
  const item = queue.find(q => q.slot === s && !q.posted);
  if (!item) {
    console.log(`  [スキップ] キューに ${s} の未投稿ツイートがありません`);
    return;
  }
  console.log(`[1/1] ${s} ツイート投稿中...`);
  await postTweet(item.tweet);
  markPosted(s);
}

/* ─── ファイル操作ユーティリティ ─── */

function updateArticlesJson(newArticles) {
  let existing = [];
  if (fs.existsSync(PATHS.articles)) {
    existing = JSON.parse(fs.readFileSync(PATHS.articles, 'utf8'));
  }
  // 重複除去（source_url基準）
  const existingUrls = new Set(existing.map(a => a.source_url));
  const toAdd = newArticles.filter(a => !existingUrls.has(a.source_url));
  // 先頭に追加し、MAX_ARTICLES件に制限
  const merged = [...toAdd, ...existing].slice(0, MAX_ARTICLES);
  fs.writeFileSync(PATHS.articles, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`  articles.json: +${toAdd.length}件追加 (合計${merged.length}件)`);
}

function saveQueue(items) {
  fs.writeFileSync(PATHS.queue, JSON.stringify(items, null, 2), 'utf8');
}

function loadQueue() {
  if (!fs.existsSync(PATHS.queue)) return [];
  return JSON.parse(fs.readFileSync(PATHS.queue, 'utf8'));
}

function markPosted(s) {
  const queue = loadQueue();
  const updated = queue.map(q => q.slot === s ? { ...q, posted: true } : q);
  fs.writeFileSync(PATHS.queue, JSON.stringify(updated, null, 2), 'utf8');
}

function logRun(generated) {
  const logPath = path.join(__dirname, '../public/data/run-log.json');
  let logs = [];
  if (fs.existsSync(logPath)) {
    try { logs = JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch {}
  }
  logs.unshift({
    date:      new Date().toISOString(),
    articles:  generated.map(g => ({ title: g.article.title, url: g.article.source_url })),
    tweets:    generated.map(g => ({ slot: g.slot, preview: g.tweet.slice(0, 60) })),
  });
  fs.writeFileSync(logPath, JSON.stringify(logs.slice(0, 30), null, 2), 'utf8');
}
