import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useLogout } from '../../lib';
import './home_page.css';

function HomePage() {
  const { isAuthenticated, isLoading, user } = useIsAuthenticated();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  if (isLoading) {
    return <div className="home-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const mockStats = {
    activeGoals: 3,
    completedChallenges: 7,
    daysActive: 15,
    communityRank: 42
  };

  const mockGoals = [
    { id: 1, title: 'Run 5K daily', progress: 75, target: '5 km', current: '3.75 km' },
    { id: 2, title: 'Lose 10 pounds', progress: 40, target: '10 lbs', current: '4 lbs' },
    { id: 3, title: 'Drink 8 glasses of water', progress: 90, target: '8 glasses', current: '7.2 glasses' }
  ];

  const mockChallenges = [
    { id: 1, title: '30-Day Push-up Challenge', participants: 156, daysLeft: 12 },
    { id: 2, title: 'Weekly Step Counter', participants: 89, daysLeft: 3 },
    { id: 3, title: 'Healthy Eating Challenge', participants: 234, daysLeft: 8 }
  ];

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome back, {user?.username}!</h1>
            <p>Ready to continue your fitness journey?</p>
          </div>
          <button 
            onClick={handleLogout}
            className="logout-btn"
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      <main className="home-main">
        {/* Quick Stats */}
        <section className="stats-section">
          <h2>Your Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{mockStats.activeGoals}</div>
              <div className="stat-label">Active Goals</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{mockStats.completedChallenges}</div>
              <div className="stat-label">Completed Challenges</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{mockStats.daysActive}</div>
              <div className="stat-label">Days Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">#{mockStats.communityRank}</div>
              <div className="stat-label">Community Rank</div>
            </div>
          </div>
        </section>

        {/* Current Goals */}
        <section className="goals-section">
          <div className="section-header">
            <h2>Current Goals</h2>
            <button className="action-btn">View All</button>
          </div>
          <div className="goals-grid">
            {mockGoals.map(goal => (
              <div key={goal.id} className="goal-card">
                <h3>{goal.title}</h3>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {goal.current} / {goal.target} ({goal.progress}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Challenges */}
        <section className="challenges-section">
          <div className="section-header">
            <h2>Active Challenges</h2>
            <button className="action-btn">Browse All</button>
          </div>
          <div className="challenges-grid">
            {mockChallenges.map(challenge => (
              <div key={challenge.id} className="challenge-card">
                <h3>{challenge.title}</h3>
                <div className="challenge-info">
                  <span className="participants">👥 {challenge.participants} participants</span>
                  <span className="days-left">⏰ {challenge.daysLeft} days left</span>
                </div>
                <button className="join-btn">Join Challenge</button>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card">
              <div className="action-icon">🎯</div>
              <div className="action-text">Set New Goal</div>
            </button>
            <button className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-text">View Progress</div>
            </button>
            <button className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-text">Find Friends</div>
            </button>
            <button className="action-card">
              <div className="action-icon">🏆</div>
              <div className="action-text">Join Challenge</div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;