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

const QUESTION_OPTION_POLICY = `Option behavior:
- Only include options when they are direct answer choices for the exact customer-facing question in "message".
- Every option must answer the same question. Do not mix choices from another requirement area.
- Do not copy generic examples from Research Agent into options unless they directly answer the current question.
- Keep options short, concrete, mutually selectable, and useful for multi-select.
- If the question asks who/roles, options must be user roles or customer groups.
- If the question asks features/workflows, options must be features or actions.
- If the question asks integrations, options must be external systems or services.
- If the question asks timeline/budget, options must be timeline or budget choices.
- The final option must mean "Other" in the same language as the customer.`;

const DETAILED_REPORT_POLICY = `Detailed report quality policy:
- Write the report as a practical handoff document, not a short chat summary.
- Separate facts into four evidence levels: confirmed by customer, inferred from conversation, external reference, and missing/needs confirmation.
- When user input is thin, still produce a useful discovery report by documenting known facts, safe assumptions, missing decisions, and recommended questions. Do not pretend unknown details are confirmed.
- For every major feature, include: requirement ID, priority, target role, user value, user story, acceptance criteria, main happy path, edge cases, data involved, dependencies, and open decisions.
- Include a prioritized backlog view that a developer or PM can convert into tickets.
- Include a traceability matrix linking business goals, actors, features, acceptance criteria, and open questions.
- Include business rules in testable form, not vague prose.
- Include non-functional requirements with measurable targets when the conversation supports them; otherwise provide recommended target ranges clearly marked as inferred.
- Include risk register entries with likelihood, impact, mitigation, and owner/role.
- Include at least one "what can be built now" section and one "what must be clarified before development" section.
- Avoid filler paragraphs. Prefer dense tables, numbered workflows, and concrete decision points.
- The final answer should usually be 1,500-3,000 words unless the conversation is extremely small.`;

const OPTION_FALLBACKS = {
  vi: {
    'Project Overview': ['Quản lý nội bộ', 'Bán hàng hoặc đặt hàng', 'Đặt lịch hoặc dịch vụ', 'Khác'],
    'Target Users & Roles': ['Khách hàng', 'Nhân viên', 'Quản trị viên', 'Khác'],
    'Core Features & Workflows': ['Đăng nhập và tài khoản', 'Tạo và quản lý dữ liệu', 'Thông báo và trạng thái', 'Khác'],
    'Business Rules': ['Phê duyệt thủ công', 'Tự động kiểm tra điều kiện', 'Phân quyền theo vai trò', 'Khác'],
    'Non-functional Requirements': ['Nhanh và ổn định', 'Bảo mật dữ liệu', 'Dễ dùng trên di động', 'Khác'],
    Integrations: ['Thanh toán', 'Email hoặc SMS', 'Lịch hoặc CRM', 'Khác'],
    'Deployment & Infrastructure': ['Web', 'Mobile', 'Cloud hoặc VPS', 'Khác'],
    'Compliance & Regulations': ['Bảo vệ dữ liệu cá nhân', 'Lưu nhật ký thao tác', 'Phân quyền truy cập', 'Khác'],
    'Timeline & Budget': ['MVP trong 2-4 tuần', 'Hoàn thành trong 1-3 tháng', 'Chưa xác định', 'Khác'],
    'Success Criteria': ['Tăng số người dùng', 'Giảm thời gian xử lý', 'Tăng doanh thu hoặc đơn hàng', 'Khác'],
  },
  en: {
    'Project Overview': ['Internal management', 'Sales or ordering', 'Booking or services', 'Other'],
    'Target Users & Roles': ['Customers', 'Staff', 'Admins', 'Other'],
    'Core Features & Workflows': ['Login and accounts', 'Create and manage records', 'Notifications and statuses', 'Other'],
    'Business Rules': ['Manual approval', 'Automatic condition checks', 'Role-based permissions', 'Other'],
    'Non-functional Requirements': ['Fast and stable', 'Secure data', 'Mobile friendly', 'Other'],
    Integrations: ['Payments', 'Email or SMS', 'Calendar or CRM', 'Other'],
    'Deployment & Infrastructure': ['Web', 'Mobile', 'Cloud or VPS', 'Other'],
    'Compliance & Regulations': ['Personal data protection', 'Audit logs', 'Access permissions', 'Other'],
    'Timeline & Budget': ['MVP in 2-4 weeks', 'Finish in 1-3 months', 'Not decided yet', 'Other'],
    'Success Criteria': ['Increase users', 'Reduce processing time', 'Increase revenue or orders', 'Other'],
  },
};

