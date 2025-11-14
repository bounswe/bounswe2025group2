import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useGoals, invalidateQueries } from '../../lib';
import { Layout } from '../../components';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import GFapi from '../../lib/api/GFapi';
import type { Goal } from '../../lib/types/api';
import { Plus, Edit, Save, Target, TrendingUp, Trash2, Calendar, RefreshCw } from 'lucide-react';
import GoalFormDialog from './GoalFormDialog';
import ProgressUpdateDialog from './ProgressUpdateDialog';
import './goal_page.css';

// Helper function to format dates
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
};

// Helper function to calculate progress percentage
const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
};

// Goal tab options for filtering
const GOAL_TAB_OPTIONS = [
    { key: 'ALL', label: 'All Goals' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'INACTIVE', label: 'Inactive' },
    { key: 'RESTARTED', label: 'Restarted' }
];


const GoalPage = () => {
    const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
    const navigate = useNavigate();
    const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useGoals();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [activeGoalTab, setActiveGoalTab] = useState('ALL');


    if (authLoading) {
        return <div className="goal-page-loading">Loading...</div>;
    }

    if (!isAuthenticated) {
        navigate('/auth');
        return null;
    }


    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingGoal(null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingGoal(null);
    };

    const handleDeleteGoal = async (goalId: number) => {
        if (!confirm('Are you sure you want to delete this goal?')) {
            return;
        }

        try {
            await GFapi.delete(`/api/goals/${goalId}/`);
            await invalidateQueries(['/api/goals/']);
        } catch (error) {
            console.error('Failed to delete goal:', error);
            alert('Failed to delete goal. Please try again.');
        }
    };

    const handleRestartGoal = async (goalId: number) => {
        if (!confirm('Are you sure you want to restart this goal?')) {
            return;
        }

        try {
            await GFapi.post(`/api/goals/${goalId}/restart/`);
            await invalidateQueries(['/api/goals/']);
        } catch (error) {
            console.error('Failed to restart goal:', error);
            alert('Failed to restart goal. Please try again.');
        }
    };

    const openProgressDialog = (goal: Goal) => {
        setSelectedGoal(goal);
        setIsProgressDialogOpen(true);
    };

    const handleCloseProgress = () => {
        setIsProgressDialogOpen(false);
        setSelectedGoal(null);
    };

    // Calculate progress for goals and group them by status
    const goalsWithProgress = goals.map(goal => ({
        ...goal,
        progress: calculateProgress(goal.current_value, goal.target_value)
    }));

    const groupedGoals = goalsWithProgress.reduce((acc, goal) => {
        const status = goal.status || 'INACTIVE';
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(goal);
        return acc;
    }, {} as { [key: string]: typeof goalsWithProgress });

    // Filter goals based on active tab
    const getFilteredGoals = () => {
        if (activeGoalTab === 'ALL') {
            return goalsWithProgress;
        }
        return groupedGoals[activeGoalTab] || [];
    };

    const filteredGoals = getFilteredGoals();

    // Calculate statistics
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.status === "COMPLETED").length;
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    return (
        <Layout>
            <div className="goal-page-content">
                <div className="section-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h1 className="page-title">Your Goals</h1>
                            <p className="page-subtitle">Track your fitness journey and achieve your targets</p>
                        </div>
                        <Button onClick={handleAddNew} className="add-goal-btn" size={"xl"}>
                            <Plus className="w-5 h-5 mr-2 font-bold" /> {/* Increased from w-4 h-4 to w-5 h-5 */}
                            {goals.length === 0 ? 'Create Your First Goal' : 'Add New Goal'}
                        </Button>
                    </div>
                </div>

                {/* Statistics Section */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <CardHeader className="stat-card-header">
                            <Target className="stat-icon w-6 h-6 mr-4" />
                            <CardTitle className="stat-title">Total Goals</CardTitle>
                        </CardHeader>
                        <CardContent className="stat-content">
                            <div className="stat-value">{totalGoals}</div>
                        </CardContent>
                    </Card>
                    <Card className="stat-card">
                        <CardHeader className="stat-card-header">
                            <TrendingUp className="stat-icon w-6 h-6 mr-4" />
                            <CardTitle className="stat-title">Completed</CardTitle>
                        </CardHeader>
                        <CardContent className="stat-content">
                            <div className="stat-value">{completedGoals}</div>
                        </CardContent>
                    </Card>
                    <Card className="stat-card">
                        <CardHeader className="stat-card-header">
                            <Save className="stat-icon w-6 h-6 mr-4" />
                            <CardTitle className="stat-title">Success Rate</CardTitle>
                        </CardHeader>
                        <CardContent className="stat-content">
                            <div className="stat-value">{completionRate}%</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Create/Edit Goal Dialog */}
                {isFormOpen && (
                    <GoalFormDialog
                        isOpen={isFormOpen}
                        onClose={handleCloseForm}
                        editingGoal={editingGoal}
                    />
                )}

                {/* Progress Update Dialog */}
                {isProgressDialogOpen && (
                    <ProgressUpdateDialog
                        isOpen={isProgressDialogOpen}
                        onClose={handleCloseProgress}
                        selectedGoal={selectedGoal}
                    />
                )}

                {goalsLoading && <div className="goal-page-loading">Loading goals...</div>}
                {goalsError && <div className="goal-page-error">Failed to load goals.</div>}

                {/* Goal Status Tabs */}
                {goals.length > 0 && (
                    <div className="goal-tabs">
                        {GOAL_TAB_OPTIONS.map(tab => (
                            <button
                                key={tab.key}
                                className={`goal-tab ${activeGoalTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveGoalTab(tab.key)}
                            >
                                {tab.label}
                                {tab.key !== 'ALL' && groupedGoals[tab.key] && (
                                    <span className="goal-count">({groupedGoals[tab.key].length})</span>
                                )}
                                {tab.key === 'ALL' && (
                                    <span className="goal-count">({goalsWithProgress.length})</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {goals.length === 0 && !goalsLoading ? (
                    <div className="empty-state">
                        <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                        <p className="text-muted-foreground mb-4">Start your fitness journey by creating your first goal!</p>
                    </div>
                ) : filteredGoals.length === 0 ? (
                    <div className="empty-state">
                        <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {activeGoalTab === 'ALL' ? 'No goals yet' : `No ${activeGoalTab.toLowerCase()} goals`}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {activeGoalTab === 'ALL'
                                ? 'Start your fitness journey by creating your first goal!'
                                : `No ${activeGoalTab.toLowerCase()} goals found.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="goals-page-goals-grid">
                        {filteredGoals.map(goal => {

                            return (
                                <Card key={goal.id} className="goal-card">
                                    <CardHeader className="goal-card-header">
                                        <div className="goal-title-section">
                                            <div className="goal-title">{goal.title}</div>
                                            <span className={`goal-status-badge ${goal.status?.toLowerCase()}`}>
                                                {goal.status}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="goal-card-content">
                                        {goal.description && (
                                            <p className="goal-description">
                                                {goal.description}
                                            </p>
                                        )}

                                        <div className="goal-progress">
                                            <div className="progress-header">
                                                <span className="progress-label">Progress</span>
                                                <span className="progress-percentage">{goal.progress}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${goal.progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="progress-text">
                                                {goal.current_value} / {goal.target_value} {goal.unit}
                                            </div>
                                        </div>

                                        <div className="goal-dates">
                                            <div className="date-item">
                                                <Calendar className="date-icon w-4 h-4" />
                                                <span>Start: {formatDate(goal.start_date)}</span>
                                            </div>
                                            <div className="date-item">
                                                <Calendar className="date-icon w-4 h-4" />
                                                <span>Target: {formatDate(goal.target_date)}</span>
                                            </div>
                                        </div>

                                        <div className="goal-card-actions">
                                            {goal.status === 'INACTIVE' ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleRestartGoal(goal.id)}
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Restart Goal
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="positive"
                                                    size="sm"
                                                    onClick={() => openProgressDialog(goal)}
                                                >
                                                    <TrendingUp className="w-4 h-4 mr-2" />
                                                    Update Progress
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(goal)}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteGoal(goal.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default GoalPage;