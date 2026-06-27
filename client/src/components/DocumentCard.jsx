import './DocumentCard.css';

const FORMAT_COLORS = {
  PDF:  { bg: '#ffeef0', border: '#f85149', text: '#f85149' },
  DOCX: { bg: '#e8f4fd', border: '#58a6ff', text: '#58a6ff' },
  DOC:  { bg: '#e8f4fd', border: '#58a6ff', text: '#58a6ff' },
  MD:   { bg: '#e6f4ea', border: '#3fb950', text: '#3fb950' },
  TXT:  { bg: '#f1f8ff', border: '#8b949e', text: '#8b949e' },
};

export default function DocumentCard({ doc }) {
  const fmt = FORMAT_COLORS[doc.format] ?? FORMAT_COLORS.TXT;
  const preview = doc.content?.slice(0, 200).replace(/\n+/g, ' ');

  return (
    <div className="doc-card">
      <div className="doc-card-header">
        <div className="doc-icon">📄</div>
        <div className="doc-meta">
          <span className="doc-filename">{doc.filename}</span>
          <div className="doc-stats">
            <span
              className="doc-format-badge"
              style={{ background: fmt.bg, color: fmt.text, borderColor: fmt.border }}
            >
              {doc.format}
            </span>
            <span className="doc-wordcount">{doc.wordCount?.toLocaleString()} words</span>
          </div>
        </div>
      </div>
      {preview && (
        <p className="doc-preview">"{preview}{doc.content?.length > 200 ? '…' : ''}"</p>
      )}
    </div>
  );
}
