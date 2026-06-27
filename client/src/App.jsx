import './App.css';
import ChatWindow from './components/ChatWindow';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-mark">RS</div>
          <span className="logo-text">ReqSense</span>
        </div>
        <div className="header-divider" />
        <span className="header-tagline">AI-powered Requirements Analyst</span>
      </header>
      <main className="app-body">
        <ChatWindow />
      </main>
    </div>
  );
}
