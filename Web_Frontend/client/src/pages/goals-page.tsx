import { useState, useEffect } from "react";
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
  BarChart2,
  Loader2
} from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface GoalMentor {
  id: number;
  name?: string;
  username: string;
}

interface GoalResponse {
  id: number;
  title: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: 'ACTIVE' | 'COMPLETED' | 'INACTIVE' | 'RESTARTED';
  target_date: string;
  start_date: string;
  last_updated: string;
  user: number;
  mentor?: {
    id: number;
    name?: string;
    username: string;
  };
  description?: string;
}

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
  mentor?: GoalMentor;
  daysRemaining?: number;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function mapGoalResponseToGoal(g: GoalResponse): Goal {
  return {
    id: g.id,
    title: g.title,
    type: g.category?.toLowerCase() || '',
    targetValue: g.target_value,
    currentValue: g.current_value,
    unit: g.unit,
    status: g.status?.toLowerCase() as 'active' | 'completed' | 'paused',
    endDate: g.target_date?.slice(0, 10) || '',
    progress: Math.round((g.current_value / g.target_value) * 100),
    userId: g.user,
    mentor: g.mentor,
    daysRemaining: g.target_date ? Math.ceil((new Date(g.target_date).getTime() - Date.now()) / (1000*60*60*24)) : undefined
  };
}

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [goals, setGoals] = useState<Goal[]>([]); // Start with empty, not mock
  const [loading, setLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    type: "walking",
    targetValue: 5,
    unit: "miles",
    endDate: "",
    mentorId: undefined as number | undefined
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { theme } = useTheme();

  // Fetch goals from backend
  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest("GET", "/api/goals/");
        if (res.ok) {
          const data = (await res.json()) as GoalResponse[];
          setGoals(data.map(mapGoalResponseToGoal));
        } else {
          const errorData = await res.json();
          setError(errorData.message || 'Failed to fetch goals');
          toast({
            title: "Error",
            description: errorData.message || 'Failed to fetch goals',
            variant: "destructive",
          });
        }
      } catch (e) {
        console.error('Error fetching goals:', e);
        setError('Failed to fetch goals. Please try again.');
        toast({
          title: "Error",
          description: 'Failed to fetch goals. Please try again.',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, [toast]);

  // Create goal
  const handleCreateGoal = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/goals/", {
        title: newGoal.title,
        goal_type: newGoal.type.toUpperCase(),
        target_value: newGoal.targetValue,
        current_value: 0,
        unit: newGoal.unit,
        target_date: new Date(newGoal.endDate).toISOString(),
        mentor: newGoal.mentorId || null
      });
      
      if (res.ok) {
        const g = await res.json();
        setGoals([...goals, {
          id: g.id,
          title: g.title,
          type: g.goal_type?.toLowerCase() || '',
          targetValue: g.target_value,
          currentValue: g.current_value,
          unit: g.unit,
          status: g.status?.toLowerCase() || 'active',
          endDate: g.target_date?.slice(0, 10) || '',
          progress: Math.round((g.current_value / g.target_value) * 100),
          userId: g.user,
          daysRemaining: g.target_date ? Math.ceil((new Date(g.target_date).getTime() - Date.now()) / (1000*60*60*24)) : undefined
        }]);
        setNewGoalOpen(false);
        resetNewGoalForm();
        toast({
          title: "Success",
          description: "Goal created successfully!",
        });
      } else {
        const errorData = await res.json();
        toast({
          title: "Error", 
          description: errorData.detail || 'Failed to create goal',
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Error creating goal:', e);
      toast({
        title: "Error",
        description: 'Failed to create goal. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update progress
  const handleUpdateProgress = async (id: number, currentValue: number, newProgress: number) => {
    const updatedValue = currentValue + newProgress;
    try {
      const res = await apiRequest("PATCH", `/api/goals/${id}/progress/`, {
        current_value: updatedValue
      });
      
      if (res.ok) {
        const g = await res.json();
        setGoals(goals.map(goal => goal.id === id ? {
          ...goal,
          currentValue: g.current_value,
          progress: Math.round((g.current_value / g.target_value) * 100),
          status: g.status?.toLowerCase() || goal.status
        } : goal));
        toast({
          title: "Success",
          description: "Progress updated successfully!",
        });
      } else {
        const errorData = await res.json();
        toast({
          title: "Error",
          description: errorData.message || 'Failed to update progress',
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Error updating goal progress:', e);
      toast({
        title: "Error",
        description: 'Failed to update progress. Please try again.',
        variant: "destructive",
      });
    }
  };

  // Delete goal
  const handleDeleteGoal = async (id: number) => {
    try {
      const res = await apiRequest("DELETE", `/api/goals/${id}/`);
      if (res.ok || res.status === 204) {
        setGoals(goals.filter(goal => goal.id !== id));
        toast({
          title: "Success",
          description: "Goal deleted successfully",
        });
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete goal' }));
        toast({
          title: "Error",
          description: errorData.message,
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Error deleting goal:', e);
      toast({
        title: "Error",
        description: 'Failed to delete goal. Please try again.',
        variant: "destructive",
      });
    }
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
                      <GoalCard 
                        goal={goal} 
                        onUpdateProgress={handleUpdateProgress}
                        onDeleteGoal={handleDeleteGoal}
                      />
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGoal}
              disabled={
                isSubmitting ||
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Goal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalCard({ goal, onUpdateProgress, onDeleteGoal }: { 
  goal: Goal;
  onUpdateProgress: (id: number, currentValue: number, newProgress: number) => void;
  onDeleteGoal: (id: number) => void;
}) {
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { theme } = useTheme();
  
  const handleAddProgress = async () => {
    setIsUpdating(true);
    try {
      await onUpdateProgress(goal.id, goal.currentValue, progressValue);
      setIsAddingProgress(false);
      setProgressValue(1);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setIsDeleting(true);
      try {
        await onDeleteGoal(goal.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme === 'dark' ? 'text-green-400 border-green-400' : 'text-green-600 border-green-600';
      case 'paused':
        return theme === 'dark' ? 'text-yellow-400 border-yellow-400' : 'text-yellow-600 border-yellow-600';
      case 'active':
        return theme === 'dark' ? 'text-[#e18d58] border-[#e18d58]' : 'text-[#800000] border-[#800000]';
      default:
        return theme === 'dark' ? 'text-white border-white' : 'text-[#800000] border-[#800000]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-nav-bg border-[#800000]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "bg-background font-bold",
                    getStatusColor(goal.status)
                  )}
                >
                  {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                </Badge>
                {goal.mentor && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "bg-background",
                      theme === 'dark' ? 'text-[#e18d58] border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                    )}
                  >
                    Mentor: {goal.mentor.name || goal.mentor.username}
                  </Badge>
                )}
              </div>
              
              <h3 className={cn(
                "text-lg font-bold mb-1",
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>{goal.title}</h3>
              <p className={cn(
                "text-sm mb-4",
                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
              )}>
                Target: {goal.targetValue} {goal.unit} by {formatDate(goal.endDate)}
              </p>
              
              <div className="space-y-2">
                <div className={cn(
                  "flex justify-between text-sm",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>
                  <span>Progress</span>
                  <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        theme === 'dark' ? 'bg-[#e18d58]' : 'bg-[#800000]'
                      )} 
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </motion.div>
                <div className={cn(
                  "flex justify-between text-sm",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>
                  <span>{goal.daysRemaining} days remaining</span>
                  <span className={cn(
                    "font-bold",
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>{goal.progress}%</span>
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
                      className={cn(
                        "flex-1",
                        theme === 'dark' ? '[&>span]:bg-[#e18d58]' : '[&>span]:bg-[#800000]'
                      )}
                    />
                    <span className={cn(
                      "font-bold w-12",
                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                    )}>+{progressValue}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cn(
                        theme === 'dark' 
                          ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                          : 'border-[#800000] text-[#800000] hover:bg-background'
                      )}
                      onClick={() => setIsAddingProgress(false)}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      className={cn(
                        "bg-nav-bg border font-bold",
                        theme === 'dark' 
                          ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                          : 'border-[#800000] text-[#800000] hover:bg-background'
                      )}
                      onClick={handleAddProgress}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Add Progress"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  className={cn(
                    "w-full bg-nav-bg border font-bold",
                    theme === 'dark' 
                      ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                      : 'border-[#800000] text-[#800000] hover:bg-background'
                  )}
                  onClick={() => setIsAddingProgress(true)}
                >
                  Update Progress
                </Button>
              )}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-[#800000]/20">
            <Button 
              variant="outline"
              className={cn(
                "w-full",
                isDeleting 
                  ? "border-red-500/50 text-red-500/50"
                  : "border-red-500 text-red-500 hover:bg-red-500/10"
              )}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Goal"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
