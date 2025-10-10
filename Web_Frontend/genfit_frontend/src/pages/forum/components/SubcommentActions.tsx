import React from 'react';
import { Button } from '../../../components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useDeleteSubcomment } from '../../../lib/hooks/useData';
import { useIsAuthenticated } from '../../../lib/hooks/useAuth';
import type { Subcomment } from '../../../lib/types/api';

interface SubcommentActionsProps {
  subcomment: Subcomment;
  onEdit?: () => void;
}

const SubcommentActions: React.FC<SubcommentActionsProps> = ({ subcomment, onEdit }) => {
  const { user } = useIsAuthenticated();
  const deleteSubcommentMutation = useDeleteSubcomment();

  // Check if current user is the owner of the subcomment
  const isOwner = user?.id === subcomment.author_id;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        await deleteSubcommentMutation.mutateAsync(subcomment.id);
      } catch (error) {
        console.error('Error deleting subcomment:', error);
      }
    }
  };

  const isLoading = deleteSubcommentMutation.isPending;

  return (
    <div className="comment-actions">
      {/* No voting section for subcomments as requested */}
      
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
    </div>
  );
};

export default SubcommentActions;