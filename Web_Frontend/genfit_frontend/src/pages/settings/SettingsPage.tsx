import { useState, useEffect } from 'react';
import { useUserSettings, useUpdateUserSettings } from '../../lib';
import { Layout } from '../../components';
import { Button } from '../../components/ui/button';
import './settings_page.css';

// Icon components
const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z" />
    <path d="M19 12L19.75 14.25L22 15L19.75 15.75L19 18L18.25 15.75L16 15L18.25 14.25L19 12Z" />
  </svg>
);

function SettingsPage() {

  const { data: settings, error: settingsError } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  
  const [dailyAdviceEnabled, setDailyAdviceEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setDailyAdviceEnabled(settings.daily_advice_enabled);
    }
  }, [settings]);

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
  };

  const handleToggleChange = (value: boolean) => {
    setDailyAdviceEnabled(value);
    setHasChanges(value !== settings?.daily_advice_enabled);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        daily_advice_enabled: dailyAdviceEnabled,
      });
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setDailyAdviceEnabled(settings.daily_advice_enabled);
      setHasChanges(false);
      setSaveSuccess(false);
    }
  };

  if (settingsError) {
    return (
      <Layout onSearch={handleSearch}>
        <div className="settings-content">
          <Button onClick={() => window.location.reload()} className="save-btn" style={{ marginTop: '1rem' }}>
            Refresh Page
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onSearch={handleSearch}>
      <div className="settings-content">
        <div className="settings-header">
          <div className="settings-title-group">
            <SettingsIcon />
            <h1>Settings</h1>
          </div>
          <p className="settings-subtitle">Manage your preferences and account settings</p>
        </div>

        {saveSuccess && (
          <div className="save-success-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Settings saved successfully!</span>
          </div>
        )}

        <div className="settings-sections">
          {/* AI Features Section */}
          <section className="settings-section">
            <div className="section-header">
              <SparklesIcon />
              <h2>AI Features</h2>
            </div>
            <p className="section-description">
              Control how AI-powered features work for you
            </p>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Daily Fitness Advice</h3>
                <p>
                  Receive personalized AI-generated daily fitness plans based on your goals, 
                  challenges, and progress. The advice is tailored to your profile and updates 
                  every day with actionable recommendations.
                </p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={dailyAdviceEnabled}
                    onChange={(e) => handleToggleChange(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">
                  {dailyAdviceEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="settings-actions">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="cancel-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="save-btn"
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default SettingsPage;

