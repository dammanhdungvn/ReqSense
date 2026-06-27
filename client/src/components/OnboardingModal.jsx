import { useState } from 'react';
import './OnboardingModal.css';

const CONTENT = {
  language: {
    title: { vi: 'Chào mừng đến ReqSense', en: 'Welcome to ReqSense' },
    subtitle: { vi: 'Trợ lý phân tích yêu cầu phần mềm AI', en: 'AI-powered Software Requirements Analyst' },
    question: { vi: 'Bạn muốn trò chuyện bằng ngôn ngữ nào?', en: 'Which language would you prefer?' },
    options: [
      { value: 'vi', icon: '🇻🇳', label: 'Tiếng Việt', desc: 'Trò chuyện hoàn toàn bằng tiếng Việt' },
      { value: 'en', icon: '🇺🇸', label: 'English', desc: 'Chat fully in English' },
    ],
  },
  role: {
    vi: {
      question: 'Bạn đóng vai trò gì trong dự án này?',
      options: [
        { value: 'developer', icon: '💻', label: 'Lập trình viên / Kỹ thuật', desc: 'Developer, kỹ sư phần mềm, CTO, DevOps' },
        { value: 'pm', icon: '🎨', label: 'Product Manager / Designer', desc: 'Quản lý sản phẩm, UX/UI Designer' },
        { value: 'business', icon: '🏢', label: 'Chủ doanh nghiệp / Startup', desc: 'Founder, doanh nhân, giám đốc' },
        { value: 'nontechnical', icon: '👔', label: 'Không chuyên kỹ thuật', desc: 'Chuyên gia lĩnh vực, quản lý, stakeholder' },
      ],
    },
    en: {
      question: 'What is your role in this project?',
      options: [
        { value: 'developer', icon: '💻', label: 'Developer / Technical', desc: 'Software engineer, CTO, DevOps' },
        { value: 'pm', icon: '🎨', label: 'Product Manager / Designer', desc: 'Product Manager, UX/UI Designer' },
        { value: 'business', icon: '🏢', label: 'Business Owner / Startup', desc: 'Founder, entrepreneur, executive' },
        { value: 'nontechnical', icon: '👔', label: 'Non-technical stakeholder', desc: 'Domain expert, manager, stakeholder' },
      ],
    },
  },
  experience: {
    vi: {
      question: 'Bạn đã từng tham gia dự án phần mềm chưa?',
      options: [
        { value: 'experienced', icon: '🚀', label: 'Nhiều lần rồi', desc: 'Tôi có nhiều kinh nghiệm với dự án phần mềm' },
        { value: 'some', icon: '🔄', label: 'Một vài lần', desc: 'Tôi đã tham gia một số dự án' },
        { value: 'first', icon: '🌱', label: 'Lần đầu tiên', desc: 'Đây là lần đầu tiên tôi làm phần mềm' },
      ],
    },
    en: {
      question: 'Have you worked on software projects before?',
      options: [
        { value: 'experienced', icon: '🚀', label: 'Many times', desc: 'I have extensive software project experience' },
        { value: 'some', icon: '🔄', label: 'A few times', desc: "I've worked on a few projects" },
        { value: 'first', icon: '🌱', label: 'First time', desc: 'This is my very first software project' },
      ],
    },
  },
};

const STEPS = ['language', 'role', 'experience'];

const STEP_LABELS = {
  vi: ['Ngôn ngữ', 'Vai trò', 'Kinh nghiệm'],
  en: ['Language', 'Role', 'Experience'],
};

const START_BTN = { vi: 'Bắt đầu tư vấn →', en: 'Start consultation →' };

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ language: null, role: null, experience: null });
  const [animating, setAnimating] = useState(false);

  const lang = profile.language || 'vi';
  const currentStep = STEPS[step];

  function getStepContent() {
    if (currentStep === 'language') return CONTENT.language;
    return CONTENT[currentStep][lang];
  }

  function select(value) {
    const newProfile = { ...profile, [currentStep]: value };
    setProfile(newProfile);

    if (step < STEPS.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setAnimating(false);
      }, 220);
    }
  }

  function finish() {
    onComplete(profile);
  }

  const content = getStepContent();
  const selected = profile[currentStep];
  const isLast = step === STEPS.length - 1;
  const labels = STEP_LABELS[lang];

  return (
    <div className="ob-overlay">
      <div className="ob-card">
        {/* Header */}
        <div className="ob-header">
          <div className="ob-logo">
            <div className="ob-logo-mark">RS</div>
            <span className="ob-logo-text">ReqSense</span>
          </div>
          {step === 0 && (
            <p className="ob-tagline">{CONTENT.language.subtitle[lang]}</p>
          )}
        </div>

        {/* Progress */}
        <div className="ob-progress">
          {STEPS.map((s, i) => (
            <div key={s} className="ob-progress-item">
              <div className={`ob-progress-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {lang && <span className="ob-progress-label">{labels[i]}</span>}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className={`ob-body ${animating ? 'ob-exit' : 'ob-enter'}`}>
          <h2 className="ob-question">
            {currentStep === 'language'
              ? CONTENT.language.question[lang]
              : content.question}
          </h2>

          <div className={`ob-options ${currentStep === 'language' ? 'ob-options-2col' : ''}`}>
            {content.options.map((opt) => (
              <button
                key={opt.value}
                className={`ob-option ${profile[currentStep] === opt.value ? 'ob-option-selected' : ''}`}
                onClick={() => select(opt.value)}
              >
                <span className="ob-option-icon">{opt.icon}</span>
                <div className="ob-option-text">
                  <span className="ob-option-label">{opt.label}</span>
                  <span className="ob-option-desc">{opt.desc}</span>
                </div>
                <span className="ob-option-check">✓</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start button — only on last step after selection */}
        {isLast && selected && (
          <div className="ob-footer">
            <button className="ob-start-btn" onClick={finish}>
              {START_BTN[lang]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
