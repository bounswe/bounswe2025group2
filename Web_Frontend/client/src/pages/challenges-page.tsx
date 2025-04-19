import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  targetValue: number;
  type: string;
  unit: string;
  participants: Array<{
    userId: string;
    progress: number;
  }>;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin: () => void;
  onUpdateProgress: (value: number) => void;
  hasJoined: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onJoin, onUpdateProgress, hasJoined }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const getUserProgress = (challengeId: string) => {
    const participant = challenge.participants.find(p => p.userId === "currentUserId"); // Replace with actual user ID
    return participant ? (participant.progress / challenge.targetValue) * 100 : 0;
  };

  const updateProgressMutation = useMutation({
    mutationFn: async (newProgress: number) => {
      const res = await apiRequest(
        "POST", 
        `/api/challenges/${challenge.id}/progress`,
        { progress: newProgress }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setProgress(progress);
    }
  });

  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
    onUpdateProgress(newProgress);
    updateProgressMutation.mutate(newProgress);
  };

  const joinChallengeMutation = useMutation({
    mutationFn: async () => {
      // This should be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onJoin();
    }
  });

  return (
    <Card className={cn(
      "bg-nav-bg border",
      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn(
            "bg-nav-bg border",
            theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
          )}>
            {challenge.type}
          </Badge>
          <div className="flex items-center gap-2">
            <Calendar className={cn(
              "h-4 w-4",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>
              {formatDate(challenge.startDate)}
            </span>
          </div>
        </div>
        <CardTitle className={cn(
          "text-lg font-semibold mt-2",
          theme === 'dark' ? 'text-white' : 'text-[#800000]'
        )}>
          {challenge.title}
        </CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <Trophy className={cn(
              "h-4 w-4",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>
              {challenge.targetValue} {challenge.unit}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className={cn(
              "h-4 w-4",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>
              {challenge.participants.length} participants
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasJoined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Your Progress</span>
                <span className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>
                  {getUserProgress(challenge.id.toString())}/{challenge.targetValue} {challenge.unit}
                </span>
              </div>
              <Progress 
                value={getUserProgress(challenge.id.toString())}
                className={cn(
                  "h-2",
                  theme === 'dark' 
                    ? 'bg-background [&>[role=progressbar]]:bg-[#e18d58]' 
                    : 'bg-background [&>[role=progressbar]]:bg-[#800000]'
                )}
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {hasJoined ? (
          <Button 
            className={cn(
              "w-full bg-nav-bg",
              theme === 'dark' 
                ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                : 'border-[#800000] text-[#800000] hover:bg-active'
            )}
            onClick={() => handleProgressUpdate(getUserProgress(challenge.id.toString()))}
          >
            Update Progress
          </Button>
        ) : (
          <Button 
            className={cn(
              "w-full bg-nav-bg",
              theme === 'dark' 
                ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                : 'border-[#800000] text-[#800000] hover:bg-active'
            )}
            onClick={() => joinChallengeMutation.mutate()}
            disabled={joinChallengeMutation.isPending}
          >
            {joinChallengeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Join Challenge
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

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
  
  const { theme } = useTheme();
  
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

  const handleUpdateProgress = (challengeId: number) => {
    if (!progressValue || isNaN(parseFloat(progressValue))) return;
    
    updateProgressMutation.mutate({
      challengeId,
      progress: parseFloat(progressValue)
    });
  };

  const handleJoinChallenge = (challengeId: number) => {
    joinChallengeMutation.mutate(challengeId);
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

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="challenges" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className={cn(
                  "text-2xl font-semibold",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Fitness Challenges</h2>
                <p className={cn(
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>Compete with others and track your progress</p>
              </div>
              
              <Button 
                onClick={() => setNewChallengeOpen(true)}
                className={cn(
                  "bg-nav-bg",
                  theme === 'dark' 
                    ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                    : 'border-[#800000] text-[#800000] hover:bg-active'
                )}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Challenge
              </Button>
            </div>
            
            {/* Challenge Tabs */}
            <Tabs defaultValue="active" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className={cn(
                "bg-nav-bg w-full border rounded-lg p-1",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <TabsTrigger 
                  value="active"
                  className={cn(
                    "flex-1 data-[state=active]:bg-[#800000] data-[state=active]:text-white",
                    theme === 'dark' 
                      ? 'text-white data-[state=active]:bg-[#e18d58]' 
                      : 'text-[#800000]'
                  )}
                >
                  Active
                </TabsTrigger>
                <TabsTrigger 
                  value="upcoming"
                  className={cn(
                    "flex-1 data-[state=active]:bg-[#800000] data-[state=active]:text-white",
                    theme === 'dark' 
                      ? 'text-white data-[state=active]:bg-[#e18d58]' 
                      : 'text-[#800000]'
                  )}
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className={cn(
                    "flex-1 data-[state=active]:bg-[#800000] data-[state=active]:text-white",
                    theme === 'dark' 
                      ? 'text-white data-[state=active]:bg-[#e18d58]' 
                      : 'text-[#800000]'
                  )}
                >
                  Completed
                </TabsTrigger>
                <TabsTrigger 
                  value="all"
                  className={cn(
                    "flex-1 data-[state=active]:bg-[#800000] data-[state=active]:text-white",
                    theme === 'dark' 
                      ? 'text-white data-[state=active]:bg-[#e18d58]' 
                      : 'text-[#800000]'
                  )}
                >
                  All Challenges
                </TabsTrigger>
              </TabsList>
              
              {/* Challenge Grid */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className={cn(
                    "h-8 w-8 animate-spin",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )} />
                </div>
              ) : filteredChallenges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredChallenges.map((challenge: any) => (
                    <ChallengeCard 
                      key={challenge.id} 
                      challenge={challenge}
                      onJoin={() => handleJoinChallenge(challenge.id)}
                      onUpdateProgress={(value) => {
                        setUpdateProgressOpen(challenge.id);
                      }}
                      hasJoined={hasJoinedChallenge(challenge.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className={cn(
                  "text-center py-12 bg-nav-bg rounded-xl border",
                  theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
                )}>
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      "bg-background h-16 w-16 rounded-full flex items-center justify-center border",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <Trophy className={cn(
                        "h-8 w-8",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                    </div>
                  </div>
                  <h3 className={cn(
                    "text-lg font-medium mb-2",
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>No active Challenges Found</h3>
                  <p className={cn(
                    "max-w-md mx-auto mb-6",
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                  )}>
                    There are no active challenges at the moment.
                  </p>
                </div>
              )}
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
