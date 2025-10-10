import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { User, MessageCircle, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useUpdateComment, useSubcomments } from '../../../lib/hooks/useData';
import CommentActions from './CommentActions';
import SubcommentItem from './SubcommentItem';
import type { Comment } from '../../../lib/types/api';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showSubcomments, setShowSubcomments] = useState(false);
  const updateCommentMutation = useUpdateComment();
  
  // Fetch subcomments when they should be shown
  const { 
    data: subcomments, 
    isLoading: subcommentsLoading, 
    error: subcommentsError 
  } = useSubcomments(showSubcomments ? comment.id : undefined);

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

  const toggleSubcomments = () => {
    setShowSubcomments(!showSubcomments);
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
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSubcomments}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span>{comment.subcomment_count} replies</span>
              {showSubcomments ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
          )}
        </div>
        
        {/* Subcomments Section */}
        {showSubcomments && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            {subcommentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <p className="text-sm text-gray-500">Loading replies...</p>
              </div>
            ) : subcommentsError ? (
              <div className="flex items-center justify-center py-4">
                <p className="text-sm text-red-500">Error loading replies. Please try again.</p>
              </div>
            ) : subcomments && subcomments.length > 0 ? (
              <div className="space-y-2">
                {subcomments.map((subcomment) => (
                  <SubcommentItem key={subcomment.id} subcomment={subcomment} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <p className="text-sm text-gray-500">No replies yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CommentItem;