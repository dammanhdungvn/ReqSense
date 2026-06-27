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

const SERPAPI_SEARCH_LIMIT = 5;
const SERPAPI_QUERY_LIMIT = 3;

const TOPIC_LABELS_VI = {
  'Project Overview': 'tổng quan dự án',
  'Target Users & Roles': 'người dùng và vai trò',
  'Core Features & Workflows': 'tính năng và quy trình chính',
  'Business Rules': 'quy tắc nghiệp vụ',
  'Non-functional Requirements': 'yêu cầu phi chức năng',
  'Integrations': 'tích hợp',
  'Deployment & Infrastructure': 'triển khai và hạ tầng',
  'Compliance & Regulations': 'tuân thủ và quy định',
  'Timeline & Budget': 'thời gian và ngân sách',
  'Success Criteria': 'tiêu chí thành công',
};

const VIETNAMESE_PATTERN = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const SKIP_REQUEST_PATTERN = /(bỏ qua|bo qua|bỏ bước|bo buoc|skip|next|tiếp theo|tiep theo|không trả lời|khong tra loi|không cần trả lời|khong can tra loi|chưa cần|chua can|để sau|de sau|không muốn trả lời|khong muon tra loi)/i;
const REPORT_REQUEST_PATTERN = /(tao bao cao|xuat bao cao|lap bao cao|tao tai lieu|tao dac ta|generate report|create report|make report|export report|generate spec|create spec)/i;

const FLEXIBLE_SURVEY_POLICY = `Survey behavior:
- Do not force the customer to answer every survey topic before helping them.
- If the customer asks to skip a topic, accept it, remember it as skipped, and move to the next useful topic.
- If the customer asks to create/generate/export the report now, do not ask more questions first; the application will generate the report immediately.
- Keep the tone helpful and concise.`;

function isSkipRequest(value) {
  return typeof value === 'string' && SKIP_REQUEST_PATTERN.test(value);
}

function isReportRequest(value) {
  if (typeof value !== 'string') return false;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
  return REPORT_REQUEST_PATTERN.test(normalized);
}

function isVietnameseText(value) {
  return VIETNAMESE_PATTERN.test(value || '') || /\b(tôi|toi|mình|minh|bạn|ban|bỏ qua|bo qua)\b/i.test(value || '');
}

function makeSkipTransitionMessage(context, skippedTopic, nextTopic) {
  if (isVietnameseText(context.lastUserMessage)) {
    return `Đã bỏ qua phần **${TOPIC_LABELS_VI[skippedTopic] || skippedTopic}**. Tiếp theo, mình chuyển sang phần **${TOPIC_LABELS_VI[nextTopic] || nextTopic}** nhé. Bạn có thể chia sẻ thông tin chính cho phần này không?`;
  }

  return `Skipped **${skippedTopic}**. Next, let's move to **${nextTopic}**. Could you share the key information for this part?`;
}

function getNextRequirementTopic(currentTopic, coveredTopics = [], skippedTopics = []) {
  const handled = new Set([
    ...(Array.isArray(coveredTopics) ? coveredTopics : []),
    ...(Array.isArray(skippedTopics) ? skippedTopics : []),
  ]);
  const currentIndex = Math.max(0, REQUIREMENT_AREAS.indexOf(currentTopic));

  for (let offset = 1; offset <= REQUIREMENT_AREAS.length; offset += 1) {
    const candidate = REQUIREMENT_AREAS[(currentIndex + offset) % REQUIREMENT_AREAS.length];
    if (!handled.has(candidate)) return candidate;
  }

  return REQUIREMENT_AREAS.find(topic => !skippedTopics.includes(topic)) || 'Project Overview';
}

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
    confirmedFeatures: Array.isArray(parsed?.confirmedFeatures) ? parsed.confirmedFeatures : [],
    skippedTopics: Array.isArray(parsed?.skippedTopics) ? parsed.skippedTopics : [],
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

