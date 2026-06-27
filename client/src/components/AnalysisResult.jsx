import ReactMarkdown from 'react-markdown';
import { Download, Printer } from 'lucide-react';
import './AnalysisResult.css';

function BadgeText({ children }) {
  const text = String(children);
  if (text === '[Confirmed]') {
    return <span className="rp-badge rp-confirmed">Confirmed</span>;
  }
  if (text === '[Inferred]') {
    return <span className="rp-badge rp-inferred">Inferred</span>;
  }
  return <code className="rp-code">{children}</code>;
}

function MetaCard({ meta }) {
  return (
    <div className="meta-card">
      <div className="meta-item">
        <span className="meta-label">Generated</span>
        <span className="meta-value">{meta.date}</span>
      </div>
      <div className="meta-item">
        <span className="meta-label">Exchanges</span>
        <span className="meta-value">{meta.exchanges}</span>
      </div>
      <div className="meta-item">
        <span className="meta-label">Topics covered</span>
        <span className="meta-value">{meta.topicsCount}/10</span>
      </div>
      <div className="meta-item">
        <span className="meta-label">Confidence</span>
        <span className="meta-value confidence-val">{meta.confidence}%</span>
      </div>
      <div className="meta-legend">
        <span className="rp-badge rp-confirmed">Confirmed</span> user stated &nbsp;·&nbsp;
        <span className="rp-badge rp-inferred">Inferred</span> from context
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

  function printReport() {
    window.print();
  }

  return (
    <div className="analysis-result">
      <div className="report-toolbar">
        <span className="report-title">Requirements Report</span>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={downloadMarkdown} title="Download .md">
            <Download size={14} />
            <span>Download</span>
          </button>
          <button className="toolbar-btn" onClick={printReport} title="Print / Save PDF">
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="report-body">
        {meta && <MetaCard meta={meta} />}
        <div className="report-content">
          <ReactMarkdown
            components={{
              code: ({ children }) => <BadgeText>{children}</BadgeText>,
              h1: ({ children }) => <h1 className="rp-h1">{children}</h1>,
              h2: ({ children }) => <h2 className="rp-h2">{children}</h2>,
              h3: ({ children }) => <h3 className="rp-h3">{children}</h3>,
              blockquote: ({ children }) => <blockquote className="rp-blockquote">{children}</blockquote>,
              ul: ({ children }) => <ul className="rp-ul">{children}</ul>,
              ol: ({ children }) => <ol className="rp-ol">{children}</ol>,
              li: ({ children }) => <li className="rp-li">{children}</li>,
              p: ({ children }) => <p className="rp-p">{children}</p>,
              strong: ({ children }) => <strong className="rp-strong">{children}</strong>,
              hr: () => <hr className="rp-hr" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
