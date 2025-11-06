import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginStats } from '../lib';
import type { Goal, Challenge } from '../lib/types/api';
import './ActivityDashboard.css';

// Simple icon components
const FlameIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 0.5C13.5 0.5 21 8 21 14C21 18.971 16.971 23 12 23C7.029 23 3 18.971 3 14C3 9 8.5 3.5 8.5 3.5C8.5 3.5 7 7 7 10C7 13.314 9.686 16 13 16C16.314 16 19 13.314 19 10C19 7 13.5 0.5 13.5 0.5Z" />
  </svg>
);

const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5C3.67 9 3 9.67 3 10.5V12.5C3 13.33 3.67 14 4.5 14H6"/>
    <path d="M18 9H19.5C20.33 9 21 9.67 21 10.5V12.5C21 13.33 20.33 14 19.5 14H18"/>
    <path d="M6 9V7C6 5.34 7.34 4 9 4H15C16.66 4 18 5.34 18 7V9"/>
    <path d="M6 14V16C6 17.66 7.34 19 9 19H15C16.66 19 18 17.66 18 16V14"/>
    <path d="M12 19V22"/>
    <path d="M8 22H16"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

interface ActivityDashboardProps {
  goals: Goal[];
  challenges: Challenge[];
  activeGoals: number;
  completedChallenges: number;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasLogin: boolean;
  events: Array<{
    type: 'goal' | 'challenge';
    title: string;
    id: number;
    daysUntil: number;
  }>;
}

