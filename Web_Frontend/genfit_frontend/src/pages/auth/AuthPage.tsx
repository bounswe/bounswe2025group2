import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin, useRegister, useIsAuthenticated } from '../../lib';
import type { LoginCredentials, RegisterData } from '../../lib';
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
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
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

            <button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;