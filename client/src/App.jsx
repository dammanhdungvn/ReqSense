import { useState, useEffect } from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';
import OnboardingModal from './components/OnboardingModal';

const PROFILE_KEY = 'reqsense_profile';
const THEME_KEY   = 'reqsense_theme';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [ready, setReady]     = useState(false);
  const [theme, setTheme]     = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) ?? 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch (_) {}
    }
    setReady(true);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  function handleOnboardingComplete(p) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
  }

  function resetProfile() {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }

  if (!ready) return null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-mark">RS</div>
          <span className="logo-text">ReqSense</span>
        </div>
        <div className="header-divider" />
        <span className="header-tagline">AI-powered Requirements Analyst</span>

        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {profile && (
            <button className="header-profile-btn" onClick={resetProfile} title="Change profile">
              {profile.language === 'vi' ? '🇻🇳' : '🇺🇸'}
              <span>{getRoleLabel(profile.role, profile.language)}</span>
            </button>
          )}
        </div>
      </header>

      <main className="app-body">
        {profile ? <ChatWindow userProfile={profile} /> : null}
      </main>

      {!profile && ready && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}

function getRoleLabel(role, lang) {
  const labels = {
    vi: { developer: 'Lập trình viên', pm: 'Product Manager', business: 'Doanh nghiệp', nontechnical: 'Không kỹ thuật' },
    en: { developer: 'Developer', pm: 'Product Manager', business: 'Business Owner', nontechnical: 'Non-technical' },
  };
  return labels[lang]?.[role] ?? role;
}
