import { useState } from 'react';
import './ReportEvaluation.css';

const DIMS = {
  completeness:     { vi: 'Độ đầy đủ',           en: 'Completeness',     icon: '📋' },
  specificity:      { vi: 'Tính cụ thể',          en: 'Specificity',      icon: '🎯' },
  userStories:      { vi: 'User Stories',         en: 'User Stories',     icon: '👤' },
  technicalClarity: { vi: 'Rõ ràng kỹ thuật',    en: 'Technical Clarity',icon: '⚙️' },
  riskCoverage:     { vi: 'Phủ rủi ro',           en: 'Risk Coverage',    icon: '🛡️' },
  devReadiness:     { vi: 'Sẵn sàng dev',         en: 'Dev Readiness',    icon: '🚀' },
};

const T = {
  vi: {
    title: 'Đánh giá chất lượng báo cáo',
    overall: 'Điểm tổng',
    strengths: 'Điểm mạnh',
    gaps: 'Cần cải thiện',
    verdict: 'Kết luận',
    loading: 'AI đang chấm báo cáo theo 6 tiêu chí BA...',
    collapse: 'Thu gọn',
    expand: 'Xem đánh giá chi tiết',
    evidence: 'Dẫn chứng từ báo cáo',
    improvement: 'Cách cải thiện',
    rubricBasis: 'Cơ sở chấm điểm: Mỗi tiêu chí theo thang 1–10 với rubric cụ thể',
  },
  en: {
    title: 'Report Quality Assessment',
    overall: 'Overall Score',
    strengths: 'Strengths',
    gaps: 'Areas to Improve',
    verdict: 'Verdict',
    loading: 'AI is scoring the report across 6 BA dimensions...',
    collapse: 'Collapse',
    expand: 'View detailed assessment',
    evidence: 'Evidence from report',
    improvement: 'How to improve',
    rubricBasis: 'Scoring basis: each dimension uses a 1–10 rubric grounded in BA standards',
  },
};

function ScoreDimension({ dimKey, score, explanation, evidence, improvement, language }) {
  const [open, setOpen] = useState(false);
  const t = T[language === 'vi' ? 'vi' : 'en'];
  const color = score >= 7 ? '#3fb950' : score >= 4 ? '#d29922' : '#f85149';
  const dim = DIMS[dimKey] ?? { vi: dimKey, en: dimKey, icon: '•' };
  const label = dim[language === 'vi' ? 'vi' : 'en'];

  return (
    <div className="re-dimension">
      <button className="re-dim-header" onClick={() => setOpen(o => !o)}>
        <div className="re-dim-left">
          <span className="re-dim-icon">{dim.icon}</span>
          <span className="re-dim-label">{label}</span>
        </div>
        <div className="re-dim-right">
          <div className="re-dim-track">
            <div className="re-dim-fill" style={{ width: `${score * 10}%`, background: color }} />
          </div>
          <span className="re-dim-score" style={{ color }}>{score}/10</span>
          <span className="re-dim-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="re-dim-detail">
          {explanation && (
            <p className="re-dim-explanation">{explanation}</p>
          )}
          {evidence && (
            <div className="re-dim-evidence">
              <span className="re-dim-evidence-label">💬 {t.evidence}</span>
              <blockquote className="re-dim-quote">"{evidence}"</blockquote>
            </div>
          )}
          {improvement && (
            <div className="re-dim-improvement">
              <span className="re-dim-improvement-label">💡 {t.improvement}</span>
              <p className="re-dim-improvement-text">{improvement}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getOverallColor(score) {
  if (score >= 7.5) return '#3fb950';
  if (score >= 5) return '#d29922';
  return '#f85149';
}

export default function ReportEvaluation({ data, loading, language }) {
  const [expanded, setExpanded] = useState(true);
  const t = T[language === 'vi' ? 'vi' : 'en'];

  if (loading) {
    return (
      <div className="re-loading">
        <div className="re-spinner" />
        <div className="re-loading-text">
          <span>{t.loading}</span>
          <span className="re-loading-sub">{t.rubricBasis}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { scores = {}, overall, strengths = [], gaps = [], verdict } = data;
  const overallColor = getOverallColor(overall);

  return (
    <div className="report-evaluation">
      <div className="re-toolbar" onClick={() => setExpanded(e => !e)}>
        <div className="re-toolbar-left">
          <span className="re-toolbar-icon">🎯</span>
          <span className="re-toolbar-title">{t.title}</span>
          <div className="re-overall-pill" style={{ color: overallColor, borderColor: overallColor }}>
            {overall?.toFixed(1)}/10
          </div>
        </div>
        <button className="re-toggle" onClick={e => { e.stopPropagation(); setExpanded(e2 => !e2); }}>
          {expanded ? t.collapse : t.expand} {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="re-body">
          {/* Overall bar */}
          <div className="re-overall-card">
            <div className="re-overall-score" style={{ color: overallColor }}>{overall?.toFixed(1)}</div>
            <div className="re-overall-right">
              <div className="re-overall-label">{t.overall}</div>
              <div className="re-overall-track">
                <div className="re-overall-fill" style={{ width: `${(overall / 10) * 100}%`, background: overallColor }} />
              </div>
            </div>
          </div>

          <p className="re-rubric-note">{t.rubricBasis}</p>

          {/* Dimension scores — expandable */}
          <div className="re-dimensions">
            {Object.entries(scores).map(([key, val]) => (
              <ScoreDimension
                key={key}
                dimKey={key}
                score={val.score}
                explanation={val.explanation}
                evidence={val.evidence}
                improvement={val.improvement}
                language={language}
              />
            ))}
          </div>

          {/* Strengths & Gaps */}
          <div className="re-feedback">
            {strengths.length > 0 && (
              <div className="re-section re-strengths">
                <h4 className="re-section-title">✅ {t.strengths}</h4>
                <ul className="re-list">
                  {strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {gaps.length > 0 && (
              <div className="re-section re-gaps">
                <h4 className="re-section-title">⚠️ {t.gaps}</h4>
                <ul className="re-list">
                  {gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
          </div>

          {verdict && (
            <div className="re-verdict">
              <span className="re-verdict-label">{t.verdict}:</span> {verdict}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
