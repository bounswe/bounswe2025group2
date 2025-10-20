import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import {
  Bell,
  Calendar,
  User,
  MessageSquare,
  Tag,
  CheckCircle,
  Clock,
  Mail,
  ExternalLink,
  Trophy,
  Target,
  AlertCircle,
  Heart,
  Reply,
  Award,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';

interface NotificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (notificationId: number) => void;
  onMarkAsUnread?: (notificationId: number) => void;
  notification: {
    id: number;
    notification_type: string;
    title: string;
    message: string;
    sender_username?: string;
    recipient_username: string;
    related_object_id?: number;
    related_object_type?: string;
    is_read: boolean;
    is_email_sent: boolean;
    created_at: string;
    target_thread_id?: number;
  } | null;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAsUnread,
  notification,
}) => {
  const navigate = useNavigate();

  if (!notification) return null;

  // Check if this is a forum-related notification
  const isForumNotification = ['LIKE', 'COMMENT', 'REPLY'].includes(notification.notification_type) && 
    ['Thread', 'Comment', 'Subcomment'].includes(notification.related_object_type || '');

  // Handle navigation to forum content
  const handleGoToForum = () => {
    // Use the backend-computed target_thread_id for correct routing
    if (notification.target_thread_id) {
      navigate(`/threads/${notification.target_thread_id}`);
      onClose();
      return;
    }

    // Fallback to old logic if target_thread_id is not available
    if (!notification.related_object_id || !notification.related_object_type) return;

    const { related_object_id, related_object_type } = notification;

    if (related_object_type === 'Thread') {
      // Navigate to the thread page
      navigate(`/threads/${related_object_id}`);
    }
    
    onClose();
  };

  // Get icon and color based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ACHIEVEMENT':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'BADGE':
        return <Award className="w-6 h-6 text-purple-500" />;
      case 'CHALLENGE':
        return <Trophy className="w-6 h-6 text-blue-500" />;
      case 'PROGRESS':
        return <Target className="w-6 h-6 text-green-500" />;
      case 'GOAL':
        return <Target className="w-6 h-6 text-orange-500" />;
      case 'FEEDBACK':
        return <MessageSquare className="w-6 h-6 text-indigo-500" />;
      case 'SYSTEM':
        return <Bell className="w-6 h-6 text-gray-500" />;
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-6 h-6 text-cyan-500" />;
      case 'LIKE':
        return <Heart className="w-6 h-6 text-red-500" />;
      case 'COMMENT':
        return <MessageSquare className="w-6 h-6 text-blue-500" />;
      case 'REPLY':
        return <Reply className="w-6 h-6 text-green-500" />;
      case 'TAG':
        return <Tag className="w-6 h-6 text-pink-500" />;
      case 'GOAL_INACTIVE':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };



  // Get status text
  const getStatusText = (isRead: boolean) => {
    return isRead ? 'Read' : 'Unread';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {getNotificationIcon(notification.notification_type)}
            <span>{notification.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Section */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm leading-relaxed">{notification.message}</p>
          </div>

          {/* Information Section - Reorganized Layout */}
          <div className="space-y-3">
            {/* Top Row: Status and Date */}
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                {notification.is_read ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-orange-600" />
                )}
                <span className="text-sm font-medium">
                  Status: {getStatusText(notification.is_read)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm">
                  Date: {new Date(notification.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Sender Row - Full Width */}
            {notification.sender_username && (
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <User className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-sm font-medium">{notification.sender_username}</p>
                </div>
              </div>
            )}

            {/* Email Status Row - Full Width */}
            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
              <Mail className="w-4 h-4 text-cyan-600" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email Status</p>
                <p className="text-sm font-medium">
                  {notification.is_email_sent ? 'Email notification sent' : 'Email notification not sent'}
                </p>
              </div>
            </div>

            {/* Related Object - Full Width */}
            {notification.related_object_id && notification.related_object_type && (
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Related Object</p>
                  <p className="text-sm font-medium">
                    {notification.related_object_type} (ID: {notification.related_object_id})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {isForumNotification && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleGoToForum}
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                Go to Forum
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {notification.is_read ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  onMarkAsUnread?.(notification.id);
                  onClose();
                }}
              >
                <Clock className="w-3 h-3 mr-1" />
                Mark as Unread
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  onMarkAsRead?.(notification.id);
                  onClose();
                }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Mark as Read
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDetailModal;