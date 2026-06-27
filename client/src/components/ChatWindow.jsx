import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { sendMessage, analyzeGaps, evaluateReport, uploadDocument } from '../api';
import ChatMessage from './ChatMessage';
import ConfidenceMeter from './ConfidenceMeter';
import AnalysisResult from './AnalysisResult';
import GapAnalysis from './GapAnalysis';

const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 340;
const SIDEBAR_DEFAULT = 220;
const CHAT_MIN = 300;
const CHAT_MAX = 620;
const CHAT_DEFAULT = 420;

const STORAGE_KEY = 'reqsense_session';

const UI_TEXT = {
  vi: {
    welcome: 'Xin chào, tôi là Alex. Hãy mô tả ngắn gọn ý tưởng phần mềm của bạn, tôi sẽ quyết định khi nào cần dùng agent để phân tích sâu hơn.',
    exchanges: count => `${count} lượt trao đổi`,
    saved: 'Đã tự lưu',
    newSession: 'Phiên mới',
    restored: 'Đã khôi phục phiên trước',
    send: 'Gửi',
    selectedOptions: count => `Đã chọn ${count}`,
    clearOptions: 'Bỏ chọn',
    sendSelected: 'Gửi lựa chọn',
    placeholder: 'Nhập câu trả lời... (Enter để gửi, Shift+Enter để xuống dòng)',
    sendError: 'Không gửi được tin nhắn. Vui lòng thử lại.',
    reportError: 'Không tạo được báo cáo. Vui lòng thử lại.',
    reportCreated: 'Đã tạo báo cáo yêu cầu. Bạn có thể xem ở khung bên phải.',
    refineText: 'Báo cáo đã được tạo. Tôi muốn bổ sung thêm thông tin để cải thiện nó. Bạn hãy hỏi tôi những gì còn thiếu nhé.',
    emptyTitle: 'Báo cáo yêu cầu',
    steps: [
      'Mô tả ý tưởng phần mềm',
      'Trả lời câu hỏi của Alex',
      'Đạt đủ độ tin cậy',
      'Tạo tài liệu đặc tả yêu cầu',
    ],
  },
  en: {
    welcome: 'Hi, I am Alex. Briefly describe your software idea and I will decide when deeper agent analysis is needed.',
    exchanges: count => `${count} exchange${count !== 1 ? 's' : ''}`,
    saved: 'Auto-saved',
    newSession: 'New Session',
    restored: 'Session restored from last time',
    send: 'Send',
    selectedOptions: count => `${count} selected`,
    clearOptions: 'Clear',
    sendSelected: 'Send selected',
    placeholder: 'Type your answer... (Enter to send, Shift+Enter for newline)',
    sendError: 'Failed to send message. Please try again.',
    reportError: 'Failed to generate report. Please try again.',
    reportCreated: 'The requirements report has been generated. You can review it in the right panel.',
    refineText: 'The report has been generated. I want to add more details to improve it. Please ask me about what information is still missing.',
    emptyTitle: 'Requirements Report',
    steps: [
      'Describe your software idea',
      "Answer Alex's questions",
      'Reach 75% confidence',
      'Generate your specification',
    ],
  },
};

const VIETNAMESE_PATTERN = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const VIETNAMESE_WORD_PATTERN = /\b(tôi|toi|mình|minh|bạn|ban|muốn|muon|cần|can|tính năng|tinh nang|báo cáo|bao cao|yêu cầu|yeu cau|phần mềm|phan mem|khách hàng|khach hang)\b/i;
const ENGLISH_WORD_PATTERN = /\b(i|we|want|need|build|feature|report|requirement|software|app|user|customer|dashboard|payment|login|admin)\b/i;

function detectMessageLanguage(text) {
  if (!text || typeof text !== 'string') return null;
  if (VIETNAMESE_PATTERN.test(text) || VIETNAMESE_WORD_PATTERN.test(text)) return 'vi';
  if (ENGLISH_WORD_PATTERN.test(text)) return 'en';
  return null;
}

