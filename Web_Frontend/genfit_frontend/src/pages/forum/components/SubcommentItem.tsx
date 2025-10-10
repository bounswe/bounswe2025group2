import React from 'react';
import { Card } from '../../../components/ui/card';
import { User } from 'lucide-react';
import type { Subcomment } from '../../../lib/types/api';

interface SubcommentItemProps {
  subcomment: Subcomment;
}

const SubcommentItem: React.FC<SubcommentItemProps> = ({ subcomment }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="ml-6 mt-2 bg-gray-50 border-l-4 border-l-gray-300">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3 h-3 text-gray-500" />
            <span className="font-medium text-gray-700">{subcomment.author_username}</span>
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(subcomment.created_at)}
          </div>
        </div>
        
        <div className="text-sm text-gray-800">
          <p>{subcomment.content}</p>
        </div>
      </div>
    </Card>
  );
};

export default SubcommentItem;