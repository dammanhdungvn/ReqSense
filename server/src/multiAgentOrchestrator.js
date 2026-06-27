const REQUIREMENT_AREAS = [
  'Project Overview',
  'Target Users & Roles',
  'Core Features & Workflows',
  'Business Rules',
  'Non-functional Requirements',
  'Integrations',
  'Deployment & Infrastructure',
  'Compliance & Regulations',
  'Timeline & Budget',
  'Success Criteria',
];

const AGENT_NAMES = [
  'Requirement Analysis Agent',
  'Business Document Search Agent',
  'Research Agent',
  'Gap Analysis Agent',
  'Question Planning Agent',
];

function safeJsonParse(value) {
  if (!value || typeof value !== 'string') return null;

  try {
    return JSON.parse(value);
  } catch (_) {
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (err) {
      return null;
    }
  }
}

function getLastUserMessage(messages) {
  return [...messages].reverse().find(
    msg => msg.role === 'user' && msg.text !== 'GENERATE_REPORT'
  )?.text || '';
}

function getPreviousAssistantState(messages) {
  const lastModel = [...messages].reverse().find(msg => msg.role === 'model');
  const parsed = safeJsonParse(lastModel?.text);

  return {
    confidence: Number(parsed?.confidence || 0),
    currentTopic: parsed?.currentTopic || '',
    coveredTopics: Array.isArray(parsed?.coveredTopics) ? parsed.coveredTopics : [],
    readyForReport: Boolean(parsed?.readyForReport),
  };
}

function buildConversationText(messages) {
  return messages
    .filter(msg => msg.text !== 'GENERATE_REPORT')
    .map((msg, index) => {
      if (msg.role === 'user') {
        return `${index + 1}. Customer: ${msg.text}`;
      }

      const parsed = safeJsonParse(msg.text);
      if (parsed?.message) {
        return `${index + 1}. BA Assistant: ${parsed.message}`;
      }

      return `${index + 1}. BA Assistant: ${msg.text}`;
    })
    .join('\n\n');
}

