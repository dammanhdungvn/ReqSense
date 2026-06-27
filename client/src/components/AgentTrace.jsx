import './AgentTrace.css';

export default function AgentTrace({ trace }) {
  if (!Array.isArray(trace) || trace.length === 0) return null;

  return (
    <details className="agent-trace">
      <summary>
        <span className="trace-dot" />
        Quá trình xử lý của agent
      </summary>

      <div className="trace-list">
        {trace.map((item, index) => (
          <div className="trace-item" key={`${item.agent}-${index}`}>
            <div className="trace-header">
              <span className="trace-step">{index + 1}</span>
              <div>
                <div className="trace-title">{item.title}</div>
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
          </div>
        ))}
      </div>
    </details>
  );
}
