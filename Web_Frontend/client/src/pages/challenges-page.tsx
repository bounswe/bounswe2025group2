import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Plus, 
  Medal,
  Calendar,
  Users,
  Clock,
  Trophy,
  UserPlus,
  BarChart2
} from "lucide-react";

export default function ChallengesPage() {
  const { user } = useAuth();
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [updateProgressOpen, setUpdateProgressOpen] = useState<number | null>(null);
  const [progressValue, setProgressValue] = useState<string>("");
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    type: "steps",
    targetValue: 10000,
    unit: "steps",
    startDate: "",
    endDate: ""
  });
  
  // Format date to YYYY-MM-DD
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Set default dates for new challenge
  useState(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setNewChallenge(prev => ({
      ...prev,
      startDate: formatDateForInput(today),
      endDate: formatDateForInput(nextWeek)
    }));
  });

  // Fetch all challenges
  const { data: challenges, isLoading } = useQuery({
    queryKey: ["/api/challenges"],
    queryFn: async () => {
      const res = await fetch("/api/challenges");
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return res.json();
    },
  });

  // Fetch challenge participants for leaderboards
  const { data: participants, isLoading: participantsLoading } = useQuery({
    queryKey: ["/api/challenges/participants"],
    queryFn: async () => {
      const res = await fetch("/api/challenges/participants");
      if (!res.ok) throw new Error("Failed to fetch participants");
      return res.json();
    },
  });

  // Create new challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (challengeData: any) => {
      // Convert string dates to Date objects before sending to server
      const formattedData = {
        ...challengeData,
        startDate: challengeData.startDate ? new Date(challengeData.startDate) : new Date(),
        endDate: challengeData.endDate ? new Date(challengeData.endDate) : new Date()
      };
      
      const res = await apiRequest("POST", "/api/challenges", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setNewChallengeOpen(false);
      resetNewChallengeForm();
    }
  });

  // Join challenge mutation
  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/join`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/participants"] });
    }
  });

  // Update challenge progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ challengeId, progress }: { challengeId: number, progress: number }) => {
      const res = await apiRequest("PATCH", `/api/challenges/${challengeId}/progress`, { progress });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/participants"] });
      setUpdateProgressOpen(null);
      setProgressValue("");
    }
  });

  const handleCreateChallenge = () => {
    createChallengeMutation.mutate({
      ...newChallenge,
      creatorId: user?.id
    });
  };

  const resetNewChallengeForm = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setNewChallenge({
      title: "",
      description: "",
      type: "steps",
      targetValue: 10000,
      unit: "steps",
      startDate: formatDateForInput(today),
      endDate: formatDateForInput(nextWeek)
    });
  };

  const handleJoinChallenge = (challengeId: number) => {
    joinChallengeMutation.mutate(challengeId);
  };

  const handleUpdateProgress = (challengeId: number) => {
    if (!progressValue || isNaN(parseFloat(progressValue))) return;
    
    updateProgressMutation.mutate({
      challengeId,
      progress: parseFloat(progressValue)
    });
  };

  // Filter challenges based on active tab
  const filteredChallenges = challenges ? challenges.filter((challenge: any) => {
    if (activeTab === "active") return challenge.status === "active";
    if (activeTab === "completed") return challenge.status === "completed";
    if (activeTab === "upcoming") {
      const startDate = new Date(challenge.startDate);
      return startDate > new Date() && challenge.status === "active";
    }
    return true; // all tab
  }) : [];

  // Check if user has joined a challenge
  const hasJoinedChallenge = (challengeId: number) => {
    if (!participants) return false;
    return participants.some((p: any) => 
      p.challengeId === challengeId && p.userId === user?.id
    );
  };

  // Get user's progress in a challenge
  const getUserProgress = (challengeId: number) => {
    if (!participants) return 0;
    const participation = participants.find((p: any) => 
      p.challengeId === challengeId && p.userId === user?.id
    );
    return participation ? participation.progress : 0;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="challenges" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-secondary-dark">Fitness Challenges</h2>
                <p className="text-muted-foreground">Compete with others and track your progress</p>
              </div>
              
              <Button 
                className="bg-secondary text-white hover:bg-secondary-dark"
                onClick={() => setNewChallengeOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </div>
            
            {/* Challenges Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All Challenges</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                  </div>
                ) : filteredChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredChallenges.map((challenge: any) => (
                      <ChallengeCard 
                        key={challenge.id} 
                        challenge={challenge}
                        hasJoined={hasJoinedChallenge(challenge.id)}
                        userProgress={getUserProgress(challenge.id)}
                        onJoin={handleJoinChallenge}
                        onUpdateProgress={() => setUpdateProgressOpen(challenge.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <div className="flex justify-center mb-4">
                      <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No {activeTab} Challenges Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {activeTab === "active" && "There are no active challenges at the moment."}
                      {activeTab === "upcoming" && "There are no upcoming challenges scheduled."}
                      {activeTab === "completed" && "There are no completed challenges yet."}
                      {activeTab === "all" && "There are no challenges available. Be the first to create one!"}
                    </p>
                    <Button 
                      className="bg-secondary text-white hover:bg-secondary-dark"
                      onClick={() => setNewChallengeOpen(true)}
                    >
                      Create a Challenge
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="challenges" />
      
      {/* Create New Challenge Dialog */}
      <Dialog open={newChallengeOpen} onOpenChange={setNewChallengeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a New Challenge</DialogTitle>
            <DialogDescription>
              Create a fitness challenge for the community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Challenge Title</Label>
              <Input
                id="title"
                placeholder="E.g., Weekly Step Count Challenge"
                value={newChallenge.title}
                onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your challenge"
                value={newChallenge.description}
                onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Challenge Type</Label>
              <Select 
                value={newChallenge.type}
                onValueChange={(value) => {
                  const unitMap: Record<string, string> = {
                    steps: "steps",
                    distance: "miles",
                    workout: "minutes",
                    calories: "calories"
                  };
                  setNewChallenge({
                    ...newChallenge, 
                    type: value,
                    unit: unitMap[value] || "units"
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select challenge type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steps">Step Count</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="workout">Workout Time</SelectItem>
                  <SelectItem value="calories">Calories Burned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  value={newChallenge.targetValue}
                  onChange={(e) => setNewChallenge({
                    ...newChallenge, 
                    targetValue: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select 
                  value={newChallenge.unit}
                  onValueChange={(value) => setNewChallenge({...newChallenge, unit: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {newChallenge.type === "steps" && (
                      <SelectItem value="steps">Steps</SelectItem>
                    )}
                    {newChallenge.type === "distance" && (
                      <>
                        <SelectItem value="miles">Miles</SelectItem>
                        <SelectItem value="kilometers">Kilometers</SelectItem>
                      </>
                    )}
                    {newChallenge.type === "workout" && (
                      <>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                      </>
                    )}
                    {newChallenge.type === "calories" && (
                      <SelectItem value="calories">Calories</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newChallenge.startDate}
                  onChange={(e) => setNewChallenge({...newChallenge, startDate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newChallenge.endDate}
                  onChange={(e) => setNewChallenge({...newChallenge, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChallengeOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-secondary text-white hover:bg-secondary-dark"
              onClick={handleCreateChallenge}
              disabled={
                createChallengeMutation.isPending || 
                !newChallenge.title || 
                !newChallenge.type || 
                !newChallenge.targetValue ||
                !newChallenge.startDate ||
                !newChallenge.endDate
              }
            >
              {createChallengeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : "Create Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Progress Dialog */}
      <Dialog
        open={updateProgressOpen !== null}
        onOpenChange={(open) => !open && setUpdateProgressOpen(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Challenge Progress</DialogTitle>
            <DialogDescription>
              Enter your current progress for this challenge
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {updateProgressOpen !== null && challenges && (
              <>
                <div className="text-center">
                  <h3 className="font-medium text-lg">
                    {challenges.find((c: any) => c.id === updateProgressOpen)?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Target: {challenges.find((c: any) => c.id === updateProgressOpen)?.targetValue}{' '}
                    {challenges.find((c: any) => c.id === updateProgressOpen)?.unit}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="progress">Your Current Progress</Label>
                  <Input
                    id="progress"
                    type="number"
                    placeholder={`Enter your current progress in ${challenges.find((c: any) => c.id === updateProgressOpen)?.unit}`}
                    value={progressValue}
                    onChange={(e) => setProgressValue(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateProgressOpen(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-secondary text-white hover:bg-secondary-dark"
              onClick={() => updateProgressOpen && handleUpdateProgress(updateProgressOpen)}
              disabled={
                updateProgressMutation.isPending || 
                !progressValue || 
                isNaN(parseFloat(progressValue))
              }
            >
              {updateProgressMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : "Update Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChallengeCard({ 
  challenge, 
  hasJoined, 
  userProgress,
  onJoin,
  onUpdateProgress
}: { 
  challenge: any;
  hasJoined: boolean;
  userProgress: number;
  onJoin: (challengeId: number) => void;
  onUpdateProgress: () => void;
}) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Calculate challenge progress percentage
  const progressPercentage = Math.min(
    Math.round((userProgress / challenge.targetValue) * 100),
    100
  );

  // Calculate days remaining
  const getDaysRemaining = () => {
    const end = new Date(challenge.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();
  
  // Check if challenge is active
  const isActive = () => {
    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    
    return now >= start && now <= end && challenge.status === "active";
  };

  // Mock leaderboard data (replace with real data)
  const leaderboardData = [
    { rank: 1, username: "JohnDoe", progress: 8500, profileImage: "" },
    { rank: 2, username: "FitnessFan22", progress: 7200, profileImage: "" },
    { rank: 3, username: "RunnerGirl", progress: 6800, profileImage: "" },
    { rank: 4, username: "SportsMaster", progress: 5500, profileImage: "" },
    { rank: 5, username: "ActiveKid", progress: 4200, profileImage: "" }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <div className="mt-1 flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Badge variant={challenge.status === "active" ? "default" : "outline"}>
            {challenge.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground mb-4">{challenge.description}</p>
        
        <div className="bg-muted p-3 rounded-md grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Target</div>
            <div className="font-semibold">
              {challenge.targetValue} <span className="text-xs">{challenge.unit}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Participants</div>
            <div className="font-semibold">
              {challenge.participantCount || "24"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Time Left</div>
            <div className="font-semibold">
              {daysRemaining} <span className="text-xs">days</span>
            </div>
          </div>
        </div>
        
        {hasJoined && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span>Your Progress</span>
              <span>{userProgress} / {challenge.targetValue} {challenge.unit}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        
        {showLeaderboard && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
              Leaderboard
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {leaderboardData.map((entry, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded-md bg-background text-sm"
                >
                  <div className="flex items-center">
                    <span className="w-5 font-medium">{entry.rank}</span>
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={entry.profileImage} />
                      <AvatarFallback>{entry.username[0]}</AvatarFallback>
                    </Avatar>
                    <span>{entry.username}</span>
                  </div>
                  <span>{entry.progress} {challenge.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="w-full flex gap-2">
          {!hasJoined ? (
            <Button 
              className="flex-1 bg-secondary text-white hover:bg-secondary-dark"
              onClick={() => onJoin(challenge.id)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Join Challenge
            </Button>
          ) : isActive() ? (
            <Button 
              className="flex-1 bg-secondary text-white hover:bg-secondary-dark"
              onClick={onUpdateProgress}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Update Progress
            </Button>
          ) : (
            <Button 
              className="flex-1"
              variant="outline"
              disabled
            >
              {new Date() < new Date(challenge.startDate) 
                ? "Starting soon" 
                : "Challenge ended"}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="flex-1"
          >
            {showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
