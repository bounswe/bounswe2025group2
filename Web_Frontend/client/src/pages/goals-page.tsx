import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import GoalProgress from "@/components/goals/goal-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  Target, 
  TrendingUp, 
  Medal,
  Calendar,
  BarChart2
} from "lucide-react";

export default function GoalsPage() {
  const { user } = useAuth();
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [newGoal, setNewGoal] = useState({
    title: "",
    type: "walking",
    targetValue: 5,
    unit: "miles",
    endDate: "",
    mentorId: undefined as number | undefined
  });
  
  // Fetch user goals
  const { data: goals, isLoading } = useQuery({
    queryKey: ["/api/goals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
  });

  // Fetch available mentors
  const { data: mentors } = useQuery({
    queryKey: ["/api/users/mentors"],
    queryFn: async () => {
      const res = await fetch("/api/users/mentors");
      if (!res.ok) throw new Error("Failed to fetch mentors");
      return res.json();
    },
  });

  // Create new goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      // Convert string dates to Date objects before sending to server
      const formattedData = {
        ...goalData,
        endDate: goalData.endDate ? new Date(goalData.endDate) : undefined
      };
      
      const res = await apiRequest("POST", "/api/goals", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setNewGoalOpen(false);
      resetNewGoalForm();
    }
  });

  // Update goal progress mutation
  const updateGoalProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: number, progress: number }) => {
      const res = await apiRequest("PATCH", `/api/goals/${id}/progress`, { progress });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    }
  });

  const handleCreateGoal = () => {
    createGoalMutation.mutate({
      ...newGoal,
      userId: user?.id
    });
  };

  const resetNewGoalForm = () => {
    setNewGoal({
      title: "",
      type: "walking",
      targetValue: 5,
      unit: "miles",
      endDate: "",
      mentorId: undefined
    });
  };

  const handleUpdateProgress = (id: number, currentValue: number, newProgress: number) => {
    updateGoalProgressMutation.mutate({
      id,
      progress: currentValue + newProgress
    });
  };

  // Filter goals based on active tab
  const filteredGoals = goals ? goals.filter((goal: any) => {
    if (activeTab === "active") return goal.status === "active";
    if (activeTab === "completed") return goal.status === "completed";
    if (activeTab === "paused") return goal.status === "paused";
    return true; // all tab
  }) : [];

  // Get goal-related stats
  const activeGoalsCount = goals ? goals.filter((g: any) => g.status === "active").length : 0;
  const completedGoalsCount = goals ? goals.filter((g: any) => g.status === "completed").length : 0;
  const totalGoalsCount = goals ? goals.length : 0;
  const completionRate = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="goals" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-secondary-dark">My Fitness Goals</h2>
                <p className="text-muted-foreground">Track and manage your personal fitness journey</p>
              </div>
              
              <Button 
                className="bg-secondary text-white hover:bg-secondary-dark"
                onClick={() => setNewGoalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Set New Goal
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="bg-primary p-2 rounded-full mr-4">
                      <Target className="h-5 w-5 text-secondary-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Goals</p>
                      <h3 className="text-2xl font-bold">{activeGoalsCount}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="bg-primary p-2 rounded-full mr-4">
                      <Medal className="h-5 w-5 text-secondary-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <h3 className="text-2xl font-bold">{completedGoalsCount}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="bg-primary p-2 rounded-full mr-4">
                      <TrendingUp className="h-5 w-5 text-secondary-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <h3 className="text-2xl font-bold">{completionRate}%</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="bg-primary p-2 rounded-full mr-4">
                      <Calendar className="h-5 w-5 text-secondary-dark" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Streak</p>
                      <h3 className="text-2xl font-bold">7 days</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Goals Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="paused">Paused</TabsTrigger>
                <TabsTrigger value="all">All Goals</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                  </div>
                ) : filteredGoals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGoals.map((goal: any) => (
                      <GoalCard 
                        key={goal.id} 
                        goal={goal} 
                        onUpdateProgress={handleUpdateProgress}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <div className="flex justify-center mb-4">
                      <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center">
                        <Target className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No {activeTab} Goals Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {activeTab === "active" && "You don't have any active goals. Set a new fitness goal to start tracking your progress."}
                      {activeTab === "completed" && "You haven't completed any goals yet. Keep working on your active goals!"}
                      {activeTab === "paused" && "You don't have any paused goals."}
                      {activeTab === "all" && "You haven't set any fitness goals yet. Start by setting your first goal."}
                    </p>
                    <Button 
                      className="bg-secondary text-white hover:bg-secondary-dark"
                      onClick={() => setNewGoalOpen(true)}
                    >
                      Set New Goal
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="goals" />
      
      {/* Create New Goal Dialog */}
      <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set a New Fitness Goal</DialogTitle>
            <DialogDescription>
              Define your fitness goal and track your progress
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                placeholder="E.g., Weekly Running Goal"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Goal Type</Label>
              <Select 
                value={newGoal.type}
                onValueChange={(value) => {
                  const unitMap: Record<string, string> = {
                    walking: "miles",
                    running: "miles",
                    workout: "hours",
                    cycling: "miles",
                    swimming: "laps",
                    sports: "hours"
                  };
                  setNewGoal({
                    ...newGoal, 
                    type: value,
                    unit: unitMap[value] || "miles"
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="workout">Workout</SelectItem>
                  <SelectItem value="cycling">Cycling</SelectItem>
                  <SelectItem value="swimming">Swimming</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="target">Target Value: {newGoal.targetValue} {newGoal.unit}</Label>
              </div>
              <Slider
                id="target"
                defaultValue={[5]}
                min={1}
                max={newGoal.unit === "hours" ? 20 : 50}
                step={1}
                onValueChange={(values) => setNewGoal({...newGoal, targetValue: values[0]})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select 
                value={newGoal.unit}
                onValueChange={(value) => setNewGoal({...newGoal, unit: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {newGoal.type === "walking" || newGoal.type === "running" || newGoal.type === "cycling" ? (
                    <>
                      <SelectItem value="miles">Miles</SelectItem>
                      <SelectItem value="kilometers">Kilometers</SelectItem>
                      <SelectItem value="steps">Steps</SelectItem>
                    </>
                  ) : newGoal.type === "workout" || newGoal.type === "sports" ? (
                    <>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="sessions">Sessions</SelectItem>
                    </>
                  ) : newGoal.type === "swimming" ? (
                    <>
                      <SelectItem value="laps">Laps</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="units">Units</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Target End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={newGoal.endDate}
                onChange={(e) => setNewGoal({...newGoal, endDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mentor">Assign a Mentor (Optional)</Label>
              <Select 
                value={newGoal.mentorId?.toString() || "none"}
                onValueChange={(value) => setNewGoal({
                  ...newGoal, 
                  mentorId: value !== "none" ? parseInt(value) : undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mentor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No mentor</SelectItem>
                  {mentors && mentors.map((mentor: any) => (
                    <SelectItem key={mentor.id} value={mentor.id.toString()}>
                      {mentor.name || mentor.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGoalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-secondary text-white hover:bg-secondary-dark"
              onClick={handleCreateGoal}
              disabled={createGoalMutation.isPending || !newGoal.title || !newGoal.type || !newGoal.unit}
            >
              {createGoalMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalCard({ 
  goal, 
  onUpdateProgress 
}: { 
  goal: any;
  onUpdateProgress: (id: number, currentValue: number, newProgress: number) => void;
}) {
  const [progressInput, setProgressInput] = useState<string>("");
  const [progressModalOpen, setProgressModalOpen] = useState(false);

  const handleAddProgress = () => {
    if (!progressInput || isNaN(parseFloat(progressInput))) return;
    
    onUpdateProgress(goal.id, goal.currentValue, parseFloat(progressInput));
    setProgressInput("");
    setProgressModalOpen(false);
  };

  const progressPercentage = Math.min(
    Math.round((goal.currentValue / goal.targetValue) * 100),
    100
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!goal.endDate) return null;
    
    const end = new Date(goal.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{goal.title}</CardTitle>
            <CardDescription>
              <div className="flex items-center mt-1">
                <span className="capitalize">{goal.type}</span>
                <span className="mx-2">•</span>
                <Badge variant={goal.status === "completed" ? "default" : "outline"}>
                  {goal.status}
                </Badge>
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center">
            {goal.mentorId && (
              <Badge variant="secondary" className="mr-2">
                Mentor Assigned
              </Badge>
            )}
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <GoalProgress goal={goal} />
        
        <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
          <div>
            {daysRemaining !== null && (
              <span>{daysRemaining} days left</span>
            )}
            {goal.endDate && !daysRemaining && (
              <span>Due {formatDate(goal.endDate)}</span>
            )}
          </div>
          <div>
            {progressPercentage}% complete
          </div>
        </div>
        
        {goal.status === "active" && (
          <div className="mt-4 flex gap-2">
            <Dialog open={progressModalOpen} onOpenChange={setProgressModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary text-white hover:bg-secondary-dark">
                  Update Progress
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Update Goal Progress</DialogTitle>
                  <DialogDescription>
                    Add your progress towards "{goal.title}"
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{goal.currentValue}</div>
                      <div className="text-sm text-muted-foreground">Current</div>
                    </div>
                    <div className="text-2xl">+</div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder={`Add ${goal.unit}`}
                        value={progressInput}
                        onChange={(e) => setProgressInput(e.target.value)}
                      />
                    </div>
                    <div className="text-2xl">=</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(parseFloat(progressInput) || 0) + goal.currentValue}
                      </div>
                      <div className="text-sm text-muted-foreground">New Total</div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div className="font-medium mb-1">Goal Details:</div>
                    <div className="flex justify-between">
                      <span>Target:</span>
                      <span>{goal.targetValue} {goal.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span>{Math.max(0, goal.targetValue - goal.currentValue)} {goal.unit}</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setProgressModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-secondary text-white hover:bg-secondary-dark"
                    onClick={handleAddProgress}
                    disabled={!progressInput || isNaN(parseFloat(progressInput))}
                  >
                    Add Progress
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