function uniqueList(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : [])
    .filter(item => typeof item === 'string' && item.trim())
    .map(item => item.trim())
    .filter(item => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeStructuredResponse(questionPlan, gapAnalysis, previousState, analysis = null, context = {}) {
  const mergedTopics = new Set([
    ...previousState.coveredTopics,
    ...(Array.isArray(gapAnalysis.coveredTopics) ? gapAnalysis.coveredTopics : []),
    ...(Array.isArray(questionPlan.coveredTopics) ? questionPlan.coveredTopics : []),
  ]);

  const skippedSet = new Set([
    ...(Array.isArray(previousState.skippedTopics) ? previousState.skippedTopics : []),
    ...(Array.isArray(gapAnalysis.skippedTopics) ? gapAnalysis.skippedTopics : []),
    ...(Array.isArray(questionPlan.skippedTopics) ? questionPlan.skippedTopics : []),
  ]);

  if (context.skipRequested && REQUIREMENT_AREAS.includes(context.skipTopic)) {
    skippedSet.add(context.skipTopic);
  }

  const coveredTopics = [...mergedTopics].filter(topic => REQUIREMENT_AREAS.includes(topic));
  const skippedTopics = [...skippedSet].filter(topic => REQUIREMENT_AREAS.includes(topic));
  const confidence = Math.max(
    previousState.confidence,
    Number(gapAnalysis.confidence || 0),
    Number(questionPlan.confidence || 0),
    coveredTopics.length > 0 ? 5 : 0
  );

  let currentTopic = REQUIREMENT_AREAS.includes(questionPlan.currentTopic)
    ? questionPlan.currentTopic
    : gapAnalysis.currentTopic || 'Project Overview';

  if (skippedTopics.includes(currentTopic)) {
    currentTopic = getNextRequirementTopic(currentTopic, coveredTopics, skippedTopics);
  }

  const options = Array.isArray(questionPlan.options) && questionPlan.options.length > 0
    ? questionPlan.options.slice(0, 4)
    : null;

  if (options && !options.some(option => /something else|khác/i.test(option))) {
    options[options.length - 1] = VIETNAMESE_PATTERN.test(questionPlan.message || '')
      ? 'Khác'
      : 'Something else';
  }

  const confirmedFeatures = analysis && Array.isArray(analysis.confirmedFeatures)
    ? uniqueList(analysis.confirmedFeatures)
    : uniqueList(questionPlan.confirmedFeatures || previousState.confirmedFeatures || []);

  let message = questionPlan.message || 'Thanks. Could you share a bit more detail about the project goal?';
  let responseOptions = options;

  if (context.skipRequested && skippedTopics.includes(context.skipTopic)) {
    message = makeSkipTransitionMessage(context, context.skipTopic, currentTopic);
    responseOptions = null;
  }

  return {
    message,
    confidence: Math.min(100, Math.round(confidence)),
    currentTopic,
    coveredTopics,
    confirmedFeatures,
    skippedTopics,
    options: responseOptions,
    readyForReport: Boolean(questionPlan.readyForReport || (confidence >= 75 && coveredTopics.length >= 6)),
  };
}

function makeEmptyAnalysis() {
  return {
    domain: 'unknown',
    businessGoal: 'unknown',
    actors: [],
    confirmedFeatures: [],
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
    searchResults: [],
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
    skippedTopics: previousState.skippedTopics || [],
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

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return '';
  }
}

function makeSearchSources(businessDocuments) {
  if (!Array.isArray(businessDocuments.searchResults)) return [];

  return businessDocuments.searchResults
    .filter(result => result && result.link)
    .map(result => ({
      title: result.title || 'Google result',
      url: result.link,
      snippet: result.snippet || '',
      source: result.source || getHostname(result.link),
      query: result.query || '',
    }))
    .slice(0, SERPAPI_SEARCH_LIMIT);
}

function getSerpApiKey() {
  return process.env.SERPAPI_API_KEY || process.env['SERPAPI_API-KEY'] || '';
}

function normalizeSearchQueries(queries, domain) {
  const normalized = Array.isArray(queries)
    ? queries
        .filter(query => typeof query === 'string' && query.trim())
        .map(query => query.trim())
    : [];

  if (normalized.length > 0) {
    return [...new Set(normalized)].slice(0, SERPAPI_QUERY_LIMIT);
  }

  if (!domain || domain === 'unknown') return [];

  return [
    `${domain} software requirements best practices`,
    `${domain} workflow business process`,
  ];
}

function normalizeSerpResult(result) {
  const link = result.link || result.redirect_link || '';
  const source = result.source || result.displayed_link || '';

  return {
    title: result.title || 'Untitled result',
    link,
    snippet: result.snippet || result.rich_snippet?.top?.detected_extensions?.snippet || '',
    source,
  };
}

async function searchGoogleWithSerpApi(query) {
  const apiKey = getSerpApiKey();
  if (!apiKey) {
    return {
      query,
      results: [],
      error: 'SERPAPI_API_KEY is not configured.',
    };
  }

  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: apiKey,
    num: String(SERPAPI_SEARCH_LIMIT),
  });

  try {
    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    if (!response.ok) {
      return {
        query,
        results: [],
        error: `SerpAPI request failed with HTTP ${response.status}.`,
      };
    }

    const data = await response.json();
    const organicResults = Array.isArray(data.organic_results) ? data.organic_results : [];

    return {
      query,
      results: organicResults.slice(0, SERPAPI_SEARCH_LIMIT).map(normalizeSerpResult),
      error: data.error || null,
    };
  } catch (err) {
    return {
      query,
      results: [],
      error: err.message,
    };
  }
}

