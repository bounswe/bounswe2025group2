import React from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import type { Challenge, User } from '../../lib/types/api';
import { Edit, TrendingUp, Trophy, UserPlus, UserMinus, Calendar, Users } from 'lucide-react';

// Helper function to format dates (copied from ChallengesPage)
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

interface ChallengeCardProps {
    challenge: Challenge & { 
        progress?: number; 
        status: string; 
    };
    user: User | undefined;
    onJoin: (challengeId: number) => void;
    onLeave: (challengeId: number) => void;
    onEdit: (challenge: Challenge) => void;
    onViewDetails: (challenge: Challenge) => void;
    onUpdateProgress: (challenge: Challenge) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    user,
    onJoin,
    onLeave,
    onEdit,
    onViewDetails,
    onUpdateProgress
}) => {
    const isUserParticipant = challenge.is_joined;
    const isCoach = user?.user_type === 'Coach' || user?.is_verified_coach;
    const canEdit = isCoach && challenge.coach === user?.id;

    // Determine if card has minimal content
    const hasDescription = challenge.description && challenge.description.trim().length > 0;
    const hasProgress = isUserParticipant;
    const hasMultipleActions = (challenge.status === 'ACTIVE' && isUserParticipant) || 
                              (challenge.status === 'ACTIVE' && !isUserParticipant) ||
                              (canEdit && (challenge.status === 'ACTIVE' || challenge.status === 'UPCOMING'));
    
    const cardClasses = [
        'challenge-card',
        !hasDescription && 'no-description',
        !hasProgress && 'no-progress',
        !hasMultipleActions && 'minimal-actions'
    ].filter(Boolean).join(' ');

    return (
        <Card className={cardClasses}>
            <CardHeader className="challenge-card-header">
                <div className="challenge-title-section">
                    <div className="challenge-title">{challenge.title}</div>
                    <span className={`challenge-status-badge ${challenge.status?.toLowerCase()}`}>
                        {challenge.status}
                    </span>
                </div>
                {/* Challenge-specific meta information */}
                <div className="challenge-meta">
                    <span className="coach-badge">By: {challenge.coach_username || 'Coach'}</span>
                    <span className={`difficulty-badge difficulty-${challenge.difficulty_level?.toLowerCase()}`}>
                        {challenge.difficulty_level || 'Beginner'}
                    </span>
                    <span className="participant-count">
                        <Users className="w-3 h-3" />
                        {challenge.participant_count || 0} participants
                    </span>
                </div>
            </CardHeader>
            <CardContent className="challenge-card-content">
                {challenge.description && (
                    <p className="challenge-description">
                        {challenge.description}
                    </p>
                )}
                
                {/* Progress section - only show if user is participant */}
                {isUserParticipant && (
                    <div className="challenge-progress">
                        <div className="progress-header">
                            <span className="progress-label">Your Progress</span>
                            <span className="progress-percentage">{challenge.progress}%</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${challenge.progress}%` }}
                            ></div>
                        </div>
                        <div className="progress-text">
                            {challenge.user_progress || 0} / {challenge.target_value} {challenge.unit}
                        </div>
                    </div>
                )}

                {/* Challenge dates */}
                <div className="challenge-dates">
                    <div className="date-item">
                        <Calendar className="date-icon w-4 h-4" />
                        <span>Start: {formatDate(challenge.start_date)}</span>
                    </div>
                    <div className="date-item">
                        <Calendar className="date-icon w-4 h-4" />
                        <span>End: {formatDate(challenge.end_date)}</span>
                    </div>
                </div>
                
                {/* Challenge-specific action buttons */}
                <div className="challenge-card-actions">
                    {isUserParticipant ? (
                        <>
                            {/* Only show Update Progress for active challenges */}
                            {challenge.status === 'ACTIVE' && (
                                <Button 
                                    variant="positive"
                                    size="sm" 
                                    onClick={() => onUpdateProgress(challenge)}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Update Progress
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onViewDetails(challenge)}
                            >
                                <Trophy className="w-4 h-4" />
                                Leaderboard
                            </Button>
                            {/* Only show Leave button for active challenges */}
                            {challenge.status === 'ACTIVE' && (
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => onLeave(challenge.id)}
                                >
                                    <UserMinus className="w-4 h-4" />
                                    Leave
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Only show Join button for active challenges */}
                            {challenge.status === 'ACTIVE' && (
                                <Button 
                                    variant="positive" 
                                    size="sm" 
                                    onClick={() => onJoin(challenge.id)}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Join Challenge
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onViewDetails(challenge)}
                            >
                                <Trophy className="w-4 h-4" />
                                View Details
                            </Button>
                        </>
                    )}
                    {/* Coach edit button - only for active/upcoming challenges */}
                    {canEdit && (challenge.status === 'ACTIVE' || challenge.status === 'UPCOMING') && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onEdit(challenge)}
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ChallengeCard;