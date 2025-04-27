import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
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
  Plus, 
  Target, 
  TrendingUp, 
  Medal,
  Calendar,
  BarChart2
} from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

interface Goal {
  id: number;
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'active' | 'completed' | 'paused';
  endDate: string;
  progress: number;
  userId: number;
  daysRemaining?: number;
}

// MOCK DATA START - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION
const mockGoals: Goal[] = [
  {
    id: 1,
    title: "Run 5K",
    type: "running",
    targetValue: 5,
    currentValue: 3,
    unit: "kilometers",
    status: "active" as const,
    endDate: "2024-04-15",
    progress: 60,
    userId: 1
  },
  {
    id: 2,
    title: "Daily Steps",
    type: "walking",
    targetValue: 10000,
    currentValue: 7500,
    unit: "steps",
    status: "active" as const,
    endDate: "2024-04-30",
    progress: 75,
    userId: 1
  },
  {
    id: 3,
    title: "Swimming Distance",
    type: "swimming",
    targetValue: 1000,
    currentValue: 800,
    unit: "meters",
    status: "completed" as const,
    endDate: "2024-03-30",
    progress: 100,
    userId: 1
  }
];
// MOCK DATA END - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION

export default function GoalsPage() {
  const { user } = useAuth();
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [newGoal, setNewGoal] = useState({
    title: "",
    type: "walking",
    targetValue: 5,
    unit: "miles",
    endDate: "",
    mentorId: undefined as number | undefined
  });
  
  const { theme } = useTheme();

  const handleCreateGoal = () => {
    const goal: Goal = {
      id: goals.length + 1,
      title: newGoal.title,
      type: newGoal.type,
      targetValue: newGoal.targetValue,
      currentValue: 0,
      unit: newGoal.unit,
      status: 'active',
      endDate: newGoal.endDate,
      progress: 0,
      userId: user?.id || 1
    };
    
    setGoals([...goals, goal]);
    setNewGoalOpen(false);
    resetNewGoalForm();
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
    setGoals(goals.map(goal => {
      if (goal.id === id) {
        const updatedValue = currentValue + newProgress;
        const progress = Math.min((updatedValue / goal.targetValue) * 100, 100);
        return {
          ...goal,
          currentValue: updatedValue,
          progress,
          status: progress >= 100 ? 'completed' : 'active'
        };
      }
      return goal;
    }));
  };

  // Filter goals based on active tab
  const filteredGoals = goals.filter((goal) => {
    if (activeTab === "active") return goal.status === "active";
    if (activeTab === "completed") return goal.status === "completed";
    if (activeTab === "paused") return goal.status === "paused";
    return true; // all tab
  });

  // Get goal-related stats
  const activeGoalsCount = goals.filter(g => g.status === "active").length;
  const completedGoalsCount = goals.filter(g => g.status === "completed").length;
  const totalGoalsCount = goals.length;
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
                <h1 className={cn(
                  "text-2xl md:text-3xl font-bold",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>My Fitness Goals</h1>
                <p className={cn(
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>Track and manage your personal fitness journey</p>
              </div>
              
              <Button 
                className={cn(
                  "bg-nav-bg border font-bold",
                  theme === 'dark' 
                    ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                    : 'border-[#800000] text-[#800000] hover:bg-background'
                )}
                onClick={() => setNewGoalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Set New Goal
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className={cn(
                "bg-nav-bg",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className={cn(
                      "bg-background border p-2 rounded-full mr-4",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <Target className={cn(
                        "h-5 w-5",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                      )}>Active Goals</p>
                      <h3 className={cn(
                        "text-2xl font-bold",
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>{activeGoalsCount}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={cn(
                "bg-nav-bg",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className={cn(
                      "bg-background border p-2 rounded-full mr-4",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <Medal className={cn(
                        "h-5 w-5",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                      )}>Completed</p>
                      <h3 className={cn(
                        "text-2xl font-bold",
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>{completedGoalsCount}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={cn(
                "bg-nav-bg",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className={cn(
                      "bg-background border p-2 rounded-full mr-4",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <BarChart2 className={cn(
                        "h-5 w-5",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                      )}>Completion Rate</p>
                      <h3 className={cn(
                        "text-2xl font-bold",
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>{completionRate}%</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={cn(
                "bg-nav-bg",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className={cn(
                      "bg-background border p-2 rounded-full mr-4",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <TrendingUp className={cn(
                        "h-5 w-5",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                      )}>Active Streak</p>
                      <h3 className={cn(
                        "text-2xl font-bold",
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>7 days</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Goals Tabs */}
            <Tabs defaultValue="active" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className={cn(
                "bg-nav-bg w-full border rounded-lg p-1 mb-8",
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
                  value="paused"
                  className={cn(
                    "flex-1 data-[state=active]:bg-[#800000] data-[state=active]:text-white",
                    theme === 'dark' 
                      ? 'text-white data-[state=active]:bg-[#e18d58]' 
                      : 'text-[#800000]'
                  )}
                >
                  Paused
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
                  All Goals
                </TabsTrigger>
              </TabsList>

              {/* Goals Grid */}
              {filteredGoals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredGoals.map((goal) => (
                    <Card 
                      key={goal.id} 
                      className={cn(
                        "bg-nav-bg",
                        theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={cn(
                            "bg-nav-bg",
                            theme === 'dark' 
                              ? 'text-white border-[#e18d58]' 
                              : 'text-[#800000] border-[#800000]'
                          )}>
                            {goal.type}
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
                              {goal.daysRemaining} days left
                            </span>
                          </div>
                        </div>
                        <CardTitle className={cn(
                          "text-lg font-semibold mt-2",
                          theme === 'dark' ? 'text-white' : 'text-[#800000]'
                        )}>
                          {goal.title}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className={cn(
                  "text-center py-12 bg-nav-bg rounded-xl border",
                  theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                )}>
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      "bg-background h-16 w-16 rounded-full flex items-center justify-center border",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <Target className={cn(
                        "h-8 w-8",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                    </div>
                  </div>
                  <h3 className={cn(
                    "text-lg font-bold mb-2",
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>No active Goals Found</h3>
                  <p className={cn(
                    "max-w-md mx-auto",
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                  )}>
                    You don't have any active goals. Set a new fitness goal to start tracking your progress.
                  </p>
                  <Button 
                    className={cn(
                      "mt-6 bg-nav-bg border",
                      theme === 'dark' 
                        ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                        : 'border-[#800000] text-[#800000] hover:bg-background'
                    )}
                    onClick={() => setNewGoalOpen(true)}
                  >
                    Set New Goal
                  </Button>
                </div>
              )}
            </Tabs>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="goals" />
      
      {/* Create New Goal Dialog */}
      <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
        <DialogContent className={cn(
          "sm:max-w-md bg-nav-bg",
          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>Set a New Goal</DialogTitle>
            <DialogDescription className={cn(
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>
              Create a new fitness goal to track your progress
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Goal Title</Label>
              <Input
                id="title"
                placeholder="E.g., Run 5K in 30 minutes"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                className={cn(
                  "bg-background",
                  theme === 'dark' 
                    ? 'text-white border-[#e18d58]' 
                    : 'text-[#800000] border-[#800000]'
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type" className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Goal Type</Label>
              <Select 
                value={newGoal.type}
                onValueChange={(value) => {
                  const unitMap: Record<string, string> = {
                    walking: "miles",
                    running: "miles",
                    cycling: "miles",
                    swimming: "laps",
                    workout: "minutes"
                  };
                  setNewGoal({
                    ...newGoal, 
                    type: value,
                    unit: unitMap[value as keyof typeof unitMap] || "units"
                  });
                }}
              >
                <SelectTrigger className={cn(
                  "bg-background",
                  theme === 'dark' 
                    ? 'text-white border-[#e18d58]' 
                    : 'text-[#800000] border-[#800000]'
                )}>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="cycling">Cycling</SelectItem>
                  <SelectItem value="swimming">Swimming</SelectItem>
                  <SelectItem value="workout">Workout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target" className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({
                    ...newGoal, 
                    targetValue: parseInt(e.target.value) || 0
                  })}
                  className={cn(
                    "bg-background",
                    theme === 'dark' 
                      ? 'text-white border-[#e18d58]' 
                      : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit" className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Unit</Label>
                <Input
                  id="unit"
                  value={newGoal.unit}
                  readOnly
                  className={cn(
                    "bg-background",
                    theme === 'dark' 
                      ? 'text-white border-[#e18d58]' 
                      : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Target Date</Label>
              <Input
                id="endDate"
                type="date"
                value={newGoal.endDate}
                onChange={(e) => setNewGoal({...newGoal, endDate: e.target.value})}
                className={cn(
                  "bg-background",
                  theme === 'dark' 
                    ? 'text-white border-[#e18d58]' 
                    : 'text-[#800000] border-[#800000]'
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewGoalOpen(false)}
              className={cn(
                "bg-background",
                theme === 'dark' 
                  ? 'text-white border-[#e18d58] hover:bg-[#e18d58]/20' 
                  : 'text-[#800000] border-[#800000] hover:bg-background'
              )}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGoal}
              disabled={
                !newGoal.title || 
                !newGoal.type || 
                !newGoal.targetValue ||
                !newGoal.endDate
              }
              className={cn(
                "bg-nav-bg",
                theme === 'dark' 
                  ? 'text-white border-[#e18d58] hover:bg-[#e18d58]/20' 
                  : 'text-[#800000] border-[#800000] hover:bg-background'
              )}
            >
              Create Goal
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
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(1);
  
  const handleAddProgress = () => {
    onUpdateProgress(goal.id, goal.currentValue, progressValue);
    setIsAddingProgress(false);
    setProgressValue(1);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(goal.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="bg-nav-bg border-[#800000]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`
                  bg-background border-[#800000] text-[#800000] font-bold
                  ${goal.status === 'completed' ? 'border-[#800000]' : ''}
                  ${goal.status === 'paused' ? 'border-[#800000]' : ''}
                `}
              >
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Badge>
              {goal.mentor && (
                <Badge 
                  variant="outline" 
                  className="bg-background border-[#800000] text-[#800000]"
                >
                  Mentor: {goal.mentor.name || goal.mentor.username}
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-[#800000] mb-1">{goal.title}</h3>
            <p className="text-[#800000]/70 text-sm mb-4">
              Target: {goal.targetValue} {goal.unit} by {formatDate(goal.endDate)}
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[#800000]/70">
                <span>Progress</span>
                <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
              </div>
              <GoalProgress 
                goal={goal}
                showTitle={false}
              />
              <div className="flex justify-between text-sm">
                <span className="text-[#800000]/70">
                  {getDaysRemaining()} days remaining
                </span>
                <span className="text-[#800000] font-bold">
                  {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {goal.status === 'active' && (
          <div className="mt-4">
            {isAddingProgress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Slider
                    value={[progressValue]}
                    onValueChange={([value]) => setProgressValue(value)}
                    min={1}
                    max={Math.min(10, goal.targetValue - goal.currentValue)}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-[#800000] font-bold w-12">+{progressValue}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-[#800000] text-[#800000] hover:bg-background"
                    onClick={() => setIsAddingProgress(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-nav-bg border border-[#800000] text-[#800000] hover:bg-background font-bold"
                    onClick={handleAddProgress}
                  >
                    Add Progress
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full bg-nav-bg border border-[#800000] text-[#800000] hover:bg-background font-bold"
                onClick={() => setIsAddingProgress(true)}
              >
                Update Progress
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
