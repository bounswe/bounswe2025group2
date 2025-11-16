import React, { useState } from 'react';
import ReportPopup from './ReportPopup';
import './ReportButton.css';

interface ReportButtonProps {
  contentType: 'THREAD' | 'COMMENT' | 'SUBCOMMENT' | 'PROFILE' | 'CHAT';
  objectId: number;
  contentTitle?: string;
  className?: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({ 
  contentType, 
  objectId, 
  contentTitle, 
  className = '' 
}) => {
  const [showReportPopup, setShowReportPopup] = useState(false);

  const handleReportClick = () => {
    // Remove the login check for now to allow reporting without authentication
    setShowReportPopup(true);
  };

  return (
    <>
      <button
        className={`report-button ${className}`}
        onClick={handleReportClick}
        title="Report this content"
      >
        ⚠️ Report
      </button>

      <ReportPopup
        isOpen={showReportPopup}
        onClose={() => setShowReportPopup(false)}
        contentType={contentType}
        objectId={objectId}
        contentTitle={contentTitle}
      />
    </>
  );
};

export default ReportButton;