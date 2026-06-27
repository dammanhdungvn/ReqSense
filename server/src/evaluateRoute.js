const express = require('express');
const OpenAI = require('openai');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';

/* ── POST /api/analyze-gaps ────────────────────────────── */
router.post('/analyze-gaps', async (req, res) => {
  const { messages, coveredTopics, skippedTopics, confidence, language } = req.body;
  const lang = language === 'vi' ? 'Vietnamese' : 'English';

  const conversationText = (messages || [])
    .map(m => `${m.role === 'user' ? 'User' : 'Alex'}: ${m.text}`)
    .join('\n');

  const prompt = `You are a senior Business Analyst auditing a requirement gathering conversation.
Language of conversation: ${lang}
Confidence score so far: ${confidence}/100
Topics marked as covered: ${(coveredTopics || []).join(', ') || 'none'}
Topics the customer explicitly skipped: ${(skippedTopics || []).join(', ') || 'none'}

Conversation transcript:
${conversationText}

Analyze the quality of coverage for ALL 10 requirement areas and return ONLY valid JSON (no extra text).
For skipped topics, keep the topic in the list but set "question": null. Do not suggest follow-up questions for skipped topics.

{
  "topics": [
    {
      "name": "Project Overview",
      "quality": "solid|partial|thin|missing",
      "score": <1-10>,
      "note": "<one short sentence in ${lang}>",
      "question": "<a specific follow-up question in ${lang} to fill the gap, or null if solid>"
    },
    ... (all 10 topics)
  ],
  "criticalGaps": ["<most important missing item in ${lang}>", ...],
  "verdict": "ready|needs-more|critical-gaps",
  "summary": "<2 sentences in ${lang} about current coverage state>"
}

The 10 topics are:
1. Project Overview
2. Target Users & Roles
3. Core Features & Workflows
4. Business Rules
5. Non-functional Requirements
6. Integrations
7. Deployment & Infrastructure
8. Compliance & Regulations
9. Timeline & Budget
10. Success Criteria`;

  try {
    const completion = await openai.chat.completions.create({
      model: model(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    const data = JSON.parse(completion.choices[0].message.content);
    return res.json(data);
  } catch (err) {
    console.error('analyze-gaps error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/evaluate ────────────────────────────────── */
router.post('/evaluate', async (req, res) => {
  const { report, language } = req.body;
  const lang = language === 'vi' ? 'Vietnamese' : 'English';

  const prompt = `You are a senior Business Analyst with 15+ years of experience reviewing requirements specifications for software development teams.

Evaluate the report below using the RUBRIC provided for each dimension. Write all feedback in ${lang}.
Return ONLY valid JSON (no extra text outside the JSON object).

## SCORING RUBRIC

### 1. Completeness (Độ đầy đủ)
Does the report cover all required sections with enough detail?
- 9-10: All 10 sections present, each with multiple specific requirements, no major gaps
- 7-8:  Most sections covered well, 1-2 sections thin but acceptable
- 5-6:  Several sections present but multiple are superficial or missing sub-points
- 3-4:  Only half the sections are adequately addressed
- 1-2:  Major sections missing or nearly empty

### 2. Specificity (Tính cụ thể / Actionable)
Are requirements specific enough for a developer to implement without guessing?
- 9-10: Every requirement has measurable criteria, specific numbers, concrete examples (e.g. "response < 200ms", "max 3 retry attempts")
- 7-8:  Most requirements are specific; a few still vague but understandable
- 5-6:  Mix of specific and vague; dev team would need to ask follow-up questions for ~30% of items
- 3-4:  Mostly high-level statements, few concrete details
- 1-2:  Almost entirely vague ("should be fast", "user-friendly") with no measurable criteria

### 3. User Stories Quality (Chất lượng User Stories)
Are user needs properly expressed in user story format with clear value?
- 9-10: All key flows have well-formed stories ("As a [role], I want [action] so that [benefit]"), with acceptance criteria
- 7-8:  Most flows have user stories; format is correct; some missing acceptance criteria
- 5-6:  User stories present but inconsistent format, or missing for important flows
- 3-4:  Only a few user stories, mostly feature descriptions instead
- 1-2:  No user stories, purely feature lists with no user perspective

### 4. Technical Clarity (Rõ ràng kỹ thuật)
Can a developer understand the technical expectations without ambiguity?
- 9-10: Architecture, stack, integrations, APIs, data models all clearly specified
- 7-8:  Good technical direction; minor gaps in one or two areas
- 5-6:  Some technical details but missing key decisions (e.g. no DB choice, no auth method)
- 3-4:  Very little technical specification; developer must make most technical decisions blindly
- 1-2:  No technical content; purely business description

### 5. Risk Coverage (Phủ rủi ro / Open Questions)
Does the report acknowledge unknowns, risks, and open questions?
- 9-10: Risk register with likelihood/impact/mitigation; clear open questions listed; failure scenarios addressed
- 7-8:  Main risks identified with some mitigation notes; open questions listed
- 5-6:  A few risks mentioned in passing; limited open questions
- 3-4:  Risks barely mentioned; no open questions section
- 1-2:  No risk awareness; report reads as if everything will go perfectly

### 6. Development Readiness (Sẵn sàng phát triển)
Could a dev team start sprint planning directly from this document?
- 9-10: Team can immediately create tickets, estimate effort, plan sprints — zero ambiguity
- 7-8:  Team could start with minor clarification (1-2 quick questions)
- 5-6:  Team needs a discovery session before starting development
- 3-4:  Significant gaps; would require another full BA workshop
- 1-2:  Not actionable; essentially a wishlist

## RESPONSE FORMAT
{
  "scores": {
    "completeness":     { "score": <1-10>, "explanation": "<2-3 sentences WHY this score, referencing specific sections>", "evidence": "<direct quote or specific example from the report>", "improvement": "<one concrete action to raise this score>" },
    "specificity":      { "score": <1-10>, "explanation": "<2-3 sentences>", "evidence": "<quote or example>", "improvement": "<action>" },
    "userStories":      { "score": <1-10>, "explanation": "<2-3 sentences>", "evidence": "<quote or example>", "improvement": "<action>" },
    "technicalClarity": { "score": <1-10>, "explanation": "<2-3 sentences>", "evidence": "<quote or example>", "improvement": "<action>" },
    "riskCoverage":     { "score": <1-10>, "explanation": "<2-3 sentences>", "evidence": "<quote or example>", "improvement": "<action>" },
    "devReadiness":     { "score": <1-10>, "explanation": "<2-3 sentences>", "evidence": "<quote or example>", "improvement": "<action>" }
  },
  "overall": <arithmetic average of all 6 scores, rounded to 1 decimal>,
  "strengths": ["<specific strength with example from the report>", "<another strength>"],
  "gaps": ["<specific gap with section reference>", "<another gap>"],
  "verdict": "<2 sentences: overall assessment + recommendation for next step>"
}

## REPORT TO EVALUATE
${report}`;

  try {
    const completion = await openai.chat.completions.create({
      model: model(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    const data = JSON.parse(completion.choices[0].message.content);
    return res.json(data);
  } catch (err) {
    console.error('evaluate error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
