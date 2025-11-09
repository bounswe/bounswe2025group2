import { useState } from 'react';
import { useDailyAdvice, useRegenerateDailyAdvice } from '../lib/hooks/useData';
import { Button } from './ui/button';
import './DailyAdvice.css';

// Icon components
const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z" />
    <path d="M19 12L19.75 14.25L22 15L19.75 15.75L19 18L18.25 15.75L16 15L18.25 14.25L19 12Z" />
    <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export function DailyAdvice() {
  const { data: dailyAdvice, isLoading, error } = useDailyAdvice();
  const regenerateMutation = useRegenerateDailyAdvice();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateMutation.mutateAsync();
    } catch (error) {
      console.error('Error regenerating advice:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <section className="daily-advice-section">
        <div className="daily-advice-card loading">
          <div className="advice-header">
            <div className="advice-icon">
              <SparklesIcon />
            </div>
            <h2>Your Daily Fitness Plan</h2>
          </div>
          <div className="advice-loading">
            <div className="loading-spinner"></div>
            <p>Generating your personalized plan...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="daily-advice-section">
        <div className="daily-advice-card error">
          <div className="advice-header">
            <div className="advice-icon">
              <SparklesIcon />
            </div>
            <h2>Your Daily Fitness Plan</h2>
          </div>
          <div className="advice-error">
            <p>Unable to load your daily advice. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!dailyAdvice) {
    return null;
  }

  // Check if daily advice is disabled
  if (dailyAdvice.enabled === false) {
    return (
      <section className="daily-advice-section">
        <div className="daily-advice-card disabled">
          <div className="advice-header">
            <div className="advice-title-group">
              <div className="advice-icon disabled">
                <SparklesIcon />
              </div>
              <div>
                <h2>Daily Fitness Advice</h2>
              </div>
            </div>
          </div>
          
          <div className="advice-disabled-content">
            <p className="disabled-message">
              {dailyAdvice.message || 'Daily advice is currently disabled.'}
            </p>
            <Button
              onClick={() => window.location.href = '/settings'}
              className="enable-btn"
            >
              Enable in Settings
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="daily-advice-section">
      <div className="daily-advice-card">
        <div className="advice-header">
          <div className="advice-title-group">
            <div className="advice-icon">
              <SparklesIcon />
            </div>
            <div>
              <h2>Your Daily Fitness Plan</h2>
              {dailyAdvice.date && (
                <div className="advice-date">
                  <CalendarIcon />
                  <span>{formatDate(dailyAdvice.date)}</span>
                </div>
              )}
            </div>
          </div>
          <button 
            className="refresh-btn" 
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Generate new advice"
          >
            <RefreshIcon />
            <span>{isRegenerating ? 'Generating...' : 'Refresh'}</span>
          </button>
        </div>
        
        <div className="advice-content">
          <div className="advice-text">
            {dailyAdvice.advice_text && dailyAdvice.advice_text.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
        
        <div className="advice-footer">
          <div className="advice-badge">
            <span className="badge-dot"></span>
            <span>AI-Powered Personalized Advice</span>
          </div>
        </div>
      </div>
    </section>
  );
}

