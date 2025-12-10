// components/ReportButton.tsx (Fixed with better error handling)
import { useState, useRef, useEffect } from 'react';
import { Flag, X, AlertCircle, Check } from 'lucide-react';
import './ReportButton.css';

interface ReportButtonProps {
  contentType: 'CHAT' | 'FORUM' | 'THREAD' | 'COMMENT' | 'PROFILE' | 'CHALLENGE' | 'OTHER';
  objectId: number;
  contentTitle?: string;
  className?: string;
  onReportSuccess?: () => void;
  variant?: 'icon' | 'text' | 'full';
}

export default function ReportButton({ 
  contentType, 
  objectId, 
  contentTitle, 
  className = '',
  onReportSuccess,
  variant = 'icon'
}: ReportButtonProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    reason: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const reasonOptions = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment or Bullying' },
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'privacy', label: 'Privacy Violation' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'other', label: 'Other' },
  ];

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showReportModal) {
        handleCancel();
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };

    if (showReportModal) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showReportModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const getCsrfToken = () => {
    const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
    return cookieMatch ? cookieMatch[1] : '';
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!reportData.reason) {
      setError('Please select a reason for reporting');
      return;
    }

    setIsReporting(true);
    setError('');
    setSuccess('');

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      // Ensure proper URL formatting
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/reports/`;
      
      console.log('Submitting report to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          content_type: contentType,
          object_id: objectId,
          reason: reportData.reason,
          description: reportData.description,
        }),
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Response is not JSON:', responseText);
        throw new Error('Server returned an unexpected response');
      }

      if (!response.ok) {
        console.error('Server error:', data);
        throw new Error(data.detail || data.message || data.error || `Server error: ${response.status}`);
      }

      setSuccess('Report submitted successfully! We will review it shortly.');
      
      // Reset form
      setReportData({ reason: '', description: '' });
      
      // Close modal after success
      setTimeout(() => {
        setShowReportModal(false);
        setSuccess('');
        if (onReportSuccess) {
          onReportSuccess();
        }
      }, 2000);

    } catch (error) {
      console.error('Report submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };

  const handleCancel = () => {
    if (!isReporting) {
      setShowReportModal(false);
      setReportData({ reason: '', description: '' });
      setError('');
      setSuccess('');
    }
  };

  const getContentTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      'CHAT': 'Chat',
      'FORUM': 'Forum Post',
      'THREAD': 'Forum Thread',
      'COMMENT': 'Comment',
      'PROFILE': 'Profile',
      'CHALLENGE': 'Challenge',
      'OTHER': 'Other',
    };
    return typeMap[type] || type;
  };

  // Render the button
  return (
    <>
      <button
        onClick={() => setShowReportModal(true)}
        className={`report-button ${variant} ${className}`}
        title="Report this content"
        type="button"
      >
        {variant === 'icon' ? (
          <Flag size={18} />
        ) : variant === 'text' ? (
          <>
            <Flag size={16} />
            <span>Report</span>
          </>
        ) : (
          <>
            <Flag size={16} />
            <span>Report Content</span>
          </>
        )}
      </button>

      {showReportModal && (
        <div className="report-modal-overlay">
          <div className="report-modal" ref={modalRef}>
            <div className="report-modal-header">
              <h3 className="report-modal-title">Report Content</h3>
              <button 
                onClick={handleCancel}
                className="report-modal-close"
                type="button"
                disabled={isReporting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="report-modal-content">
              <div className="report-info">
                <div className="report-info-label">Reporting:</div>
                <div className="report-info-value">{contentTitle || `${getContentTypeDisplay(contentType)} #${objectId}`}</div>
                <div className="report-info-type">Content Type: {getContentTypeDisplay(contentType)}</div>
              </div>

              <form 
                ref={formRef}
                onSubmit={handleSubmitReport} 
                className="report-form"
                noValidate
              >
                <div className="form-group">
                  <label htmlFor="reason" className="form-label">
                    Reason for Reporting *
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    value={reportData.reason}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                    disabled={isReporting}
                  >
                    <option value="">Select a reason...</option>
                    {reasonOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Additional Details
                    <span className="optional-label">(Optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={reportData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={4}
                    placeholder="Please provide additional details about why you're reporting this content..."
                    disabled={isReporting}
                  />
                  {reportData.reason === 'other' && (
                    <div className="form-hint">
                      <AlertCircle size={14} />
                      Please describe the issue in detail when selecting "Other"
                    </div>
                  )}
                </div>

                {error && (
                  <div className="form-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="form-success">
                    <Check size={16} />
                    <span>{success}</span>
                  </div>
                )}

                <div className="report-modal-actions">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={isReporting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isReporting || !reportData.reason}
                  >
                    {isReporting ? (
                      <>
                        <span className="spinner"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Flag size={16} />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>

                <div className="report-notice">
                  Your report will be reviewed by our moderation team. We take all reports seriously.
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}