function getInterfaceLanguage(messages, fallback = 'vi') {
  const lastUserMessage = [...messages].reverse().find(
    msg => msg.role === 'user' && msg.text !== 'GENERATE_REPORT'
  );
  return detectMessageLanguage(lastUserMessage?.text) || fallback || 'vi';
}

const ROLE_MAP = {
  developer:    { vi: 'Lập trình viên / Kỹ thuật', en: 'Developer / Technical person' },
  pm:           { vi: 'Product Manager / Designer', en: 'Product Manager / Designer' },
  business:     { vi: 'Chủ doanh nghiệp / Startup founder', en: 'Business Owner / Startup founder' },
  nontechnical: { vi: 'Người không chuyên kỹ thuật', en: 'Non-technical stakeholder' },
};

const EXP_MAP = {
  experienced: { vi: 'Đã có nhiều kinh nghiệm', en: 'Very experienced' },
  some:        { vi: 'Đã làm một vài dự án', en: 'Some experience' },
  first:       { vi: 'Lần đầu tiên', en: 'First time' },
};

function buildSeedMsg(profile) {
  if (!profile) return 'Hello, I want to start a requirement consultation.';
  const lang = profile.language === 'vi' ? 'vi' : 'en';
  const role = ROLE_MAP[profile.role]?.[lang] ?? profile.role;
  const exp  = EXP_MAP[profile.experience]?.[lang] ?? profile.experience;
  const langLabel = profile.language === 'vi' ? 'Vietnamese' : 'English';
  const greeting  = profile.language === 'vi'
    ? 'Xin chào, tôi muốn bắt đầu tư vấn yêu cầu phần mềm.'
    : 'Hello, I want to start a requirement consultation.';
  return `[PROFILE: language=${langLabel} | role=${role} | experience=${exp}]\n${greeting}`;
}

/**
 * Confidence tính từ dữ liệu thực — độc lập với AI:
 * - Mỗi topic đã phủ: +9 điểm  (10 topics → 90 điểm)
 * - Mật độ trao đổi:  +0.5 điểm / lượt user (tối đa +10)
 * Kết quả: 5 (khởi đầu) → 100 (phủ hết + nhiều trao đổi)
 */
function calcConfidence(coveredTopics, exchanges) {
  const topicPts   = coveredTopics.length * 9;
  const densityPts = Math.min(10, Math.floor(exchanges * 0.5));
  return Math.min(100, 5 + topicPts + densityPts);
}

function toRawJson(data) {
  return JSON.stringify({
    message: data.message,
    confidence: data.confidence,
    currentTopic: data.currentTopic,
    coveredTopics: data.coveredTopics,
    confirmedFeatures: data.confirmedFeatures || [],
    skippedTopics: data.skippedTopics || [],
    options: data.options,
    readyForReport: data.readyForReport,
    agentTrace: data.agentTrace || [],
  });
}

