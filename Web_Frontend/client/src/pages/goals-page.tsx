import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
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
  Loader2,
  Trash2,
  Edit,
  CheckCircle, // Added for completed goals icon
  ListChecks // Added for total goals icon
} from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { API_BASE_URL, WEB_SOCKET_URL } from "@/lib/queryClient.ts";
import { Textarea } from "@/components/ui/textarea";

function getCsrfToken() {
  const name = 'csrftoken';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const lastPart = parts.pop();
    if (lastPart) {
      const value = lastPart.split(';').shift();
      return value ?? '';
    }
  }
  return '';
}

interface Goal {
  id: number;
  title: string;
  description: string;
  user: number;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string; // Changed from end_date
  status: string;
  last_updated: string;
}

// Create an API client with consistent headers
const apiClient = {
  fetch: (url: string, options: RequestInit = {}) => {
    const csrfToken = getCsrfToken();
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
        ...options.headers
      }
    };

    // Merge default options with provided options
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };

    return fetch(url, mergedOptions);
  },

  get: (url: string) => {
    return apiClient.fetch(url);
  },

  post: (url: string, data: any) => {
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  
  // Check if the date is valid
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

// Helper function to get goal type icon
const getGoalTypeIcon = (type: string) => {
  switch (type) {
    case 'WALKING_RUNNING':
    case 'strength': // Keep existing frontend values if they map to backend ones or update UI
      return <TrendingUp className="h-4 w-4" />;
    case 'WORKOUT':
    case 'endurance':
      return <BarChart2 className="h-4 w-4" />;
    case 'CYCLING':
    case 'SWIMMING':
    case 'SPORTS':
    case 'achievement':
      return <Medal className="h-4 w-4" />;
    default:
      return <Target className="h-4 w-4" />;
  }
};

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate statistics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => goal.status === "COMPLETED").length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'SPORTS', // Changed to a valid default
    target_value: 100,
    // current_value: 0, // Removed, as it's read-only for creation and defaults on backend
    unit: '',
    // start_date: new Date().toISOString().split('T')[0], // Removed, as it's auto_now_add on backend
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Renamed from end_date
  });

  const [progressData, setProgressData] = useState({
    current_value: 0
  });

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`${API_BASE_URL}/api/goals/`);
        const data = await response.json();
        setGoals(data);
        setFilteredGoals(data);
      } catch (error) {
        console.error('Error fetching goals:', error);
        toast({
          title: 'Error',
          description: 'Failed to load goals. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, [toast]);

  console.log(goals);

  useEffect(() => {
    // Filter goals based on active tab
    if (activeTab === "all") {
      setFilteredGoals(goals);
    } else if (activeTab === "active") {
      setFilteredGoals(goals.filter(goal => goal.status === "ACTIVE"));
    } else if (activeTab === "completed") {
      setFilteredGoals(goals.filter(goal => goal.status === "COMPLETED"));
    }
  }, [activeTab, goals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleProgressChange = (value: number[]) => {
    setProgressData({ current_value: value[0] });
  };

  const handleCreateGoal = async () => {
    try {
      setIsSubmitting(true);
      // Construct payload with only expected fields
      const payload = {
        title: formData.title,
        description: formData.description,
        goal_type: formData.goal_type,
        target_value: formData.target_value,
        unit: formData.unit,
        target_date: formData.target_date,
        // Do not send: user, current_value, status, start_date, last_updated, progress_percentage
      };
      const response = await apiClient.post(`${API_BASE_URL}/api/goals/`, payload);
      const newGoal = await response.json();
      setGoals([...goals, newGoal]);
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        goal_type: 'SPORTS', // Reset to a valid default
        target_value: 100,
        unit: '',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      toast({
        title: 'Success',
        description: 'Goal created successfully!',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal) return;
    try {
      setIsSubmitting(true);
      const response = await apiClient.fetch(`${API_BASE_URL}/api/goals/${selectedGoal.id}/`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      const updatedGoal = await response.json();
      setGoals(goals.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal));
      setIsUpdateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Goal updated successfully!',
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);

    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      setIsLoading(true);
      await apiClient.fetch(`${API_BASE_URL}/api/goals/${goalId}/`, {
        method: 'DELETE'
      });
      setGoals(goals.filter(goal => goal.id !== goalId));
      toast({
        title: 'Success',
        description: 'Goal deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedGoal) return;
    try {
      setIsSubmitting(true);
      const response = await apiClient.fetch(`${API_BASE_URL}/api/goals/${selectedGoal.id}/progress/`, {
        method: 'PATCH',
        body: JSON.stringify({ current_value: progressData.current_value })
      });
      const updatedGoal = await response.json();
      setGoals(goals.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal));
      setIsProgressDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Progress updated successfully!',
      });
      // Fetch updated goals
      const new_response = await apiClient.get(`${API_BASE_URL}/api/goals/`);
      const updatedGoals = await new_response.json();
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      goal_type: goal.goal_type,
      target_value: goal.target_value,
      // current_value: goal.current_value, // Not part of edit form for general goal details
      unit: goal.unit,
      // start_date: goal.start_date.split('T')[0], // start_date is not editable
      target_date: goal.target_date.split('T')[0] // Renamed from end_date
    });
    setIsUpdateDialogOpen(true);
  };

  const openProgressDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setProgressData({
      current_value: goal.current_value
    });
    setIsProgressDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="goals" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className={cn(
                  "text-2xl md:text-3xl font-bold",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Goals</h1>
                <p className={cn(
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>track your fitness journey</p>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className={cn(
                  "flex items-center gap-2",
                  theme === 'dark' ? 'bg-[#e18d58] text-white hover:bg-[#e18d58]/90' : 'bg-[#800000] text-white hover:bg-[#800000]/90'
                )}
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            </div>

            {/* Statistics Section */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className={cn(theme === 'dark' ? 'bg-nav-bg border-[#e18d58]' : 'bg-nav-bg border-[#800000]')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={cn("text-sm font-medium", theme === 'dark' ? 'text-white/80' : 'text-[#800000]/80')}>
                    Total Goals
                  </CardTitle>
                  <ListChecks className={cn("h-4 w-4", theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]')}/>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", theme === 'dark' ? 'text-white' : 'text-[#800000]')}>{totalGoals}</div>
                </CardContent>
              </Card>
              <Card className={cn(theme === 'dark' ? 'bg-nav-bg border-[#e18d58]' : 'bg-nav-bg border-[#800000]')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={cn("text-sm font-medium", theme === 'dark' ? 'text-white/80' : 'text-[#800000]/80')}>
                    Completed Goals
                  </CardTitle>
                  <CheckCircle className={cn("h-4 w-4", theme === 'dark' ? 'text-green-400' : 'text-green-600')}/>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", theme === 'dark' ? 'text-white' : 'text-[#800000]')}>{completedGoals}</div>
                </CardContent>
              </Card>
              <Card className={cn(theme === 'dark' ? 'bg-nav-bg border-[#e18d58]' : 'bg-nav-bg border-[#800000]')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={cn("text-sm font-medium", theme === 'dark' ? 'text-white/80' : 'text-[#800000]/80')}>
                    Completion Rate
                  </CardTitle>
                  <TrendingUp className={cn("h-4 w-4", theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]')}/>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", theme === 'dark' ? 'text-white' : 'text-[#800000]')}>{completionRate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className={cn(
                "grid grid-cols-3 mb-4",
                theme === 'dark' ? 'bg-nav-bg border-[#e18d58]/30 border' : 'bg-nav-bg border-[#800000]/30 border'
              )}>
                <TabsTrigger 
                  value="all"
                  className={cn(
                    theme === 'dark' 
                      ? 'data-[state=active]:bg-[#e18d58] data-[state=active]:text-white' 
                      : 'data-[state=active]:bg-[#800000] data-[state=active]:text-white'
                  )}
                >
                  All Goals
                </TabsTrigger>
                <TabsTrigger 
                  value="active"
                  className={cn(
                    theme === 'dark' 
                      ? 'data-[state=active]:bg-[#e18d58] data-[state=active]:text-white' 
                      : 'data-[state=active]:bg-[#800000] data-[state=active]:text-white'
                  )}
                >
                  Active
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className={cn(
                    theme === 'dark' 
                      ? 'data-[state=active]:bg-[#e18d58] data-[state=active]:text-white' 
                      : 'data-[state=active]:bg-[#800000] data-[state=active]:text-white'
                  )}
                >
                  Completed
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Goals List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className={cn(
                  "h-8 w-8 animate-spin",
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )} />
              </div>
            ) : filteredGoals && filteredGoals.length > 0 ? (
              <div className="space-y-4">
                {filteredGoals.map((goal) => (
                  <Card 
                    key={goal.id} 
                    className={cn(
                      "bg-nav-bg w-full relative overflow-hidden",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Goal Icon */}
                        <div className={cn(
                          "bg-background h-12 w-12 rounded-full flex items-center justify-center border",
                          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                        )}>
                          <div className={cn(
                            theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                          )}>
                            {getGoalTypeIcon(goal.goal_type)}
                          </div>
                        </div>

                        {/* Goal Details */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className={cn(
                                  "font-bold text-lg",
                                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                                )}>
                                  {goal.title}
                                </h3>
                                <Badge className={cn(
                                  "text-xs",
                                  goal.status === "completed" 
                                    ? "bg-green-500" 
                                    : theme === 'dark' ? 'bg-[#e18d58]/20 text-[#e18d58]' : 'bg-[#800000]/20 text-[#800000]'
                                )}>
                                  {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                                </Badge>
                              </div>
                              <p className={cn(
                                "text-sm mt-1",
                                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                              )}>
                                {goal.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openProgressDialog(goal)}
                                className={cn(
                                  "h-8 w-8",
                                  theme === 'dark' ? 'border-[#e18d58] text-[#e18d58]' : 'border-[#800000] text-[#800000]'
                                )}
                              >
                                <Target className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditDialog(goal)}
                                className={cn(
                                  "h-8 w-8",
                                  theme === 'dark' ? 'border-[#e18d58] text-[#e18d58]' : 'border-[#800000] text-[#800000]'
                                )}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteGoal(goal.id)}
                                className={cn(
                                  "h-8 w-8",
                                  theme === 'dark' ? 'border-[#e18d58] text-[#e18d58] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' 
                                    : 'border-[#800000] text-[#800000] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500'
                                )}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn(
                                "text-xs font-medium",
                                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                              )}>
                                Progress: {goal.current_value} / {goal.target_value} {goal.unit}
                              </span>
                              <span className={cn(
                                "text-xs font-medium",
                                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                              )}>
                                {calculateProgress(goal.current_value, goal.target_value)}%
                              </span>
                            </div>
                            <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                              <div 
                                className={cn(
                                  "h-2 rounded-full", 
                                  theme === 'dark' ? 'bg-[#e18d58]' : 'bg-[#800000]'
                                )}
                                style={{ width: `${calculateProgress(goal.current_value, goal.target_value)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="mt-3 flex items-center gap-4 text-xs">
                            <div className="flex items-center">
                              <Calendar className={cn(
                                "h-3 w-3 mr-1",
                                theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                              )} />
                              <span className={cn(
                                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                              )}>
                                Start: {formatDate(goal.start_date)}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className={cn(
                                "h-3 w-3 mr-1",
                                theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                              )} />
                              <span className={cn(
                                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                              )}>
                                E<span>nds: {formatDate(goal.target_date)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
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
                )}>No Goals Yet</h3>
                <p className={cn(
                  "max-w-md mx-auto",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>
                  you haven't created any goals yet. click the "Add Goal" button to get started!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="goals" />

      {/* Create Goal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className={cn(
          "bg-nav-bg sm:max-w-[425px]",
          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>Create New Goal</DialogTitle>
            <DialogDescription className={cn(
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>
              Set a new fitness goal to track your progress
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Title</Label>
              <Input 
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={cn(
                  "bg-background",
                  theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Description</Label>
              <Textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={cn(
                  "bg-background",
                  theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Goal Type</Label>
              <Select 
                name="goal_type" 
                value={formData.goal_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, goal_type: value }))}
              >
                <SelectTrigger className={cn(
                  "bg-background",
                  theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                )}>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WALKING_RUNNING">Walking/Running</SelectItem>
                  <SelectItem value="WORKOUT">Workout</SelectItem>
                  <SelectItem value="CYCLING">Cycling</SelectItem>
                  <SelectItem value="SWIMMING">Swimming</SelectItem>
                  <SelectItem value="SPORTS">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Target Value</Label>
                <Input 
                  type="number"
                  name="target_value"
                  value={formData.target_value}
                  onChange={handleNumericInputChange}
                  className={cn(
                    "bg-background",
                    theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Unit</Label>
                <Input 
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder="kg, miles, etc."
                  className={cn(
                    "bg-background",
                    theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>End Date</Label>
                <Input 
                  type="date"
                  name="target_date"
                  value={formData.target_date}
                  onChange={handleInputChange}
                  className={cn(
                    "bg-background",
                    theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              className={cn(
                theme === 'dark' ? 'border-[#e18d58] text-[#e18d58] hover:bg-[#e18d58]/10' : 'border-[#800000] text-[#800000] hover:bg-[#800000]/10'
              )}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGoal}
              disabled={isSubmitting}
              className={cn(
                "ml-2",
                theme === 'dark' ? 'bg-[#e18d58] text-white hover:bg-[#e18d58]/90' : 'bg-[#800000] text-white hover:bg-[#800000]/90'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Goal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Goal Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className={cn(
          "bg-nav-bg sm:max-w-[425px]",
          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>Update Goal</DialogTitle>
            <DialogDescription className={cn(
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>
              Update your fitness goal details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Title</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={cn(
                  "bg-background",
                  theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Description</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={cn(
                  "bg-background",
                  theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Goal Type</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, goal_type: value }))}
              >
                <SelectTrigger className={cn(
                  "bg-background",
                  theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                )}>
                  <SelectValue placeholder="Select a goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WALKING_RUNNING">Walking/Running</SelectItem>
                  <SelectItem value="WORKOUT">Workout</SelectItem>
                  <SelectItem value="CYCLING">Cycling</SelectItem>
                  <SelectItem value="SWIMMING">Swimming</SelectItem>
                  <SelectItem value="SPORTS">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Target Value</Label>
                <Input
                  type="number"
                  name="target_value"
                  value={formData.target_value}
                  onChange={handleNumericInputChange}
                  className={cn(
                    "bg-background",
                    theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Unit</Label>
                <Input
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder="kg, miles, etc."
                  className={cn(
                    "bg-background",
                    theme === 'dark' ? 'text-white border-[#e18d58]' : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>End Date</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUpdateDialogOpen(false)}
              className={cn(
                theme === 'dark' ? 'border-[#e18d58] text-[#e18d58] hover:bg-[#e18d58]/10' : 'border-[#800000] text-[#800000] hover:bg-[#800000]/10'
              )}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateGoal}
              disabled={isSubmitting}
              className={cn(
                "ml-2",
                theme === 'dark' ? 'bg-[#e18d58] text-white hover:bg-[#e18d58]/90' : 'bg-[#800000] text-white hover:bg-[#800000]/90'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Goal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className={cn(
          "bg-nav-bg sm:max-w-[425px]",
          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>Update Progress</DialogTitle>
            <DialogDescription className={cn(
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>
              Update your progress for this goal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className={cn(
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>Current Progress</Label>
                  <span className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                  )}>
                    {progressData.current_value} {selectedGoal?.unit}
                  </span>
                </div>
                <Slider
                  value={[progressData.current_value]}
                  max={selectedGoal?.target_value || 100}
                  step={1}
                  onValueChange={handleProgressChange}
                  className={cn(
                    theme === 'dark' ? '[&_[role=slider]]:border-[#e18d58] [&_[role=slider]]:bg-[#e18d58]' 
                      : '[&_[role=slider]]:border-[#800000] [&_[role=slider]]:bg-[#800000]'
                  )}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsProgressDialogOpen(false)}
              className={cn(
                theme === 'dark' ? 'border-[#e18d58] text-[#e18d58] hover:bg-[#e18d58]/10' : 'border-[#800000] text-[#800000] hover:bg-[#800000]/10'
              )}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProgress}
              disabled={isSubmitting}
              className={cn(
                "ml-2",
                theme === 'dark' ? 'bg-[#e18d58] text-white hover:bg-[#e18d58]/90' : 'bg-[#800000] text-white hover:bg-[#800000]/90'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Progress'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNavigation activeTab="goals" />
    </div>
  );
}