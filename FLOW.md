# ReqSense — Luồng Sản Phẩm Đầy Đủ


---

## 1. TỔNG QUAN SẢN PHẨM

```
Người dùng có ý tưởng phần mềm
        │
        ▼
Chatbot BA (Alex) hỏi có cấu trúc qua 10 vùng yêu cầu
        │
        ▼
Hệ thống track độ phủ + confidence score theo thời gian thực
        │
        ▼ (khi confidence ≥ 75% và ≥ 6 topics đã phủ)
        │
        ▼
Generate báo cáo đặc tả yêu cầu chuyên nghiệp (10 section)
```

---

## 2. KIẾN TRÚC HỆ THỐNG

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                                                                  │
│   ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│   │   Sidebar   │   │   Chat Panel     │   │  Report Panel   │  │
│   │             │   │                  │   │                 │  │
│   │ SVG Ring    │   │ ChatMessage.jsx  │   │ AnalysisResult  │  │
│   │ Phase list  │   │ Option chips     │   │ Metadata card   │  │
│   │ Topic check │   │ Input box        │   │ Download btn    │  │
│   └─────────────┘   └──────────────────┘   └─────────────────┘  │
│         ▲                    │                       ▲           │
│         │                    ▼                       │           │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              ChatWindow.jsx  (state hub)                │   │
│   │  apiHistory[] | displayMsgs[] | confidence              │   │
│   │  coveredTopics[] | currentTopic | readyForReport        │   │
│   │  report | reportMeta | sidebarW | chatW                 │   │
│   └──────────────────────────┬──────────────────────────────┘   │
│                              │ fetch POST /api/chat              │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                 ┌─────────────▼─────────────┐
                 │      Express Server        │
                 │      (port 3001)           │
                 │                           │
                 │  chatRoute.js             │
                 │  ├── buildMessages()      │
                 │  ├── OpenAI API call      │
                 │  └── parse + respond      │
                 └─────────────┬─────────────┘
                               │
                 ┌─────────────▼─────────────┐
                 │       OpenAI API           │
                 │   model: gpt-4o-mini       │
                 │   response_format:         │
                 │     json_object            │
                 └───────────────────────────┘
```

---

## 3. LUỒNG KHỞI ĐỘNG (Session Start)

```
App mount
   │
   ├─── Kiểm tra localStorage['reqsense_session']
   │         │
   │         ├── CÓ data (apiHistory.length > 1)
   │         │      │
   │         │      └── Restore state:
   │         │            setApiHistory(saved.apiHistory)
   │         │            setDisplayMsgs(saved.displayMsgs)
   │         │            setConfidence(saved.confidence)
   │         │            setCoveredTopics(saved.coveredTopics)
   │         │            setReport(saved.report)
   │         │            → Hiện banner "Session restored" (4s)
   │         │
   │         └── KHÔNG có data
   │                │
   │                └── startSession()
   │                       │
   │                       ├── Reset toàn bộ state về 0/[]
   │                       ├── Gửi seed message lên server:
   │                       │    "Hello, I want to start a requirement consultation."
   │                       ├── Server gọi OpenAI → trả JSON
   │                       ├── setApiHistory([seedMsg, modelRawJson])
   │                       ├── setDisplayMsgs([{role:'model', text, options, topic}])
   │                       └── applyBA(data) → set confidence/topics
```

---

## 4. LUỒNG HỘI THOẠI (Chat Turn)

```
User gõ tin nhắn hoặc bấm option chip
   │
   ▼
send(text)
   │
   ├── Xoá options khỏi tất cả displayMsgs cũ
   ├── Append {role:'user', text} vào displayMsgs
   ├── setLoading(true) → hiển thị typing bubble
   │
   ▼
POST /api/chat
Body: {
  messages: apiHistory + [newUserMsg],  ← TOÀN BỘ lịch sử
  generateReport: false
}
   │
   ▼
