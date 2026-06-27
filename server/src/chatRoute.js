const express = require('express');
const OpenAI = require('openai');
const {
  runElicitationPipeline,
  generateRequirementReport,
  isReportRequest,
} = require('./multiAgentOrchestrator');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/chat', async (req, res) => {
  const { messages, generateReport } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const lastUserMessage = [...messages].reverse().find(
      msg => msg.role === 'user' && msg.text !== 'GENERATE_REPORT'
    )?.text || '';

    if (generateReport || isReportRequest(lastUserMessage)) {
      const content = await generateRequirementReport(openai, model, messages);
      return res.json({ type: 'report', content });
    }

    const data = await runElicitationPipeline(openai, model, messages);
    return res.json({
      type: 'structured',
      message: data.message,
      confidence: data.confidence,
      currentTopic: data.currentTopic,
      coveredTopics: data.coveredTopics || [],
      confirmedFeatures: data.confirmedFeatures || [],
      skippedTopics: data.skippedTopics || [],
      options: data.options || null,
      readyForReport: data.readyForReport || false,
      agentTrace: data.agentTrace || [],
    });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
