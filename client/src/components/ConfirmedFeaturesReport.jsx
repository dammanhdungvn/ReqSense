import { ListChecks, MessageSquareText } from 'lucide-react';
import './ConfirmedFeaturesReport.css';

const TEXT = {
  vi: {
    title: 'Tính năng đã xác nhận',
    subtitle: 'Danh sách các tính năng hệ thống đã hiểu từ cuộc trò chuyện.',
    emptyTitle: 'Chưa có tính năng nào được xác nhận',
    emptyText: 'Khi khách hàng mô tả hoặc xác nhận tính năng, danh sách này sẽ tự cập nhật.',
    count: 'tính năng',
    coverage: 'Vùng yêu cầu đã phủ',
    current: 'Đang làm rõ',
    refineHint: 'Muốn chỉnh sửa? Hãy nhắn trực tiếp cho Alex ở khung chat.',
  },
  en: {
    title: 'Confirmed Features',
    subtitle: 'Features the system has understood from the conversation.',
    emptyTitle: 'No confirmed features yet',
    emptyText: 'When the customer describes or confirms features, they will appear here.',
    count: 'features',
    coverage: 'Covered areas',
    current: 'Clarifying',
    refineHint: 'Need a change? Tell Alex in the chat panel.',
  },
};

export default function ConfirmedFeaturesReport({
  features,
  coveredTopics,
  currentTopic,
  language,
}) {
  const t = language === 'vi' ? TEXT.vi : TEXT.en;
  const list = Array.isArray(features) ? features : [];
  const topics = Array.isArray(coveredTopics) ? coveredTopics : [];

  return (
    <section className="confirmed-report">
      <div className="confirmed-header">
        <div>
          <h2 className="confirmed-title">{t.title}</h2>
          <p className="confirmed-subtitle">{t.subtitle}</p>
        </div>
        <span className="confirmed-count">{list.length} {t.count}</span>
      </div>

      {list.length > 0 ? (
        <ul className="confirmed-list">
          {list.map((feature, index) => (
            <li className="confirmed-item" key={`${feature}-${index}`}>
              <span className="confirmed-index" aria-hidden="true">{index + 1}</span>
              <span className="confirmed-text">{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="confirmed-empty">
          <div className="confirmed-empty-icon" aria-hidden="true">
            <ListChecks size={16} />
          </div>
          <div>
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyText}</p>
          </div>
        </div>
      )}

      <div className="confirmed-meta">
        <div className="confirmed-meta-item">
          <span className="confirmed-meta-label">{t.coverage}</span>
          <span className="confirmed-meta-value">{topics.length}/10</span>
        </div>
        <div className="confirmed-meta-item">
          <span className="confirmed-meta-label">{t.current}</span>
          <span className="confirmed-meta-value confirmed-topic">
            {currentTopic || 'Project Overview'}
          </span>
        </div>
      </div>

      <div className="confirmed-refine-hint">
        <MessageSquareText size={14} aria-hidden="true" />
        <span>{t.refineHint}</span>
      </div>
    </section>
  );
}
