import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Printer, PenLine } from 'lucide-react';
import ReportEvaluation from './ReportEvaluation';
import './AnalysisResult.css';

function extractText(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
}

const TEXT = {
  vi: {
    title: 'Tài liệu đặc tả yêu cầu',
    download: 'Tải .md',
    print: 'In / PDF',
    confidence: 'Độ tin cậy',
    topics: 'Vùng yêu cầu',
    exchanges: 'Lượt trao đổi',
    generated: 'Đã tạo',
    confirmed: 'Đã xác nhận',
    inferred: 'Suy luận',
    userStated: 'khách hàng đã nói',
    fromContext: 'suy luận từ ngữ cảnh',
    completeness: 'Độ đầy đủ của mục',
  },
  en: {
    title: 'Requirements Specification',
    download: 'Download .md',
    print: 'Print / PDF',
    confidence: 'Confidence',
    topics: 'Topics',
    exchanges: 'Exchanges',
    generated: 'Generated',
    confirmed: 'Confirmed',
    inferred: 'Inferred',
    userStated: 'user stated',
    fromContext: 'from context',
    completeness: 'Section completeness',
  },
};

function BadgeInline({ children, language }) {
  const text = String(children);
  const t = TEXT[language === 'vi' ? 'vi' : 'en'];
  if (text === '[Confirmed]' || text === '[Đã xác nhận]') return <span className="rp-badge rp-confirmed">✓ {t.confirmed}</span>;
  if (text === '[Inferred]' || text === '[Suy luận]') return <span className="rp-badge rp-inferred">~ {t.inferred}</span>;
  return <code className="rp-code">{children}</code>;
}

function CompletenessBlock({ children, language }) {
  const t = TEXT[language === 'vi' ? 'vi' : 'en'];
  const raw = extractText(children);
  const match = raw.match(/(?:Completeness|Độ đầy đủ):\s*(\d+)\/10(.*)$/s);
  if (match) {
    const score = parseInt(match[1]);
    const note = match[2].replace(/^[\s—–-]+/, '').trim();
    const pct = score * 10;
    const color = score >= 8 ? '#3fb950' : score >= 5 ? '#d29922' : '#f85149';
    return (
      <div className="rp-completeness">
        <div className="rp-completeness-header">
          <span className="rp-completeness-label">{t.completeness}</span>
          <span className="rp-completeness-score" style={{ color }}>{score}/10</span>
        </div>
        <div className="rp-completeness-track">
          <div className="rp-completeness-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        {note && <p className="rp-completeness-note">{note}</p>}
      </div>
    );
  }
  return <blockquote className="rp-blockquote">{children}</blockquote>;
}

function MetaCard({ meta, language }) {
  const t = TEXT[language === 'vi' ? 'vi' : 'en'];
  const confColor = meta.confidence >= 75 ? '#3fb950' : meta.confidence >= 40 ? '#d29922' : '#58a6ff';
  return (
    <div className="meta-card">
      <div className="meta-stats">
        <div className="meta-stat">
          <span className="meta-stat-value" style={{ color: confColor }}>{meta.confidence}%</span>
          <span className="meta-stat-label">{t.confidence}</span>
        </div>
        <div className="meta-stat">
          <span className="meta-stat-value">{meta.topicsCount}/10</span>
          <span className="meta-stat-label">{t.topics}</span>
        </div>
        <div className="meta-stat">
          <span className="meta-stat-value">{meta.exchanges}</span>
          <span className="meta-stat-label">{t.exchanges}</span>
        </div>
        <div className="meta-stat">
          <span className="meta-stat-value meta-date">{meta.date}</span>
          <span className="meta-stat-label">{t.generated}</span>
        </div>
      </div>
      <div className="meta-legend">
        <span className="rp-badge rp-confirmed">✓ {t.confirmed}</span> {t.userStated} &nbsp;·&nbsp;
        <span className="rp-badge rp-inferred">~ {t.inferred}</span> {t.fromContext}
      </div>
    </div>
  );
}

export default function AnalysisResult({ content, meta, evaluation, evalLoading, language, onRefine }) {
  const t = TEXT[language === 'vi' ? 'vi' : 'en'];

  function downloadMarkdown() {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requirements-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="analysis-result">
      <div className="report-toolbar">
        <div className="report-toolbar-left">
          <div className="report-toolbar-dot" />
          <span className="report-title">{t.title}</span>
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={downloadMarkdown}>
            <Download size={13} />
            <span>{t.download}</span>
          </button>
          <button className="toolbar-btn" onClick={() => window.print()}>
            <Printer size={13} />
            <span>{t.print}</span>
          </button>
          {onRefine && (
            <button className="toolbar-btn toolbar-btn-refine" onClick={onRefine}>
              <PenLine size={13} />
              <span>{language === 'vi' ? 'Bổ sung & tạo lại' : 'Refine & regenerate'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="report-body">
        {meta && <MetaCard meta={meta} language={language} />}

        {(evaluation || evalLoading) && (
          <ReportEvaluation data={evaluation} loading={evalLoading} language={language} />
        )}

        <div className="report-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ children }) => <BadgeInline language={language}>{children}</BadgeInline>,
              h1: ({ children }) => <h1 className="rp-h1">{children}</h1>,
              h2: ({ children }) => {
                const text = String(children);
                const num = text.match(/^(\d+)\./)?.[1];
                return (
                  <h2 className="rp-h2">
                    {num && <span className="rp-section-num">{num}</span>}
                    <span>{num ? text.replace(/^\d+\.\s*/, '') : text}</span>
                  </h2>
                );
              },
              h3: ({ children }) => <h3 className="rp-h3"><span className="rp-h3-dot" />{children}</h3>,
              blockquote: ({ children }) => <CompletenessBlock language={language}>{children}</CompletenessBlock>,
              table: ({ children }) => <div className="rp-table-wrap"><table className="rp-table">{children}</table></div>,
              thead: ({ children }) => <thead className="rp-thead">{children}</thead>,
              th: ({ children }) => <th className="rp-th">{children}</th>,
              td: ({ children }) => <td className="rp-td">{children}</td>,
              tr: ({ children }) => <tr className="rp-tr">{children}</tr>,
              ul: ({ children }) => <ul className="rp-ul">{children}</ul>,
              ol: ({ children }) => <ol className="rp-ol">{children}</ol>,
              li: ({ children }) => <li className="rp-li">{children}</li>,
              p: ({ children }) => <p className="rp-p">{children}</p>,
              strong: ({ children }) => <strong className="rp-strong">{children}</strong>,
              hr: () => <div className="rp-section-break"><span /><span /><span /></div>,
              em: ({ children }) => <em className="rp-em">{children}</em>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
