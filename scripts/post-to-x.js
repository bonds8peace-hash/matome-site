'use strict';
/**
 * post-to-x.js
 * X API v2 でツイートを投稿する
 */

const { TwitterApi } = require('twitter-api-v2');
const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = require('./config');

let _client = null;

function getClient() {
  if (!_client) {
    if (!X_API_KEY || X_API_KEY.startsWith('xxx')) {
      throw new Error('X APIキーが未設定です。.env を確認してください。');
    }
    _client = new TwitterApi({
      appKey:            X_API_KEY,
      appSecret:         X_API_SECRET,
      accessToken:       X_ACCESS_TOKEN,
      accessSecret:      X_ACCESS_TOKEN_SECRET,
    });
  }
  return _client;
}

/**
 * ツイートを投稿する
 * @param {string} text - 投稿テキスト（140字以内）
 * @returns {Promise<{ id: string, text: string }>}
 */
async function postTweet(text) {
  // 140字超の場合は切り詰め（URLは末尾に保持）
  const trimmed = trimTweet(text);
  const client = getClient();
  const rwClient = client.readWrite;
  const { data } = await rwClient.v2.tweet(trimmed);
  console.log(`  [X] 投稿成功: id=${data.id}`);
  return data;
}

/**
 * 140字を超える場合、URL手前で切り詰めて「…」を挿入
 */
function trimTweet(text) {
  if (text.length <= 140) return text;
  // URLを分離
  const urlMatch = text.match(/(https?:\/\/\S+)\s*(#\S+\s*)*$/);
  if (urlMatch) {
    const suffix = text.slice(urlMatch.index);      // URL + ハッシュタグ
    const body   = text.slice(0, urlMatch.index).trim();
    const maxBody = 140 - suffix.length - 1;         // 「…」の1文字分
    return body.slice(0, maxBody) + '…\n' + suffix;
  }
  return text.slice(0, 139) + '…';
}

module.exports = { postTweet };
