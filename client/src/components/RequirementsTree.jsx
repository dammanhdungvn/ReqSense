import { useState, useEffect } from 'react';
import './RequirementsTree.css';

const TREE = [
  {
    id: 'Project Overview',
    icon: '🎯',
    vi: 'Tổng quan dự án',
    sub: [
      { id: 'vision',    vi: 'Tầm nhìn sản phẩm',       en: 'Product Vision' },
      { id: 'problem',   vi: 'Vấn đề cần giải quyết',    en: 'Problem Statement' },
      { id: 'goals',     vi: 'Mục tiêu & Kết quả',       en: 'Goals & Objectives' },
      { id: 'scope',     vi: 'Phạm vi (Trong / Ngoài)',  en: 'Scope (In / Out)' },
    ],
  },
  {
    id: 'Target Users & Roles',
    icon: '👥',
    vi: 'Đối tượng sử dụng',
    sub: [
      { id: 'personas',     vi: 'Persona người dùng',         en: 'User Personas' },
      { id: 'roles',        vi: 'Vai trò & Quyền hạn',        en: 'Roles & Permissions' },
      { id: 'stakeholders', vi: 'Stakeholders',                en: 'Stakeholders' },
    ],
  },
  {
    id: 'Core Features & Workflows',
    icon: '⚙️',
    vi: 'Tính năng & Luồng chính',
    sub: [
      { id: 'features',   vi: 'Danh sách tính năng',     en: 'Feature List' },
      { id: 'workflows',  vi: 'Luồng xử lý chính',       en: 'Key Workflows' },
      { id: 'stories',    vi: 'User Stories',             en: 'User Stories' },
    ],
  },
  {
    id: 'Business Rules',
    icon: '📋',
    vi: 'Quy tắc nghiệp vụ',
    sub: [
      { id: 'logic',       vi: 'Logic nghiệp vụ cốt lõi', en: 'Core Logic' },
      { id: 'validation',  vi: 'Quy tắc kiểm tra dữ liệu', en: 'Validation Rules' },
      { id: 'constraints', vi: 'Ràng buộc luồng xử lý',   en: 'Workflow Constraints' },
    ],
  },
  {
    id: 'Non-functional Requirements',
    icon: '🔧',
    vi: 'Yêu cầu phi chức năng',
    sub: [
      { id: 'perf',      vi: 'Hiệu năng',          en: 'Performance' },
      { id: 'security',  vi: 'Bảo mật',            en: 'Security' },
      { id: 'reliab',    vi: 'Độ tin cậy',         en: 'Reliability' },
      { id: 'scale',     vi: 'Khả năng mở rộng',   en: 'Scalability' },
      { id: 'usab',      vi: 'Khả năng sử dụng',   en: 'Usability' },
    ],
  },
  {
    id: 'Integrations',
    icon: '🔌',
    vi: 'Tích hợp bên ngoài',
    sub: [
      { id: 'third',    vi: 'Dịch vụ bên thứ ba',  en: 'Third-party Services' },
      { id: 'api',      vi: 'API bên ngoài',        en: 'External APIs' },
      { id: 'internal', vi: 'Hệ thống nội bộ',      en: 'Internal Systems' },
    ],
  },
  {
    id: 'Deployment & Infrastructure',
    icon: '🚀',
    vi: 'Triển khai & Hạ tầng',
    sub: [
      { id: 'hosting',  vi: 'Hosting & Cloud',   en: 'Hosting & Cloud' },
      { id: 'arch',     vi: 'Kiến trúc hệ thống', en: 'Architecture' },
      { id: 'cicd',     vi: 'CI/CD & DevOps',     en: 'CI/CD & DevOps' },
      { id: 'monitor',  vi: 'Giám sát & Logs',    en: 'Monitoring & Logging' },
    ],
  },
  {
    id: 'Compliance & Regulations',
    icon: '⚖️',
    vi: 'Tuân thủ & Pháp lý',
    sub: [
      { id: 'privacy',  vi: 'Bảo mật dữ liệu (PDPA/GDPR)', en: 'Data Privacy' },
      { id: 'industry', vi: 'Quy định ngành',                en: 'Industry Regulations' },
      { id: 'legal',    vi: 'Pháp lý & Hợp đồng',           en: 'Legal & Contractual' },
    ],
  },
  {
    id: 'Timeline & Budget',
    icon: '📅',
    vi: 'Timeline & Ngân sách',
    sub: [
      { id: 'phases',  vi: 'Các giai đoạn dự án', en: 'Project Phases' },
      { id: 'budget',  vi: 'Ngân sách',            en: 'Budget' },
      { id: 'team',    vi: 'Nhân sự & Nguồn lực', en: 'Team & Resources' },
    ],
  },
  {
    id: 'Success Criteria',
    icon: '🏆',
    vi: 'Tiêu chí thành công',
    sub: [
      { id: 'kpi',     vi: 'KPI nghiệp vụ',             en: 'Business KPIs' },
      { id: 'metrics', vi: 'Chỉ số kỹ thuật',            en: 'Technical Metrics' },
      { id: 'uac',     vi: 'Tiêu chí nghiệm thu',        en: 'User Acceptance Criteria' },
      { id: 'dod',     vi: 'Định nghĩa "Hoàn thành"',   en: 'Definition of Done' },
    ],
  },
];

