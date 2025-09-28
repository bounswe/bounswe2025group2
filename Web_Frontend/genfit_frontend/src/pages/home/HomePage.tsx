import { useNavigate } from 'react-router-dom';
import {useIsAuthenticated, useGoals, useChallenges, useForumThreads, useUserStats, useDailyQuote} from '../../lib';
import { Layout } from '../../components';
import './home_page.css';

function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const navigate = useNavigate();

  // Data hooks
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useGoals();
  const { data: challenges = [], isLoading: challengesLoading, error: challengesError } = useChallenges();
  const { data: threads = [], isLoading: threadsLoading, error: threadsError } = useForumThreads();
    const { data: dailyQuote, error: quoteError } = useDailyQuote();
  const stats = useUserStats();

  // Redirect to auth if not authenticated
  if (authLoading) {
    return <div className="home-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search functionality here
  };

  // Calculate progress for goals
  const goalsWithProgress = goals.map(goal => ({
    ...goal,
    progress: Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100))
  }));

  // Calculate days left for challenges
  const challengesWithDaysLeft = challenges.map(challenge => ({
    ...challenge,
    daysLeft: Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
    participants: challenge.participants?.length || 0
  }));

  // Show loading state
  const isLoading = goalsLoading || challengesLoading || threadsLoading;
  if (isLoading) {
    return (
      <Layout onSearch={handleSearch}>
        <div className="home-content">
          <div className="home-loading">Loading your dashboard...</div>
        </div>
      </Layout>
    );
  }

  // Show error state
  const hasError = goalsError || challengesError || threadsError;
  if (hasError) {
    return (
      <Layout onSearch={handleSearch}>
        <div className="home-content">
          <div className="home-error">
            <h2>Unable to load dashboard</h2>
            <p>Please try refreshing the page or check your connection.</p>
            <button onClick={() => window.location.reload()} className="action-btn">
              Refresh Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onSearch={handleSearch}>
      <div className="home-content">
        {/* Daily Quote Section */}
        {dailyQuote && !quoteError && (
          <section className="quote-section">
            <blockquote className="quote-text">
              “{dailyQuote.text}”
            </blockquote>
            <cite className="quote-author">— {dailyQuote.author}</cite>
          </section>
        )}

        {/* Quick Stats */}
        <section className="stats-section">
          <h2>Your Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.activeGoals}</div>
              <div className="stat-label">Active Goals</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.completedChallenges}</div>
              <div className="stat-label">Completed Challenges</div>
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
            {goalsWithProgress.length > 0 ? (
              goalsWithProgress.slice(0, 3).map(goal => (
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
                      {goal.current_value} / {goal.target_value} {goal.unit} ({Math.round(goal.progress)}%)
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No goals yet. Set your first goal to get started!</p>
                <button className="action-btn">Create Goal</button>
              </div>
            )}
          </div>
        </section>

        {/* Active Challenges */}
        <section className="challenges-section">
          <div className="section-header">
            <h2>Active Challenges</h2>
            <button className="action-btn">Browse All</button>
          </div>
          <div className="challenges-grid">
            {challengesWithDaysLeft.length > 0 ? (
              challengesWithDaysLeft.slice(0, 3).map(challenge => (
                <div key={challenge.id} className="challenge-card">
                  <h3>{challenge.title}</h3>
                  <div className="challenge-info">
                    <span className="participants">👥 {challenge.participants} participants</span>
                    <span className="days-left">⏰ {challenge.daysLeft} days left</span>
                  </div>
                  <button className="join-btn">Join Challenge</button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No active challenges. Browse challenges to join one!</p>
                <button className="action-btn">Browse Challenges</button>
              </div>
            )}
          </div>
        </section>

        {/* Recent Forum Threads */}
        <section className="forum-section">
          <div className="section-header">
            <h2>Recent Community Discussions</h2>
            <button className="action-btn">View Forum</button>
          </div>
          <div className="forum-threads">
            {threads.length > 0 ? (
              threads.slice(0, 3).map(thread => (
                <div key={thread.id} className="thread-card">
                  <h3>{thread.title}</h3>
                  <div className="thread-meta">
                    <span>By {thread.author}</span>
                    <span>👁 {thread.view_count} views</span>
                    <span>💬 {thread.comment_count} comments</span>
                    <span>👍 {thread.like_count} likes</span>
                  </div>
                  <div className="thread-date">
                    {new Date(thread.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No forum discussions yet. Start a conversation!</p>
                <button className="action-btn">Start Discussion</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default HomePage;