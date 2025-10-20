import React from 'react';
import { Button } from '../../../components/ui/button';
import { Heart, HeartOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useThreadVoteStatus, useVoteThread, useRemoveVoteThread } from '../../../lib/hooks/useData';
import type { ForumThread } from '../../../lib/types/api';

interface ThreadActionsProps {
  thread: ForumThread;
}

const ThreadActions: React.FC<ThreadActionsProps> = ({ thread }) => {
  // Get current vote status
  const { data: voteStatus } = useThreadVoteStatus(thread.id);
  
  // Voting mutations
  const voteThreadMutation = useVoteThread();
  const removeVoteMutation = useRemoveVoteThread();
  
  // Check current vote state (voteStatus can be null if no vote exists)
  const hasUpvoted = voteStatus?.vote_type === 'UPVOTE';
  const hasDownvoted = voteStatus?.vote_type === 'DOWNVOTE';
  
  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    try {
      if ((voteType === 'UPVOTE' && hasUpvoted) || (voteType === 'DOWNVOTE' && hasDownvoted)) {
        // Remove vote if clicking the same vote type
        await removeVoteMutation.mutateAsync(thread.id);
      } else {
        // Add or change vote
        await voteThreadMutation.mutateAsync({
          threadId: thread.id,
          voteType
        });
      }
    } catch (error) {
      console.error('Error voting on thread:', error);
    }
  };

  const isLoading = voteThreadMutation.isPending || removeVoteMutation.isPending;

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
        <span className="like-count">{thread.like_count}</span>
        
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

export default ThreadActions;