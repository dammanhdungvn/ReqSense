import ReactMarkdown from 'react-markdown';
import './ChatMessage.css';

function BadgeText({ children }) {
  const text = String(children);
  if (text === '[Confirmed]') {
    return <span className="badge badge-confirmed">Confirmed</span>;
  }
  if (text === '[Inferred]') {
    return <span className="badge badge-inferred">Inferred</span>;
  }
  return <code>{children}</code>;
}

export default function ChatMessage({ message }) {
  const isModel = message.role === 'model';

  return (
    <div className={`chat-message ${isModel ? 'model' : 'user'}`}>
      {isModel && (
        <div className="msg-avatar alex-avatar small">A</div>
      )}
      <div className="msg-content">
        {isModel && message.topic && (
          <span className="topic-badge">{message.topic}</span>
        )}
        <div className={`msg-bubble ${isModel ? 'bubble-model' : 'bubble-user'}`}>
          {isModel ? (
            <ReactMarkdown
              components={{
                code: ({ children }) => <BadgeText>{children}</BadgeText>,
              }}
            >
              {message.text}
            </ReactMarkdown>
          ) : (
            <span>{message.text}</span>
          )}
        </div>
      </div>
      {!isModel && (
        <div className="msg-avatar user-avatar small">You</div>
      )}
    </div>
  );
}
