import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { MessageCircle, Send } from 'lucide-react';
import { useAddComment } from '../lib/hooks/useData';

interface CommentFormProps {
  threadId: number;
  onCommentAdded?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ threadId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const addCommentMutation = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }
    
    try {
      await addCommentMutation.mutateAsync({ threadId, content: content.trim() });
      
      // Reset form after successful submission
      setContent('');
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <Card className="comment-form-card" style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid #e2e8f0',
      boxShadow: '0 8px 20px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      borderRadius: '16px',
      marginBottom: '24px'
    }}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4" style={{
          paddingBottom: '12px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0',
            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Add a Comment</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts and join the conversation..."
            className="min-h-[120px] resize-none"
            disabled={addCommentMutation.isPending}
            style={{
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              background: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              lineHeight: '1.6',
              transition: 'all 0.2s ease'
            }}
          />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!content.trim() || addCommentMutation.isPending}
              className="flex items-center gap-2"
              style={{
                background: addCommentMutation.isPending 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.2s ease',
                cursor: addCommentMutation.isPending ? 'not-allowed' : 'pointer'
              }}
            >
              <Send className="w-4 h-4" />
              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default CommentForm;