import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useChallenges } from '../../lib';
import { useJoinChallenge, useLeaveChallenge } from '../../lib/hooks/useChallenges';
import { Layout } from '../../components';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import type { Challenge } from '../../lib/types/api';
import { Plus, Save, Trophy, Users } from 'lucide-react';
import ChallengeCard from './ChallengeCard';
import ChallengeFormDialog from './ChallengeFormDialog';
import ProgressUpdateDialog from './ProgressUpdateDialog';
import ChallengeDetailModal from './ChallengeDetailModal';
import './challenges_page.css';

// Helper function to format dates (copied from GoalPage) - TODO: Use when implementing date displays
// const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) {
//         return 'Invalid date';
//     }
//     return new Intl.DateTimeFormat('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric'
//     }).format(date);
// };

// Helper function to calculate progress percentage (copied from GoalPage)
const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
};

// Challenge tab options for filtering (adapted from GOAL_TAB_OPTIONS)
const getChallengeTabOptions = (isCoach: boolean) => {
    const baseTabs = [
        { key: 'ALL', label: 'All Challenges' },
        { key: 'JOINED', label: 'Joined' },
        { key: 'ACTIVE', label: 'Active' },
        { key: 'INACTIVE', label: 'Inactive' },
        { key: 'COMPLETED', label: 'Completed' }
    ];

    if (isCoach) {
        baseTabs.splice(1, 0, { key: 'MY_CHALLENGES', label: 'My Challenges' });
    }

    return baseTabs;
};

