# ReqSense — Chatbot Phân Tích Yêu Cầu Phần Mềm Bằng AI

> **"Biến ý tưởng thành đặc tả yêu cầu chuyên nghiệp — thông qua một cuộc trò chuyện."**

---

## Mục Lục

1. [Lý do chọn chủ đề](#1-lý-do-chọn-chủ-đề)
2. [Phân tích thị trường](#2-phân-tích-thị-trường)
3. [Sản phẩm là gì](#3-sản-phẩm-là-gì)
4. [Tính năng nổi bật](#4-tính-năng-nổi-bật)
5. [Tech Stack](#5-tech-stack)
6. [Kiến trúc hệ thống](#6-kiến-trúc-hệ-thống)
7. [Hướng dẫn cài đặt & chạy](#7-hướng-dẫn-cài-đặt--chạy)
8. [Cấu trúc thư mục](#8-cấu-trúc-thư-mục)
9. [Cơ chế hoạt động](#9-cơ-chế-hoạt-động)
10. [10 Vùng yêu cầu BA](#10-10-vùng-yêu-cầu-ba)
11. [Báo cáo đặc tả đầu ra](#11-báo-cáo-đặc-tả-đầu-ra)

---

## 1. Lý Do Chọn Chủ Đề

### Vấn đề thực tế mà thị trường đang gặp phải

Khi một doanh nghiệp, startup, hay cá nhân muốn xây dựng một sản phẩm phần mềm, bước đầu tiên — và cũng là bước **dễ thất bại nhất** — là xác định đúng yêu cầu. Theo báo cáo của **Standish Group (CHAOS Report)**, hơn **52% dự án phần mềm bị trễ deadline hoặc vượt ngân sách**, và nguyên nhân số một được trích dẫn xuyên suốt nhiều năm là **yêu cầu không rõ ràng, thiếu sót, hoặc bị hiểu sai ngay từ đầu**.

Các bên liên quan thường rơi vào một trong ba tình huống:

| Tình huống | Mô tả | Hậu quả |
|---|---|---|
| **Khách hàng không biết cần gì** | Có ý tưởng mờ nhạt, không biết diễn đạt thành yêu cầu kỹ thuật | Dev xây sai, làm lại tốn tiền |
| **Khách hàng biết nhưng không nói đủ** | Chỉ mô tả tính năng bề mặt, bỏ sót business rules, edge cases | Sản phẩm ra không đúng nghiệp vụ |
| **Không đủ tiền thuê BA chuyên nghiệp** | BA senior có giá từ $50–$150/giờ, SME/startup không kham nổi | Bỏ qua bước phân tích, dẫn đến rủi ro cao |

### Tại sao giải pháp hiện tại chưa đủ

**ChatGPT / Gemini thông thường** không giải quyết được vấn đề này vì:
- Chúng trả lời **một lần** — người dùng phải biết đặt đúng câu hỏi
- Không có **luồng hướng dẫn có cấu trúc** qua 10 vùng yêu cầu BA
- Không **theo dõi độ phủ** — không biết thiếu thông tin gì
- Không **định lượng độ tin cậy** để biết khi nào đã đủ thông tin
- Đầu ra là văn xuôi tự do, không theo **chuẩn đặc tả phần mềm**

**ReqSense** lấp đúng khoảng trống đó: một BA AI chuyên biệt, có cấu trúc, tương tác liên tục cho đến khi đủ thông tin.

---

## 2. Phân Tích Thị Trường

### 2.1 Quy mô thị trường toàn cầu

| Thị trường liên quan | Giá trị 2024 | Dự báo 2030 | CAGR |
|---|---|---|---|
| Business Analysis Tools | $1.2 tỷ USD | $2.8 tỷ USD | ~15% |
| AI in Software Development | $4.1 tỷ USD | $22.3 tỷ USD | ~32% |
| Requirements Management Software | $890 triệu USD | $1.9 tỷ USD | ~13% |
| No-code/Low-code Platforms | $13.8 tỷ USD | $65 tỷ USD | ~28% |

> ReqSense nằm ở **giao điểm** của cả bốn thị trường này — đặc biệt ở phân khúc AI + BA Tools.

### 2.2 Phân khúc khách hàng mục tiêu

#### 🎯 Phân khúc 1: Startup & SME (ưu tiên cao nhất)
- **Số lượng**: Hàng triệu startup toàn cầu, riêng Đông Nam Á có hơn **600.000 startup** đang hoạt động
- **Pain point**: Không đủ ngân sách thuê BA, nhưng cần đặc tả để làm việc với dev/agency
- **Khả năng chi trả**: $20–$99/tháng per seat (SaaS model)
- **Kênh tiếp cận**: Product Hunt, LinkedIn, startup communities, tech forums

#### 🎯 Phân khúc 2: Freelance Developer & Tech Agency
- **Số lượng**: Hơn **59 triệu freelancer** tại Mỹ, ~15 triệu tại Đông Nam Á
- **Pain point**: Mất nhiều thời gian thu thập yêu cầu từ khách hàng không có kỹ thuật; dễ scope creep
- **Khả năng chi trả**: $30–$150/tháng hoặc pay-per-report
- **Kênh tiếp cận**: Upwork, Fiverr, GitHub communities, tech blogs

#### 🎯 Phân khúc 3: Product Manager & Business Analyst Junior
- **Số lượng**: Hơn **900.000 PM** trên LinkedIn tại Mỹ; thị trường BA toàn cầu ~1.5 triệu người
- **Pain point**: Cần công cụ hỗ trợ tư duy có cấu trúc, tự động hóa phần hỏi-đáp ban đầu
- **Khả năng chi trả**: $49–$199/tháng (enterprise tier)
- **Kênh tiếp cận**: Product communities (Lenny's, Reforge), BA forums

#### 🎯 Phân khúc 4: Giáo dục & Đào tạo IT
- Trường đại học dạy môn Phân tích & Thiết kế hệ thống
- Bootcamp dạy BA, PM
- **Model**: License theo trường, $500–$5.000/năm

### 2.3 Đối thủ cạnh tranh & lợi thế khác biệt

| Sản phẩm | Mô hình | Điểm mạnh | Điểm yếu so với ReqSense |
|---|---|---|---|
| **Jira / Confluence** | Quản lý dự án | Phổ biến, ecosystem lớn | Không có AI hỏi-đáp; cần biết viết yêu cầu trước |
| **Notion AI** | Ghi chú + AI | Linh hoạt | Không có luồng BA có cấu trúc; đầu ra tự do |
| **ChatGPT / Gemini** | LLM tổng quát | Mạnh, miễn phí | Một chiều, không track coverage, không chuẩn BA |
| **Azure DevOps** | ALM | Dành cho enterprise | Quá phức tạp, không có AI hỏi-đáp |
| **Aha! / ProductPlan** | Product roadmap | Tốt cho planning | Không phải BA tool, không có AI |
| **ReqSense** | AI BA Chatbot | **Hội thoại có cấu trúc + track độ phủ + đầu ra chuẩn** | — |

### 2.4 Mô hình kinh doanh đề xuất

```
┌─────────────────────────────────────────────────────────┐
│                    PRICING TIERS                        │
├──────────────┬──────────────────┬───────────────────────┤
│  FREE        │  PRO             │  BUSINESS             │
│  $0/tháng    │  $29/tháng       │  $99/tháng            │
├──────────────┼──────────────────┼───────────────────────┤
│ 3 sessions   │ Unlimited        │ Unlimited + Team      │
│ 1 report     │ sessions         │ 5 seats               │
│ Basic export │ PDF export       │ API access            │
│              │ History saved    │ Custom branding       │
│              │ Email support    │ Priority support      │
└──────────────┴──────────────────┴───────────────────────┘
```

**Revenue projection (năm 1):**
- 1.000 user FREE → 5% convert Pro = 50 user × $29 = **$1.450/tháng**
- 10.000 user FREE → 5% convert Pro = 500 user × $29 = **$14.500/tháng**
- 100 Business accounts × $99 = **$9.900/tháng**
- **Tổng tiềm năng Year 1**: ~$24.000–$300.000 ARR tùy tốc độ tăng trưởng

### 2.5 Xu hướng thúc đẩy tăng trưởng

1. **AI Adoption trong doanh nghiệp** đang tăng tốc mạnh sau 2023 — hầu hết tổ chức đang tìm cách tích hợp AI vào quy trình nội bộ
2. **Outsourcing phần mềm tăng** — nhiều công ty thuê agency/freelancer hơn; nhu cầu có đặc tả rõ ràng tăng theo
3. **No-code/Low-code revolution** — nhiều người không có kỹ thuật muốn xây sản phẩm; họ cần cầu nối từ ý tưởng → yêu cầu
4. **Remote work** — giao tiếp bất đồng bộ giữa khách hàng và dev cần tài liệu yêu cầu chuẩn hơn bao giờ hết
5. **Viet Nam tech ecosystem phát triển** — hơn 50.000 công ty phần mềm; nhu cầu BA tool tăng mạnh

---

## 3. Sản Phẩm Là Gì

**ReqSense** là một ứng dụng web cho phép bất kỳ ai — dù không có kiến thức BA — tương tác với AI tên **Alex** (một Senior Business Analyst ảo 10 năm kinh nghiệm) để:

1. Mô tả ý tưởng phần mềm của mình bằng ngôn ngữ tự nhiên
2. Được Alex dẫn dắt qua **10 vùng yêu cầu chuẩn BA** thông qua câu hỏi có mục tiêu
3. Theo dõi **độ phủ yêu cầu** theo thời gian thực (thanh tiến trình, checklist)
4. Nhận **báo cáo đặc tả yêu cầu** đầy đủ, chuyên nghiệp khi đã đủ thông tin

### Giao diện 3 cột

```
┌──────────────────┬──────────────────────────┬────────────────────────────┐
│  Progress Sidebar │       Chat (Alex)         │     Requirement Report     │
│                  │                           │                            │
│  ○ 42% COVERED   │  ┌────────────────────┐   │  # 1. Project Summary      │
│  Getting there   │  │ PROJECT OVERVIEW   │   │                            │
│  3 of 10 topics  │  │ ✅ Got it — food    │   │  # 2. Functional Req.      │
│                  │  │ delivery app...    │   │                            │
│  DISCOVERY  1/4  │  └────────────────────┘   │  # 3. Non-functional Req.  │
│  ✓ Project Ovw   │                           │                            │
│  ● Target Users  │  [Faster delivery]         │  ...                       │
│  ○ Core Features │  [Lower fees] [Other]      │                            │
│  ○ Business Rules│                           │                            │
│                  │  ┌─────────────────────┐  │                            │
│  TECHNICAL  0/3  │  │ Type your reply...  │  │                            │
│  ...             │  └─────────────────────┘  │                            │
└──────────────────┴──────────────────────────┴────────────────────────────┘
         ↕ kéo thả                   ↕ kéo thả
      (resizable)                 (resizable)
```

---

## 4. Tính Năng Nổi Bật

| Tính năng | Mô tả |
|---|---|
| **Hội thoại có cấu trúc** | Alex hỏi 1–2 câu mỗi lượt, không bao giờ làm người dùng choáng ngợp |
| **Option Chips** | Gợi ý câu trả lời nhanh dạng chip bấm được; vẫn có thể tự nhập |
| **Progress Ring (SVG)** | Vòng tròn tiến độ animation hiển thị % phủ yêu cầu |
| **Phase Checklist** | 10 topic chia 3 giai đoạn: Discovery / Technical / Compliance & Delivery |
| **Topic Badge** | Mỗi tin nhắn của Alex hiển thị đang hỏi về vùng yêu cầu nào |
| **Rich Markdown** | Bold terms, bullet lists, ✅ acknowledgements trong mỗi tin nhắn |
| **Confidence Gate** | Report chỉ mở khi confidence ≥ 75% VÀ ≥ 6 topics đã phủ |
| **Resizable Panels** | Kéo thả divider để điều chỉnh chiều rộng 3 cột |
| **Report Export** | Báo cáo Markdown 10 section, dễ copy hoặc xuất PDF |
| **New Session** | Bắt đầu lại hoàn toàn với một click |

---

## 5. Tech Stack

| Lớp | Công nghệ | Lý do chọn |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast HMR, component-based, ecosystem lớn |
| **Styling** | Pure CSS + CSS Variables | Không dependency nặng, dark theme linh hoạt |
| **Icons** | lucide-react | Nhẹ, consistent, tree-shakeable |
| **Markdown** | react-markdown | Render AI responses với custom components |
| **Backend** | Node.js + Express 5 | Non-blocking I/O phù hợp streaming AI |
| **AI Model** | Gemini 2.5 Flash | Nhanh, rẻ, context window lớn, JSON mode |
| **AI SDK** | @google/genai | SDK chính thức Google, hỗ trợ Vertex AI |
| **Auth AI** | Service Account JSON | Bảo mật, không expose API key ở client |

---

## 6. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│                                                             │
│  ChatWindow.jsx                                             │
│  ├── apiHistory[]     ← raw JSON strings (AI context)       │
│  ├── displayMsgs[]    ← extracted .message + .options       │
│  ├── confidence       ← 0–100, never regresses              │
│  ├── coveredTopics[]  ← cumulative, grows only              │
│  └── chatW / sidebarW ← resizable panel widths              │
│                                                             │
│  ChatMessage.jsx      ← topic badge + react-markdown        │
│  ConfidenceMeter.jsx  ← SVG ring + phase checklist          │
│  AnalysisResult.jsx   ← markdown report renderer           │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/chat
                               │ { messages[], generateReport }
┌──────────────────────────────▼──────────────────────────────┐
│                       SERVER (Express)                      │
│                                                             │
│  chatRoute.js                                               │
│  ├── parseAIResponse()  ← strip fences + extract JSON       │
│  ├── Vertex AI call     ← responseMimeType: application/json│
│  └── Returns:           { type, message, confidence,        │
│                           currentTopic, coveredTopics,      │
│                           options, readyForReport }          │
│                                                             │
│  chatSystemPrompt.js   ← BA persona + 10 areas + rules     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│              Google Vertex AI (Gemini 2.5 Flash)            │
│              Authenticated via service account              │
└─────────────────────────────────────────────────────────────┘
```

### Chiến lược giữ JSON format qua nhiều turns

Tin nhắn của model trong conversation history được lưu dưới dạng **raw JSON string** (không phải plain text). Khi gửi lên Vertex AI, model thấy lại chính định dạng JSON nó đã output → tiếp tục giữ format cho các lượt sau.

```js
// Lưu vào history (gửi lên API)
{ role: 'model', text: '{"message":"...","confidence":13,...}' }

// Hiển thị trong UI (extract ra)
{ role: 'model', text: data.message, options: data.options, topic: data.currentTopic }
```

---

## 7. Hướng Dẫn Cài Đặt & Chạy

### Yêu cầu hệ thống

- **Node.js** v18 trở lên
- **npm** v9 trở lên
- Tài khoản **Google Cloud** với Vertex AI API được bật
- **Service account** có quyền `roles/aiplatform.user`

### Bước 1: Clone repo

```bash
git clone https://github.com/kienvbhp872004/Requirements-of-Customer-Analyst.git
cd Requirements-of-Customer-Analyst
```

### Bước 2: Thêm service account key

Đặt file JSON key của service account vào thư mục gốc, đặt tên:

```
vertex-key.json
```

> ⚠️ **Bảo mật quan trọng:** File này đã được `.gitignore` chặn, sẽ không bao giờ bị commit lên GitHub. Không chia sẻ file này dưới bất kỳ hình thức nào.

### Bước 3: Cấu hình môi trường (tuỳ chọn)

```bash
# Tạo file .env trong thư mục server/
cp server/.env.example server/.env
```

```env
# server/.env
PORT=3001
VERTEX_PROJECT_ID=your-gcp-project-id     # mặc định: "vinuni-project"
VERTEX_LOCATION=us-central1               # mặc định: "us-central1"
VERTEX_MODEL=gemini-2.5-flash             # mặc định: "gemini-2.5-flash"
GOOGLE_APPLICATION_CREDENTIALS=../vertex-key.json
```

### Bước 4: Cài đặt dependencies

```bash
# Cài tất cả một lần
cd client && npm install
cd ../server && npm install
```

### Bước 5: Khởi động

```bash
# Terminal 1 — Backend (port 3001)
cd server
node index.js

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Mở trình duyệt tại **http://localhost:5173**

### Kiểm tra backend hoạt động

```bash
curl http://localhost:3001/health
# → {"status":"ok"}
```

---

## 8. Cấu Trúc Thư Mục

```
Requirements-of-Customer-Analyst/
│
├── client/                          # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                 # Entry point
│       ├── App.jsx                  # Shell layout (header + chat)
│       ├── App.css                  # Dark theme, tất cả styles
│       ├── index.css                # Base reset + font
│       ├── api.js                   # fetch wrappers → /api/chat
│       └── components/
│           ├── ChatWindow.jsx       # Orchestrator chính: state, history, resize
│           ├── ChatMessage.jsx      # 1 tin nhắn: topic badge + markdown prose
│           ├── ConfidenceMeter.jsx  # SVG ring + phase checklist
│           ├── AnalysisResult.jsx   # Render báo cáo Markdown
│           └── DropZone.jsx         # Upload file (chế độ phân tích tài liệu)
│
├── server/                          # Node.js + Express backend
│   ├── index.js                     # App entry: middleware, routes, listen
│   ├── .env.example                 # Template biến môi trường
│   └── src/
│       ├── chatRoute.js             # POST /api/chat — Vertex AI integration
│       ├── chatSystemPrompt.js      # System prompt BA: persona + 10 areas + rules
│       ├── analyzeRoute.js          # POST /api/analyze (document upload mode)
│       └── systemPrompt.js          # Prompt cho chế độ phân tích tài liệu
│
├── vertex-key.json                  # ← KEY CỦA BẠN ĐẶT Ở ĐÂY (đã gitignore)
├── package.json                     # Root-level scripts
└── README.md
```

---

## 9. Cơ Chế Hoạt Động

### Luồng hội thoại

```
User mở app
    │
    ▼
Frontend gửi seed message: "Hello, I want to start a requirement consultation."
    │
    ▼
Alex (AI) trả về JSON: { message, confidence: 5, currentTopic: "Project Overview",
                          coveredTopics: [], options: null, readyForReport: false }
    │
    ▼
User trả lời (gõ hoặc bấm chip)
    │
    ▼
Frontend gửi toàn bộ conversation history (model turns = raw JSON strings)
    │
    ▼
Alex phân tích → cập nhật confidence, coveredTopics → hỏi tiếp
    │
    ▼ (lặp lại cho đến khi confidence ≥ 75 VÀ coveredTopics.length ≥ 6)
    │
    ▼
Nút "Generate Full Report" xuất hiện
    │
    ▼
User click → Frontend gửi lệnh GENERATE_REPORT
    │
    ▼
Alex output báo cáo Markdown 10 section
    │
    ▼
Report panel hiển thị đặc tả hoàn chỉnh
```

### Hệ thống confidence scoring

```
Bắt đầu: 5%

Mỗi vùng yêu cầu được phủ đầy đủ:  +8 đến +10 điểm
Mỗi vùng yêu cầu được phủ một phần: +3 đến +5 điểm

Điều kiện unlock báo cáo:
  ✓ confidence ≥ 75%
  ✓ coveredTopics.length ≥ 6

Quy tắc bảo vệ phía client:
  - Confidence không bao giờ giảm (Math.max(prev, new))
  - coveredTopics chỉ tăng, không bao giờ shrink
```

---

## 10. 10 Vùng Yêu Cầu BA

Alex dẫn dắt qua 10 vùng theo thứ tự, chia 3 giai đoạn:

### Giai đoạn 1: Discovery (Khám phá)

| # | Tên | Nội dung thu thập |
|---|---|---|
| 1 | **Project Overview** | Vấn đề cần giải quyết, giải pháp, domain ngành |
| 2 | **Target Users & Roles** | Ai dùng, phân quyền từng role |
| 3 | **Core Features & Workflows** | Tính năng chính, user journey từng bước |
| 4 | **Business Rules** | Ràng buộc, điều kiện, validation, edge cases |

### Giai đoạn 2: Technical (Kỹ thuật)

| # | Tên | Nội dung thu thập |
|---|---|---|
| 5 | **Non-functional Requirements** | Performance, security, availability, browser support |
| 6 | **Integrations** | Payment, email/SMS, ERP, CRM, third-party API |
| 7 | **Deployment & Infrastructure** | Cloud/on-premise, provider ưa thích |

### Giai đoạn 3: Compliance & Delivery (Tuân thủ & Bàn giao)

| # | Tên | Nội dung thu thập |
|---|---|---|
| 8 | **Compliance & Regulations** | GDPR, HIPAA, PCI-DSS, luật địa phương |
| 9 | **Timeline & Budget** | Deadline, phases, ngân sách |
| 10 | **Success Criteria** | Làm thế nào biết dự án thành công |

---

## 11. Báo Cáo Đặc Tả Đầu Ra

Khi đủ điều kiện, báo cáo được tạo tự động với 10 section chuyên nghiệp:

```markdown
# 1. Project Summary
   Tóm tắt toàn bộ dự án, vấn đề, giải pháp, đối tượng

# 2. Functional Requirements
   Danh sách tính năng chi tiết, user stories

# 3. Non-functional Requirements
   Performance, scalability, security, UX

# 4. Actors
   Các vai trò, quyền hạn, mô tả từng actor

# 5. Business Rules
   Các quy tắc nghiệp vụ, ràng buộc, điều kiện

# 6. Constraints
   Giới hạn kỹ thuật, pháp lý, ngân sách

# 7. Missing Information
   Những gì còn thiếu, cần làm rõ thêm

# 8. Clarification Questions
   Câu hỏi cụ thể để hoàn thiện đặc tả

# 9. Requirement Quality Assessment
   Đánh giá chất lượng yêu cầu đã thu thập

# 10. Risk Analysis
    Các rủi ro kỹ thuật, nghiệp vụ, và biện pháp giảm thiểu
```

---

## License

MIT © 2024 — ReqSense