async function enrichBusinessDocumentsWithSearch(businessDocuments) {
  if (!businessDocuments.searchNeeded) return businessDocuments;

  const queries = normalizeSearchQueries(businessDocuments.searchQueries, businessDocuments.domain);
  if (queries.length === 0) {
    return {
      ...businessDocuments,
      verificationNotes: [
        ...(businessDocuments.verificationNotes || []),
        'No usable search query was generated for this domain.',
      ],
    };
  }

  const searches = await Promise.all(queries.map(searchGoogleWithSerpApi));
  const searchResults = searches.flatMap(search =>
    search.results.map(result => ({
      query: search.query,
      ...result,
    }))
  ).slice(0, SERPAPI_SEARCH_LIMIT);

  const errors = searches
    .filter(search => search.error)
    .map(search => `Search "${search.query}" failed: ${search.error}`);

  const sourceFindings = searchResults.map(result =>
    `${result.title}${result.source ? ` (${result.source})` : ''}: ${result.snippet || result.link}`
  );

  return {
    ...businessDocuments,
    searchQueries: queries,
    searchResults,
    keyFindings: [
      ...(businessDocuments.keyFindings || []),
      ...sourceFindings,
    ].slice(0, 8),
    verificationNotes: [
      ...(businessDocuments.verificationNotes || []),
      ...errors,
      ...(searchResults.length > 0
        ? ['Search results are external references only; confirm requirements with the customer before marking them as facts.']
        : ['No Google search results were available; use internal BA knowledge and customer confirmation.']),
    ],
  };
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
    const searchSources = makeSearchSources(businessDocuments);
    trace.push({
      agent: 'Business Document Search Agent',
      title: 'Tìm tài liệu nghiệp vụ liên quan',
      summary: `Domain: ${businessDocuments.domain || analysis.domain || 'chưa xác định'}. ${searchSources.length > 0 ? `Đã dùng Google Search và tìm được ${searchSources.length} nguồn tham khảo.` : `Cần tra cứu: ${businessDocuments.searchNeeded ? 'có' : 'không rõ/chưa cần'}.`}`,
      searchUsed: searchSources.length > 0,
      sources: searchSources,
      details: [
        ...asShortList((businessDocuments.searchResults || []).map(result => `Google: ${result.title}`)),
        ...asShortList(businessDocuments.searchQueries),
        ...asShortList(businessDocuments.documentTypes),
        ...asShortList(businessDocuments.recommendedSources),
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
Use specialized agents when the user provides new project requirements, answers elicitation questions, asks to skip a requirement topic, asks for requirement analysis, or when readiness/confidence should be updated.
Select Business Document Search Agent when the topic has a clear business domain, regulatory/process-heavy context, unfamiliar industry terms, or when external business documents would improve the next question.
Return JSON only.`,
    user: `Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Last customer message:
${context.lastUserMessage}

Skip request detected: ${context.skipRequested ? 'yes' : 'no'}
Topic requested to skip: ${context.skipTopic || 'none'}

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
${FLEXIBLE_SURVEY_POLICY}
Reply in the same language as the latest customer message.
All customer-facing fields, including message, options, and confirmedFeatures, must use that same language.
Keep the existing requirement state unless the user clearly provides new requirement details.
If the latest customer message asks to skip the current topic, acknowledge it briefly and move to the next unskipped requirement topic. Do not ask about the skipped topic again.
If the latest message is the initial seed greeting, briefly greet and ask the user to describe their software idea.
Return JSON only.`,
    user: `Requirement areas:
${REQUIREMENT_AREAS.map((area, index) => `${index + 1}. ${area}`).join('\n')}

Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Last customer message:
${context.lastUserMessage}

Skip request detected: ${context.skipRequested ? 'yes' : 'no'}
Topic requested to skip: ${context.skipTopic || 'none'}

Conversation:
${context.conversationText}

Return exactly this JSON shape:
{
  "message": "customer-facing response text",
  "confidence": ${context.previousState.confidence || 0},
  "currentTopic": "${context.previousState.currentTopic || 'Project Overview'}",
  "coveredTopics": ${JSON.stringify(context.previousState.coveredTopics || [])},
  "confirmedFeatures": ${JSON.stringify(context.previousState.confirmedFeatures || [])},
  "skippedTopics": ${JSON.stringify(context.previousState.skippedTopics || [])},
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
confirmedFeatures must be the complete current list of software features explicitly requested or confirmed by the customer, not only newly added features.
If the customer renames, changes, or removes a feature, update the complete current list accordingly.
Do not keep removed features.
Keep extracted confirmedFeatures in the same language as the latest customer message.
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
  "confirmedFeatures": ["complete current feature list explicitly requested or confirmed by the customer, written in the latest customer's language"],
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
The application may run Google Search separately after your response using the search queries you provide.
Do not invent exact URLs. Provide practical document types, trusted source categories, and 2-3 precise Google search queries.
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
  "searchQueries": ["precise Google query to find business documents or workflows"],
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
You may use Business Document Search Agent search results as external reference signals.
Do not treat external search results as customer-confirmed requirements.
Do not claim a requirement is confirmed unless it is explicitly stated in the conversation.
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
Use external search results only to identify potential gaps and follow-up questions, not as confirmed facts.
Do not mark skipped topics as covered unless the customer gave real detail.
Do not prioritize or ask follow-up questions for skipped topics.
Return JSON only.`,
    user: `Requirement areas:
${REQUIREMENT_AREAS.map((area, index) => `${index + 1}. ${area}`).join('\n')}

Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Skip request detected: ${context.skipRequested ? 'yes' : 'no'}
Topic requested to skip: ${context.skipTopic || 'none'}

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
  "skippedTopics": ["exact skipped requirement area name"],
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
${FLEXIBLE_SURVEY_POLICY}
Reply in the same language as the latest customer message.
All customer-facing fields, including message and options, must use that same language.
If the latest customer message asks to skip a topic, acknowledge the skip and move to the next useful unskipped topic. Do not ask about the skipped topic again in this turn.
If the latest customer message is only the seed greeting, greet briefly and ask for the software idea.
Always acknowledge the latest real customer answer first with "✅" when there is one.
Use Markdown bold for important terms.
When options help, provide 3-4 concise options and make the final option mean "Something else" in the same language as the latest customer message.
If external search results reveal domain-specific gaps, ask the customer to confirm them instead of asserting them as requirements.
Return JSON only.`,
    user: `Requirement areas:
${REQUIREMENT_AREAS.map((area, index) => `${index + 1}. ${area}`).join('\n')}

Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Last customer message:
${context.lastUserMessage}

Skip request detected: ${context.skipRequested ? 'yes' : 'no'}
Topic requested to skip: ${context.skipTopic || 'none'}

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
  "skippedTopics": ["exact skipped requirement area name"],
  "options": ["Option A", "Option B", "Option C", "Something else or same-language equivalent"] or null,
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
Write in the same language as the latest non-command customer message in the conversation.
Do not mix languages in headings, labels, or requirement items.
Mark explicitly stated items as ✅ **[Confirmed]** in English or ✅ **[Đã xác nhận]** in Vietnamese.
Mark carefully inferred items as ⚠️ **[Inferred]** in English or ⚠️ **[Suy luận]** in Vietnamese.
Mark external search references as 🔎 **[Reference]** and keep them separate from confirmed requirements.
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

## External References

## Open Questions

Each of the 10 numbered sections must include a completeness score like:
> **Completeness: X/10** - short explanation

If the report is Vietnamese, use:
> **Độ đầy đủ: X/10** - giải thích ngắn`,
  });
}

async function runElicitationPipeline(openai, model, messages) {
  const previousState = getPreviousAssistantState(messages);
  const lastUserMessage = getLastUserMessage(messages);
  const context = {
    conversationText: buildConversationText(messages),
    lastUserMessage,
    previousState,
    skipRequested: isSkipRequest(lastUserMessage),
    skipTopic: previousState.currentTopic || 'Project Overview',
  };

  const routerDecision = await runAgentRouter(openai, model, context);
  const executedAgents = addRequiredAgents(routerDecision.selectedAgents);

  if (!routerDecision.useSpecializedAgents || executedAgents.length === 0) {
    const directResponse = await runDirectResponse(openai, model, context);
    const analysis = await runRequirementAnalysisAgent(openai, model, context);
    const gapAnalysis = makeEmptyGapAnalysis(context.previousState);

    return {
      ...normalizeStructuredResponse(directResponse, gapAnalysis, context.previousState, analysis, context),
      agentTrace: makeSelectedAgentTrace({
        routerDecision,
        executedAgents: [],
        analysis,
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
    businessDocuments = await enrichBusinessDocumentsWithSearch(businessDocuments);
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
    ...normalizeStructuredResponse(questionPlan, gapAnalysis, context.previousState, analysis, context),
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
  let businessDocuments = await runBusinessDocumentSearchAgent(openai, model, context, analysis);
  businessDocuments = await enrichBusinessDocumentsWithSearch(businessDocuments);
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
  isReportRequest,
};
