const express = require('express');
const OpenAI = require('openai');
const SYSTEM_PROMPT = require('./chatSystemPrompt');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildMessages(messages) {
  const result = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.text });
    } else if (msg.role === 'model') {
      result.push({ role: 'assistant', content: msg.text });
    }
  }
  return result;
}

router.post('/chat', async (req, res) => {
  const { messages, generateReport } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const builtMessages = buildMessages(messages);
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const options = {
      model,
      messages: builtMessages,
      temperature: 0.7,
    };

    if (!generateReport) {
      options.response_format = { type: 'json_object' };
    }

    const completion = await openai.chat.completions.create(options);
    const content = completion.choices[0].message.content;

    if (generateReport) {
      return res.json({ type: 'report', content });
    }

    const data = JSON.parse(content);
    return res.json({
      type: 'structured',
      message: data.message,
      confidence: data.confidence,
      currentTopic: data.currentTopic,
      coveredTopics: data.coveredTopics || [],
      options: data.options || null,
      readyForReport: data.readyForReport || false,
    });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
