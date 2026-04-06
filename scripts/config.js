'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/** RSS フィード一覧（日本語優先・英語補完） */
const RSS_FEEDS = [
  { url: 'https://aismiley.co.jp/feed/',                        lang: 'ja', weight: 3 },
  { url: 'https://www.publickey1.jp/atom.xml',                  lang: 'ja', weight: 3 },
  { url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',  lang: 'ja', weight: 2 },
  { url: 'https://gigazine.net/news/rss_2.0/',                  lang: 'ja', weight: 2 },
  { url: 'https://techcrunch.com/feed/',                        lang: 'en', weight: 1 },
  { url: 'https://feeds.feedburner.com/TheHackersNews',         lang: 'en', weight: 1 },
];

/** カテゴリ別アフィリエイト枠テンプレート（URLは後で差し替え） */
const AFFILIATE_TEMPLATES = {
  'AI': `<a href="{{URL}}" target="_blank" rel="noopener sponsored"
    style="display:inline-block;padding:10px 20px;background:#0078d4;color:#fff;
    border-radius:4px;font-size:13px;text-decoration:none;">
    ▶ Azure OpenAI Service を試す</a>`,

  'セキュリティ': `<a href="{{URL}}" target="_blank" rel="noopener sponsored"
    style="display:inline-block;padding:10px 20px;background:#cc0000;color:#fff;
    border-radius:4px;font-size:13px;text-decoration:none;">
    ▶ 脆弱性管理ツール Tenable.io を試す</a>`,

  'EC': `<a href="{{URL}}" target="_blank" rel="noopener sponsored"
    style="display:inline-block;padding:10px 20px;background:#96bf48;color:#fff;
    border-radius:4px;font-size:13px;text-decoration:none;">
    ▶ Shopify を無料で始める</a>`,

  '副業・アフィ': `<a href="{{URL}}" target="_blank" rel="noopener sponsored"
    style="display:inline-block;padding:10px 20px;background:#ff7a59;color:#fff;
    border-radius:4px;font-size:13px;text-decoration:none;">
    ▶ HubSpot アフィリエイトプログラムに登録</a>`,

  'デフォルト': `<a href="{{URL}}" target="_blank" rel="noopener sponsored"
    style="display:inline-block;padding:10px 20px;background:#333;color:#fff;
    border-radius:4px;font-size:13px;text-decoration:none;">
    ▶ 関連サービスを見る</a>`,
};

/** カテゴリ判定キーワード */
const CATEGORY_KEYWORDS = {
  'セキュリティ': ['脆弱性', 'セキュリティ', 'CVE', 'breach', 'hack', 'malware', 'phishing'],
  'EC':           ['EC', 'ecommerce', 'Shopify', '通販', '購買', 'ショッピング'],
  '副業・アフィ': ['副業', 'アフィリエイト', 'フリーランス', '案件', '収益化', 'SaaS'],
  'AI':           ['AI', '生成AI', 'ChatGPT', 'Claude', 'LLM', 'OpenAI', '機械学習'],
};

const PATHS = {
  articles:  require('path').join(__dirname, '../public/data/articles.json'),
  queue:     require('path').join(__dirname, '../public/data/post-queue.json'),
  config:    require('path').join(__dirname, '../public/data/config.json'),
};

module.exports = {
  RSS_FEEDS,
  AFFILIATE_TEMPLATES,
  CATEGORY_KEYWORDS,
  PATHS,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  X_API_KEY:          process.env.X_API_KEY,
  X_API_SECRET:       process.env.X_API_SECRET,
  X_ACCESS_TOKEN:     process.env.X_ACCESS_TOKEN,
  X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET,
  FIXED_HASHTAG:      process.env.FIXED_HASHTAG || '#AI速報',
  MAX_ARTICLES:       parseInt(process.env.MAX_ARTICLES || '100', 10),
};