function TreeNode({ node, index, isCovered, isActive, language, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const lang = language === 'vi' ? 'vi' : 'en';
  const label = lang === 'vi' ? node.vi : node.id;

  useEffect(() => {
    if (isCovered || isActive) {
      const t = setTimeout(() => setExpanded(true), isNew ? 300 : 0);
      return () => clearTimeout(t);
    }
  }, [isCovered, isActive]);

  const status = isActive ? 'active' : isCovered ? 'covered' : 'pending';

  return (
    <div className={`rt-node rt-node-${status} ${isNew ? 'rt-node-new' : ''}`}>
      <button className="rt-node-header" onClick={() => setExpanded(e => !e)}>
        <div className="rt-node-left">
          <span className="rt-node-num">{index + 1}</span>
          <span className="rt-status-dot">
            {isActive  && <span className="rt-dot rt-dot-active" />}
            {isCovered && !isActive && <span className="rt-dot rt-dot-covered">✓</span>}
            {!isCovered && !isActive && <span className="rt-dot rt-dot-pending" />}
          </span>
          <span className="rt-node-icon">{node.icon}</span>
          <span className="rt-node-label">{label}</span>
        </div>
        <div className="rt-node-right">
          {isActive && <span className="rt-badge-active">{lang === 'vi' ? 'Đang hỏi' : 'In progress'}</span>}
          {isCovered && !isActive && <span className="rt-badge-done">{lang === 'vi' ? 'Hoàn thành' : 'Covered'}</span>}
          <span className="rt-chevron">{expanded ? '▾' : '▸'}</span>
        </div>
      </button>

      {expanded && (
        <div className="rt-subnodes">
          {node.sub.map((sub) => (
            <div
              key={sub.id}
              className={`rt-subnode ${isCovered ? 'rt-subnode-covered' : isActive ? 'rt-subnode-active' : 'rt-subnode-pending'}`}
            >
              <span className="rt-sub-icon">
                {isCovered ? '✓' : isActive ? '…' : '○'}
              </span>
              <span className="rt-sub-label">{sub[lang]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RequirementsTree({ coveredTopics, currentTopic, language }) {
  const [prevCovered, setPrevCovered] = useState([]);
  const [newTopics, setNewTopics] = useState(new Set());
  const lang = language === 'vi' ? 'vi' : 'en';

  useEffect(() => {
    const added = coveredTopics.filter(t => !prevCovered.includes(t));
    if (added.length > 0) {
      setNewTopics(new Set(added));
      const t = setTimeout(() => setNewTopics(new Set()), 2000);
      setPrevCovered([...coveredTopics]);
      return () => clearTimeout(t);
    }
  }, [coveredTopics]);

  const covered = coveredTopics.length;
  const total = TREE.length;
  const pct = Math.round((covered / total) * 100);

  return (
    <div className="req-tree">
      <div className="rt-header">
        <div className="rt-header-top">
          <span className="rt-title">{lang === 'vi' ? 'Cây yêu cầu' : 'Requirements Tree'}</span>
          <span className="rt-progress-label">{covered}/{total} {lang === 'vi' ? 'vùng' : 'areas'}</span>
        </div>
        <div className="rt-progress-track">
          <div
            className="rt-progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="rt-hint">
          {lang === 'vi'
            ? 'Bấm vào từng nhánh để xem chi tiết'
            : 'Click any branch to expand details'}
        </p>
      </div>

      <div className="rt-body">
        {TREE.map((node, i) => (
          <TreeNode
            key={node.id}
            node={node}
            index={i}
            isCovered={coveredTopics.includes(node.id)}
            isActive={currentTopic === node.id}
            isNew={newTopics.has(node.id)}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}