Server (chatRoute.js)
   │
   ├── buildMessages(messages, SYSTEM_PROMPT)
   │     → [
   │         {role:'system', content: SYSTEM_PROMPT},
   │         {role:'user', content: seedText},
   │         {role:'assistant', content: '{"message":"...","confidence":5,...}'},
   │         {role:'user', content: 'user answer 1'},
   │         {role:'assistant', content: '{"message":"...","confidence":13,...}'},
   │         ... (toàn bộ lịch sử)
   │         {role:'user', content: newMessage}
   │       ]
   │
   ├── OpenAI API call:
   │     model: gpt-4o-mini
   │     response_format: {type: 'json_object'}   ← Đảm bảo JSON hợp lệ
   │
   └── Trả về JSON:
         {
           type: 'structured',
           message: "Alex's response text",
           confidence: 25,
           currentTopic: "Target Users & Roles",
           coveredTopics: ["Project Overview", "Target Users & Roles"],
           options: ["B2C consumers", "B2B companies", "Both", "Something else"],
           readyForReport: false
         }
   │
   ▼
Client nhận response
   │
   ├── setApiHistory([...prev, userMsg, {role:'model', text: rawJsonString}])
   │     ↑ LƯU RAW JSON STRING (không phải text) cho model turns
   │       → Khi gửi lại lên AI, model thấy lại format của mình → tiếp tục giữ JSON
   │
   ├── setDisplayMsgs([...prev, {role:'model', text: data.message, options, topic}])
   │     ↑ CHỈ LƯU .message cho display (không phải raw JSON)
   │
   ├── applyBA(data):
   │     setConfidence(prev => Math.max(prev, data.confidence))  ← không giảm
   │     setCoveredTopics(prev => merge(prev, data.coveredTopics)) ← chỉ tăng
   │     setCurrentTopic(data.currentTopic)
   │     if (data.readyForReport) setReadyForReport(true)
   │
   ├── setLoading(false)
   │
   └── Auto-save to localStorage (useEffect watches key state)
```

---

## 5. LUỒNG GENERATE BÁO CÁO

```
Điều kiện unlock:
  confidence >= 75 AND coveredTopics.length >= 6
  → Hiện nút "Generate Full Report"
   │
   ▼
User click nút
   │
   ▼
generateReport()
   │
   ├── Capture meta:
   │     {date, confidence, topicsCount, exchanges, coveredTopics}
   │
   ▼
POST /api/chat
Body: {
  messages: [...apiHistory, {role:'user', text:'GENERATE_REPORT'}],
  generateReport: true    ← Flag đặc biệt
}
   │
   ▼
Server nhận generateReport=true
   │
   ├── OpenAI API call (KHÔNG có response_format → free-text Markdown)
   │
   └── Trả về: {type: 'report', content: '# Requirements Specification Report\n...'}
   │
   ▼
Client:
   ├── setReport(data.content)      ← Markdown string
   ├── setReportMeta(meta)          ← Metadata card
   └── Report panel render <AnalysisResult markdown report meta />
```

---

## 6. CẤU TRÚC DỮ LIỆU

### 6.1 apiHistory (gửi lên server)
```js
[
  { role: 'user',  text: 'Hello, I want to start...' },
  { role: 'model', text: '{"message":"Hi! I am Alex...","confidence":5,"currentTopic":"Project Overview","coveredTopics":[],"options":null,"readyForReport":false}' },
  { role: 'user',  text: 'I want to build a food delivery app' },
  { role: 'model', text: '{"message":"✅ Got it...","confidence":13,...}' },
  // ... tiếp tục
]
// Model turns = RAW JSON STRING (giữ AI trong JSON mode)
```

### 6.2 displayMsgs (render UI)
```js
[
  { role: 'model', text: 'Hi! I am Alex...', options: null, topic: 'Project Overview' },
  { role: 'user',  text: 'I want to build a food delivery app' },
  { role: 'model', text: '✅ Got it — food delivery app...', options: ['Faster delivery', 'Lower fees', ...], topic: 'Project Overview' },
]
// Chỉ chứa text thuần + options để render
```

### 6.3 AI Response JSON Schema
```json
{
  "message": "string — Alex's reply, markdown supported",
  "confidence": 13,
  "currentTopic": "Target Users & Roles",
  "coveredTopics": ["Project Overview", "Target Users & Roles"],
  "options": ["Option A", "Option B", "Option C", "Something else"],
  "readyForReport": false
}
```

### 6.4 localStorage Schema
```json
{
  "apiHistory": [...],
  "displayMsgs": [...],
  "confidence": 42,
  "coveredTopics": ["Project Overview", "Target Users & Roles", "Core Features & Workflows"],
  "currentTopic": "Business Rules",
  "readyForReport": false,
  "report": null
}
```

---

## 7. SYSTEM PROMPT LOGIC

```
Persona:  Alex, Senior BA 10+ years
Goal:     Thu thập đủ 10 vùng yêu cầu qua hội thoại tự nhiên

