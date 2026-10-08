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
      console.error('ERROR: GEMINI_API_KEY is not set in Environment Variables.');
      return res.status(500).json({ error: 'サーバーにGEMINI_API_KEYが設定されていません。' });
    }

    const systemPrompt = PROMPTS[character] || PROMPTS.marisa;
    
    // 最新モデル（gemini-3.8-flash）を指定
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`;

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

    if (!response.ok || data.error) {
      console.error('Gemini API Error Detail:', JSON.stringify(data.error || data));
      const errMsg = data.error?.message || 'Gemini APIエラーが発生しました。';
      return res.status(response.status || 500).json({ error: `APIエラー: ${errMsg}` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '返答の取得に失敗しました。';
    res.json({ reply: replyText });

  } catch (error) {
    console.error('Server Catch Error:', error);
    res.status(500).json({ error: `サーバーエラー: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
