import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { User, MessageCircle, Save, X, ChevronDown, ChevronUp, Reply } from 'lucide-react';
import { useUpdateComment, useSubcomments } from '../../../lib/hooks/useData';
import CommentActions from './CommentActions';
import SubcommentItem from './SubcommentItem';
import SubcommentForm from './SubcommentForm';
import type { Comment } from '../../../lib/types/api';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showSubcomments, setShowSubcomments] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
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

  const handleReply = () => {
    setShowReplyForm(true);
  };

  const handleReplyCancel = () => {
    setShowReplyForm(false);
  };

  const handleSubcommentAdded = () => {
    setShowReplyForm(false);
    // Refresh subcomments by toggling and showing again
    setShowSubcomments(true);
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
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <CommentActions comment={comment} onEdit={handleEdit} />
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReply}
              className="vote-button reply-button"
              title="Reply to comment"
            >
              <Reply className="w-4 h-4" />
            </Button>
            
            {comment.subcomment_count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSubcomments}
                className="vote-button subcomments-button"
                title={`${showSubcomments ? 'Hide' : 'Show'} ${comment.subcomment_count} ${comment.subcomment_count === 1 ? 'reply' : 'replies'}`}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="ml-1 text-xs">{comment.subcomment_count}</span>
                {showSubcomments ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4 p-4 bg-slate-50/50 rounded-lg border border-slate-200/60">
            <SubcommentForm
              commentId={comment.id}
              onSubcommentAdded={handleSubcommentAdded}
              onCancel={handleReplyCancel}
            />
          </div>
        )}
        
        {/* Subcomments Section */}
        {showSubcomments && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {subcommentsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-500">Loading replies...</p>
                </div>
              </div>
            ) : subcommentsError ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">Error loading replies. Please try again.</p>
              </div>
            ) : subcomments && subcomments.length > 0 ? (
              <div className="space-y-3">
                {subcomments.map((subcomment) => (
                  <SubcommentItem key={subcomment.id} subcomment={subcomment} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p className="text-sm text-slate-400 italic">No replies yet. Be the first to reply!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CommentItem;