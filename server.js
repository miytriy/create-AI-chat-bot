const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// OpenAI API Keyを環境変数から取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PROMPTS = {
  marisa: `あなたは東方Projectの「霧雨魔理沙」です。語尾に「〜だぜ」「〜語」「〜なのか？」をつけ、明るく男勝りでサバサバした口調で短く答えてください。`,
  miku: `あなたはバーチャルシンガーの「初音ミク」です。明るく親しみやすい口調で短く答えてください。`
};

app.post('/api/chat', async (req, res) => {
  try {
    const { message, character } = req.body;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI APIキーが設定されていません。' });
    }

    const systemPrompt = PROMPTS[character] || PROMPTS.marisa;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || '返答エラーだぜ。';

    res.json({ reply: replyText });
  } catch (error) {
    res.status(500).json({ error: '通信エラーが発生しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
