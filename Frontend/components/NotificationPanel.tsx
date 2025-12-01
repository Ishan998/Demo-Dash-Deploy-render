import React from 'react';
import { Notification, NotificationType } from '../types';
import { ICONS } from '../constants';

const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    if (Math.floor(seconds) < 5) return "just now";
    return Math.floor(seconds) + " seconds ago";
};

const getNotificationIcon = (type: NotificationType): React.ReactNode => {
    switch (type) {
        case NotificationType.NewOrder:
        case NotificationType.NewProductAdded:
        case NotificationType.WelcomeMessage:
        case NotificationType.OrderStatusUpdate:
            return ICONS.success;
        case NotificationType.ProductLowStock:
        case NotificationType.DiscountTimeout:
        case NotificationType.BannerTimeout:
            return ICONS.warning;
        case NotificationType.ProductOutOfStock:
        case NotificationType.OrderDeclined:
        case NotificationType.ProductRemoved:
        case NotificationType.PasswordReset:
            return ICONS.error;
        default:
            return ICONS.info;
    }
};

interface NotificationPanelProps {
    notifications: Notification[];
    onMarkAllRead: () => void;
    onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onMarkAllRead, onClose }) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-card rounded-lg shadow-xl z-50 ring-1 ring-black ring-opacity-5">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Notifications</h3>
                {unreadCount > 0 && (
                    <button onClick={onMarkAllRead} className="text-sm text-primary font-semibold hover:underline">
                        Mark all as read
                    </button>
                )}
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">No notifications yet.</p>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className={`p-4 flex items-start border-b hover:bg-background ${!notif.isRead ? 'bg-blue-50' : ''}`}>
                            <div className="flex-shrink-0">{getNotificationIcon(notif.type)}</div>
                            <div className="ml-3 w-0 flex-1">
                                <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                                <p className="mt-1 text-sm text-text-secondary">{notif.message}</p>
                                <p className="mt-1 text-xs text-gray-500">{timeSince(notif.timestamp)}</p>
                            </div>
                            {!notif.isRead && (
                                <div className="ml-2 flex-shrink-0 self-center">
                                    <span className="w-2.5 h-2.5 bg-primary rounded-full block"></span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
export default NotificationPanel;