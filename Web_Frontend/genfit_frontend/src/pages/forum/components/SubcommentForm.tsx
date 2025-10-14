import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Card } from '../../../components/ui/card';
import { MessageCircle, Send } from 'lucide-react';
import { useAddSubcomment } from '../../../lib/hooks/useData';

interface SubcommentFormProps {
  commentId: number;
  onSubcommentAdded?: () => void;
  onCancel?: () => void;
}

const SubcommentForm: React.FC<SubcommentFormProps> = ({ 
  commentId, 
  onSubcommentAdded, 
  onCancel 
}) => {
  const [content, setContent] = useState('');
  const addSubcommentMutation = useAddSubcomment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }
    
    try {
      await addSubcommentMutation.mutateAsync({ 
        commentId, 
        content: content.trim() 
      });
      
      // Reset form after successful submission
      setContent('');
      
      // Notify parent component
      if (onSubcommentAdded) {
        onSubcommentAdded();
      }
    } catch (error) {
      console.error('Error adding subcomment:', error);
    }
  };

  return (
    <Card className="subcomment-form-card mt-4" style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid #e2e8f0',
      boxShadow: '0 6px 16px -4px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.04)',
      borderRadius: '12px',
      transform: 'scale(0.98)',
      animation: 'subcommentFormSlideIn 0.3s ease-out forwards'
    }}>
      <div className="p-4">
        <div className="relative mb-4" style={{
          background: 'transparent',
          padding: '12px 0px',
          position: 'relative'
        }}>
          <div className="flex items-center gap-3 relative z-10">
            <div style={{
              background: 'white',
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}>
              <MessageCircle className="w-4 h-4 text-gray-600" style={{
                filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.1))'
              }} />
            </div>
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                background: 'linear-gradient(135deg, #800000 0%, #740000 20%, #8d0000 80%, #9a0000 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.3px'
              }}>Reply to Comment</h4>
              <p style={{
                fontSize: '12px',
                margin: '2px 0 0 0',
                color: '#666',
                fontWeight: '400'
              }}>Share your thoughts on this comment</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reply and join the conversation..."
            className="min-h-[90px] resize-none"
            disabled={addSubcommentMutation.isPending}
            style={{
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              background: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              lineHeight: '1.5',
              transition: 'all 0.2s ease',
              marginBottom: '12px'
            }}
          />
          
          <div className="flex justify-between items-center" style={{ marginTop: '16px' }}>
            <div className="text-xs text-slate-500">
              {content.length > 0 && (
                <span className="opacity-70 transition-opacity duration-200">{content.length} characters</span>
              )}
            </div>
            <div className="flex gap-2">
              {onCancel && (
                <Button 
                  type="button"
                  onClick={onCancel}
                  disabled={addSubcommentMutation.isPending}
                  className="flex items-center"
                  style={{
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#64748b',
                    transition: 'all 0.2s ease',
                    cursor: addSubcommentMutation.isPending ? 'not-allowed' : 'pointer',
                    minHeight: 'auto'
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={!content.trim() || addSubcommentMutation.isPending}
                className="flex items-center gap-1.5"
                style={{
                  background: addSubcommentMutation.isPending 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #800000 0%, #740000 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 3px 8px rgba(128, 0, 0, 0.25)',
                  transition: 'all 0.2s ease',
                  cursor: addSubcommentMutation.isPending ? 'not-allowed' : 'pointer'
                }}
              >
                <Send className="w-3 h-3" />
                {addSubcommentMutation.isPending ? 'Posting...' : 'Post Reply'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default SubcommentForm;