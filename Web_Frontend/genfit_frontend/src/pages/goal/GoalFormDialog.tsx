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
import { Save, X } from 'lucide-react';

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
