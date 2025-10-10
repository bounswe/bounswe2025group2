import React from 'react';
import { Button } from '../../../components/ui/button';
import { Heart, HeartOff, ChevronUp, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { useVoteComment, useRemoveVoteComment, useCommentVoteStatus, useDeleteComment } from '../../../lib/hooks/useData';
import { useIsAuthenticated } from '../../../lib/hooks/useAuth';
import type { Comment } from '../../../lib/types/api';

interface CommentActionsProps {
  comment: Comment;
  onEdit?: () => void;
}

const CommentActions: React.FC<CommentActionsProps> = ({ comment, onEdit }) => {
  // Get current user and vote status
  const { user } = useIsAuthenticated();
  const { data: voteStatus } = useCommentVoteStatus(comment.id);
  
  // Voting mutations
  const voteCommentMutation = useVoteComment();
  const removeVoteMutation = useRemoveVoteComment();
  const deleteCommentMutation = useDeleteComment();
  
  // Check current vote state (voteStatus can be null if no vote exists)
  const hasUpvoted = voteStatus?.vote_type === 'UPVOTE';
  const hasDownvoted = voteStatus?.vote_type === 'DOWNVOTE';
  
  // Check if current user owns this comment
  const isOwner = user?.id === comment.author_id;
  
  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    try {
      if ((voteType === 'UPVOTE' && hasUpvoted) || (voteType === 'DOWNVOTE' && hasDownvoted)) {
        // Remove vote if clicking the same vote type
        await removeVoteMutation.mutateAsync(comment.id);
      } else {
        // Add or change vote
        await voteCommentMutation.mutateAsync({
          commentId: comment.id,
          voteType
        });
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteCommentMutation.mutateAsync(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const isLoading = voteCommentMutation.isPending || removeVoteMutation.isPending || deleteCommentMutation.isPending;

  return (
    <div className="comment-actions">
      <div className="vote-buttons">
        {/* Upvote Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('UPVOTE')}
          className={`vote-button upvote-button ${hasUpvoted ? 'voted' : ''}`}
          disabled={isLoading}
        >
          {hasUpvoted ? (
            <Heart className="w-4 h-4 fill-current text-red-500" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </Button>
        
        {/* Like Count */}
        <span className="like-count">{comment.like_count}</span>
        
        {/* Downvote Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('DOWNVOTE')}
          className={`vote-button downvote-button ${hasDownvoted ? 'voted' : ''}`}
          disabled={isLoading}
        >
          {hasDownvoted ? (
            <HeartOff className="w-4 h-4 fill-current text-blue-500" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {/* Edit and Delete buttons for comment owner */}
      {isOwner && (
        <div className="owner-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="vote-button edit-button"
            disabled={isLoading}
            title="Edit comment"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="vote-button delete-button"
            disabled={isLoading}
            title="Delete comment"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommentActions;