import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin, useRegister, useIsAuthenticated } from '../../lib';
import type { LoginCredentials, RegisterData } from '../../lib';
import { Button } from '../../components/ui/button';
import './auth_page.css';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'User' as 'User' | 'Coach'
  });
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Redirect if already authenticated
  if (authLoading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (isAuthenticated) {
    navigate('/home');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if terms are accepted for registration
    if (!isLogin && !acceptedTerms) {
      setError('You must accept the Terms and Conditions to register');
      return;
    }

    try {
      if (isLogin) {
        const credentials: LoginCredentials = {
          username: formData.username,
          password: formData.password
        };
        await loginMutation.mutateAsync(credentials);
        navigate('/home');
      } else {
        const registerData: RegisterData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          user_type: formData.user_type
        };
        await registerMutation.mutateAsync(registerData);
        navigate('/home');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Authentication failed');
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="auth-container">
      {/* Left section - Logo (2/3 of the page) */}
      <div className="auth-logo-section">
        <div className="logo-content">
          <h1 className="main-logo">GenFit</h1>
          <p className="logo-tagline">Transform Your Fitness Journey</p>
          <div className="auth-features">
            <h3>Why GenFit?</h3>
            <ul>
              <li>•  Set and track fitness goals</li>
              <li>•  Join challenges and compete</li>
              <li>•  Connect with fitness community</li>
              <li>•  Monitor your progress</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right section - Auth Form (1/3 of the page) */}
      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">
              {isLogin ? 'Welcome back!' : 'Join the fitness community'}
            </h2>
          </div>

          <div className="auth-tabs">
            <Button
              variant="ghost"
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              Login
            </Button>
            <Button
              variant="ghost"
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError('');
                setAcceptedTerms(false);
              }}
            >
              Register
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user_type">Account Type</label>
                  <select
                    id="user_type"
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  >
                    <option value="User">User</option>
                    <option value="Coach">Coach</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="terms-checkbox-group">
                <label className="terms-checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    disabled={isLoading}
                    className="terms-checkbox"
                  />
                  <span>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="terms-link"
                    >
                      Terms and Conditions
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="terms-link"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>
            )}

            <Button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
            </Button>
          </form>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <h2>Terms and Conditions</h2>
              <button
                className="terms-modal-close"
                onClick={() => setShowTermsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="terms-modal-body">
              <p className="terms-effective-date">
                <strong>Effective Date:</strong> November 24, 2025
              </p>

              <section className="terms-section">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By accessing or using GenFit ("the Platform"), you agree to be bound by these Terms
                  and Conditions. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="terms-section">
                <h3>2. Platform Purpose</h3>
                <p>
                  GenFit is a youth sports and fitness platform designed to connect young individuals
                  with local sports programs, fitness challenges, coaches, and a supportive community
                  to promote healthy and active lifestyles.
                </p>
              </section>

              <section className="terms-section">
                <h3>3. User Eligibility</h3>
                <p>
                  Users must provide accurate information during registration. For users under 18,
                  parental consent and supervision are strongly recommended. Coaches must provide
                  verification documentation to obtain coach status.
                </p>
              </section>

              <section className="terms-section">
                <h3>4. Health and Safety</h3>
                <p>
                  <strong>Important:</strong> GenFit provides fitness guidance and AI-powered suggestions,
                  but we are not a substitute for professional medical advice. Users should:
                </p>
                <ul>
                  <li>Consult healthcare professionals before starting any fitness program</li>
                  <li>Listen to their body and stop any activity that causes pain or discomfort</li>
                  <li>Follow safe and realistic fitness goals as recommended by our platform</li>
                  <li>Report any unsafe content or coaching practices immediately</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>5. User Responsibilities</h3>
                <p>Users agree to:</p>
                <ul>
                  <li>Provide accurate and truthful information</li>
                  <li>Maintain the confidentiality of their account credentials</li>
                  <li>Use the platform respectfully and not engage in bullying or harassment</li>
                  <li>Not share inappropriate content or promote harmful behaviors</li>
                  <li>Respect intellectual property rights and not copy or distribute platform content</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>6. Coach Responsibilities</h3>
                <p>Verified coaches must:</p>
                <ul>
                  <li>Provide safe, age-appropriate fitness guidance</li>
                  <li>Maintain professional boundaries with all users</li>
                  <li>Report any concerns about user safety or wellbeing</li>
                  <li>Hold valid certifications and credentials as required by local regulations</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>7. Community Guidelines</h3>
                <p>
                  GenFit is committed to maintaining a positive, supportive environment. We prohibit:
                </p>
                <ul>
                  <li>Promotion of unhealthy or dangerous fitness practices</li>
                  <li>Body shaming, bullying, or discriminatory behavior</li>
                  <li>Sharing of false or misleading health information</li>
                  <li>Commercial solicitation without platform authorization</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>8. AI-Powered Features</h3>
                <p>
                  Our platform uses AI to provide goal suggestions, daily advice, and personalized
                  recommendations. While we strive for accuracy, AI suggestions should be considered
                  as guidance only and not as professional medical advice.
                </p>
              </section>

              <section className="terms-section">
                <h3>9. Data and Privacy</h3>
                <p>
                  We collect and process user data including fitness goals, progress tracking,
                  community interactions, and profile information. We are committed to protecting
                  your privacy and will not sell your personal data to third parties.
                </p>
              </section>

              <section className="terms-section">
                <h3>10. Challenges and Competitions</h3>
                <p>
                  Participation in fitness challenges and leaderboards is voluntary. Users should
                  only participate in challenges appropriate for their fitness level and should
                  prioritize safety over competition.
                </p>
              </section>

              <section className="terms-section">
                <h3>11. Content Ownership</h3>
                <p>
                  Users retain ownership of content they post but grant GenFit a license to use,
                  display, and share such content on the platform. Users are responsible for ensuring
                  they have rights to any content they upload.
                </p>
              </section>

              <section className="terms-section">
                <h3>12. Limitation of Liability</h3>
                <p>
                  GenFit is not liable for injuries, health issues, or damages resulting from use
                  of the platform or participation in fitness activities. Users assume all risks
                  associated with physical activities.
                </p>
              </section>

              <section className="terms-section">
                <h3>13. Account Termination</h3>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these terms,
                  engage in harmful behavior, or pose risks to the community. Users may delete their
                  accounts at any time through account settings.
                </p>
              </section>

              <section className="terms-section">
                <h3>14. Changes to Terms</h3>
                <p>
                  GenFit reserves the right to update these Terms and Conditions. Users will be
                  notified of significant changes and continued use of the platform constitutes
                  acceptance of updated terms.
                </p>
              </section>

              <section className="terms-section">
                <h3>15. Contact Information</h3>
                <p>
                  For questions, concerns, or to report violations of these terms, please contact
                  our support team through the platform or visit our community forums.
                </p>
              </section>

              <p className="terms-footer">
                By checking the Terms and Conditions box, you acknowledge that you have read,
                understood, and agree to be bound by these terms.
              </p>
            </div>
            <div className="terms-modal-footer">
              <Button
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                className="terms-accept-button"
              >
                Accept Terms
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowTermsModal(false)}
                className="terms-close-button"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="terms-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <h2>Privacy Policy</h2>
              <button
                className="terms-modal-close"
                onClick={() => setShowPrivacyModal(false)}
              >
                ×
              </button>
            </div>
            <div className="terms-modal-body">
              <p className="terms-effective-date">
                <strong>Effective Date:</strong> December 15, 2025
              </p>

              <section className="terms-section">
                <h3>1. Introduction</h3>
                <p>
                  Welcome to GenFit ("the Platform"). We are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
                </p>
                <p>
                  This policy is designed to comply with the General Data Protection Regulation (GDPR) and the Law on the Protection of Personal Data (KVKK) in Turkey.
                </p>
              </section>

              <section className="terms-section">
                <h3>2. Data Controller</h3>
                <p>
                  The data controller for GenFit is the BounSwe Group 2 Team. If you have any questions about this policy, please contact us using the information provided in the "Contact Us" section.
                </p>
              </section>

              <section className="terms-section">
                <h3>3. Information We Collect</h3>
                <p>
                  We collect information that you provide directly to us, as well as information collected automatically when you use the Platform.
                </p>
                <ul>
                  <li>• Personal Information: Name, email address, username, and date of birth (for age verification).</li>
                  <li>• Health and Fitness Data: Fitness goals, workout logs, physical activity data, and body metrics (e.g., weight, height). This is considered sensitive personal data and is processed with your explicit consent.</li>
                  <li>• Usage Data: Information about how you interact with the app, features used, and time spent.</li>
                  <li>• Device Information: Device type, operating system, and unique device identifiers.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>4. How We Use Your Information</h3>
                <p>
                  We use the collected data for the following purposes:
                </p>
                <ul>
                  <li>• To provide, maintain, and improve our services, including fitness tracking and AI-powered suggestions.</li>
                  <li>• To personalize your experience and provide tailored fitness advice.</li>
                  <li>• To facilitate community features, such as forums, challenges, and leaderboards.</li>
                  <li>• To communicate with you about updates, security alerts, and support.</li>
                  <li>• To ensure the safety and security of our users, particularly minors.</li>
                  <li>• To comply with legal obligations and enforce our Terms and Conditions.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>5. Legal Basis for Processing</h3>
                <p>
                  Under GDPR and KVKK, we process your data based on:
                </p>
                <ul>
                  <li>• Consent: You have given clear consent for us to process your personal data for a specific purpose (e.g., health data).</li>
                  <li>• Contract: Processing is necessary for the performance of a contract (e.g., providing the app services).</li>
                  <li>• Legitimate Interests: Processing is necessary for our legitimate interests (e.g., security, fraud prevention) unless there is a good reason to protect your personal data which overrides those legitimate interests.</li>
                  <li>• Legal Obligation: Processing is necessary for compliance with a legal obligation.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>6. Data Sharing and Tracking</h3>
                <p>
                  We do not sell your personal data. We do not track you across third-party apps or websites, and we do not use your data for targeted advertising. We may share your information with:
                </p>
                <ul>
                  <li>• Coaches: If you choose to connect with a coach, they will have access to your fitness data to provide guidance.</li>
                  <li>• Service Providers: Third-party vendors who provide services such as cloud hosting, data analysis, and AI processing. These providers are bound by confidentiality agreements.</li>
                  <li>• Legal Authorities: If required by law or to protect the rights and safety of GenFit, our users, or others.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>7. International Data Transfers</h3>
                <p>
                  Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ. We ensure appropriate safeguards, such as Standard Contractual Clauses, are in place for such transfers.
                </p>
              </section>

              <section className="terms-section">
                <h3>8. Data Retention</h3>
                <p>
                  We will retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.
                </p>
              </section>

              <section className="terms-section">
                <h3>9. Your Rights (GDPR & KVKK)</h3>
                <p>
                  You have the following rights regarding your personal data:
                </p>
                <ul>
                  <li>• Right to Access: You have the right to request copies of your personal data.</li>
                  <li>• Right to Rectification: You have the right to request that we correct any information you believe is inaccurate.</li>
                  <li>• Right to Erasure: You have the right to request that we erase your personal data, under certain conditions.</li>
                  <li>• Right to Restrict Processing: You have the right to request that we restrict the processing of your personal data.</li>
                  <li>• Right to Object: You have the right to object to our processing of your personal data.</li>
                  <li>• Right to Data Portability: You have the right to request that we transfer the data that we have collected to another organization, or directly to you.</li>
                  <li>• Right to Withdraw Consent: You have the right to withdraw your consent at any time where GenFit relied on your consent to process your personal information.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>10. Children's Privacy</h3>
                <p>
                  GenFit is designed for youth sports, but we prioritize the safety of minors. We strongly recommend parental supervision for users under 18. We do not knowingly collect personally identifiable information from children under 13 without verifiable parental consent. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us.
                </p>
              </section>

              <section className="terms-section">
                <h3>11. Contact Us</h3>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <p>
                  Email: bounswe.2025.02@gmail.com
                </p>
              </section>

              <p className="terms-footer">
                By using GenFit, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
            <div className="terms-modal-footer">
              <Button
                variant="ghost"
                onClick={() => setShowPrivacyModal(false)}
                className="terms-close-button"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthPage;