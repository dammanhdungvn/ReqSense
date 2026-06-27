import './AgentTrace.css';

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return '';
  }
}

function TraceSources({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return (
    <div className="trace-sources" aria-label="Google search sources used by this agent">
      <div className="trace-sources-header">
        <span>Google sources used</span>
        <span>{sources.length} cited</span>
      </div>

      <div className="trace-source-grid">
        {sources.map((source, sourceIndex) => {
          const host = source.source || getHost(source.url);

          return (
            <a
              className="trace-source-card"
              href={source.url}
              key={`${source.url}-${sourceIndex}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="trace-source-number">{sourceIndex + 1}</span>
              <span className="trace-source-body">
                <span className="trace-source-title">{source.title}</span>
                {source.snippet && (
                  <span className="trace-source-snippet">{source.snippet}</span>
                )}
                <span className="trace-source-meta">
                  {host || 'External source'}
                  {source.query ? ` · query: ${source.query}` : ''}
                </span>
                <span className="trace-source-action">
                  Open source ↗
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function AgentTrace({ trace }) {
  if (!Array.isArray(trace) || trace.length === 0) return null;

  const sourceCount = trace.reduce(
    (count, item) => count + (Array.isArray(item.sources) ? item.sources.length : 0),
    0
  );

  return (
    <details className="agent-trace">
      <summary>
        <span className="trace-dot" />
        <span>Quá trình xử lý của agent</span>
        {sourceCount > 0 && (
          <span className="trace-source-pill">{sourceCount} Google sources</span>
        )}
      </summary>

      <div className="trace-list">
        {trace.map((item, index) => (
          <div className={`trace-item ${item.searchUsed ? 'trace-item-search' : ''}`} key={`${item.agent}-${index}`}>
            <div className="trace-header">
              <span className="trace-step">{index + 1}</span>
              <div>
                <div className="trace-title-row">
                  <div className="trace-title">{item.title}</div>
                  {item.searchUsed && <span className="trace-used-badge">Search used</span>}
                </div>
                <div className="trace-agent">{item.agent}</div>
              </div>
            </div>

            {item.summary && (
              <p className="trace-summary">{item.summary}</p>
            )}

            {Array.isArray(item.details) && item.details.length > 0 && (
              <ul className="trace-details">
                {item.details.map((detail, detailIndex) => (
                  <li key={detailIndex}>{detail}</li>
                ))}
              </ul>
            )}

            <TraceSources sources={item.sources} />
          </div>
        ))}
      </div>
    </details>
  );
}
