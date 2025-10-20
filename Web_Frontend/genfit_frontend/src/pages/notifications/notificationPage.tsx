import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useNotifications, invalidateQueries } from '../../lib';
import { Layout } from '../../components';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import GFapi from '../../lib/api/GFapi';
import NotificationDetailModal from './NotificationDetailModal';
//import type { Notification } from '../../lib/types/api';

import {
  Bell,
  BellOff,
  CheckCircle,
  CheckCircle2,
  Trash2,
  Clock,
  Eye,
} from 'lucide-react';
import './notifications_page.css';

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Notification tab options for filtering
const NOTIFICATION_TAB_OPTIONS = [
  { key: 'ALL', label: 'All Notifications' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'READ', label: 'Read' }
];

const NotificationsPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const navigate = useNavigate();
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    error: notificationsError
  } = useNotifications();

  const [activeNotificationTab, setActiveNotificationTab] = useState('ALL');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (authLoading) {
    return <div className="notifications-page-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await GFapi.patch(`/api/notifications/${notificationId}/read/`); // Changed endpoint
      await invalidateQueries(['/api/notifications/']);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      alert('Failed to mark notification as read. Please try again.');
    }
  };

  const handleMarkAsUnread = async (notificationId: number) => {
    try {
      await GFapi.patch(`/api/notifications/${notificationId}/unread/`);
      await invalidateQueries(['/api/notifications/']);
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
      alert('Failed to mark notification as unread. Please try again.');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadNotifications.length === 0) return;

    setIsMarkingAll(true);
    try {
      await GFapi.patch('/api/notifications/read-all/'); // Changed endpoint
      await invalidateQueries(['/api/notifications/']);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      alert('Failed to mark all notifications as read. Please try again.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await GFapi.delete(`/api/notifications/${notificationId}/delete/`); // Updated endpoint
      await invalidateQueries(['/api/notifications/']);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      alert('Failed to delete notification. Please try again.');
    }
  };

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    
    // Mark as read if not already read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeNotificationTab) {
      case 'UNREAD':
        return notifications.filter(notification => !notification.is_read);
      case 'READ':
        return notifications.filter(notification => notification.is_read);
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadNotifications = notifications.filter(notification => !notification.is_read);
  const readNotifications = notifications.filter(notification => notification.is_read);

  // Calculate statistics
  const totalNotifications = notifications.length;
  const unreadCount = unreadNotifications.length;
  const readCount = readNotifications.length;

  return (
    <Layout>
      <div className="notifications-page-content">
        <div className="section-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="page-title">Notifications</h1>
              <p className="page-subtitle">Stay updated with your fitness journey</p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                className="mark-all-read-btn"
                variant="positive"
                disabled={isMarkingAll}
                size="xl"
              >
                {isMarkingAll ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Marking All...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mark All as Read
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="stats-grid">
          <Card className="stat-card">
            <CardHeader className="stat-card-header">
              <Bell className="stat-icon w-6 h-6 mr-4" />
              <CardTitle className="stat-title">Total Notifications</CardTitle>
            </CardHeader>
            <CardContent className="stat-content">
              <div className="stat-value">{totalNotifications}</div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="stat-card-header">
              <BellOff className="stat-icon w-6 h-6 mr-4" />
              <CardTitle className="stat-title">Unread</CardTitle>
            </CardHeader>
            <CardContent className="stat-content">
              <div className={`stat-value ${unreadCount > 0 ? 'text-warning' : ''}`}>
                {unreadCount}
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="stat-card-header">
              <CheckCircle className="stat-icon w-6 h-6 mr-4" />
              <CardTitle className="stat-title">Read</CardTitle>
            </CardHeader>
            <CardContent className="stat-content">
              <div className="stat-value">{readCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Status Tabs */}
        {notifications.length > 0 && (
          <div className="notification-tabs">
            {NOTIFICATION_TAB_OPTIONS.map(tab => {
              let count = 0;
              switch (tab.key) {
                case 'ALL':
                  count = notifications.length;
                  break;
                case 'UNREAD':
                  count = unreadCount;
                  break;
                case 'READ':
                  count = readCount;
                  break;
              }

              return (
                <button
                  key={tab.key}
                  className={`notification-tab ${activeNotificationTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveNotificationTab(tab.key)}
                >
                  {tab.label}
                  <span className="notification-count">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {notificationsLoading && (
          <div className="notifications-page-loading">Loading notifications...</div>
        )}

        {notificationsError && (
          <div className="notifications-page-error">
            Failed to load notifications. Please try again later.
          </div>
        )}

        {notifications.length === 0 && !notificationsLoading ? (
          <div className="empty-state">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground mb-4">
              You're all caught up! Notifications will appear here when you have new updates.
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <BellOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {activeNotificationTab === 'UNREAD' ? 'No unread notifications' : 'No read notifications'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeNotificationTab === 'UNREAD'
                ? 'You have no unread notifications. Great job staying updated!'
                : 'You have no read notifications yet.'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <Card
                key={notification.id}
                className={`notification-card ${!notification.is_read ? 'unread' : ''} cursor-pointer`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="notification-card-content">
                  <div className="notification-message-section">
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-date">
                      {formatDate(notification.created_at)}
                    </div>
                  </div>

                  <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
                    {!notification.is_read ? (
                      <Button
                        variant="positive"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="mark-read-btn"
                      >
                        <Eye className="w-4 h-4" />
                        Mark as Read
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsUnread(notification.id)}
                        className="mark-unread-btn"
                      >
                        <Clock className="w-4 h-4" />
                        Mark as Unread
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Notification Detail Modal */}
        <NotificationDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          notification={selectedNotification}
        />
      </div>
    </Layout>
  );
};

export default NotificationsPage;
