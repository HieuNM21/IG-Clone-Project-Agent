import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../context/WebSocketContext';
import { FiCheck, FiHeart } from 'react-icons/fi';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return date.toLocaleDateString();
};

const notifText = (type) => {
  switch (type) {
    case 'LIKE': return 'liked your post.';
    case 'COMMENT': return 'commented on your post.';
    case 'FOLLOW': return 'started following you.';
    default: return 'interacted with you.';
  }
};

const groupNotifications = (notifications) => {
  const now = new Date();
  const dayMs = 86400000;
  const weekMs = dayMs * 7;
  const groups = { new: [], thisWeek: [], earlier: [] };

  notifications.forEach((n) => {
    const created = n.createdAt ? new Date(n.createdAt) : new Date();
    const diff = now - created;
    if (diff < dayMs) groups.new.push(n);
    else if (diff < weekMs) groups.thisWeek.push(n);
    else groups.earlier.push(n);
  });
  return groups;
};

const NotificationDrawer = ({ isOpen, onClose }) => {
  const { notifications, markNotificationsRead, markOneNotificationRead } = useWebSocket();
  const navigate = useNavigate();
  const grouped = groupNotifications(notifications);

  const handleClick = (n) => {
    if (!n.isRead) markOneNotificationRead(n.id);
    onClose();
    if (n.type === 'FOLLOW') navigate(`/profile/${n.actorUsername}`);
    else if (n.targetId) navigate(`/post/${n.targetId}`);
  };

  const renderItem = (n, i) => (
    <button
      key={n.id || i}
      onClick={() => handleClick(n)}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-smooth text-left ${
        !n.isRead ? 'bg-ig-primary/5' : ''
      }`}
    >
      <div className="w-11 h-11 rounded-full bg-ig-card flex items-center justify-center overflow-hidden flex-shrink-0">
        {n.actorAvatarUrl ? (
          <img src={n.actorAvatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold">{n.actorUsername?.[0]?.toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-tight">
          <span className="font-semibold">{n.actorUsername}</span>{' '}
          <span className="text-ig-text-secondary">{notifText(n.type)}</span>{' '}
          <span className="text-ig-text-secondary text-xs">{timeAgo(n.createdAt)}</span>
        </p>
      </div>
      {!n.isRead && <span className="w-2 h-2 rounded-full bg-ig-primary flex-shrink-0"></span>}
    </button>
  );

  const renderSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div>
        <h4 className="px-4 pt-4 pb-2 text-sm font-semibold">{title}</h4>
        {items.map(renderItem)}
      </div>
    );
  };

  return (
    <div className={`notification-drawer ${isOpen ? 'open' : ''}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-ig-border/50">
          <h2 className="text-[22px] font-bold">Notifications</h2>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={markNotificationsRead}
              className="text-ig-primary text-xs font-semibold flex items-center gap-1 hover:text-ig-primary-dark transition-smooth"
            >
              <FiCheck /> Mark all read
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ig-text-secondary">
              <FiHeart className="text-4xl mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <>
              {renderSection('New', grouped.new)}
              {renderSection('This Week', grouped.thisWeek)}
              {renderSection('Earlier', grouped.earlier)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
