import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './ReportPopup.css';

interface ReportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'THREAD' | 'COMMENT' | 'SUBCOMMENT' | 'PROFILE' | 'CHAT';
  objectId: number;
  contentTitle?: string;
}

const ReportPopup: React.FC<ReportPopupProps> = ({ 
  isOpen, 
  onClose, 
  contentType, 
  objectId, 
  contentTitle 
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const reportReasons = [
    "Spam",
    "Harassment or Hate Speech",
    "Inappropriate Content",
    "False Information",
    "Copyright Violation",
    "Other"
  ];

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just show success message without actual backend call
      console.log('Report submitted:', {
        content_type: contentType,
        object_id: objectId,
        reason: reason,
        description: description
      });
      
      alert('Report submitted successfully! Our moderators will review this content.');
      onClose();
      
      // Reset form
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    setDescription('');
    onClose();
  };

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Create portal to render outside the component hierarchy
  return ReactDOM.createPortal(
    <div className="report-popup-overlay" onClick={handleCancel}>
      <div className="report-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="report-popup">
          <div className="report-popup-header">
            <div className="header-content">
              <h3>Report Content</h3>
              <p>Help us keep the community safe and respectful</p>
            </div>
            <button className="close-btn" onClick={handleCancel}>
              <span>×</span>
            </button>
          </div>
          
          <div className="report-popup-content">
            <div className="report-target">
              <span className="target-label">You're reporting:</span>
              <span className="target-content">
                {contentType === 'PROFILE' 
                  ? `Profile: ${contentTitle}` 
                  : contentType === 'CHAT'
                  ? `Chat: ${contentTitle}`
                  : contentTitle || `${contentType.toLowerCase()} #${objectId}`
                }
              </span>
            </div>
            
            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-section">
                <label className="section-label">Why are you reporting this? *</label>
                <div className="reason-options">
                  {reportReasons.map((reportReason) => (
                    <label key={reportReason} className={`reason-option ${reason === reportReason ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="reason"
                        value={reportReason}
                        checked={reason === reportReason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className="reason-input"
                      />
                      <span className="reason-text">{reportReason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label className="section-label">
                  Additional details (optional)
                  <span className="optional-text"> - Helpful for our moderators</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide any additional context or details about why you're reporting this content..."
                  rows={4}
                  className="description-textarea"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-submit"
                  disabled={!reason || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body // Render directly in body
  );
};

export default ReportPopup;