const OPTION_RELEVANCE_PATTERNS = {
  'Project Overview': /(quản lý|quan ly|bán|ban|đặt|dat|dịch vụ|dich vu|nội bộ|noi bo|khách hàng|khach hang|app|web|sales|order|booking|service|internal|customer)/i,
  'Target Users & Roles': /(người dùng|nguoi dung|khách|khach|nhân viên|nhan vien|admin|quản trị|quan tri|vai trò|vai tro|doanh nghiệp|doanh nghiep|tổ chức|to chuc|cá nhân|ca nhan|customer|staff|admin|role|business|organization|individual)/i,
  'Core Features & Workflows': /(đăng nhập|dang nhap|tài khoản|tai khoan|tạo|tao|sửa|sua|xóa|xoa|quản lý|quan ly|tìm kiếm|tim kiem|thông báo|thong bao|trạng thái|trang thai|báo cáo|bao cao|lịch|lich|feature|login|account|create|manage|notification|status|workflow|report|calendar)/i,
  'Business Rules': /(phê duyệt|phe duyet|tự động|tu dong|điều kiện|dieu kien|quy tắc|quy tac|phân quyền|phan quyen|vai trò|vai tro|hạn mức|han muc|approval|automatic|condition|rule|permission|limit|role)/i,
  'Non-functional Requirements': /(bảo mật|bao mat|nhanh|ổn định|on dinh|hiệu năng|hieu nang|dễ dùng|de dung|di động|di dong|sao lưu|backup|tải|tai|secure|fast|stable|performance|mobile|usable|backup)/i,
  Integrations: /(thanh toán|thanh toan|email|sms|lịch|lich|crm|api|google|zalo|webhook|payment|calendar|integration)/i,
  'Deployment & Infrastructure': /(web|mobile|cloud|vps|server|hosting|ios|android|triển khai|trien khai|hạ tầng|ha tang|deploy|infrastructure)/i,
  'Compliance & Regulations': /(dữ liệu|du lieu|bảo vệ|bao ve|audit|nhật ký|nhat ky|phân quyền|phan quyen|tuân thủ|tuan thu|quy định|quy dinh|data|privacy|log|permission|compliance|regulation)/i,
  'Timeline & Budget': /(tuần|tuan|tháng|thang|mvp|ngân sách|ngan sach|chi phí|chi phi|deadline|chưa xác định|chua xac dinh|week|month|budget|cost|timeline|undecided)/i,
  'Success Criteria': /(tăng|tang|giảm|giam|doanh thu|người dùng|nguoi dung|thời gian|thoi gian|tỉ lệ|ti le|kpi|hiệu quả|hieu qua|increase|reduce|revenue|user|time|rate|success|order)/i,
};

function isSkipRequest(value) {
  return typeof value === 'string' && SKIP_REQUEST_PATTERN.test(value);
}

function isReportRequest(value) {
  if (typeof value !== 'string') return false;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase();
  return REPORT_REQUEST_PATTERN.test(normalized);
}

function isVietnameseText(value) {
  if (typeof value !== 'string') return false;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase();

  return VIETNAMESE_PATTERN.test(value)
    || /\b(toi|minh|ban|bo qua|bao cao|yeu cau|phan mem|ung dung|dat lich|khach hang|tinh nang|muon|can|khong|co|la|cua|cho|hay)\b/i.test(normalized);
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
    msg => msg.role === 'user' && msg.text !== 'GENERATE_REPORT' && !isReportRequest(msg.text)
  )?.text || '';
}

