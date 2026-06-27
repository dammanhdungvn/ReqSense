import './ConfidenceMeter.css';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ALL_TOPICS = [
  'Project Overview',
  'Target Users & Roles',
  'Core Features & Workflows',
  'Business Rules',
  'Non-functional Requirements',
  'Integrations',
  'Deployment & Infrastructure',
  'Compliance & Regulations',
  'Timeline & Budget',
  'Success Criteria',
];

const PHASES = [
  { label: 'Discovery', topics: ALL_TOPICS.slice(0, 4) },
  { label: 'Technical', topics: ALL_TOPICS.slice(4, 7) },
  { label: 'Compliance & Delivery', topics: ALL_TOPICS.slice(7, 10) },
];

function getColor(value) {
  if (value >= 75) return '#3fb950';
  if (value >= 40) return '#d29922';
  return '#58a6ff';
}

export default function ConfidenceMeter({ confidence, coveredTopics, currentTopic }) {
  const offset = CIRCUMFERENCE * (1 - confidence / 100);
  const color = getColor(confidence);
  const covered = new Set(coveredTopics);

  return (
    <div className="confidence-meter">
      <div className="ring-wrapper">
        <svg viewBox="0 0 100 100" width="110" height="110">
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#21262d" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
          />
          <text
            x="50"
            y="46"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize="18"
            fontWeight="700"
            fontFamily="Inter, sans-serif"
            style={{ transition: 'fill 0.4s ease' }}
          >
            {confidence}%
          </text>
          <text
            x="50"
            y="62"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#8b949e"
            fontSize="9"
            fontFamily="Inter, sans-serif"
          >
            confidence
          </text>
        </svg>

        {confidence >= 75 && (
          <div className="ready-badge">Ready</div>
        )}
      </div>

      <div className="phases-list">
        {PHASES.map((phase) => {
          const phaseCovered = phase.topics.filter(t => covered.has(t)).length;
          return (
            <div className="phase" key={phase.label}>
              <div className="phase-header">
                <span className="phase-label">{phase.label}</span>
                <span className="phase-count">{phaseCovered}/{phase.topics.length}</span>
              </div>
              <div className="topic-list">
                {phase.topics.map((topic) => {
                  const isCovered = covered.has(topic);
                  const isCurrent = topic === currentTopic && !isCovered;
                  return (
                    <div
                      key={topic}
                      className={`topic-item ${isCovered ? 'covered' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <span className="topic-dot" />
                      <span className="topic-name">{topic}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
