import React from 'react';
import type { Notification, IconProps } from '../types';
import { HeartIcon, TagIcon, TruckIcon, SparklesIcon } from './Icon';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

const iconMap: Record<Notification['type'], React.FC<IconProps>> = {
  sale: TagIcon,
  shipping: TruckIcon,
  welcome: HeartIcon,
  new_arrival: SparklesIcon,
};

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onMarkAsRead, onMarkAllAsRead }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      <div className="flex justify-between items-center p-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={onMarkAllAsRead} className="text-xs font-medium text-[#D4AF37] hover:underline">
            Mark all as read
          </button>
        )}
      </div>
      <div className="overflow-y-auto max-h-80">
        {notifications.length > 0 ? (
          notifications.map(notification => {
            const Icon = iconMap[notification.type];
            return (
              <div
                key={notification.id}
                onClick={() => onMarkAsRead(notification.id)}
                className="flex items-start p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>}
                <div className={`flex-shrink-0 ${notification.read ? 'ml-5' : ''}`}>
                    <Icon className="w-6 h-6 text-gray-500" />
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-semibold text-gray-800">{notification.title}</p>
                  <p className="text-xs text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.timestamp)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-gray-500">You have no new notifications.</p>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-gray-100 text-center">
        <button className="text-sm font-medium text-gray-700 hover:text-[#D4AF37]">
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;