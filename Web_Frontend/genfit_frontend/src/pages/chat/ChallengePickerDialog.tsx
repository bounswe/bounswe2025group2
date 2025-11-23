import { useState } from 'react';
import { useChallenges } from '../../lib';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { Challenge } from '../../lib/types/api';
import { Trophy, Search, Calendar, Users, TrendingUp } from 'lucide-react';

interface ChallengePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChallenge: (challengeId: number, challengeTitle: string) => void;
}

const ChallengePickerDialog = ({ isOpen, onClose, onSelectChallenge }: ChallengePickerDialogProps) => {
  const { data: challenges = [], isLoading } = useChallenges();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter challenges based on search query
  const filteredChallenges = challenges.filter(challenge => 
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.challenge_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get status badge class
  const getStatusClass = (challenge: Challenge) => {
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'inactive';
    if (challenge.is_active) return 'active';
    return 'inactive';
  };

  const getStatusLabel = (challenge: Challenge) => {
    const status = getStatusClass(challenge);
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleSelect = (challenge: Challenge) => {
    onSelectChallenge(challenge.id, challenge.title);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="challenge-picker-dialog">
        <DialogHeader>
          <DialogTitle className="challenge-picker-title">
            <Trophy className="w-5 h-5" />
            Share a Challenge
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="challenge-search">
          <Search className="search-icon" />
          <Input
            type="text"
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Challenge List */}
        <div className="challenge-picker-list">
          {isLoading ? (
            <div className="picker-loading">Loading challenges...</div>
          ) : filteredChallenges.length === 0 ? (
            <div className="picker-empty">
              {searchQuery ? 'No challenges found matching your search' : 'No challenges available'}
            </div>
          ) : (
            filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="picker-challenge-item"
                onClick={() => handleSelect(challenge)}
              >
                <div className="picker-challenge-header">
                  <div className="picker-challenge-title-section">
                    <h3 className="picker-challenge-title">{challenge.title}</h3>
                    <span className={`picker-status-badge ${getStatusClass(challenge)}`}>
                      {getStatusLabel(challenge)}
                    </span>
                  </div>
                  <p className="picker-challenge-type">
                    <TrendingUp className="w-3 h-3" />
                    {challenge.challenge_type}
                  </p>
                </div>

                <p className="picker-challenge-description">
                  {challenge.description.length > 100
                    ? `${challenge.description.substring(0, 100)}...`
                    : challenge.description}
                </p>

                <div className="picker-challenge-meta">
                  <span className="picker-meta-item">
                    <Calendar className="w-3 h-3" />
                    {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                  </span>
                  {challenge.participant_count !== undefined && (
                    <span className="picker-meta-item">
                      <Users className="w-3 h-3" />
                      {challenge.participant_count} participants
                    </span>
                  )}
                  <span className={`picker-difficulty ${challenge.difficulty_level.toLowerCase()}`}>
                    {challenge.difficulty_level}
                  </span>
                </div>

                <div className="picker-challenge-footer">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(challenge);
                    }}
                  >
                    Share This Challenge
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengePickerDialog;
