'use strict';
/**
 * generate-article.js
 * Claude API でニュースアイテムから
 * - articles.json 用の記事オブジェクト
 * - X投稿テキスト（朝・昼・夜の3スロット）
 * を生成する
 */

const Anthropic = require('@anthropic-ai/sdk');
const { ANTHROPIC_API_KEY, AFFILIATE_TEMPLATES, CATEGORY_KEYWORDS, FIXED_HASHTAG } = require('./config');

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

/**
 * ニュースアイテムから記事データとツイートを生成
 * @param {{ title, summary, url, pubDate, source }} newsItem
 * @param {string} slot - 'morning' | 'noon' | 'evening'
 * @returns {Promise<{ article: object, tweet: string }>}
 */
async function generateArticle(newsItem, slot = 'morning') {
  const slotGuide = {
    morning: '朝のニュース反応型。結論→理由の順。簡潔に。',
    noon:    '昼の体験談・解説型。具体的な数字や事例を入れる。',
    evening: '夜のHowToスレッド型。箇条書き3点で手順を示す。',
  };

  const prompt = `あなたは「副業・フリーランスでAIを活用して稼ぐ」をテーマにしたメディアのSNS運用プロかつWebライターです。
以下のニュース情報をもとに、JSON形式でアウトプットを生成してください。

【ニュース情報】
タイトル: ${newsItem.title}
概要: ${newsItem.summary}
URL: ${newsItem.url}
出典: ${newsItem.source}

【コンセプト】
読者は副業・フリーランスで収益化を目指している個人。
「このニュースが自分の副業にどう使えるか」という実益視点で書く。
単なるニュース要約ではなく、「だから副業でこう活かせる」という一歩踏み込んだ解説を必ず入れること。

【出力ルール】
- 著作権に配慮し、本文のコピペは禁止。必ず自分の言葉で書く
- あいまい語（「すごい」「やばい」等）は禁止
- 絵文字は禁止
- 長文禁止（ツイートは140字以内）
- body_htmlには必ず「副業・フリーランスへの活用例」セクション（<h3>）を1つ含めること

以下のJSONを返してください（他の文字は不要）:
{
  "category": "AI | セキュリティ | EC | 副業・アフィ のいずれか最適なもの",
  "title": "20〜30文字で言い換えた見出し",
  "summary": "2〜3行の要約（事実のみ、コピペ禁止）",
  "body_html": "<p>本文HTML。h3・ul・p使用可。300〜500字程度。必ず副業・フリーランスへの活用例セクションを含む。</p>",
  "tweet": "${slotGuide[slot]}\\n形式: 1行目=結論、2行目=副業での具体的な活用ポイント、3行目=なぜ今取り組むべきか。${FIXED_HASHTAG} と記事固有ハッシュタグ1つを最後に付ける。140字以内。",
  "hashtag": "記事固有のハッシュタグ1つ（#記号付き）"
}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();
  // JSON部分だけ抽出（前後に余計な文字があっても対応）
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON取得失敗: ' + raw.slice(0, 200));
  const data = JSON.parse(jsonMatch[0]);

  // カテゴリのフォールバック（キーワードマッチ）
  if (!data.category || !AFFILIATE_TEMPLATES[data.category]) {
    data.category = detectCategory(newsItem.title + ' ' + newsItem.summary);
  }

  // アフィリエイト枠（URLプレースホルダー付き）
  const affiliateTemplate = AFFILIATE_TEMPLATES[data.category] || AFFILIATE_TEMPLATES['デフォルト'];
  const affiliate_html = affiliateTemplate.replace('{{URL}}', '#AFFILIATE_URL');

  // ツイートテキスト整形
  const tweetText = `${data.tweet}\n${newsItem.url}`;

  const today = new Date().toISOString().split('T')[0];
  const article = {
    id:            generateId(),
    title:         data.title,
    date:          today,
    category:      data.category,
    summary:       data.summary,
    body:          data.body_html,
    source_url:    newsItem.url,
    affiliate_html,
    views:         0,
  };

  return { article, tweet: tweetText };
}

function detectCategory(text) {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
      return cat;
    }
  }
  return 'AI';
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

module.exports = { generateArticle };
