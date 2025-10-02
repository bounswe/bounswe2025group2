import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useGoals, invalidateQueries } from '../../lib';
import { Layout } from '../../components';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectItem } from '../../components/ui/select';
import GFapi from '../../lib/api/GFapi';
import type { Goal } from '../../lib/types/api';
import { Plus, Edit, Save, X, Target, TrendingUp, Trash2, Calendar } from 'lucide-react';
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
    return Math.min(Math.round((current / target) * 100), 100);
};

// Define suggested units for each goal type
const GOAL_TYPE_UNITS: Record<string, string[]> = {
    "WALKING_RUNNING": ["km", "miles", "steps"],
    "WORKOUT": ["minutes", "hours", "sets", "reps"],
    "CYCLING": ["km", "miles", "minutes", "hours"],
    "SWIMMING": ["laps", "meters", "km", "minutes"],
    "SPORTS": ["matches", "points", "goals", "minutes", "hours"]
};

const GoalPage = () => {
    const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
    const navigate = useNavigate();
    const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useGoals();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal_type: 'SPORTS',
        target_value: 100,
        unit: '',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const [progressData, setProgressData] = useState({
        current_value: 0
    });

    useEffect(() => {
        if (editingGoal) {
            setFormData({
                title: editingGoal.title,
                description: editingGoal.description || '',
                goal_type: editingGoal.goal_type,
                target_value: editingGoal.target_value,
                unit: editingGoal.unit,
                target_date: editingGoal.target_date.split('T')[0]
            });
        } else {
            setFormData({
                title: '',
                description: '',
                goal_type: 'SPORTS',
                target_value: 100,
                unit: '',
                target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }
    }, [editingGoal]);

    if (authLoading) {
        return <div className="goal-page-loading">Loading...</div>;
    }

    if (!isAuthenticated) {
        navigate('/auth');
        return null;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleGoalTypeChange = (value: string) => {
        setFormData(prev => {
            const goalTypeUnits = GOAL_TYPE_UNITS[value] || [];
            const suggestedUnit = goalTypeUnits.length > 0 ? goalTypeUnits[0] : '';
            return { 
                ...prev, 
                goal_type: value,
                unit: suggestedUnit
            };
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.title.trim() || !formData.target_value || !formData.unit.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                goal_type: formData.goal_type,
                target_value: formData.target_value,
                unit: formData.unit,
                target_date: formData.target_date
            };

            if (editingGoal) {
                await GFapi.put(`/api/goals/${editingGoal.id}/`, payload);
            } else {
                await GFapi.post('/api/goals/', payload);
            }

            await invalidateQueries(['/api/goals/']);
            setIsFormOpen(false);
            setEditingGoal(null);
            setFormData({
                title: '',
                description: '',
                goal_type: 'SPORTS',
                target_value: 100,
                unit: '',
                target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Failed to save goal:', error);
            alert('Failed to save goal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingGoal(null);
        setIsFormOpen(true);
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

    const openProgressDialog = (goal: Goal) => {
        setSelectedGoal(goal);
        setProgressData({ current_value: goal.current_value });
        setIsProgressDialogOpen(true);
    };

    const handleUpdateProgress = async () => {
        if (!selectedGoal) return;
        
        try {
            setIsSubmitting(true);
            await GFapi.patch(`/api/goals/${selectedGoal.id}/progress/`, { current_value: progressData.current_value });
            await invalidateQueries(['/api/goals/']);
            setIsProgressDialogOpen(false);
        } catch (error) {
            console.error('Failed to update progress:', error);
            alert('Failed to update progress. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            <Plus className="w-4 h-4" />
                            Add New Goal
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
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="goal-dialog">
                        <DialogHeader>
                            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleFormSubmit} className="goal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <Label htmlFor="title" className="form-label">Title *</Label>
                                    <Input 
                                        id="title" 
                                        name="title" 
                                        value={formData.title} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g., Lose Weight, Run 5K"
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <Label htmlFor="goal_type" className="form-label">Goal Type *</Label>
                                    <Select 
                                        id="goal_type"
                                        value={formData.goal_type} 
                                        onValueChange={handleGoalTypeChange}
                                    >
                                        <SelectItem value="WALKING_RUNNING">Walking/Running</SelectItem>
                                        <SelectItem value="WORKOUT">Workout</SelectItem>
                                        <SelectItem value="CYCLING">Cycling</SelectItem>
                                        <SelectItem value="SWIMMING">Swimming</SelectItem>
                                        <SelectItem value="SPORTS">Sports</SelectItem>
                                    </Select>
                                </div>
                            </div>
                            <div className="form-group">
                                <Label htmlFor="description" className="form-label">Description</Label>
                                <Textarea 
                                    id="description" 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleInputChange} 
                                    placeholder="Describe your goal and motivation..."
                                    rows={3}
                                />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <Label htmlFor="target_value" className="form-label">Target Value *</Label>
                                    <Input 
                                        id="target_value" 
                                        name="target_value" 
                                        type="number" 
                                        min="0" 
                                        step="0.1"
                                        value={formData.target_value} 
                                        onChange={handleNumericInputChange} 
                                        placeholder="Enter target number"
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <Label htmlFor="unit" className="form-label">Unit *</Label>
                                    <Input 
                                        id="unit" 
                                        name="unit" 
                                        value={formData.unit} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g., kg, miles, minutes"
                                        required 
                                    />
                                    {GOAL_TYPE_UNITS[formData.goal_type] && (
                                        <p className="unit-suggestion">
                                            Suggested: {GOAL_TYPE_UNITS[formData.goal_type].join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <Label htmlFor="target_date" className="form-label">Target Date *</Label>
                                <Input 
                                    id="target_date" 
                                    name="target_date" 
                                    type="date" 
                                    value={formData.target_date} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <DialogFooter className="form-actions">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsFormOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    <Save className="w-4 h-4" />
                                    {isSubmitting ? 'Saving...' : (editingGoal ? 'Save Changes' : 'Create Goal')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Progress Update Dialog */}
                <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
                    <DialogContent className="progress-dialog">
                        <DialogHeader>
                            <DialogTitle>Update Progress</DialogTitle>
                        </DialogHeader>
                        <div className="progress-form">
                            <div className="form-group">
                                <Label htmlFor="current_value" className="form-label">
                                    Current Progress ({selectedGoal?.unit})
                                </Label>
                                <Input 
                                    id="current_value"
                                    type="number" 
                                    min="0" 
                                    step="0.1"
                                    value={progressData.current_value} 
                                    onChange={(e) => setProgressData({ current_value: parseFloat(e.target.value) || 0 })}
                                    placeholder="Enter current progress"
                                />
                                {selectedGoal && (
                                    <p className="progress-info">
                                        Target: {selectedGoal.target_value} {selectedGoal.unit}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsProgressDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateProgress} disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Progress'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {goalsLoading && <div className="goal-page-loading">Loading goals...</div>}
                {goalsError && <div className="goal-page-error">Failed to load goals.</div>}

                {goals.length === 0 && !goalsLoading ? (
                    <div className="empty-state">
                        <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                        <p className="text-muted-foreground mb-4">Start your fitness journey by creating your first goal!</p>
                        <Button onClick={handleAddNew}>
                            <Plus className="w-4 h-4" />
                            Create Your First Goal
                        </Button>
                    </div>
                ) : (
                    <div className="goals-grid">
                        {goals.map(goal => {
                            const progress = calculateProgress(goal.current_value, goal.target_value);
                            
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
                                                <span className="progress-percentage">{progress}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill" 
                                                    style={{ width: `${progress}%` }}
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
                                            <Button 
                                                variant="positive"
                                                size="sm" 
                                                onClick={() => openProgressDialog(goal)}
                                            >
                                                <TrendingUp className="w-4 h-4" />
                                                Update Progress
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleEdit(goal)}
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                onClick={() => handleDeleteGoal(goal.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
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