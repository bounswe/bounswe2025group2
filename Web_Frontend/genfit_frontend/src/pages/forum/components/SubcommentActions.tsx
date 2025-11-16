import React from 'react';
import { Button } from '../../../components/ui/button';
import { Heart, HeartOff, ChevronUp, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { useVoteSubcomment, useRemoveVoteSubcomment, useSubcommentVoteStatus, useDeleteSubcomment } from '../../../lib/hooks/useData';
import { useIsAuthenticated } from '../../../lib/hooks/useAuth';
import type { Subcomment } from '../../../lib/types/api';
import ReportButton from '../../../components/ReportButton';

interface SubcommentActionsProps {
  subcomment: Subcomment;
  onEdit?: () => void;
}

const SubcommentActions: React.FC<SubcommentActionsProps> = ({ subcomment, onEdit }) => {
  // Get current user and vote status
  const { user } = useIsAuthenticated();
  const { data: voteStatus } = useSubcommentVoteStatus(subcomment.id);

  // Voting mutations
  const voteSubcommentMutation = useVoteSubcomment();
  const removeVoteMutation = useRemoveVoteSubcomment();
  const deleteSubcommentMutation = useDeleteSubcomment();

  // Check current vote state (voteStatus can be null if no vote exists)
  const hasUpvoted = voteStatus?.vote_type === 'UPVOTE';
  const hasDownvoted = voteStatus?.vote_type === 'DOWNVOTE';

  // Check if current user owns this subcomment
  const isOwner = user?.id === subcomment.author_id;

  const handleVote = async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    try {
      if ((voteType === 'UPVOTE' && hasUpvoted) || (voteType === 'DOWNVOTE' && hasDownvoted)) {
        // Remove vote if clicking the same vote type
        await removeVoteMutation.mutateAsync(subcomment.id);
      } else {
        // Add or change vote
        await voteSubcommentMutation.mutateAsync({
          subcommentId: subcomment.id,
          voteType
        });
      }
    } catch (error) {
      console.error('Error voting on subcomment:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        await deleteSubcommentMutation.mutateAsync(subcomment.id);
      } catch (error) {
        console.error('Error deleting subcomment:', error);
      }
    }
  };

  const isLoading = voteSubcommentMutation.isPending || removeVoteMutation.isPending || deleteSubcommentMutation.isPending;

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
        <span className="like-count">{subcomment.like_count}</span>

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

      {/* Edit and Delete buttons for subcomment owner */}
      {isOwner && (
        <div className="owner-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="vote-button edit-button"
            disabled={isLoading}
            title="Edit reply"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="vote-button delete-button"
            disabled={isLoading}
            title="Delete reply"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Report Button for ALL users (moved outside isOwner condition) */}
      <ReportButton
        contentType="SUBCOMMENT"
        objectId={subcomment.id}
        contentTitle={`Reply by ${subcomment.author_username}`}
      />
    </div>
  );
};

export default SubcommentActions;