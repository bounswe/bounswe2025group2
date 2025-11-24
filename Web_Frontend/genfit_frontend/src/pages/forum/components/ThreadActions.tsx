import React from 'react';
import { Button } from '../../../components/ui/button';
import { Heart, HeartOff, ChevronUp, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { useThreadVoteStatus, useVoteThread, useRemoveVoteThread, useDeleteThread } from '../../../lib/hooks/useData';
import { useIsAuthenticated } from '../../../lib/hooks/useAuth';
import type { ForumThread } from '../../../lib/types/api';
import ReportButton from '../../../components/ReportButton';

interface ThreadActionsProps {
  thread: ForumThread;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ThreadActions: React.FC<ThreadActionsProps> = ({ thread, onEdit, onDelete }) => {
  // Get current user and vote status
  const { user } = useIsAuthenticated();
  const { data: voteStatus } = useThreadVoteStatus(thread.id);

  // Voting mutations
  const voteThreadMutation = useVoteThread();
  const removeVoteMutation = useRemoveVoteThread();
  const deleteThreadMutation = useDeleteThread();
  

  // Check current vote state (voteStatus can be null if no vote exists)
  const hasUpvoted = voteStatus?.vote_type === 'UPVOTE';
  const hasDownvoted = voteStatus?.vote_type === 'DOWNVOTE';
  
  // Check if current user owns this thread
  const isOwner = user?.username === thread.author;
  

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

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this thread? This will also delete all comments and cannot be undone.')) {
      try {
        await deleteThreadMutation.mutateAsync(thread.id);
        if (onDelete) {
          onDelete();
        }
      } catch (error) {
        console.error('Error deleting thread:', error);
      }
    }
  };

  const isLoading = voteThreadMutation.isPending || removeVoteMutation.isPending || deleteThreadMutation.isPending;

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
      
      {/* Edit and Delete buttons for thread owner */}
      {isOwner && (
        <div className="owner-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="vote-button edit-button"
            disabled={isLoading}
            title="Edit thread"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="vote-button delete-button"
            disabled={isLoading}
            title="Delete thread"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      <div className="comment-actions">
        <div className="vote-buttons">
          {/* Existing vote buttons code remains the same */}
        </div>

        {/* Add Report Button */}
        <ReportButton
          contentType="THREAD"
          objectId={thread.id}
          contentTitle={thread.title}
        />
      </div>
    </div>
  );
};

export default ThreadActions;