export default function ChatWindow({ userProfile }) {
  const [apiHistory, setApiHistory] = useState([]);
  const [displayMsgs, setDisplayMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportMeta, setReportMeta] = useState(null);
  const [error, setError] = useState(null);
  const [restored, setRestored] = useState(false);
  const [coveredTopics, setCoveredTopics] = useState([]);
  const [confirmedFeatures, setConfirmedFeatures] = useState([]);
  const [skippedTopics, setSkippedTopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [readyForReport, setReadyForReport] = useState(false);
  const [sidebarW, setSidebarW] = useState(SIDEBAR_DEFAULT);
  const [chatW, setChatW] = useState(CHAT_DEFAULT);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [refineMode, setRefineMode] = useState(false);
  const [rightTab, setRightTab] = useState('gaps');

  const messagesEndRef = useRef(null);
  const initialized = useRef(false);
  const fileInputRef = useRef(null);

  const exchangeCount = displayMsgs.filter(m => m.role === 'user').length;
  const confidence = useMemo(
    () => calcConfidence(coveredTopics, exchangeCount),
    [coveredTopics, exchangeCount]
  );
  const interfaceLanguage = useMemo(
    () => getInterfaceLanguage(displayMsgs, userProfile?.language || 'vi'),
    [displayMsgs, userProfile?.language]
  );
  const t = UI_TEXT[interfaceLanguage] || UI_TEXT.vi;

  function buildReportMeta() {
    return {
      date: new Date().toLocaleString(interfaceLanguage === 'vi' ? 'vi-VN' : 'en-US'),
      confidence,
      topicsCount: coveredTopics.length,
      exchanges: exchangeCount,
      coveredTopics,
    };
  }

  function applyBA(data) {
    setCoveredTopics(prev => {
      const set = new Set(prev);
      (data.coveredTopics || []).forEach(t => set.add(t));
      return [...set];
    });
    if (Array.isArray(data.confirmedFeatures)) {
      const byKey = new Map();
      data.confirmedFeatures.forEach(feature => {
        if (typeof feature === 'string' && feature.trim()) {
          const clean = feature.trim();
          byKey.set(clean.toLowerCase(), clean);
        }
      });
      setConfirmedFeatures([...byKey.values()]);
    }
    if (Array.isArray(data.skippedTopics)) {
      setSkippedTopics(data.skippedTopics);
    }
    setCurrentTopic(data.currentTopic || '');
    if (data.readyForReport) setReadyForReport(true);
  }

  function startSession() {
    const initialLanguage = userProfile?.language === 'en' ? 'en' : 'vi';
    setApiHistory([]);
    setDisplayMsgs([{
      role: 'model',
      text: UI_TEXT[initialLanguage].welcome,
      options: null,
      topic: 'Project Overview',
      agentTrace: [],
    }]);
    setCoveredTopics([]);
    setConfirmedFeatures([]);
    setSkippedTopics([]);
    setSelectedOptions([]);
    setCurrentTopic('');
    setReadyForReport(false);
    setReport(null);
    setReportMeta(null);
    setError(null);
    setLoading(false);
  }

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed };

    setDisplayMsgs(prev => [
      ...prev.map(m => ({ ...m, options: null })),
      { role: 'user', text: trimmed },
    ]);
    setInput('');
    setSelectedOptions([]);
    setLoading(true);
    setError(null);

    const newHistory = [...apiHistory, userMsg];

    try {
      const data = await sendMessage(newHistory, false);
      if (data.type === 'report') {
        setApiHistory(newHistory);
        setReport(data.content);
        setReportMeta(buildReportMeta());
        setDisplayMsgs(prev => [...prev, {
          role: 'model',
          text: t.reportCreated,
          options: null,
          topic: 'Report',
          agentTrace: [],
        }]);
        fetchEvaluation(data.content);
        return;
      }

      setApiHistory([...newHistory, { role: 'model', text: toRawJson(data) }]);
      setDisplayMsgs(prev => [...prev, {
        role: 'model',
        text: data.message,
        options: data.options,
        topic: data.currentTopic,
        agentTrace: data.agentTrace,
      }]);
      applyBA(data);
    } catch (err) {
      setError(t.sendError);
      setDisplayMsgs(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    const meta = buildReportMeta();

    setLoading(true);
    setError(null);

    try {
      const messages = [...apiHistory, { role: 'user', text: 'GENERATE_REPORT' }];
      const data = await sendMessage(messages, true);
      setReport(data.content);
      setReportMeta(meta);
      fetchEvaluation(data.content);
    } catch (err) {
      setError(t.reportError);
    } finally {
      setLoading(false);
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    initialized.current = false;
    setGapAnalysis(null);
    setEvaluation(null);
    setConfirmedFeatures([]);
    setSkippedTopics([]);
    startSession();
  }

  async function handleRefine() {
    setReport(null);
    setReportMeta(null);
    setEvaluation(null);
    setEvalLoading(false);
    setGapAnalysis(null);
    setRefineMode(true);
    await send(t.refineText);
  }

  async function fetchGapAnalysis() {
    setGapLoading(true);
    try {
      const data = await analyzeGaps(
        apiHistory, coveredTopics, skippedTopics, confidence, interfaceLanguage
      );
      setGapAnalysis(data);
      setRefineMode(false);
    } catch (_) {}
    finally { setGapLoading(false); }
  }

  async function fetchEvaluation(reportContent) {
    setEvalLoading(true);
    try {
      const data = await evaluateReport(reportContent, interfaceLanguage);
      setEvaluation(data);
    } catch (_) {}
    finally { setEvalLoading(false); }
  }

  // Trigger gap analysis when readyForReport
  useEffect(() => {
    if (readyForReport && !gapAnalysis && !gapLoading && apiHistory.length > 1) {
      fetchGapAnalysis();
      setRightTab('gaps');
    }
  }, [readyForReport, interfaceLanguage]);

  // Switch to report tab when report is generated
  useEffect(() => {
    if (report) setRightTab('report');
  }, [report]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMsgs, loading]);

  // Auto-save
  useEffect(() => {
    if (apiHistory.length > 1) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        apiHistory, displayMsgs, coveredTopics, confirmedFeatures, skippedTopics,
        currentTopic, readyForReport, report,
      }));
    }
  }, [apiHistory, displayMsgs, confidence, coveredTopics, confirmedFeatures, skippedTopics, currentTopic, readyForReport, report]);

  // Initialize once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.apiHistory?.length > 1) {
          setApiHistory(p.apiHistory);
          setDisplayMsgs(p.displayMsgs || []);
          setCoveredTopics(p.coveredTopics || []);
          setConfirmedFeatures(p.confirmedFeatures || []);
          setSkippedTopics(p.skippedTopics || []);
          setCurrentTopic(p.currentTopic || '');
          setReadyForReport(p.readyForReport || false);
          setReport(p.report || null);
          setRestored(true);
          setTimeout(() => setRestored(false), 4000);
          return;
        }
      } catch (_) {
        // corrupted storage — start fresh
      }
    }
    startSession();
  }, []);

  // Drag resize — sidebar
  function startSidebarResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarW;
    const onMove = (e) => {
      setSidebarW(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startW + e.clientX - startX)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // Drag resize — chat
  function startChatResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = chatW;
    const onMove = (e) => {
      setChatW(Math.max(CHAT_MIN, Math.min(CHAT_MAX, startW + e.clientX - startX)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // Show document card in chat immediately
    const docMsg = { role: 'user', type: 'document', doc: { filename: file.name, format: file.name.split('.').pop().toUpperCase(), wordCount: 0, content: '' } };
    setDisplayMsgs(prev => [...prev.map(m => ({ ...m, options: null })), docMsg]);
    setLoading(true);
    setError(null);

    try {
      const doc = await uploadDocument(file);

      // Update the doc card with real data
      setDisplayMsgs(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.type === 'document' ? { ...m, doc } : m
      ));

      // Build context message for Alex
      const contextMsg = {
        role: 'user',
        text: `[DOCUMENT: ${doc.filename}]\n${doc.content}`,
      };
      const newHistory = [...apiHistory, contextMsg];

      const data = await sendMessage(newHistory, false);
      setApiHistory([...newHistory, { role: 'model', text: toRawJson(data) }]);
      setDisplayMsgs(prev => [...prev, {
        role: 'model',
        text: data.message,
        options: data.options,
        topic: data.currentTopic,
        agentTrace: data.agentTrace,
      }]);
      applyBA(data);
    } catch (err) {
      setError(err.message || 'Failed to process document.');
      setDisplayMsgs(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(buildAnswerText());
    }
  }

  const lastMsg = displayMsgs[displayMsgs.length - 1];
  const showOptions = !loading && lastMsg?.role === 'model' && lastMsg?.options?.length > 0;
  const selectedOptionSet = useMemo(() => new Set(selectedOptions), [selectedOptions]);

  useEffect(() => {
    setSelectedOptions([]);
  }, [lastMsg?.text]);

  function toggleOption(option) {
    setSelectedOptions(prev => (
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    ));
  }

  function buildAnswerText() {
    const typed = input.trim();
    if (selectedOptions.length === 0) return typed;

    const choices = selectedOptions.join(', ');
    return typed ? `${choices}\n${typed}` : choices;
  }

  return (
    <div className="chat-window">
      {/* ── Sidebar ── */}
      <div className="sidebar-panel" style={{ width: sidebarW }}>
        <ConfidenceMeter
          confidence={confidence}
          coveredTopics={coveredTopics}
          currentTopic={currentTopic}
        />
        <div className="session-meta">
          <span>{t.exchanges(exchangeCount)}</span>
          {apiHistory.length > 1 && <span className="saved-indicator">{t.saved}</span>}
        </div>
        <button className="new-session-btn" onClick={clearSession}>
          {t.newSession}
        </button>
      </div>

      <div className="drag-handle" onMouseDown={startSidebarResize} />

      {/* ── Chat panel ── */}
      <div className="chat-panel" style={{ width: chatW }}>
        <div className="chat-header">
          <div className="alex-avatar">A</div>
          <div className="alex-info">
            <div className="alex-name">Alex</div>
            <div className="alex-role">Senior Business Analyst</div>
          </div>
          <div className="online-dot" />
        </div>

        {restored && (
          <div className="restored-banner">{t.restored}</div>
        )}

        <div className="messages-list">
          {displayMsgs.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {showOptions && (
            <div className="option-chips">
              {lastMsg.options.map((opt, i) => (
                <button
                  key={i}
                  className={`option-chip ${selectedOptionSet.has(opt) ? 'selected' : ''}`}
                  onClick={() => toggleOption(opt)}
                  aria-pressed={selectedOptionSet.has(opt)}
                  type="button"
                >
                  {opt}
                </button>
              ))}
              {selectedOptions.length > 0 && (
                <div className="option-selection-actions">
                  <span className="option-selection-count">
                    {t.selectedOptions(selectedOptions.length)}
                  </span>
                  <button
                    className="option-selection-clear"
                    onClick={() => setSelectedOptions([])}
                    type="button"
                  >
                    {t.clearOptions}
                  </button>
                  <button
                    className="option-selection-send"
                    onClick={() => send(buildAnswerText())}
                    type="button"
                  >
                    {t.sendSelected}
                  </button>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="typing-bubble">
              <div className="alex-avatar small">A</div>
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="chat-footer">
          <div className="input-row">
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Upload document (PDF, MD, DOCX)"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.txt,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              disabled={loading}
              rows={2}
            />
            <button
              className="send-btn"
              onClick={() => send(buildAnswerText())}
              disabled={loading || (!input.trim() && selectedOptions.length === 0)}
            >
              {t.send}
            </button>
          </div>
        </div>
      </div>

      <div className="drag-handle" onMouseDown={startChatResize} />

      {/* ── Report panel ── */}
      <div className="report-panel">
        {/* Tab bar */}
        <div className="panel-tabs">
          <button
            className={`panel-tab ${rightTab === 'gaps' ? 'panel-tab-active' : ''}`}
            onClick={() => setRightTab('gaps')}
          >
            🔍 {interfaceLanguage === 'vi' ? 'Phân tích' : 'Gap Analysis'}
          </button>
          <button
            className={`panel-tab ${rightTab === 'report' ? 'panel-tab-active' : ''}`}
            onClick={() => setRightTab('report')}
          >
            📄 {interfaceLanguage === 'vi' ? 'Báo cáo' : 'Report'}
          </button>
        </div>

        {/* Tab content */}

        {rightTab === 'gaps' && (
          <GapAnalysis
            data={gapAnalysis}
            loading={gapLoading}
            onGenerate={generateReport}
            onAskQuestion={(q) => send(q)}
            onReanalyze={fetchGapAnalysis}
            isRefineMode={refineMode}
            language={interfaceLanguage}
          />
        )}

        {rightTab === 'report' && report && (
          <AnalysisResult
            content={report}
            meta={reportMeta}
            evaluation={evaluation}
            evalLoading={evalLoading}
            language={interfaceLanguage}
            onRefine={handleRefine}
          />
        )}

        {rightTab === 'report' && !report && (
          <div className="report-empty">
            <h3>{t.emptyTitle}</h3>
            <div className="steps">
              {t.steps.map((step, index) => (
                <div className="step" key={step}>
                  <span>{index + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