10 VÙNG YÊU CẦU:
  1. Project Overview
  2. Target Users & Roles
  3. Core Features & Workflows
  4. Business Rules
  5. Non-functional Requirements
  6. Integrations
  7. Deployment & Infrastructure
  8. Compliance & Regulations
  9. Timeline & Budget
  10. Success Criteria

CONVERSATION RULES:
  - Hỏi 1-2 câu mỗi lượt
  - Luôn acknowledge trước khi hỏi tiếp (✅ prefix)
  - Dùng bold cho key terms
  - Cung cấp options 3-4 lựa chọn khi câu hỏi có common answers

CONFIDENCE SCORING:
  - Bắt đầu: 5
  - Mỗi vùng phủ đầy đủ: +8 đến +10
  - Mỗi vùng phủ một phần: +3 đến +5
  - readyForReport = true CHỈ KHI: confidence >= 75 VÀ coveredTopics.length >= 6

coveredTopics RULES:
  - Chỉ tăng, không bao giờ shrink
  - Dùng exact names từ danh sách 10 topics
  - Chỉ thêm khi customer đã trả lời thực sự (không phải chỉ mention)

OUTPUT FORMAT (mọi lượt trừ GENERATE_REPORT):
  JSON object với 6 fields: message, confidence, currentTopic, coveredTopics, options, readyForReport

GENERATE_REPORT command:
  - Output Markdown tự do (không JSON)
  - Mỗi requirement item: ✅ [Confirmed] hoặc ⚠️ [Inferred]
  - Mỗi section: blockquote completeness score
  - 10 sections cố định
```

---

## 8. API CONTRACT

### POST /api/chat

**Request:**
```json
{
  "messages": [
    {"role": "user",  "text": "..."},
    {"role": "model", "text": "{...raw json...}"}
  ],
  "generateReport": false
}
```

**Response (structured):**
```json
{
  "type": "structured",
  "message": "Alex's text",
  "confidence": 25,
  "currentTopic": "Core Features & Workflows",
  "coveredTopics": ["Project Overview", "Target Users & Roles"],
  "options": ["Web app", "Mobile app", "Both", "Something else"],
  "readyForReport": false
}
```

**Response (report):**
```json
{
  "type": "report",
  "content": "# Requirements Specification Report\n\n## 1. Project Summary\n..."
}
```

---

## 9. COMPONENT TREE

```
App.jsx
├── Header (logo, tagline)
└── ChatWindow.jsx  ← State hub toàn bộ
    ├── sidebar-panel (resizable, default 220px)
    │   ├── ConfidenceMeter.jsx
    │   │   ├── RingProgress (SVG)
    │   │   ├── phase: Discovery  (topics 1-4)
    │   │   ├── phase: Technical  (topics 5-7)
    │   │   └── phase: Compliance & Delivery (topics 8-10)
    │   ├── session-meta (exchange count + auto-saved)
    │   └── btn "New session"
    │
    ├── drag-handle (resize sidebar)
    │
    ├── chat-panel (resizable, default 420px)
    │   ├── header (Alex avatar, name, role, Online dot)
    │   ├── restored-banner (hiện 4s khi restore từ localStorage)
    │   ├── messages-list
    │   │   ├── ChatMessage.jsx × N
    │   │   │   ├── [model] avatar A + bubble với topic badge + ReactMarkdown
    │   │   │   └── [user]  avatar You + bubble plain text
    │   │   ├── option-chips (chỉ trên msg cuối khi !loading)
    │   │   └── typing-bubble (3 dots, khi loading=true)
    │   └── footer
    │       ├── btn "Generate Full Report" (khi readyForReport && !report)
    │       └── textarea input + send button
    │
    ├── drag-handle (resize chat)
    │
    └── report-panel (flex: 1)
        ├── [empty state] steps 1-2-3-4
        └── AnalysisResult.jsx (khi report != null)
            ├── toolbar (title + Download .md + Print/PDF)
            ├── MetaCard (date, exchanges, topics, confidence%, legend)
            └── ReactMarkdown với custom components (rp-* classes)
                └── BadgeText (render [Confirmed]/[Inferred] as styled spans)
