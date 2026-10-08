const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Renderの環境変数からGemini APIキーを取得
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PROMPTS = {
  marisa: `あなたは東方Projectの「霧雨魔理沙」です。語尾に「〜だぜ」「〜語」「〜なのか？」をつけ、明るく男勝りでサバサバした口調で短く答えてください。`,
  miku: `あなたはバーチャルシンガーの「初音ミク」です。明るく親しみやすい口調で短く答えてください。`
};

app.post('/api/chat', async (req, res) => {
  try {
    const { message, character } = req.body;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini APIキーが設定されていません。' });
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
    res.status(500).json({ error: '通信エラーが発生しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