async function runJsonAgent(openai, { model, name, system, user, temperature = 0.2 }) {
  const completion = await openai.chat.completions.create({
    model,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const content = completion.choices[0].message.content;
  const parsed = safeJsonParse(content);
  if (!parsed) {
    throw new Error(`${name} returned invalid JSON`);
  }
  return parsed;
}

async function runTextAgent(openai, { model, system, user, temperature = 0.4 }) {
  const completion = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  return completion.choices[0].message.content;
}

function normalizeStructuredResponse(questionPlan, gapAnalysis, previousState) {
  const mergedTopics = new Set([
    ...previousState.coveredTopics,
    ...(Array.isArray(gapAnalysis.coveredTopics) ? gapAnalysis.coveredTopics : []),
    ...(Array.isArray(questionPlan.coveredTopics) ? questionPlan.coveredTopics : []),
  ]);

  const coveredTopics = [...mergedTopics].filter(topic => REQUIREMENT_AREAS.includes(topic));
  const confidence = Math.max(
    previousState.confidence,
    Number(gapAnalysis.confidence || 0),
    Number(questionPlan.confidence || 0),
    coveredTopics.length > 0 ? 5 : 0
  );

  const currentTopic = REQUIREMENT_AREAS.includes(questionPlan.currentTopic)
    ? questionPlan.currentTopic
    : gapAnalysis.currentTopic || 'Project Overview';

  const options = Array.isArray(questionPlan.options) && questionPlan.options.length > 0
    ? questionPlan.options.slice(0, 4)
    : null;

  if (options && !options.some(option => /something else/i.test(option))) {
    options[options.length - 1] = 'Something else';
  }

  return {
    message: questionPlan.message || 'Thanks. Could you share a bit more detail about the project goal?',
    confidence: Math.min(100, Math.round(confidence)),
    currentTopic,
    coveredTopics,
    options,
    readyForReport: Boolean(questionPlan.readyForReport || (confidence >= 75 && coveredTopics.length >= 6)),
  };
}

function makeEmptyAnalysis() {
  return {
    domain: 'unknown',
    businessGoal: 'unknown',
    actors: [],
    mentionedFeatures: [],
    businessRules: [],
    nonFunctionalNeeds: [],
    integrations: [],
    constraints: [],
    confirmedFacts: [],
    inferredFacts: [],
    topicEvidence: {},
  };
}

function makeEmptyResearch(domain = 'unknown') {
  return {
    domain,
    commonWorkflows: [],
    commonFeatures: [],
    bestPractices: [],
    domainRisks: [],
    complianceConsiderations: [],
    usefulQuestionsByTopic: {},
  };
}

function makeEmptyBusinessDocuments(domain = 'unknown') {
  return {
    domain,
    searchNeeded: false,
    searchQueries: [],
    documentTypes: [],
    recommendedSources: [],
    keyFindings: [],
    verificationNotes: [],
  };
}

function makeEmptyGapAnalysis(previousState) {
  return {
    coveredTopics: previousState.coveredTopics || [],
    coverageByTopic: {},
    missingRequirements: [],
    priorityTopics: [],
    confidence: previousState.confidence || 0,
    currentTopic: previousState.currentTopic || 'Project Overview',
    readyForReport: previousState.readyForReport || false,
  };
}

function normalizeRouterDecision(decision) {
  const selectedAgents = Array.isArray(decision.selectedAgents)
    ? decision.selectedAgents.filter(agent => AGENT_NAMES.includes(agent))
    : [];

  const useSpecializedAgents = Boolean(decision.useSpecializedAgents && selectedAgents.length > 0);

  return {
    useSpecializedAgents,
    selectedAgents: useSpecializedAgents ? selectedAgents : [],
    decisionReason: decision.decisionReason || 'No reason provided.',
    expectedBenefit: decision.expectedBenefit || '',
  };
}

function addRequiredAgents(selectedAgents) {
  const selected = new Set(selectedAgents);

  if (selected.size === 0) return [];

  if (
    selected.has('Business Document Search Agent') ||
    selected.has('Research Agent') ||
    selected.has('Gap Analysis Agent')
  ) {
    selected.add('Requirement Analysis Agent');
  }

  if (selected.has('Gap Analysis Agent')) {
    selected.add('Research Agent');
  }

  selected.add('Question Planning Agent');

  return AGENT_NAMES.filter(agent => selected.has(agent));
}

function asShortList(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter(item => typeof item === 'string' && item.trim())
    .slice(0, 4);
}

function makeAgentTrace({ analysis, research, gapAnalysis, questionPlan }) {
  return [
    {
      agent: 'Requirement Analysis Agent',
      title: 'Phân tích yêu cầu',
      summary: `Domain: ${analysis.domain || 'chưa xác định'}. Mục tiêu: ${analysis.businessGoal || 'chưa rõ'}.`,
      details: [
        ...asShortList(analysis.confirmedFacts),
        ...asShortList(analysis.mentionedFeatures),
      ].slice(0, 5),
    },
    {
      agent: 'Research Agent',
      title: 'Bổ sung kiến thức nghiệp vụ',
      summary: `Tham chiếu các chức năng và quy trình phổ biến cho domain ${research.domain || analysis.domain || 'hiện tại'}.`,
      details: [
        ...asShortList(research.commonWorkflows),
        ...asShortList(research.commonFeatures),
        ...asShortList(research.domainRisks),
      ].slice(0, 5),
    },
    {
      agent: 'Gap Analysis Agent',
      title: 'Tìm khoảng trống yêu cầu',
      summary: `Độ hoàn thiện ước tính: ${gapAnalysis.confidence || 0}%. Chủ đề ưu tiên: ${(gapAnalysis.priorityTopics || []).slice(0, 2).join(', ') || 'chưa xác định'}.`,
      details: asShortList(gapAnalysis.missingRequirements, ['Chưa có đủ dữ liệu để xác định khoảng trống.']),
    },
    {
      agent: 'Question Planning Agent',
      title: 'Lập câu hỏi tiếp theo',
      summary: `Câu hỏi tiếp theo tập trung vào: ${questionPlan.currentTopic || gapAnalysis.currentTopic || 'Project Overview'}.`,
      details: asShortList(questionPlan.options, ['Tiếp tục hỏi 1-2 câu để làm rõ yêu cầu.']),
    },
  ];
}

function makeRouterTrace(routerDecision, executedAgents) {
  return {
    agent: 'Agent Router',
    title: 'Quyết định dùng agent',
    summary: routerDecision.useSpecializedAgents
      ? `Có dùng agent chuyên trách. Agent được chọn: ${executedAgents.join(', ')}.`
      : 'Không dùng agent chuyên trách. Trả lời trực tiếp để tiết kiệm token và giảm độ trễ.',
    details: [
      routerDecision.decisionReason,
      routerDecision.expectedBenefit,
    ].filter(Boolean),
  };
}

function makeSelectedAgentTrace({
  routerDecision,
  executedAgents,
  analysis,
  businessDocuments,
  research,
  gapAnalysis,
  questionPlan,
}) {
  const trace = [makeRouterTrace(routerDecision, executedAgents)];

  if (executedAgents.includes('Requirement Analysis Agent')) {
    trace.push({
      agent: 'Requirement Analysis Agent',
      title: 'Phân tích yêu cầu',
      summary: `Domain: ${analysis.domain || 'chưa xác định'}. Mục tiêu: ${analysis.businessGoal || 'chưa rõ'}.`,
      details: [
        ...asShortList(analysis.confirmedFacts),
        ...asShortList(analysis.mentionedFeatures),
      ].slice(0, 5),
    });
  }

  if (executedAgents.includes('Business Document Search Agent')) {
    trace.push({
      agent: 'Business Document Search Agent',
      title: 'Tìm tài liệu nghiệp vụ liên quan',
      summary: `Domain: ${businessDocuments.domain || analysis.domain || 'chưa xác định'}. Cần tra cứu: ${businessDocuments.searchNeeded ? 'có' : 'không rõ/chưa cần'}.`,
      details: [
        ...asShortList(businessDocuments.documentTypes),
        ...asShortList(businessDocuments.recommendedSources),
        ...asShortList(businessDocuments.searchQueries),
        ...asShortList(businessDocuments.keyFindings),
      ].slice(0, 6),
    });
  }

  if (executedAgents.includes('Research Agent')) {
    trace.push({
      agent: 'Research Agent',
      title: 'Bổ sung kiến thức nghiệp vụ',
      summary: `Tham chiếu các chức năng và quy trình phổ biến cho domain ${research.domain || analysis.domain || 'hiện tại'}.`,
      details: [
        ...asShortList(research.commonWorkflows),
        ...asShortList(research.commonFeatures),
        ...asShortList(research.domainRisks),
      ].slice(0, 5),
    });
  }

  if (executedAgents.includes('Gap Analysis Agent')) {
    trace.push({
      agent: 'Gap Analysis Agent',
      title: 'Tìm khoảng trống yêu cầu',
      summary: `Độ hoàn thiện ước tính: ${gapAnalysis.confidence || 0}%. Chủ đề ưu tiên: ${(gapAnalysis.priorityTopics || []).slice(0, 2).join(', ') || 'chưa xác định'}.`,
      details: asShortList(gapAnalysis.missingRequirements, ['Chưa có đủ dữ liệu để xác định khoảng trống.']),
    });
  }

  if (executedAgents.includes('Question Planning Agent')) {
    trace.push({
      agent: 'Question Planning Agent',
      title: 'Lập câu hỏi tiếp theo',
      summary: `Câu hỏi tiếp theo tập trung vào: ${questionPlan.currentTopic || gapAnalysis.currentTopic || 'Project Overview'}.`,
      details: asShortList(questionPlan.options, ['Tiếp tục hỏi 1-2 câu để làm rõ yêu cầu.']),
    });
  }

  return trace;
}

async function runAgentRouter(openai, model, context) {
  const decision = await runJsonAgent(openai, {
    model,
    name: 'Agent Router',
    temperature: 0,
    system: `You are the Agent Router for a Business Analyst assistant.
Your job is to decide whether specialized agents are needed for this turn.
Use specialized agents only when they add clear value.

Agent catalog:
- Requirement Analysis Agent: extracts structured requirement facts from customer answers.
- Business Document Search Agent: identifies related business documents, standards, policies, workflow references, document types, trusted source categories, and search queries for the current domain.
- Research Agent: adds domain best practices and common workflows.
- Gap Analysis Agent: finds missing requirements and updates completion/confidence.
- Question Planning Agent: chooses the next 1-2 BA questions.

Prefer direct response when the user is greeting, asking a simple UI/help question, correcting wording, or the turn does not add requirement content.
Use specialized agents when the user provides new project requirements, answers elicitation questions, asks for requirement analysis, or when readiness/confidence should be updated.
Select Business Document Search Agent when the topic has a clear business domain, regulatory/process-heavy context, unfamiliar industry terms, or when external business documents would improve the next question.
Return JSON only.`,
    user: `Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Last customer message:
${context.lastUserMessage}

Conversation:
${context.conversationText}

Return this JSON shape:
{
  "useSpecializedAgents": true,
  "selectedAgents": ["Requirement Analysis Agent", "Business Document Search Agent", "Research Agent", "Gap Analysis Agent", "Question Planning Agent"],
  "decisionReason": "short reason",
  "expectedBenefit": "short benefit"
}`,
  });

  return normalizeRouterDecision(decision);
}

async function runDirectResponse(openai, model, context) {
  return runJsonAgent(openai, {
    model,
    name: 'Direct BA Response',
    temperature: 0.4,
    system: `You are Alex, a Senior Business Analyst.
Answer directly without using specialized agents.
Reply in the same language as the latest customer message.
Keep the existing requirement state unless the user clearly provides new requirement details.
If the latest message is the initial seed greeting, briefly greet and ask the user to describe their software idea.
Return JSON only.`,
    user: `Requirement areas:
${REQUIREMENT_AREAS.map((area, index) => `${index + 1}. ${area}`).join('\n')}

Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Last customer message:
${context.lastUserMessage}

Conversation:
${context.conversationText}

Return exactly this JSON shape:
{
  "message": "customer-facing response text",
  "confidence": ${context.previousState.confidence || 0},
  "currentTopic": "${context.previousState.currentTopic || 'Project Overview'}",
  "coveredTopics": ${JSON.stringify(context.previousState.coveredTopics || [])},
  "options": null,
  "readyForReport": ${context.previousState.readyForReport || false}
}`,
  });
}

async function runRequirementAnalysisAgent(openai, model, context) {
  return runJsonAgent(openai, {
    model,
    name: 'Requirement Analysis Agent',
    system: `You are the Requirement Analysis Agent.
Your job is to read the full customer conversation and extract the current requirement facts.
Do not ask questions. Do not invent facts.
Return JSON only.`,
    user: `Requirement areas:
${REQUIREMENT_AREAS.map((area, index) => `${index + 1}. ${area}`).join('\n')}

Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Last customer message:
${context.lastUserMessage}

Conversation:
${context.conversationText}

Return this JSON shape:
{
  "domain": "string or unknown",
  "businessGoal": "string or unknown",
  "actors": ["actor"],
  "mentionedFeatures": ["feature"],
  "businessRules": ["rule"],
  "nonFunctionalNeeds": ["need"],
  "integrations": ["integration"],
  "constraints": ["constraint"],
  "confirmedFacts": ["fact explicitly stated by the customer"],
  "inferredFacts": ["fact carefully inferred from context"],
  "topicEvidence": {
    "Project Overview": ["evidence"],
    "Target Users & Roles": ["evidence"],
    "Core Features & Workflows": ["evidence"],
    "Business Rules": ["evidence"],
    "Non-functional Requirements": ["evidence"],
    "Integrations": ["evidence"],
    "Deployment & Infrastructure": ["evidence"],
    "Compliance & Regulations": ["evidence"],
    "Timeline & Budget": ["evidence"],
    "Success Criteria": ["evidence"]
  }
}`,
  });
}

async function runBusinessDocumentSearchAgent(openai, model, context, analysis) {
  return runJsonAgent(openai, {
    model,
    name: 'Business Document Search Agent',
    temperature: 0.2,
    system: `You are the Business Document Search Agent.
Your job is to identify business documents, standards, workflows, policy references, and search queries that are relevant to the customer's domain.
You do not browse the web in this environment. Do not invent exact URLs.
Provide practical document types, trusted source categories, and search keywords that a BA should use to validate the domain.
Return JSON only.`,
    user: `Requirement Analysis Agent output:
${JSON.stringify(analysis, null, 2)}

Last customer message:
${context.lastUserMessage}

Conversation:
${context.conversationText}

Return this JSON shape:
{
  "domain": "domain name",
  "searchNeeded": true,
  "searchQueries": ["query to find business documents"],
  "documentTypes": ["document type, standard, policy, workflow, template"],
  "recommendedSources": ["trusted source category or organization name, not fake URL"],
  "keyFindings": ["short business insight likely relevant to requirements"],
  "verificationNotes": ["what must be verified with customer or official source"]
}`,
  });
}

async function runResearchAgent(openai, model, analysis, businessDocuments = makeEmptyBusinessDocuments()) {
  return runJsonAgent(openai, {
    model,
    name: 'Research Agent',
    system: `You are the Research Agent.
Your job is to provide concise domain knowledge for requirement elicitation.
Use general software and business-analysis best practices.
Do not claim that you browsed the web. Do not cite external sources.
Return JSON only.`,
    user: `Requirement analysis:
${JSON.stringify(analysis, null, 2)}

Business Document Search Agent output:
${JSON.stringify(businessDocuments, null, 2)}

Return this JSON shape:
{
  "domain": "domain name",
  "commonWorkflows": ["workflow"],
  "commonFeatures": ["feature"],
  "bestPractices": ["practice"],
  "domainRisks": ["risk"],
  "complianceConsiderations": ["consideration"],
  "usefulQuestionsByTopic": {
    "Project Overview": ["question"],
    "Target Users & Roles": ["question"],
    "Core Features & Workflows": ["question"],
    "Business Rules": ["question"],
    "Non-functional Requirements": ["question"],
    "Integrations": ["question"],
    "Deployment & Infrastructure": ["question"],
    "Compliance & Regulations": ["question"],
    "Timeline & Budget": ["question"],
    "Success Criteria": ["question"]
  }
}`,
  });
}

async function runGapAnalysisAgent(openai, model, context, analysis, research, businessDocuments = makeEmptyBusinessDocuments()) {
  return runJsonAgent(openai, {
    model,
    name: 'Gap Analysis Agent',
    system: `You are the Gap Analysis Agent.
Your job is to compare current requirements with expected domain knowledge.
Score completion conservatively. Keep previous covered topics; never remove them.
Only mark a topic covered when the customer gave real detail.
Return JSON only.`,
    user: `Requirement areas:
${REQUIREMENT_AREAS.map((area, index) => `${index + 1}. ${area}`).join('\n')}

Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Requirement Analysis Agent output:
${JSON.stringify(analysis, null, 2)}

Research Agent output:
${JSON.stringify(research, null, 2)}

Business Document Search Agent output:
${JSON.stringify(businessDocuments, null, 2)}

Return this JSON shape:
{
  "coveredTopics": ["exact requirement area name"],
  "coverageByTopic": {
    "Project Overview": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Target Users & Roles": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Core Features & Workflows": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Business Rules": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Non-functional Requirements": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Integrations": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Deployment & Infrastructure": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Compliance & Regulations": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Timeline & Budget": {"status": "missing|partial|covered", "score": 0, "notes": "short"},
    "Success Criteria": {"status": "missing|partial|covered", "score": 0, "notes": "short"}
  },
  "missingRequirements": ["important missing item"],
  "priorityTopics": ["exact requirement area name in recommended next-question order"],
  "confidence": 0,
  "currentTopic": "exact requirement area name",
  "readyForReport": false
}`,
  });
}

async function runQuestionPlanningAgent(openai, model, context, analysis, research, gapAnalysis, businessDocuments = makeEmptyBusinessDocuments()) {
  return runJsonAgent(openai, {
    model,
    name: 'Question Planning Agent',
    temperature: 0.5,
    system: `You are the Question Planning Agent and customer-facing BA assistant named Alex.
Use the outputs from the other agents to ask the next best 1-2 questions.
Reply in the same language as the latest customer message.
If the latest customer message is only the seed greeting, greet briefly and ask for the software idea.
Always acknowledge the latest real customer answer first with "✅" when there is one.
Use Markdown bold for important terms.
When options help, provide 3-4 concise options and make the final option "Something else".
Return JSON only.`,
    user: `Requirement areas:
${REQUIREMENT_AREAS.map((area, index) => `${index + 1}. ${area}`).join('\n')}

Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Last customer message:
${context.lastUserMessage}

Conversation:
${context.conversationText}

Requirement Analysis Agent output:
${JSON.stringify(analysis, null, 2)}

Research Agent output:
${JSON.stringify(research, null, 2)}

Business Document Search Agent output:
${JSON.stringify(businessDocuments, null, 2)}

Gap Analysis Agent output:
${JSON.stringify(gapAnalysis, null, 2)}

Return exactly this JSON shape:
{
  "message": "customer-facing response text",
  "confidence": 0,
  "currentTopic": "exact requirement area name",
  "coveredTopics": ["exact requirement area name"],
  "options": ["Option A", "Option B", "Option C", "Something else"] or null,
  "readyForReport": false
}`,
  });
}

async function runRequirementGeneratorAgent(
  openai,
  model,
  context,
  analysis,
  research,
  gapAnalysis,
  businessDocuments = makeEmptyBusinessDocuments()
) {
  return runTextAgent(openai, {
    model,
    system: `You are the Requirement Generator Agent.
Create a professional Markdown requirements specification from the multi-agent analysis.
Write in the same language used by the customer in the conversation.
Mark explicitly stated items as ✅ **[Confirmed]**.
Mark carefully inferred items as ⚠️ **[Inferred]**.
Do not invent unsupported details.`,
    user: `Conversation:
${context.conversationText}

Requirement Analysis Agent output:
${JSON.stringify(analysis, null, 2)}

Research Agent output:
${JSON.stringify(research, null, 2)}

Business Document Search Agent output:
${JSON.stringify(businessDocuments, null, 2)}

Gap Analysis Agent output:
${JSON.stringify(gapAnalysis, null, 2)}

Create this Markdown report:
# Requirements Specification Report

## Executive Summary

## 1. Project Overview

## 2. Target Users & Roles

## 3. Core Features & Workflows

## 4. Business Rules

## 5. Non-functional Requirements

## 6. Integrations

## 7. Deployment & Infrastructure

## 8. Compliance & Regulations

## 9. Timeline & Budget

## 10. Success Criteria

## Open Questions

Each of the 10 numbered sections must include a completeness score like:
> **Completeness: X/10** - short explanation`,
  });
}

async function runElicitationPipeline(openai, model, messages) {
  const context = {
    conversationText: buildConversationText(messages),
    lastUserMessage: getLastUserMessage(messages),
    previousState: getPreviousAssistantState(messages),
  };

  const routerDecision = await runAgentRouter(openai, model, context);
  const executedAgents = addRequiredAgents(routerDecision.selectedAgents);

  if (!routerDecision.useSpecializedAgents || executedAgents.length === 0) {
    const directResponse = await runDirectResponse(openai, model, context);
    const gapAnalysis = makeEmptyGapAnalysis(context.previousState);

    return {
      ...normalizeStructuredResponse(directResponse, gapAnalysis, context.previousState),
      agentTrace: makeSelectedAgentTrace({
        routerDecision,
        executedAgents: [],
        analysis: makeEmptyAnalysis(),
        businessDocuments: makeEmptyBusinessDocuments(),
        research: makeEmptyResearch(),
        gapAnalysis,
        questionPlan: directResponse,
      }),
    };
  }

  let analysis = makeEmptyAnalysis();
  let businessDocuments = makeEmptyBusinessDocuments();
  let research = makeEmptyResearch();
  let gapAnalysis = makeEmptyGapAnalysis(context.previousState);

  if (executedAgents.includes('Requirement Analysis Agent')) {
    analysis = await runRequirementAnalysisAgent(openai, model, context);
  }

  if (executedAgents.includes('Business Document Search Agent')) {
    businessDocuments = await runBusinessDocumentSearchAgent(openai, model, context, analysis);
  } else {
    businessDocuments = makeEmptyBusinessDocuments(analysis.domain);
  }

  if (executedAgents.includes('Research Agent')) {
    research = await runResearchAgent(openai, model, analysis, businessDocuments);
  } else {
    research = makeEmptyResearch(analysis.domain);
  }

  if (executedAgents.includes('Gap Analysis Agent')) {
    gapAnalysis = await runGapAnalysisAgent(openai, model, context, analysis, research, businessDocuments);
  }

  const questionPlan = await runQuestionPlanningAgent(
    openai,
    model,
    context,
    analysis,
    research,
    gapAnalysis,
    businessDocuments
  );

  return {
    ...normalizeStructuredResponse(questionPlan, gapAnalysis, context.previousState),
    agentTrace: makeSelectedAgentTrace({
      routerDecision,
      executedAgents,
      analysis,
      businessDocuments,
      research,
      gapAnalysis,
      questionPlan,
    }),
  };
}

async function generateRequirementReport(openai, model, messages) {
  const context = {
    conversationText: buildConversationText(messages),
    lastUserMessage: getLastUserMessage(messages),
    previousState: getPreviousAssistantState(messages),
  };

  const analysis = await runRequirementAnalysisAgent(openai, model, context);
  const businessDocuments = await runBusinessDocumentSearchAgent(openai, model, context, analysis);
  const research = await runResearchAgent(openai, model, analysis, businessDocuments);
  const gapAnalysis = await runGapAnalysisAgent(openai, model, context, analysis, research, businessDocuments);

  return runRequirementGeneratorAgent(
    openai,
    model,
    context,
    analysis,
    research,
    gapAnalysis,
    businessDocuments
  );
}

module.exports = {
  runElicitationPipeline,
  generateRequirementReport,
};
