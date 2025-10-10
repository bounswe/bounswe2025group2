import React from 'react';
import { Button } from './ui/button';
import { Heart, HeartOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useVoteComment, useRemoveVoteComment, useCommentVoteStatus } from '../lib/hooks/useData';
import type { Comment } from '../lib/types/api';

interface CommentActionsProps {
  comment: Comment;
}

const CommentActions: React.FC<CommentActionsProps> = ({ comment }) => {
  // Get current vote status
  const { data: voteStatus } = useCommentVoteStatus(comment.id);
  
  // Voting mutations
  const voteCommentMutation = useVoteComment();
  const removeVoteMutation = useRemoveVoteComment();
  
  // Check current vote state (voteStatus can be null if no vote exists)
  const hasUpvoted = voteStatus?.vote_type === 'UPVOTE';
  const hasDownvoted = voteStatus?.vote_type === 'DOWNVOTE';
  
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

  const isLoading = voteCommentMutation.isPending || removeVoteMutation.isPending;

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
    </div>
  );
};

export default CommentActions;