import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectItem } from '../../components/ui/select';
import GFapi from '../../lib/api/GFapi';
import { invalidateQueries } from '../../lib';
import type { Goal } from '../../lib/types/api';
import { Save, X, Sparkles, Loader2 } from 'lucide-react';
import { GoalAISuggestions } from '../../components/goals/GoalAISuggestions';
import { getGoalSuggestions, calculateTargetDate, type GoalSuggestion } from '../../lib/api/goalSuggestionsApi';

// Define suggested units for each goal type
const GOAL_TYPE_UNITS: Record<string, string[]> = {
    "WALKING_RUNNING": ["km", "miles", "steps"],
    "WORKOUT": ["minutes", "hours", "sets", "reps"],
    "CYCLING": ["km", "miles", "minutes", "hours"],
    "SWIMMING": ["laps", "meters", "km", "minutes"],
    "SPORTS": ["matches", "points", "goals", "minutes", "hours"]
};

interface GoalFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    editingGoal: Goal | null;
}

const GoalFormDialog = ({ isOpen, onClose, editingGoal }: GoalFormDialogProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal_type: 'SPORTS',
        target_value: 100,
        unit: '',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    
    // AI Suggestions state
    const [aiSuggestion, setAiSuggestion] = useState<GoalSuggestion | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

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

    // AI Suggestions handlers
    const fetchAISuggestions = async () => {
        if (!formData.title.trim()) {
            setSuggestionError('Please enter a goal title first');
            return;
        }

        setIsLoadingSuggestion(true);
        setSuggestionError(null);
        setAiSuggestion(null);

        // Add timeout to prevent infinite loading (30 seconds)
        const timeoutId = setTimeout(() => {
            setIsLoadingSuggestion(false);
            setSuggestionError('Request timed out. The AI service is taking longer than usual. Please try again.');
        }, 30000);

        try {
            const suggestion = await getGoalSuggestions({
                title: formData.title,
                description: formData.description,
            });
            clearTimeout(timeoutId);
            setAiSuggestion(suggestion);
            setSuggestionError(null); // Clear any previous errors on success
        } catch (error: any) {
            clearTimeout(timeoutId);
            setSuggestionError(error.message);
            setAiSuggestion(null); // Clear suggestions on error
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const handleApplySuggestion = (suggestion: GoalSuggestion) => {
        setFormData(prev => ({
            ...prev,
            goal_type: suggestion.goal_type,
            target_value: suggestion.target_value,
            unit: suggestion.unit,
            target_date: calculateTargetDate(suggestion.days_to_complete),
        }));
    };

    const handleChatClick = () => {
        window.open('/chat', '_blank');
    };

    // Check if AI suggestions button should be enabled
    const canGetSuggestions = formData.title.trim().length > 0 && formData.description.trim().length > 0;

    // Reset AI suggestions when title or description changes significantly
    useEffect(() => {
        if (aiSuggestion) {
            setAiSuggestion(null);
            setSuggestionError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.title, formData.description]);

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
            onClose();
        } catch (error) {
            console.error('Failed to save goal:', error);
            alert('Failed to save goal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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

                    {/* AI Suggestions Section */}
                    <div className="form-group mt-4">
                        <Button
                            type="button"
                            onClick={fetchAISuggestions}
                            disabled={!canGetSuggestions || isLoadingSuggestion}
                            className={`
                                w-full py-3 font-semibold text-sm transition-all duration-200
                                ${canGetSuggestions && !isLoadingSuggestion
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98]'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            {isLoadingSuggestion ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Analyzing your goal...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Get AI Suggestions</span>
                                </span>
                            )}
                        </Button>
                        {!canGetSuggestions && !isLoadingSuggestion && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                💡 Fill in both title and description to get personalized suggestions
                            </p>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoadingSuggestion && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900">Getting AI suggestions...</p>
                                    <p className="text-xs text-blue-600 mt-1">This may take 2-5 seconds</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Display AI Suggestions */}
                    {aiSuggestion && !isLoadingSuggestion && (
                        <div className="mt-4 mb-4">
                            <GoalAISuggestions
                                suggestion={aiSuggestion}
                                onApply={handleApplySuggestion}
                                onChatClick={handleChatClick}
                            />
                        </div>
                    )}

                    {/* Display Error */}
                    {suggestionError && !isLoadingSuggestion && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <span className="text-red-600 text-lg">✕</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-900">
                                        {suggestionError.includes('hourly limit') || suggestionError.includes('try again')
                                            ? 'Rate Limit Reached' 
                                            : suggestionError.includes('temporarily unavailable') || suggestionError.includes('Failed')
                                            ? 'Service Unavailable'
                                            : 'Suggestion Error'}
                                    </p>
                                    <p className="text-xs text-red-600 mt-1">{suggestionError}</p>
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={fetchAISuggestions}
                                            className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        >
                                            🔄 Try Again
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSuggestionError(null)}
                                            className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                            onClick={onClose}
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
    );
};

export default GoalFormDialog;
