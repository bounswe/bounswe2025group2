import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { User, MessageCircle, Save, X } from 'lucide-react';
import { useUpdateComment } from '../../../lib/hooks/useData';
import CommentActions from './CommentActions';
import type { Comment } from '../../../lib/types/api';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const updateCommentMutation = useUpdateComment();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleSave = async () => {
    if (!editContent.trim()) {
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment.id,
        content: editContent.trim()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  return (
    <Card className="comment-card">
      <div className="comment-content">
        <div className="comment-header">
          <div className="comment-author">
            <User className="w-4 h-4" />
            <span className="author-name">{comment.author_username}</span>
          </div>
          <div className="comment-date">
            {formatDate(comment.created_at)}
          </div>
        </div>
        
        <div className="comment-body">
          {isEditing ? (
            <div className="edit-mode">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="edit-textarea"
                rows={4}
                placeholder="Edit your comment..."
                disabled={updateCommentMutation.isPending}
              />
              <div className="edit-actions">
                <Button
                  onClick={handleSave}
                  disabled={updateCommentMutation.isPending || !editContent.trim()}
                  size="sm"
                  className="save-button"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={updateCommentMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="cancel-button"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p>{comment.content}</p>
          )}
        </div>
        
        <div className="comment-footer">
          <CommentActions comment={comment} onEdit={handleEdit} />
          {comment.subcomment_count > 0 && (
            <div className="comment-stats">
              <div className="stat-item">
                <MessageCircle className="w-4 h-4" />
                <span>{comment.subcomment_count} replies</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CommentItem;