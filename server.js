const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// index.html など静的ファイルをブラウザに返す設定
app.use(express.static('.'));

// APIキーはRenderの環境変数から取得（コードには直接書かない！）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// キャラクターごとのプロンプト定義
const PROMPTS = {
  marisa: `あなたは東方Projectの「霧雨魔理沙」です。語尾に「〜だぜ」「〜語」「〜なのか？」をつけ、明るく男勝りでサバサバした口調で答えてください。長文にならず、短く簡潔にテンポよく返答してください。`,
  miku: `あなたはバーチャルシンガーの「初音ミク」です。明るく元気で丁寧、親しみやすい口調で話してください。「〜だよ」「〜ね！」といった可愛らしい語尾を使い、短く答えてください。`
};

// フロントエンドからの会話リクエストを受け取るエンドポイント
app.post('/api/chat', async (req, res) => {
  try {
    const { message, character } = req.body;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'サーバーにAPIキーが設定されていません。' });
    }

    const systemPrompt = PROMPTS[character] || PROMPTS.marisa;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nユーザー: ${message}` }] }
        ]
      })
    });

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'うまく返答できなかったぜ。';

    res.json({ reply: replyText });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '通信エラーが発生しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
