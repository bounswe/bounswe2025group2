import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import GFapi from '../../lib/api/GFapi';
import { invalidateQueries } from '../../lib';
import type { Goal } from '../../lib/types/api';

interface ProgressUpdateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGoal: Goal | null;
}

const ProgressUpdateDialog = ({ isOpen, onClose, selectedGoal }: ProgressUpdateDialogProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progressData, setProgressData] = useState({
        current_value: 0
    });

    useEffect(() => {
        if (selectedGoal) {
            setProgressData({ current_value: selectedGoal.current_value });
        }
    }, [selectedGoal]);

    const handleUpdateProgress = async () => {
        if (!selectedGoal) return;
        
        try {
            setIsSubmitting(true);
            await GFapi.patch(`/api/goals/${selectedGoal.id}/progress/`, { current_value: progressData.current_value });
            await invalidateQueries(['/api/goals/']);
            onClose();
        } catch (error) {
            console.error('Failed to update progress:', error);
            alert('Failed to update progress. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                        onClick={onClose}
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
    );
};

export default ProgressUpdateDialog;
