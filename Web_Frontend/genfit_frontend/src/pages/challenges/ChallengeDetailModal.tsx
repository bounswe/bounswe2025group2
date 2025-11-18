// Button import removed as it's not used in this component
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useChallengeParticipants } from '../../lib/hooks/useChallenges';
import type { Challenge, User } from '../../lib/types/api';
import { Trophy, Users, Calendar, MapPin, Target } from 'lucide-react';

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

interface ChallengeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    challenge: Challenge | null;
    user: User | undefined;
}

const ChallengeDetailModal = ({
    isOpen,
    onClose,
    challenge,
    user
}: ChallengeDetailModalProps) => {
    const { data: participants = [], isLoading: participantsLoading } = useChallengeParticipants(
        challenge?.id || 0
    );

    if (!challenge) return null;

    const isUserParticipant = challenge.is_joined;

    // Sort participants by current value (descending order)
    const sortedParticipants = [...participants].sort((a, b) => {
        return b.current_value - a.current_value;
    });

    // Find current user's rank
    const userRank = sortedParticipants.findIndex(p => p.user === user?.id) + 1;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="detail-modal" style={{ maxWidth: '1400px', width: '60vw' }}>
                <DialogHeader>
                    <DialogTitle className="challenge-detail-title">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        {challenge.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="challenge-detail-content">
                    {/* Left Column - Challenge Info */}
                    <div className="challenge-info-column">
                        <div className="challenge-description">
                            <p>{challenge.description || 'No description provided.'}</p>
                        </div>

                        <div className="challenge-meta-grid">
                            <div className="meta-item">
                                <Calendar className="meta-icon" />
                                <div>
                                    <span className="meta-label">Duration</span>
                                    <span className="meta-value">
                                        {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                                    </span>
                                </div>
                            </div>

                            <div className="meta-item">
                                <Target className="meta-icon" />
                                <div>
                                    <span className="meta-label">Target</span>
                                    <span className="meta-value">
                                        {challenge.target_value} {challenge.unit}
                                    </span>
                                </div>
                            </div>

                            <div className="meta-item">
                                <Users className="meta-icon" />
                                <div>
                                    <span className="meta-label">Participants</span>
                                    <span className="meta-value">
                                        {challenge.participant_count || 0} joined
                                    </span>
                                </div>
                            </div>

                            <div className="meta-item">
                                <Trophy className="meta-icon" />
                                <div>
                                    <span className="meta-label">Difficulty</span>
                                    <span className={`meta-value difficulty-badge difficulty-${challenge.difficulty_level?.toLowerCase()}`}>
                                        {challenge.difficulty_level || 'Beginner'}
                                    </span>
                                </div>
                            </div>

                            {challenge.location && (
                                <div className="meta-item">
                                    <MapPin className="meta-icon" />
                                    <div>
                                        <span className="meta-label">Location</span>
                                        <span className="meta-value">{challenge.location}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User's Progress (if participant) */}
                        {isUserParticipant && (
                            <div className="user-progress-section">
                                <h3 className="section-title">Your Progress</h3>
                                <div className="progress-display">
                                    <div className="progress-stats">
                                        <span className="progress-current">
                                            {challenge.user_progress || 0} {challenge.unit}
                                        </span>
                                        <span className="progress-percentage">
                                            {calculateProgress(challenge.user_progress || 0, challenge.target_value)}%
                                        </span>
                                        {userRank > 0 && (
                                            <span className="user-rank">
                                                Rank #{userRank}
                                            </span>
                                        )}
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${calculateProgress(challenge.user_progress || 0, challenge.target_value)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Leaderboard */}
                    <div className="leaderboard-column">
                        <div className="leaderboard-header">
                            <h3 className="section-title">Leaderboard</h3>
                        </div>

                        {participantsLoading ? (
                            <div className="leaderboard-loading">Loading leaderboard...</div>
                        ) : sortedParticipants.length === 0 ? (
                            <div className="leaderboard-empty">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p>No participants yet</p>
                            </div>
                        ) : (
                            <div className="leaderboard-list">
                                {sortedParticipants.map((participant, index) => {
                                    const progress = calculateProgress(participant.current_value, challenge.target_value);
                                    const isCurrentUser = participant.user === user?.id;

                                    return (
                                        <div
                                            key={participant.id}
                                            className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''}`}
                                        >
                                            <div className="entry-rank">
                                                {index + 1}
                                                {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 ml-1" />}
                                            </div>
                                            <div className="entry-user">
                                                {participant.username || `User ${participant.user}`}
                                                {isCurrentUser && <span className="you-badge">You</span>}
                                            </div>
                                            <div className="entry-progress">
                                                <span className="progress-value">
                                                    {participant.current_value} {challenge.unit}
                                                </span>
                                                <span className="progress-percent">
                                                    {progress}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>


                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChallengeDetailModal;