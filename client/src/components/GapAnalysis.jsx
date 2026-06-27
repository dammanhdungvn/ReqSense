import './GapAnalysis.css';

const QUALITY_CONFIG = {
  solid:   { label: 'Solid',   color: '#3fb950', bg: 'rgba(63,185,80,0.1)',   icon: '✓' },
  partial: { label: 'Partial', color: '#d29922', bg: 'rgba(210,153,34,0.1)', icon: '◑' },
  thin:    { label: 'Thin',    color: '#f0883e', bg: 'rgba(240,136,62,0.1)', icon: '◔' },
  missing: { label: 'Missing', color: '#f85149', bg: 'rgba(248,81,73,0.1)',  icon: '○' },
};

const VI = {
  title: 'Phân tích độ phủ yêu cầu',
  subtitle: 'Đánh giá chất lượng thông tin đã thu thập cho từng vùng yêu cầu',
  criticalGaps: 'Khoảng trống quan trọng',
  askBtn: 'Hỏi ngay',
  generateBtn: 'Tạo báo cáo đầy đủ',
  loading: 'Đang phân tích cuộc trò chuyện...',
  suggestedQ: 'Câu hỏi gợi ý:',
  verdict: { ready: '✅ Đã đủ thông tin để tạo báo cáo', 'needs-more': '⚠️ Nên hỏi thêm trước khi tạo báo cáo', 'critical-gaps': '🔴 Còn thiếu thông tin quan trọng' },
};

const EN = {
  title: 'Coverage Gap Analysis',
  subtitle: 'Quality assessment of gathered information across all 10 requirement areas',
  criticalGaps: 'Critical Gaps',
  askBtn: 'Ask now',
  generateBtn: 'Generate Full Report',
  loading: 'Analyzing conversation coverage...',
  suggestedQ: 'Suggested question:',
  verdict: { ready: '✅ Ready to generate report', 'needs-more': '⚠️ Consider asking more before generating', 'critical-gaps': '🔴 Critical information still missing' },
};

function ScoreBar({ score }) {
  const color = score >= 7 ? '#3fb950' : score >= 4 ? '#d29922' : '#f85149';
  return (
    <div className="ga-score-bar">
      <div className="ga-score-track">
        <div className="ga-score-fill" style={{ width: `${score * 10}%`, background: color }} />
      </div>
      <span className="ga-score-num" style={{ color }}>{score}</span>
    </div>
  );
}

export default function GapAnalysis({ data, loading, onGenerate, onAskQuestion, language }) {
  const t = language === 'vi' ? VI : EN;

  if (loading) {
    return (
      <div className="ga-loading">
        <div className="ga-spinner" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (!data) return null;

  const { topics = [], criticalGaps = [], verdict, summary } = data;
  const verdictText = t.verdict[verdict] ?? verdict;
  const verdictClass = verdict === 'ready' ? 'ga-verdict-ready' : verdict === 'needs-more' ? 'ga-verdict-warn' : 'ga-verdict-danger';

  return (
    <div className="gap-analysis">
      <div className="ga-header">
        <h2 className="ga-title">{t.title}</h2>
        <p className="ga-subtitle">{t.subtitle}</p>
        {summary && <p className="ga-summary">{summary}</p>}
      </div>

      <div className={`ga-verdict ${verdictClass}`}>{verdictText}</div>

      <div className="ga-topics">
        {topics.map((topic) => {
          const cfg = QUALITY_CONFIG[topic.quality] ?? QUALITY_CONFIG.missing;
          return (
            <div key={topic.name} className="ga-topic-card">
              <div className="ga-topic-header">
                <div className="ga-topic-left">
                  <span className="ga-quality-icon" style={{ color: cfg.color, background: cfg.bg }}>
                    {cfg.icon}
                  </span>
                  <div>
                    <span className="ga-topic-name">{topic.name}</span>
                    <span className="ga-quality-label" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
                <ScoreBar score={topic.score} />
              </div>

              {topic.note && <p className="ga-topic-note">{topic.note}</p>}

              {topic.question && (
                <div className="ga-suggestion">
                  <span className="ga-suggestion-label">{t.suggestedQ}</span>
                  <div className="ga-suggestion-row">
                    <span className="ga-suggestion-text">"{topic.question}"</span>
                    <button
                      className="ga-ask-btn"
                      onClick={() => onAskQuestion(topic.question)}
                    >
                      {t.askBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {criticalGaps.length > 0 && (
        <div className="ga-gaps-section">
          <h3 className="ga-gaps-title">{t.criticalGaps}</h3>
          <ul className="ga-gaps-list">
            {criticalGaps.map((gap, i) => (
              <li key={i} className="ga-gap-item">{gap}</li>
            ))}
          </ul>
        </div>
      )}

      <button className="ga-generate-btn" onClick={onGenerate}>
        {t.generateBtn}
      </button>
    </div>
  );
}
