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
    <div className="relative ml-8 mt-3 p-3 bg-white border border-slate-200/60 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{subcomment.author_username}</span>
            <span className="text-xs text-slate-500">{formatDate(subcomment.created_at)}</span>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-slate-800 leading-relaxed ml-8">
        <p>{subcomment.content}</p>
      </div>
      
      {/* Subtle visual indicator for subcomment */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-200 rounded-full"></div>
    </div>
  );
};

export default SubcommentItem;