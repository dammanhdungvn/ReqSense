import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Printer } from 'lucide-react';
import './AnalysisResult.css';

function extractText(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
}

function BadgeInline({ children }) {
  const text = String(children);
  if (text === '[Confirmed]') return <span className="rp-badge rp-confirmed">✓ Confirmed</span>;
  if (text === '[Inferred]') return <span className="rp-badge rp-inferred">~ Inferred</span>;
  return <code className="rp-code">{children}</code>;
}

function CompletenessBlock({ children }) {
  const raw = extractText(children);
  const match = raw.match(/Completeness:\s*(\d+)\/10(.*)$/s);
  if (match) {
    const score = parseInt(match[1]);
    const note = match[2].replace(/^[\s—–-]+/, '').trim();
    const pct = score * 10;
    const color = score >= 8 ? '#3fb950' : score >= 5 ? '#d29922' : '#f85149';
    return (
      <div className="rp-completeness">
        <div className="rp-completeness-header">
          <span className="rp-completeness-label">Section completeness</span>
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

function MetaCard({ meta }) {
  const confColor = meta.confidence >= 75 ? '#3fb950' : meta.confidence >= 40 ? '#d29922' : '#58a6ff';
  return (
    <div className="meta-card">
      <div className="meta-stats">
        <div className="meta-stat">
          <span className="meta-stat-value" style={{ color: confColor }}>{meta.confidence}%</span>
          <span className="meta-stat-label">Confidence</span>
        </div>
        <div className="meta-stat">
          <span className="meta-stat-value">{meta.topicsCount}/10</span>
          <span className="meta-stat-label">Topics</span>
        </div>
        <div className="meta-stat">
          <span className="meta-stat-value">{meta.exchanges}</span>
          <span className="meta-stat-label">Exchanges</span>
        </div>
        <div className="meta-stat">
          <span className="meta-stat-value meta-date">{meta.date}</span>
          <span className="meta-stat-label">Generated</span>
        </div>
      </div>
      <div className="meta-legend">
        <span className="rp-badge rp-confirmed">✓ Confirmed</span> user stated &nbsp;·&nbsp;
        <span className="rp-badge rp-inferred">~ Inferred</span> from context
      </div>
    </div>
  );
}

export default function AnalysisResult({ content, meta }) {
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
          <span className="report-title">Requirements Specification</span>
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={downloadMarkdown}>
            <Download size={13} />
            <span>Download .md</span>
          </button>
          <button className="toolbar-btn" onClick={() => window.print()}>
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      <div className="report-body">
        {meta && <MetaCard meta={meta} />}

        <div className="report-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ children }) => <BadgeInline>{children}</BadgeInline>,
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
              blockquote: ({ children }) => <CompletenessBlock>{children}</CompletenessBlock>,
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