const ChallengesPage = () => {
    const { isAuthenticated, isLoading: authLoading, user } = useIsAuthenticated();
    const navigate = useNavigate();
    const { data: challenges = [], isLoading: challengesLoading, error: challengesError } = useChallenges();

    const joinChallengeMutation = useJoinChallenge();
    const leaveChallengeMutation = useLeaveChallenge();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [activeChallengeTab, setActiveChallengeTab] = useState('ALL');

    // Check if user is a coach
    const isCoach = Boolean(user?.user_type === 'Coach' || user?.is_verified_coach);

    if (authLoading) {
        return <div className="challenge-page-loading">Loading...</div>;
    }

    if (!isAuthenticated) {
        navigate('/auth');
        return null;
    }

    const handleEdit = (challenge: Challenge) => {
        setEditingChallenge(challenge);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingChallenge(null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingChallenge(null);
    };

    // handleDeleteChallenge function removed as it's not used in this component
    // Delete functionality is handled within ChallengeFormDialog

    const handleJoinChallenge = async (challengeId: number) => {
        // Find the challenge to debug
        const challenge = challenges.find(c => c.id === challengeId);
        console.log('Attempting to join challenge:', {
            id: challengeId,
            title: challenge?.title,
            is_active: challenge?.is_active,
            start_date: challenge?.start_date,
            end_date: challenge?.end_date,
            current_time: new Date().toISOString()
        });

        try {
            await joinChallengeMutation.mutateAsync(challengeId);
        } catch (error: unknown) {
            console.error('Failed to join challenge:', error);
            // Extract more detailed error message from the API response
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            let errorMessage = 'Failed to join challenge. Please try again.';

            if (err?.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            alert(errorMessage);
        }
    };

    const handleLeaveChallenge = async (challengeId: number) => {
        if (!confirm('Are you sure you want to leave this challenge?')) {
            return;
        }

        try {
            await leaveChallengeMutation.mutateAsync(challengeId);
        } catch (error: unknown) {
            console.error('Failed to leave challenge:', error);
            // Extract more detailed error message from the API response
            const err = error as { response?: { data?: { detail?: string } }; message?: string };
            let errorMessage = 'Failed to leave challenge. Please try again.';

            if (err?.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            alert(errorMessage);
        }
    };

    const openProgressDialog = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsProgressDialogOpen(true);
    };

    const handleCloseProgress = () => {
        setIsProgressDialogOpen(false);
        setSelectedChallenge(null);
    };

    const openDetailModal = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailModalOpen(false);
        setSelectedChallenge(null);
    };

    // Helper function to determine challenge status based on dates and backend is_active
    const getChallengeStatus = (challenge: Challenge) => {
        const now = new Date();
        const startDate = new Date(challenge.start_date);
        const endDate = new Date(challenge.end_date);

        if (now < startDate) {
            return 'UPCOMING';
        } else if (now > endDate) {
            return 'INACTIVE'; // Challenge has ended (was previously "COMPLETED")
        } else if (challenge.is_active) {
            return 'ACTIVE';
        } else {
            return 'INACTIVE';
        }
    };

    // Helper function to check if user successfully completed a challenge
    const isUserCompleted = (challenge: Challenge) => {
        return challenge.is_joined && 
               (challenge.user_progress || 0) >= challenge.target_value;
    };

    // Calculate progress for challenges and group them by status (adapted from GoalPage)
    const challengesWithProgress = challenges.map(challenge => ({
        ...challenge,
        progress: challenge.user_progress ? calculateProgress(challenge.user_progress, challenge.target_value) : 0,
        progress_percentage: challenge.user_progress ? calculateProgress(challenge.user_progress, challenge.target_value) : 0,
        status: getChallengeStatus(challenge) // Add calculated status
    }));

    const groupedChallenges = challengesWithProgress.reduce((acc, challenge) => {
        // Group by different criteria for challenges
        if (challenge.is_joined) {
            if (!acc['JOINED']) acc['JOINED'] = [];
            acc['JOINED'].push(challenge);
        }

        // Group challenges created by current coach
        if (isCoach && user && challenge.coach === user.id) {
            if (!acc['MY_CHALLENGES']) acc['MY_CHALLENGES'] = [];
            acc['MY_CHALLENGES'].push(challenge);
        }

        // Group challenges user has successfully completed
        if (isUserCompleted(challenge)) {
            if (!acc['COMPLETED']) acc['COMPLETED'] = [];
            acc['COMPLETED'].push(challenge);
        }

        // Group by calculated status
        const status = challenge.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(challenge);
        return acc;
    }, {} as { [key: string]: typeof challengesWithProgress });

    // Filter challenges based on active tab (adapted from GoalPage)
    const getFilteredChallenges = () => {
        if (activeChallengeTab === 'ALL') {
            return challengesWithProgress;
        }
        return groupedChallenges[activeChallengeTab] || [];
    };

    const filteredChallenges = getFilteredChallenges();

    // Calculate statistics (adapted from GoalPage)
    const totalChallenges = challenges.length;
    const joinedChallenges = challenges.filter(challenge => challenge.is_joined).length;
    const completedChallenges = challengesWithProgress.filter(challenge => isUserCompleted(challenge)).length;
    const myChallenges = isCoach && user ? challenges.filter(challenge => challenge.coach === user.id).length : 0;

    return (
        <Layout>
            <div className="challenge-page-content">
                <div className="section-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h1 className="page-title">Challenges</h1>
                            <p className="page-subtitle">Join fitness challenges and compete with the community</p>
                        </div>
                        {isCoach && (
                            <Button onClick={handleAddNew} className="add-challenge-btn" size={"xl"}>
                                <Plus className="w-4 h-4" />
                                Create Challenge
                            </Button>
                        )}
                    </div>
                </div>

                {/* Statistics Section (adapted from GoalPage) */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <CardHeader className="stat-card-header">
                            <Trophy className="stat-icon w-6 h-6 mr-4" />
                            <CardTitle className="stat-title">Total Challenges</CardTitle>
                        </CardHeader>
                        <CardContent className="stat-content">
                            <div className="stat-value">{totalChallenges}</div>
                        </CardContent>
                    </Card>
                    <Card className="stat-card">
                        <CardHeader className="stat-card-header">
                            <Users className="stat-icon w-6 h-6 mr-4" />
                            <CardTitle className="stat-title">Joined</CardTitle>
                        </CardHeader>
                        <CardContent className="stat-content">
                            <div className="stat-value">{joinedChallenges}</div>
                        </CardContent>
                    </Card>
                    {isCoach && (
                        <Card className="stat-card">
                            <CardHeader className="stat-card-header">
                                <Plus className="stat-icon w-6 h-6 mr-4" />
                                <CardTitle className="stat-title">My Challenges</CardTitle>
                            </CardHeader>
                            <CardContent className="stat-content">
                                <div className="stat-value">{myChallenges}</div>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="stat-card">
                        <CardHeader className="stat-card-header">
                            <Save className="stat-icon w-6 h-6 mr-4" />
                            <CardTitle className="stat-title">Completed</CardTitle>
                        </CardHeader>
                        <CardContent className="stat-content">
                            <div className="stat-value">{completedChallenges}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Challenge Form Dialog */}
                <ChallengeFormDialog
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    editingChallenge={editingChallenge}
                />

                {/* Progress Update Dialog */}
                <ProgressUpdateDialog
                    isOpen={isProgressDialogOpen}
                    onClose={handleCloseProgress}
                    selectedChallenge={selectedChallenge}
                />

                {/* Challenge Detail Modal */}
                <ChallengeDetailModal 
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetail}
                    challenge={selectedChallenge}
                    user={user || undefined}
                />

                {challengesLoading && <div className="challenge-page-loading">Loading challenges...</div>}
                {challengesError && <div className="challenge-page-error">Failed to load challenges.</div>}

                {/* Challenge Status Tabs (adapted from GoalPage) */}
                {challenges.length > 0 && (
                    <div className="challenge-tabs">
                        {getChallengeTabOptions(isCoach).map(tab => (
                            <button
                                key={tab.key}
                                className={`challenge-tab ${activeChallengeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveChallengeTab(tab.key)}
                            >
                                {tab.label}
                                {tab.key !== 'ALL' && groupedChallenges[tab.key] && (
                                    <span className="challenge-count">({groupedChallenges[tab.key].length})</span>
                                )}
                                {tab.key === 'ALL' && (
                                    <span className="challenge-count">({challengesWithProgress.length})</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {challenges.length === 0 && !challengesLoading ? (
                    <div className="empty-state">
                        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No challenges yet</h3>
                        <p className="text-muted-foreground mb-4">
                            {isCoach
                                ? 'Create your first challenge to engage the community!'
                                : 'Check back later for new challenges to join!'
                            }
                        </p>
                        {isCoach && (
                            <Button onClick={handleAddNew}>
                                <Plus className="w-4 h-4" />
                                Create Your First Challenge
                            </Button>
                        )}
                    </div>
                ) : filteredChallenges.length === 0 ? (
                    <div className="empty-state">
                        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {activeChallengeTab === 'ALL' ? 'No challenges yet' :
                                activeChallengeTab === 'MY_CHALLENGES' ? 'No challenges created yet' :
                                activeChallengeTab === 'COMPLETED' ? 'No completed challenges yet' :
                                    `No ${activeChallengeTab.toLowerCase().replace('_', ' ')} challenges`}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {activeChallengeTab === 'ALL'
                                ? (isCoach ? 'Create your first challenge!' : 'Check back later for new challenges!')
                                : activeChallengeTab === 'MY_CHALLENGES'
                                    ? 'Create your first challenge to get started!'
                                    : activeChallengeTab === 'COMPLETED'
                                    ? 'Complete a challenge by reaching its target to see it here!'
                                    : `No ${activeChallengeTab.toLowerCase().replace('_', ' ')} challenges found.`
                            }
                        </p>
                        {(activeChallengeTab === 'ALL' || activeChallengeTab === 'MY_CHALLENGES') && isCoach && (
                            <Button onClick={handleAddNew}>
                                <Plus className="w-4 h-4" />
                                Create Your First Challenge
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="challenges-grid">
                        {filteredChallenges.map(challenge => (
                            <ChallengeCard
                                key={challenge.id}
                                challenge={challenge}
                                user={user || undefined}
                                onJoin={handleJoinChallenge}
                                onLeave={handleLeaveChallenge}
                                onEdit={handleEdit}
                                onViewDetails={openDetailModal}
                                onUpdateProgress={openProgressDialog}
                            />
                        ))}

                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ChallengesPage;