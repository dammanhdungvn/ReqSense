import ReactMarkdown from 'react-markdown';
import './ChatMessage.css';

function BadgeText({ children }) {
  const text = String(children);
  if (text === '[Confirmed]') return <span className="badge badge-confirmed">✓ Confirmed</span>;
  if (text === '[Inferred]') return <span className="badge badge-inferred">~ Inferred</span>;
  return <code>{children}</code>;
}

function AckParagraph({ children }) {
  const text = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.map(c => (typeof c === 'string' ? c : c?.props?.children ?? '')).join('')
      : '';

  const isAck = text.startsWith('✅');
  return <p className={`msg-p ${isAck ? 'msg-ack' : ''}`}>{children}</p>;
}

export default function ChatMessage({ message }) {
  const isModel = message.role === 'model';

  return (
    <div className={`chat-message ${isModel ? 'model' : 'user'}`}>
      {isModel && <div className="msg-avatar alex-avatar small">A</div>}

      <div className="msg-content">
        {isModel && message.topic && (
          <span className="topic-badge">{message.topic}</span>
        )}

        <div className={`msg-bubble ${isModel ? 'bubble-model' : 'bubble-user'}`}>
          {isModel ? (
            <ReactMarkdown
              components={{
                code: ({ children }) => <BadgeText>{children}</BadgeText>,
                p: ({ children }) => <AckParagraph>{children}</AckParagraph>,
                strong: ({ children }) => <strong className="msg-strong">{children}</strong>,
                ul: ({ children }) => <ul className="msg-ul">{children}</ul>,
                ol: ({ children }) => <ol className="msg-ol">{children}</ol>,
                li: ({ children }) => <li className="msg-li">{children}</li>,
                em: ({ children }) => <em className="msg-em">{children}</em>,
              }}
            >
              {message.text}
            </ReactMarkdown>
          ) : (
            <span>{message.text}</span>
          )}
        </div>
      </div>

      {!isModel && <div className="msg-avatar user-avatar">You</div>}
    </div>
  );
}