function getLastCustomerMessage(messages) {
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
    .filter(msg => msg.text !== 'GENERATE_REPORT' && !(msg.role === 'user' && isReportRequest(msg.text)))
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

function getResponseLanguage(message, context = {}) {
  if (isVietnameseText(message) || isVietnameseText(context.lastUserMessage)) return 'vi';
  return 'en';
}

function makeFallbackOptions(currentTopic, language) {
  return (OPTION_FALLBACKS[language] || OPTION_FALLBACKS.vi)[currentTopic]
    || OPTION_FALLBACKS[language]?.['Project Overview']
    || OPTION_FALLBACKS.vi['Project Overview'];
}

function isOtherOption(option) {
  return /(khác|khac|other|something else)/i.test(option || '');
}

function normalizeQuestionOptions(rawOptions, currentTopic, message, context = {}) {
  const options = uniqueList(rawOptions).slice(0, 4);
  if (options.length === 0) return null;

  const language = getResponseLanguage(message, context);
  const pattern = OPTION_RELEVANCE_PATTERNS[currentTopic];
  const meaningfulOptions = options.filter(option => !isOtherOption(option));
  const relevantCount = pattern
    ? meaningfulOptions.filter(option => pattern.test(option)).length
    : meaningfulOptions.length;

  if (meaningfulOptions.length > 0 && relevantCount < Math.min(2, meaningfulOptions.length)) {
    return [...makeFallbackOptions(currentTopic, language)];
  }

  const normalized = options.slice(0, 4);
  const otherLabel = language === 'vi' ? 'Khác' : 'Other';

  if (!normalized.some(isOtherOption)) {
    if (normalized.length >= 4) normalized[3] = otherLabel;
    else normalized.push(otherLabel);
  } else {
    const otherIndex = normalized.findIndex(isOtherOption);
    normalized[otherIndex] = otherLabel;
    if (otherIndex !== normalized.length - 1) {
      normalized.splice(otherIndex, 1);
      normalized.push(otherLabel);
    }
  }

  return normalized;
}

function getReportLanguage(context = {}) {
  return isVietnameseText(context.lastUserMessage) || isVietnameseText(context.conversationText) ? 'vi' : 'en';
}

function getReportQualityIssues(report = '') {
  const issues = [];
  const wordCount = (report.match(/\S+/g) || []).length;
  const tableCount = (report.match(/\n\|/g) || []).length;
  const headingCount = (report.match(/^##\s+/gm) || []).length;

  if (wordCount < 900) issues.push('report is too short for a handoff-quality requirement document');
  if (tableCount < 6) issues.push('report does not contain enough structured tables');
  if (headingCount < 10) issues.push('report is missing several required sections');
  if (!/acceptance criteria|ti[eế]u ch[ií].*ch[aấ]p nh[aậ]n/i.test(report)) {
    issues.push('acceptance criteria are missing or too hard to find');
  }
  if (!/traceability|truy v[eế]t|li[eê]n k[eế]t/i.test(report)) {
    issues.push('traceability matrix is missing');
  }
  if (!/backlog|user story|c[aâ]u chuy[eệ]n ng[uư][oờ]i d[uù]ng/i.test(report)) {
    issues.push('backlog-ready user stories are missing');
  }
  if (!/risk|r[uủ]i ro/i.test(report)) {
    issues.push('risk analysis is missing');
  }

  return issues;
}

function getRequirementReportTemplate(language) {
  if (language === 'vi') {
    return `# Báo cáo đặc tả yêu cầu

## 0. Tóm tắt cho khách hàng
- **Mục tiêu dự án:** nêu mục tiêu bằng ngôn ngữ dễ hiểu.
- **Người dùng chính:** liệt kê nhóm người dùng hoặc vai trò đã biết.
- **Giá trị mang lại:** giải thích hệ thống giúp khách hàng đạt điều gì.
- **Phạm vi MVP:** liệt kê những phần nên có trong bản MVP.
- **Điểm cần khách hàng duyệt:** liệt kê quyết định quan trọng cần xác nhận.

## 1. Tổng quan dự án
> **Độ đầy đủ: X/10** - giải thích ngắn vì sao chấm điểm này.
- Bối cảnh
- Mục tiêu nghiệp vụ
- Phạm vi có làm
- Phạm vi chưa làm hoặc chưa rõ
- Giả định đang dùng

## 2. Người dùng và vai trò
> **Độ đầy đủ: X/10** - giải thích ngắn.
| Vai trò | Mục tiêu | Quyền chính | Ghi chú còn thiếu |
|---|---|---|---|

## 3. Tính năng và luồng chính
> **Độ đầy đủ: X/10** - giải thích ngắn.
### 3.1 Tính năng đã xác nhận
| Tính năng | Giá trị cho người dùng | Trạng thái | Bằng chứng |
|---|---|---|---|

### 3.2 Luồng nghiệp vụ chính
Với mỗi luồng, viết theo dạng:
1. Tác nhân bắt đầu hành động.
2. Hệ thống xử lý.
3. Hệ thống phản hồi kết quả.
4. Trường hợp lỗi hoặc ngoại lệ nếu có.

### 3.3 Câu chuyện người dùng
Viết ít nhất 3 câu nếu đủ dữ liệu:
- Là **[vai trò]**, tôi muốn **[hành động]**, để **[mục tiêu]**.

### 3.4 Tiêu chí chấp nhận
Với mỗi tính năng chính:
- **Cho trước** bối cảnh.
- **Khi** người dùng thao tác.
- **Thì** hệ thống phải phản hồi như thế nào.

## 4. Quy tắc nghiệp vụ
> **Độ đầy đủ: X/10** - giải thích ngắn.
| Quy tắc | Mô tả | Khi nào áp dụng | Cần xác nhận |
|---|---|---|---|

## 5. Yêu cầu phi chức năng
> **Độ đầy đủ: X/10** - giải thích ngắn.
Bao gồm nếu có dữ liệu:
- Hiệu năng
- Bảo mật
- Phân quyền
- Độ ổn định
- Khả năng mở rộng
- Trải nghiệm người dùng

## 6. Tích hợp
> **Độ đầy đủ: X/10** - giải thích ngắn.
| Hệ thống tích hợp | Mục đích | Dữ liệu trao đổi | Trạng thái |
|---|---|---|---|

## 7. Dữ liệu và mô hình thông tin
> **Độ đầy đủ: X/10** - giải thích ngắn.
| Đối tượng dữ liệu | Trường dữ liệu dự kiến | Ai tạo/sửa | Ghi chú |
|---|---|---|---|

## 8. Triển khai và hạ tầng
> **Độ đầy đủ: X/10** - giải thích ngắn.
- Nền tảng triển khai dự kiến
- Môi trường cần có
- Yêu cầu vận hành
- Giám sát và sao lưu nếu có

## 9. Tuân thủ và quy định
> **Độ đầy đủ: X/10** - giải thích ngắn.
- Dữ liệu nhạy cảm
- Quyền truy cập
- Nhật ký thao tác
- Quy định pháp lý cần kiểm tra

## 10. Thời gian, ngân sách và tiêu chí thành công
> **Độ đầy đủ: X/10** - giải thích ngắn.
### Thời gian và ngân sách
- Mốc MVP
- Mốc hoàn thiện
- Ràng buộc ngân sách nếu có

### Tiêu chí thành công
| Tiêu chí | Cách đo | Mức đạt kỳ vọng |
|---|---|---|

## 11. Rủi ro, giả định và câu hỏi mở
### Rủi ro
| Rủi ro | Ảnh hưởng | Cách giảm thiểu |
|---|---|---|

### Giả định
- Liệt kê giả định đang dùng khi thiếu thông tin.

### Câu hỏi mở cần khách hàng trả lời
- Sắp xếp câu hỏi theo mức ưu tiên cao đến thấp.

## 12. Khuyến nghị bước tiếp theo
- Những câu hỏi nên hỏi tiếp.
- Những tài liệu hoặc dữ liệu khách hàng nên cung cấp.
- Những phần có thể bắt đầu thiết kế ngay.`;
  }

  return `# Requirements Specification Report

## 0. Customer Review Summary
- **Project goal:** explain the goal in plain language.
- **Primary users:** list known user groups or roles.
- **Business value:** explain what the system helps the customer achieve.
- **MVP scope:** list what should be included in the first version.
- **Approval points:** list key decisions the customer should confirm.

## 1. Project Overview
> **Completeness: X/10** - short explanation.
- Context
- Business goals
- In scope
- Out of scope or unclear
- Working assumptions

## 2. Target Users & Roles
> **Completeness: X/10** - short explanation.
| Role | Goal | Main permissions | Missing notes |
|---|---|---|---|

## 3. Core Features & Workflows
> **Completeness: X/10** - short explanation.
### 3.1 Confirmed Features
| Feature | User value | Status | Evidence |
|---|---|---|---|

### 3.2 Main Business Workflows
For each workflow:
1. Actor starts the action.
2. System processes it.
3. System returns a result.
4. Error or exception path if known.

### 3.3 User Stories
Write at least 3 stories if enough data exists:
- As a **[role]**, I want **[action]**, so that **[goal]**.

### 3.4 Acceptance Criteria
For each main feature:
- **Given** the context.
- **When** the user acts.
- **Then** the system responds.

## 4. Business Rules
> **Completeness: X/10** - short explanation.
| Rule | Description | Applies when | Needs confirmation |
|---|---|---|---|

## 5. Non-functional Requirements
> **Completeness: X/10** - short explanation.
Cover when supported:
- Performance
- Security
- Permissions
- Reliability
- Scalability
- User experience

## 6. Integrations
> **Completeness: X/10** - short explanation.
| Integrated system | Purpose | Data exchanged | Status |
|---|---|---|---|

## 7. Data & Information Model
> **Completeness: X/10** - short explanation.
| Data object | Expected fields | Created/edited by | Notes |
|---|---|---|---|

## 8. Deployment & Infrastructure
> **Completeness: X/10** - short explanation.
- Target platforms
- Required environments
- Operations needs
- Monitoring and backup if known

## 9. Compliance & Regulations
> **Completeness: X/10** - short explanation.
- Sensitive data
- Access rights
- Audit logs
- Regulations to verify

## 10. Timeline, Budget & Success Criteria
> **Completeness: X/10** - short explanation.
### Timeline & Budget
- MVP milestone
- Full release milestone
- Budget constraints if known

### Success Criteria
| Criterion | Measurement | Target |
|---|---|---|

## 11. Risks, Assumptions & Open Questions
### Risks
| Risk | Impact | Mitigation |
|---|---|---|

### Assumptions
- List assumptions used when information is missing.

### Open Questions
- Sort questions from highest to lowest priority.

## 12. Recommended Next Steps
- Questions to ask next.
- Documents or data the customer should provide.
- Areas ready to start design.`;
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

  const options = normalizeQuestionOptions(
    questionPlan.options,
    currentTopic,
    questionPlan.message || '',
    context
  );

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
${QUESTION_OPTION_POLICY}
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
  const reportLanguage = getReportLanguage(context);
  const languageName = reportLanguage === 'vi' ? 'Vietnamese' : 'English';
  const confirmedLabel = reportLanguage === 'vi' ? '[Đã xác nhận]' : '[Confirmed]';
  const inferredLabel = reportLanguage === 'vi' ? '[Suy luận]' : '[Inferred]';
  const referenceLabel = reportLanguage === 'vi' ? '[Tham khảo]' : '[Reference]';
  const template = getRequirementReportTemplate(reportLanguage);

  const draftReport = await runTextAgent(openai, {
    model,
    temperature: 0.25,
    system: `You are the Requirement Generator Agent.
Create a professional Markdown requirements specification from the multi-agent analysis.
${DETAILED_REPORT_POLICY}
The report language is ${languageName}. All headings, table headers, labels, explanations, open questions, and recommendations must be in ${languageName}.
Do not use English headings in a Vietnamese report. Do not mix languages except unavoidable acronyms such as API, MVP, KPI, CRM, GDPR.
When using an acronym, briefly explain it in the report language the first time it appears.
The report must be useful for both customer review and BA/developer implementation.
Make the report detailed enough for an MVP handoff: include tables, user stories, acceptance criteria, business rules, data needs, risks, assumptions, and next steps.
Never place inferred or common best-practice features in confirmed scope unless they are marked with ⚠️ **${inferredLabel}**.
Keep confirmed scope separate from suggested scope.
Write in the same language as the latest non-command customer message in the conversation.
Do not mix languages in headings, labels, or requirement items.
Mark explicitly stated items as ✅ **[Confirmed]** in English or ✅ **[Đã xác nhận]** in Vietnamese.
Mark carefully inferred items as ⚠️ **[Inferred]** in English or ⚠️ **[Suy luận]** in Vietnamese.
Mark external search references as 🔎 **[Reference]** and keep them separate from confirmed requirements.
Do not invent unsupported details.`,
    user: `Conversation:
${context.conversationText}

Latest customer language: ${languageName}
Latest customer message:
${context.lastUserMessage || 'none'}

Previous assistant state:
${JSON.stringify(context.previousState, null, 2)}

Requirement Analysis Agent output:
${JSON.stringify(analysis, null, 2)}

Research Agent output:
${JSON.stringify(research, null, 2)}

Business Document Search Agent output:
${JSON.stringify(businessDocuments, null, 2)}

Gap Analysis Agent output:
${JSON.stringify(gapAnalysis, null, 2)}

Use this exact report structure and fill every section with the best supported content:
${template}

Quality rules before returning:
- Keep the whole report in ${languageName}.
- Each numbered requirement section must include the required completeness block.
- Every confirmed requirement must include ✅ **${confirmedLabel}**.
- Every inferred item must include ⚠️ **${inferredLabel}**.
- External references must be marked as 🔎 **${referenceLabel}** and must stay separate from confirmed requirements.
- If evidence is weak, say so clearly instead of making the report look complete.
- Include at least 5 prioritized open questions unless the conversation is already complete.
- Include a MoSCoW or priority table for MVP scope.
- Include at least one backlog-ready table with columns for ID, user story, priority, acceptance criteria, dependencies, and status.
- Include a traceability matrix that links goals, actors, features, and open questions.
- Include edge cases and failure states for the main workflows.
- Include measurable non-functional requirements or clearly marked inferred target ranges.
- Include "ready to build now" and "needs clarification before build" lists.
- Before returning, self-check that the report is not superficial. If a section has little data, fill it with explicit assumptions, risks, and questions instead of leaving it short.
- Return Markdown only. Do not wrap the report in JSON.
`,
  });

  const qualityIssues = getReportQualityIssues(draftReport);
  if (qualityIssues.length === 0) return draftReport;

  return runTextAgent(openai, {
    model,
    temperature: 0.2,
    system: `You are a senior BA document editor.
Rewrite the draft into a deeper, implementation-ready requirements report.
Keep the report language as ${languageName}.
Return Markdown only.
Do not remove any confirmed facts.
Do not invent unsupported details; mark assumptions and inferred items clearly.
Fix these quality issues:
${qualityIssues.map(issue => `- ${issue}`).join('\n')}

${DETAILED_REPORT_POLICY}`,
    user: `Original multi-agent context:

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

Draft report to improve:
${draftReport}`,
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
    lastUserMessage: getLastUserMessage(messages) || getLastCustomerMessage(messages),
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
