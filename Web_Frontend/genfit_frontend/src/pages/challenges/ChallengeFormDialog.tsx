import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectItem } from '../../components/ui/select';
import { useCreateChallenge, useUpdateChallenge, useDeleteChallenge } from '../../lib/hooks/useChallenges';
import type { Challenge } from '../../lib/types/api';
import { Save, Trash2 } from 'lucide-react';

// Define suggested units for each challenge type (adapted from GOAL_TYPE_UNITS)
const CHALLENGE_TYPE_UNITS: Record<string, string[]> = {
    "WALKING_RUNNING": ["km", "miles", "steps"],
    "WORKOUT": ["minutes", "hours", "sessions"],
    "CYCLING": ["km", "miles", "minutes", "hours"],
    "SWIMMING": ["laps", "meters", "km", "minutes"],
    "SPORTS": ["matches", "points", "goals", "minutes", "hours"]
};

interface ChallengeFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    editingChallenge: Challenge | null;
}

const ChallengeFormDialog = ({ isOpen, onClose, editingChallenge }: ChallengeFormDialogProps) => {
    const createChallengeMutation = useCreateChallenge();
    const updateChallengeMutation = useUpdateChallenge();
    const deleteChallengeMutation = useDeleteChallenge();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        challenge_type: 'SPORTS',
        difficulty_level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
        target_value: 100,
        unit: '',
        location: '',
        start_date: new Date().toISOString().split('T')[0], // Today
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    });

    const isSubmitting = createChallengeMutation.isPending || updateChallengeMutation.isPending;

    useEffect(() => {
        if (editingChallenge) {
            setFormData({
                title: editingChallenge.title,
                description: editingChallenge.description || '',
                challenge_type: editingChallenge.challenge_type,
                difficulty_level: editingChallenge.difficulty_level || 'Beginner',
                target_value: editingChallenge.target_value,
                unit: editingChallenge.unit,
                location: editingChallenge.location || '',
                start_date: editingChallenge.start_date.split('T')[0],
                end_date: editingChallenge.end_date.split('T')[0]
            });
        } else {
            setFormData({
                title: '',
                description: '',
                challenge_type: 'SPORTS',
                difficulty_level: 'Beginner',
                target_value: 100,
                unit: '',
                location: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }
    }, [editingChallenge, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleChallengeTypeChange = (value: string) => {
        setFormData(prev => {
            const challengeTypeUnits = CHALLENGE_TYPE_UNITS[value] || [];
            const suggestedUnit = challengeTypeUnits.length > 0 ? challengeTypeUnits[0] : '';
            return { 
                ...prev, 
                challenge_type: value,
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

        // Validate dates
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        
        if (endDate <= startDate) {
            alert('End date must be after start date');
            return;
        }

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                challenge_type: formData.challenge_type,
                difficulty_level: formData.difficulty_level,
                target_value: formData.target_value,
                unit: formData.unit,
                location: formData.location,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString()
            };

            if (editingChallenge) {
                await updateChallengeMutation.mutateAsync({
                    challengeId: editingChallenge.id,
                    data: payload
                });
            } else {
                await createChallengeMutation.mutateAsync(payload);
            }

            onClose();
        } catch (error: unknown) {
            console.error('Failed to save challenge:', error);
            
            // Show more detailed error message
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            let errorMessage = 'Failed to save challenge. Please try again.';
            if (err?.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err?.response?.data) {
                errorMessage = JSON.stringify(err.response.data);
            } else if (err?.message) {
                errorMessage = err.message;
            }
            
            alert(errorMessage);
        }
    };

    const handleDelete = async () => {
        if (!editingChallenge) return;
        
        if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone and will remove all participant data.')) {
            return;
        }

        try {
            await deleteChallengeMutation.mutateAsync(editingChallenge.id);
            onClose();
        } catch (error: unknown) {
            console.error('Failed to delete challenge:', error);
            
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            let errorMessage = 'Failed to delete challenge. Please try again.';
            if (err?.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err?.message) {
                errorMessage = err.message;
            }
            
            alert(errorMessage);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="challenge-dialog">
                <DialogHeader>
                    <DialogTitle>{editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} className="challenge-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <Label htmlFor="title" className="form-label">Title *</Label>
                            <Input 
                                id="title" 
                                name="title" 
                                value={formData.title} 
                                onChange={handleInputChange} 
                                placeholder="e.g., 10K Steps Challenge, Marathon Training"
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <Label htmlFor="challenge_type" className="form-label">Challenge Type *</Label>
                            <Select 
                                id="challenge_type"
                                value={formData.challenge_type} 
                                onValueChange={handleChallengeTypeChange}
                            >
                                <SelectItem value="WALKING_RUNNING">Walking/Running</SelectItem>
                                <SelectItem value="WORKOUT">Workout</SelectItem>
                                <SelectItem value="CYCLING">Cycling</SelectItem>
                                <SelectItem value="SWIMMING">Swimming</SelectItem>
                                <SelectItem value="SPORTS">Sports</SelectItem>
                            </Select>
                        </div>
                        <div className="form-group">
                            <Label htmlFor="difficulty_level" className="form-label">Difficulty Level *</Label>
                            <Select 
                                id="difficulty_level"
                                value={formData.difficulty_level} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value as 'Beginner' | 'Intermediate' | 'Advanced' }))}
                            >
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
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
                            placeholder="Describe the challenge goals and rules..."
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
                                placeholder="e.g., km, steps, minutes"
                                required 
                            />
                            {CHALLENGE_TYPE_UNITS[formData.challenge_type] && (
                                <p className="unit-suggestion">
                                    Suggested: {CHALLENGE_TYPE_UNITS[formData.challenge_type].join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <Label htmlFor="location" className="form-label">Location</Label>
                        <Input 
                            id="location" 
                            name="location" 
                            value={formData.location} 
                            onChange={handleInputChange} 
                            placeholder="e.g., Central Park, Online, Local Gym"
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <Label htmlFor="start_date" className="form-label">Start Date *</Label>
                            <Input 
                                id="start_date" 
                                name="start_date" 
                                type="date" 
                                value={formData.start_date} 
                                onChange={handleInputChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <Label htmlFor="end_date" className="form-label">End Date *</Label>
                            <Input 
                                id="end_date" 
                                name="end_date" 
                                type="date" 
                                value={formData.end_date} 
                                onChange={handleInputChange} 
                                required 
                            />
                        </div>
                    </div>
                    <DialogFooter className="form-actions">
                        <div className="form-actions-left">
                            {editingChallenge && (
                                <Button 
                                    type="button" 
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isSubmitting || deleteChallengeMutation.isPending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deleteChallengeMutation.isPending ? 'Deleting...' : 'Delete Challenge'}
                                </Button>
                            )}
                        </div>
                        <div className="form-actions-right">
                            <Button 
                                type="submit" 
                                variant="positive"
                                disabled={isSubmitting || deleteChallengeMutation.isPending}
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Saving...' : (editingChallenge ? 'Save Changes' : 'Create Challenge')}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ChallengeFormDialog;