```

---

## 10. STATE MANAGEMENT (ChatWindow)

```
State                  | Type      | Mô tả
-----------------------|-----------|------------------------------------------
apiHistory             | Array     | Lịch sử đầy đủ gửi lên server
displayMsgs            | Array     | Messages hiển thị trong UI
input                  | String    | Text đang nhập trong textarea
loading                | Boolean   | Đang chờ AI response
report                 | String    | Markdown báo cáo (null nếu chưa gen)
reportMeta             | Object    | Metadata báo cáo (date, confidence...)
error                  | String    | Lỗi hiển thị cho user
restored               | Boolean   | True 4s sau khi restore từ localStorage
confidence             | Number    | 0-100, chỉ tăng
coveredTopics          | Array     | Tên các topic đã phủ
currentTopic           | String    | Topic đang hỏi hiện tại
readyForReport         | Boolean   | True khi đủ điều kiện, không quay lại false
sidebarW               | Number    | Chiều rộng sidebar (px), drag-resize
chatW                  | Number    | Chiều rộng chat panel (px), drag-resize
```

---

## 11. LUỒNG RESIZE PANEL

```
User mousedown trên drag-handle
   │
   ├── Lưu startX = e.clientX
   ├── Lưu startW = sidebarW hoặc chatW
   │
   ├── document.addEventListener('mousemove')
   │     → delta = currentX - startX
   │     → newW = clamp(startW + delta, MIN, MAX)
   │     → setter(newW)  // setSidebarW hoặc setChatW
   │
   └── document.addEventListener('mouseup')
         → removeEventListener mousemove + mouseup
```

---

## 12. LUỒNG PERSISTENCE (localStorage)

```
Mọi thay đổi của: apiHistory, displayMsgs, confidence,
coveredTopics, currentTopic, readyForReport, report
   │
   ▼
useEffect([...dependencies])
   │
   ├── if (apiHistory.length > 1)   ← Chỉ save khi có data thật
   │     localStorage.setItem('reqsense_session', JSON.stringify({...}))
   │
   └── Không save khi session rỗng (mới mount)

New session → clearSession() → localStorage.removeItem('reqsense_session')
```

---

## 13. TECH STACK ĐỂ BUILD 

### Frontend
```
Framework:   React 18 + Vite
Styling:     Pure CSS với CSS Custom Properties (dark theme)
Icons:       lucide-react
Markdown:    react-markdown (với custom components)
State:       useState + useEffect (không cần Redux/Zustand)
Persistence: localStorage (browser-side, không cần backend)
```

### Backend
```
Runtime:     Node.js v18+
Framework:   Express 5.x
AI SDK:      openai (npm package)
File upload: multer (cho analyze route)
Env:         dotenv
```

### AI
```
Provider:    OpenAI
Model:       gpt-4o-mini (default) / gpt-4o (cao cấp hơn)
JSON mode:   response_format: { type: 'json_object' }
Auth:        OPENAI_API_KEY trong .env
```

### Biến môi trường cần thiết
```env
PORT=3001
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

---

## 14. LUỒNG BUILD SẢN PHẨM

```
Bước 1: Setup project
  └── npm create vite@latest client -- --template react
  └── mkdir server && cd server && npm init -y
  └── npm install express openai dotenv multer cors

Bước 2: Backend core
  └── server/index.js          (Express app)
  └── server/src/chatSystemPrompt.js  (BA persona + rules)
  └── server/src/chatRoute.js  (POST /api/chat)
  └── server/.env              (OPENAI_API_KEY)

Bước 3: Frontend shell
  └── client/src/index.css     (reset + font)
  └── client/src/App.jsx       (header + main layout)
  └── client/src/App.css       (CSS variables + dark theme)
  └── client/src/api.js        (fetch wrapper)

Bước 4: Chat core
  └── ChatWindow.jsx           (state hub + send logic)
  └── ChatMessage.jsx          (bubble với markdown)

Bước 5: BA tracking
  └── ConfidenceMeter.jsx      (SVG ring + phase checklist)
  └── CSS cho sidebar

Bước 6: Report
  └── AnalysisResult.jsx       (metadata + badges + download)
  └── Print CSS

Bước 7: UX polish
  └── localStorage persistence
  └── Drag-to-resize panels
  └── Option chips
  └── Restored session banner
  └── "Ready" badge trên sidebar
```
