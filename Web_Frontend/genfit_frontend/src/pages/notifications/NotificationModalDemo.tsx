import React, { useState } from 'react';
import NotificationDetailModal from './NotificationDetailModal';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

// Demo component to test the notification modal functionality
const NotificationModalDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  // Sample notification data for testing
  const sampleNotifications = [
    {
      id: 1,
      notification_type: 'ACHIEVEMENT',
      title: 'Goal Achievement!',
      message: 'Congratulations! You\'ve completed your daily walking goal of 10,000 steps. Keep up the great work!',
      sender_username: 'Coach Sarah',
      recipient_username: 'trial123456',
      related_object_id: 123,
      related_object_type: 'FitnessGoal',
      is_read: false,
      is_email_sent: true,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      notification_type: 'CHALLENGE',
      title: 'New Challenge Invitation',
      message: 'You\'ve been invited to join the "30-Day Fitness Challenge"! This challenge will help you build healthy habits and achieve your fitness goals.',
      sender_username: 'Coach Mike',
      recipient_username: 'trial123456',
      related_object_id: 456,
      related_object_type: 'Challenge',
      is_read: true,
      is_email_sent: false,
      created_at: '2024-01-14T15:45:00Z'
    },
    {
      id: 3,
      notification_type: 'GOAL_INACTIVE',
      title: 'Goal Inactive Warning',
      message: 'Your "Swimming Goal" has been inactive for more than 7 days. Consider updating your progress or restarting the goal.',
      sender_username: null,
      recipient_username: 'trial123456',
      related_object_id: 789,
      related_object_type: 'FitnessGoal',
      is_read: false,
      is_email_sent: false,
      created_at: '2024-01-13T09:15:00Z'
    },
    {
      id: 4,
      notification_type: 'BADGE',
      title: 'New Badge Earned',
      message: 'You\'ve earned the "Early Bird" badge for completing morning workouts for 7 consecutive days!',
      sender_username: null,
      recipient_username: 'trial123456',
      related_object_id: null,
      related_object_type: null,
      is_read: true,
      is_email_sent: true,
      created_at: '2024-01-12T08:00:00Z'
    }
  ];

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Notification Modal Demo</h1>
      <p className="text-muted-foreground mb-8">
        Click on any notification below to see the detailed modal popup with full notification information.
      </p>

      <div className="space-y-4">
        {sampleNotifications.map((notification) => (
          <Card
            key={notification.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleNotificationClick(notification)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{notification.title}</h3>
                  <p className="text-muted-foreground mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Type: {notification.notification_type}</span>
                    <span>Status: {notification.is_read ? 'Read' : 'Unread'}</span>
                    <span>Date: {new Date(notification.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        notification={selectedNotification}
      />
    </div>
  );
};

export default NotificationModalDemo;
