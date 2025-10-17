import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useUpdateChallengeProgress } from '../../lib/hooks/useChallenges';
import type { Challenge } from '../../lib/types/api';

interface ProgressUpdateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedChallenge: Challenge | null;
}

const ProgressUpdateDialog = ({ isOpen, onClose, selectedChallenge }: ProgressUpdateDialogProps) => {
    const [progressData, setProgressData] = useState({
        added_value: 0
    });

    const updateProgressMutation = useUpdateChallengeProgress();

    useEffect(() => {
        if (selectedChallenge) {
            // Reset to 0 for new progress entry (challenges use added_value, not absolute current_value)
            setProgressData({ added_value: 0 });
        }
    }, [selectedChallenge]);

    const handleUpdateProgress = async () => {
        if (!selectedChallenge || progressData.added_value <= 0) return;
        
        try {
            await updateProgressMutation.mutateAsync({
                challengeId: selectedChallenge.id,
                progress: progressData.added_value
            });
            // Reset form and close dialog
            setProgressData({ added_value: 0 });
            onClose();
        } catch (error) {
            console.error('Failed to update challenge progress:', error);
            alert('Failed to update progress. Please try again.');
        }
    };

    const currentProgress = selectedChallenge?.user_progress || 0;
    const targetValue = selectedChallenge?.target_value || 0;
    const newTotal = currentProgress + progressData.added_value;
    const progressPercentage = targetValue > 0 ? Math.min((newTotal / targetValue) * 100, 100) : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="progress-dialog">
                <DialogHeader>
                    <DialogTitle>Update Challenge Progress</DialogTitle>
                </DialogHeader>
                <div className="progress-form">
                    <div className="form-group">
                        <Label htmlFor="added_value" className="form-label">
                            Add Progress ({selectedChallenge?.unit})
                        </Label>
                        <Input 
                            id="added_value"
                            type="number" 
                            min="0" 
                            max={selectedChallenge ? selectedChallenge.target_value * 2 : undefined}
                            step="0.1"
                            value={progressData.added_value} 
                            onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setProgressData({ added_value: Math.max(0, value) });
                            }}
                            placeholder="Enter progress to add"
                        />
                        {selectedChallenge && (
                            <div className="progress-info">
                                <p>Current Progress: {currentProgress} {selectedChallenge.unit}</p>
                                <p>Target: {targetValue} {selectedChallenge.unit}</p>
                                {progressData.added_value > 0 && (
                                    <p className="new-progress">
                                        New Total: {newTotal} {selectedChallenge.unit} ({progressPercentage.toFixed(1)}%)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        disabled={updateProgressMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUpdateProgress} 
                        disabled={updateProgressMutation.isPending || progressData.added_value <= 0}
                    >
                        {updateProgressMutation.isPending ? 'Updating...' : 'Update Progress'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProgressUpdateDialog;