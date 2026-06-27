import { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../api';
import ChatMessage from './ChatMessage';
import ConfidenceMeter from './ConfidenceMeter';
import AnalysisResult from './AnalysisResult';

const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 340;
const SIDEBAR_DEFAULT = 220;
const CHAT_MIN = 300;
const CHAT_MAX = 620;
const CHAT_DEFAULT = 420;

const STORAGE_KEY = 'reqsense_session';

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

function toRawJson(data) {
  return JSON.stringify({
    message: data.message,
    confidence: data.confidence,
    currentTopic: data.currentTopic,
    coveredTopics: data.coveredTopics,
    options: data.options,
    readyForReport: data.readyForReport,
  });
}

export default function ChatWindow({ userProfile }) {
  const [apiHistory, setApiHistory] = useState([]);
  const [displayMsgs, setDisplayMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportMeta, setReportMeta] = useState(null);
  const [error, setError] = useState(null);
  const [restored, setRestored] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [coveredTopics, setCoveredTopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [readyForReport, setReadyForReport] = useState(false);
  const [sidebarW, setSidebarW] = useState(SIDEBAR_DEFAULT);
  const [chatW, setChatW] = useState(CHAT_DEFAULT);

  const messagesEndRef = useRef(null);
  const initialized = useRef(false);

  function applyBA(data) {
    setConfidence(prev => Math.max(prev, data.confidence ?? 0));
    setCoveredTopics(prev => {
      const set = new Set(prev);
      (data.coveredTopics || []).forEach(t => set.add(t));
      return [...set];
    });
    setCurrentTopic(data.currentTopic || '');
    if (data.readyForReport) setReadyForReport(true);
  }

  async function startSession() {
    setApiHistory([]);
    setDisplayMsgs([]);
    setConfidence(0);
    setCoveredTopics([]);
    setCurrentTopic('');
    setReadyForReport(false);
    setReport(null);
    setReportMeta(null);
    setError(null);
    setLoading(true);

    const seedMsg = { role: 'user', text: buildSeedMsg(userProfile) };

    try {
      const data = await sendMessage([seedMsg], false);
      setApiHistory([seedMsg, { role: 'model', text: toRawJson(data) }]);
      setDisplayMsgs([{
        role: 'model',
        text: data.message,
        options: data.options,
        topic: data.currentTopic,
      }]);
      applyBA(data);
    } catch (err) {
      setError('Failed to start session. Please check your server and API key, then refresh.');
    } finally {
      setLoading(false);
    }
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
    setLoading(true);
    setError(null);

    const newHistory = [...apiHistory, userMsg];

    try {
      const data = await sendMessage(newHistory, false);
      setApiHistory([...newHistory, { role: 'model', text: toRawJson(data) }]);
      setDisplayMsgs(prev => [...prev, {
        role: 'model',
        text: data.message,
        options: data.options,
        topic: data.currentTopic,
      }]);
      applyBA(data);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      setDisplayMsgs(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    const meta = {
      date: new Date().toLocaleString(),
      confidence,
      topicsCount: coveredTopics.length,
      exchanges: displayMsgs.filter(m => m.role === 'user').length,
      coveredTopics,
    };

    setLoading(true);
    setError(null);

    try {
      const messages = [...apiHistory, { role: 'user', text: 'GENERATE_REPORT' }];
      const data = await sendMessage(messages, true);
      setReport(data.content);
      setReportMeta(meta);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    initialized.current = false;
    startSession();
  }

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMsgs, loading]);

  // Auto-save
  useEffect(() => {
    if (apiHistory.length > 1) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        apiHistory, displayMsgs, confidence, coveredTopics,
        currentTopic, readyForReport, report,
      }));
    }
  }, [apiHistory, displayMsgs, confidence, coveredTopics, currentTopic, readyForReport, report]);

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
          setConfidence(p.confidence || 0);
          setCoveredTopics(p.coveredTopics || []);
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

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const lastMsg = displayMsgs[displayMsgs.length - 1];
  const showOptions = !loading && lastMsg?.role === 'model' && lastMsg?.options?.length > 0;
  const exchangeCount = displayMsgs.filter(m => m.role === 'user').length;

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
          <span>{exchangeCount} exchange{exchangeCount !== 1 ? 's' : ''}</span>
          {apiHistory.length > 1 && <span className="saved-indicator">Auto-saved</span>}
        </div>
        <button className="new-session-btn" onClick={clearSession}>
          New Session
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
          <div className="restored-banner">Session restored from last time</div>
        )}

        <div className="messages-list">
          {displayMsgs.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {showOptions && (
            <div className="option-chips">
              {lastMsg.options.map((opt, i) => (
                <button key={i} className="option-chip" onClick={() => send(opt)}>
                  {opt}
                </button>
              ))}
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
          {readyForReport && !report && (
            <button
              className="generate-report-btn"
              onClick={generateReport}
              disabled={loading}
            >
              Generate Full Report
            </button>
          )}
          <div className="input-row">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer… (Enter to send, Shift+Enter for newline)"
              disabled={loading}
              rows={2}
            />
            <button
              className="send-btn"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="drag-handle" onMouseDown={startChatResize} />

      {/* ── Report panel ── */}
      <div className="report-panel">
        {report ? (
          <AnalysisResult content={report} meta={reportMeta} />
        ) : (
          <div className="report-empty">
            <h3>Requirements Report</h3>
            <div className="steps">
              <div className="step"><span>1</span>Describe your software idea</div>
              <div className="step"><span>2</span>Answer Alex's questions</div>
              <div className="step"><span>3</span>Reach 75% confidence</div>
              <div className="step"><span>4</span>Generate your specification</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