export function ActivityDashboard({ goals, challenges, activeGoals, completedChallenges }: ActivityDashboardProps) {
  const navigate = useNavigate();
  const { data: loginStats, isLoading: statsLoading } = useLoginStats();

  // Generate calendar for current month
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate days to show from previous month
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Calculate days to show from next month (to fill grid to 35 or 42 days)
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((daysFromPrevMonth + totalDays) / 7) * 7;
    const daysFromNextMonth = totalCells - daysFromPrevMonth - totalDays;
    
    const days: CalendarDay[] = [];
    
    // Add previous month days
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        hasLogin: false,
        events: []
      });
    }
    
    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if user logged in on this day (only for past and today, not future)
      const isPastOrToday = date <= today;
      const hasLogin = isPastOrToday && (loginStats?.login_calendar.some(
        cal => cal.date === dateStr && cal.logged_in
      ) || false);
      
      // Find events (goals and challenges) for this day
      const events: CalendarDay['events'] = [];
      
      // Check goals
      goals.forEach(goal => {
        const targetDate = new Date(goal.target_date);
        const goalDateStr = targetDate.toISOString().split('T')[0];
        if (goalDateStr === dateStr && goal.status === 'ACTIVE') {
          const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          events.push({
            type: 'goal',
            title: goal.title,
            id: goal.id,
            daysUntil
          });
        }
      });
      
      // Check challenges
      challenges.forEach(challenge => {
        const endDate = new Date(challenge.end_date);
        const challengeDateStr = endDate.toISOString().split('T')[0];
        if (challengeDateStr === dateStr && challenge.is_active && challenge.is_joined) {
          const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          events.push({
            type: 'challenge',
            title: challenge.title,
            id: challenge.id,
            daysUntil
          });
        }
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        hasLogin,
        events
      });
    }
    
    // Add next month days
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        hasLogin: false,
        events: []
      });
    }
    
    return days;
  }, [loginStats, goals, challenges]);

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const deadlines: Array<{
      type: 'goal' | 'challenge';
      title: string;
      date: Date;
      daysUntil: number;
      id: number;
    }> = [];
    
    // Add goal deadlines
    goals.forEach(goal => {
      if (goal.status === 'ACTIVE') {
        const targetDate = new Date(goal.target_date);
        if (targetDate >= today && targetDate <= sevenDaysFromNow) {
          const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          deadlines.push({
            type: 'goal',
            title: goal.title,
            date: targetDate,
            daysUntil,
            id: goal.id
          });
        }
      }
    });
    
    // Add challenge deadlines
    challenges.forEach(challenge => {
      if (challenge.is_active && challenge.is_joined) {
        const endDate = new Date(challenge.end_date);
        if (endDate >= today && endDate <= sevenDaysFromNow) {
          const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          deadlines.push({
            type: 'challenge',
            title: challenge.title,
            date: endDate,
            daysUntil,
            id: challenge.id
          });
        }
      }
    });
    
    // Sort by date
    return deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [goals, challenges]);

  const today = new Date();
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (statsLoading) {
    return <div className="activity-dashboard-loading">Loading activity dashboard...</div>;
  }

  return (
    <div className="activity-dashboard">
      {/* Two Column Layout */}
      <div className="dashboard-layout">
        {/* Left Column: Stats + Streak + Deadlines */}
        <div className="dashboard-left-column">
          {/* Quick Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-number">{activeGoals}</div>
              <div className="stat-label">Active Goals</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{completedChallenges}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          {/* Login Streak Section */}
          <section className="streak-section">
            <div className="section-title">
              <FlameIcon />
              <h2>Login Streak</h2>
            </div>
            <div className="streak-stats">
              <div className="streak-stat-card primary">
                <div className="streak-number">{loginStats?.current_streak || 0}</div>
                <div className="streak-label">Current</div>
                {loginStats?.streak_active && (
                  <div className="streak-status active">Active</div>
                )}
              </div>
              <div className="streak-stat-card">
                <div className="streak-number">{loginStats?.longest_streak || 0}</div>
                <div className="streak-label">Best</div>
              </div>
              <div className="streak-stat-card">
                <div className="streak-number">{loginStats?.total_login_days || 0}</div>
                <div className="streak-label">Total</div>
              </div>
            </div>
            {loginStats && !loginStats.logged_in_today && (
              <div className="streak-warning">
                <AlertIcon />
                <span>Log in today to continue!</span>
              </div>
            )}
          </section>

          {/* Upcoming Deadlines */}
          <section className="deadlines-section">
            <div className="section-title">
              <AlertIcon />
              <h2>Upcoming Deadlines</h2>
            </div>
            {upcomingDeadlines.length > 0 ? (
              <div className="deadlines-list">
                {upcomingDeadlines.slice(0, 5).map((deadline) => (
                  <div 
                    key={`${deadline.type}-${deadline.id}`} 
                    className={`deadline-item ${deadline.type}`}
                    onClick={() => navigate(deadline.type === 'goal' ? '/goals' : '/challenges')}
                  >
                    <div className="deadline-icon">
                      {deadline.type === 'goal' ? <TargetIcon /> : <TrophyIcon />}
                    </div>
                    <div className="deadline-content">
                      <div className="deadline-title">{deadline.title}</div>
                      <div className="deadline-meta">
                        <span className="deadline-type">{deadline.type}</span>
                        <span className="deadline-date">
                          {deadline.daysUntil === 0 ? 'Today' : 
                           deadline.daysUntil === 1 ? 'Tomorrow' : 
                           `${deadline.daysUntil}d`}
                        </span>
                      </div>
                    </div>
                    <div className={`deadline-urgency urgency-${deadline.daysUntil <= 1 ? 'high' : deadline.daysUntil <= 3 ? 'medium' : 'low'}`}>
                      <div className="urgency-dot"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-deadlines">
                <p>No upcoming deadlines</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Calendar */}
        <section className="calendar-section">
          <div className="section-title">
            <CalendarIcon />
            <h2>{monthName}</h2>
          </div>
          <div className="calendar-legend">
            <span className="legend-item">
              <span className="legend-dot login"></span> Login
            </span>
            <span className="legend-item">
              <span className="legend-dot goal"></span> Goal
            </span>
            <span className="legend-item">
              <span className="legend-dot challenge"></span> Challenge
            </span>
          </div>
          <div className="calendar-grid">
            <div className="calendar-header">
              <div className="calendar-day-name">S</div>
              <div className="calendar-day-name">M</div>
              <div className="calendar-day-name">T</div>
              <div className="calendar-day-name">W</div>
              <div className="calendar-day-name">T</div>
              <div className="calendar-day-name">F</div>
              <div className="calendar-day-name">S</div>
            </div>
            <div className="calendar-body">
              {calendarDays.map((day, index) => {
                const isToday = day.date.toDateString() === today.toDateString();
                return (
                  <div
                    key={index}
                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                  >
                    <div className="day-number">{day.date.getDate()}</div>
                    <div className="day-indicators">
                      {day.hasLogin && <span className="indicator login"></span>}
                      {day.events.filter(e => e.type === 'goal').length > 0 && (
                        <span className="indicator goal"></span>
                      )}
                      {day.events.filter(e => e.type === 'challenge').length > 0 && (
                        <span className="indicator challenge"></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

