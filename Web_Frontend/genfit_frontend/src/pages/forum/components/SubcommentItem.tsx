import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { User, Save, X } from 'lucide-react';
import { useUpdateSubcomment } from '../../../lib/hooks/useData';
import SubcommentActions from './SubcommentActions';
import type { Subcomment } from '../../../lib/types/api';

interface SubcommentItemProps {
  subcomment: Subcomment;
}

const SubcommentItem: React.FC<SubcommentItemProps> = ({ subcomment }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(subcomment.content);
  const updateSubcommentMutation = useUpdateSubcomment();

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
    setEditContent(subcomment.content);
  };

  const handleSave = async () => {
    if (!editContent.trim()) {
      return;
    }

    try {
      await updateSubcommentMutation.mutateAsync({
        subcommentId: subcomment.id,
        content: editContent.trim()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating subcomment:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(subcomment.content);
  };

  return (
    <Card className="comment-card ml-8 relative">
      <div className="comment-content">
        <div className="comment-header">
          <div className="comment-author">
            <User className="w-4 h-4" />
            <span className="author-name">{subcomment.author_username}</span>
          </div>
          <div className="comment-date">
            {formatDate(subcomment.created_at)}
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
                placeholder="Edit your reply..."
                disabled={updateSubcommentMutation.isPending}
              />
              <div className="edit-actions">
                <Button
                  onClick={handleSave}
                  disabled={updateSubcommentMutation.isPending || !editContent.trim()}
                  size="sm"
                  className="save-button"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateSubcommentMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={updateSubcommentMutation.isPending}
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
            <p>{subcomment.content}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <SubcommentActions subcomment={subcomment} onEdit={handleEdit} />
          {/* No voting section for subcomments as requested */}
        </div>
      </div>
      
      {/* Visual indicator for subcomment - different color to distinguish from main comments */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-300 rounded-r-sm opacity-60"></div>
    </Card>
  );
};

export default SubcommentItem;