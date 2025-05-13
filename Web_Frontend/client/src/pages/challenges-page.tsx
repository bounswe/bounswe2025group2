import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
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
  BarChart2,
  Send,
  MessageSquare
} from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CohereClient } from 'cohere-ai';

// Initialize Cohere client
const cohereClient = new CohereClient({
  token: 'QHwU4OAiBoqIT66delqyPHINM8zqFsRNaRsXhreX', // Trial API Key
});

// Message interface for chat
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Mock data
const mockChallenges = [
  {
    id: "1",
    title: "10K Steps Challenge",
    description: "Walk 10,000 steps every day for a month",
    startDate: "2024-03-01",
    endDate: "2024-03-31",
    targetValue: 10000,
    type: "steps",
    unit: "steps",
    participants: [
      { userId: "1", progress: 8000 },
      { userId: "2", progress: 5000 }
    ]
  },
  {
    id: "2",
    title: "Swimming Marathon",
    description: "Swim 5km in a month",
    startDate: "2024-03-15",
    endDate: "2024-04-15",
    targetValue: 5000,
    type: "distance",
    unit: "meters",
    participants: [
      { userId: "1", progress: 2000 },
      { userId: "3", progress: 3000 }
    ]
  }
];

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string; // Matching backend field name
  end_date: string;   // Matching backend field name
  target_value: number; // Matching backend field name
  challenge_type: string; // Matching backend field name 
  unit: string;
  status: string;
  participants: Array<{
    user: string;
    current_value: number;
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
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const getUserProgress = (challengeId: string) => {
    // Find participant with matching user ID
    const participant = challenge.participants?.find(p => p.user === user?.id?.toString());
    return participant ? (participant.current_value / challenge.target_value) * 100 : 0;
  };

  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
    onUpdateProgress(newProgress);
  };

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
            {challenge.challenge_type}
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
              {formatDate(challenge.start_date)}
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
          <div className="flex items-center gap-1">            <Trophy className={cn(
              "h-4 w-4",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>
              {challenge.target_value} {challenge.unit}
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
              {challenge.participants?.length || 0} participants
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasJoined && (            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Your Progress</span>
                <span className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>
                  {challenge.participants?.find(p => p.user === user?.id?.toString())?.current_value || 0}/{challenge.target_value} {challenge.unit}
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
            onClick={() => onJoin()}
          >
            Join Challenge
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default function ChallengesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [updateProgressOpen, setUpdateProgressOpen] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<string>("");
  
  // Chat related state variables
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    type: "steps",
    targetValue: "",
    unit: "steps", // Default unit matching the default type
    startDate: "",
    endDate: ""
  });
  
  const { theme } = useTheme();
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Chat with Cohere API
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    
    try {      // Call Cohere Chat API
      const response = await cohereClient.chat({
        message: inputMessage,
        model: "command",
        preamble: "You are a helpful fitness assistant that provides advice about fitness challenges, workout routines, and motivation. Your name is FitBot.",
        conversationId: user?.id ? `user-${user.id}` : undefined
      });
      
      // Add response to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.text || "Sorry, I couldn't process your request right now.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error with Cohere API:", error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Could not connect to the chat service. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };
  
  // Format date to YYYY-MM-DD
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  // Set default dates for new challenge
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setNewChallenge(prev => ({
      ...prev,
      startDate: formatDateForInput(today),
      endDate: formatDateForInput(nextWeek)
    }));
  }, []);
  // Add loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Fetch challenges from backend
  useEffect(() => {    const fetchChallenges = async () => {
      setIsLoading(true);
      try {
        // Using the search endpoint to get all challenges
        const res = await apiRequest("GET", "/api/challenges/search/");
        if (res.ok) {
          const data = await res.json(); // assume array of challenges
          setChallenges(data);
        } else {
          const err = await res.json().catch(() => ({}));
          toast({
            title: `Error ${res.status}`,
            description: err.detail || 'Failed to load challenges',
            variant: 'destructive',
          });
        }
      } catch (e) {
        console.error('Error fetching challenges:', e);
        toast({
          title: 'Error',
          description: 'Network error: could not fetch challenges.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenges();
  }, [toast]);  const handleCreateChallenge = async () => {
    if (!newChallenge.title || !newChallenge.type || !newChallenge.targetValue || !newChallenge.startDate || !newChallenge.endDate || !newChallenge.unit) {
      toast({ 
        title: 'Missing Fields', 
        description: 'Please fill in all required fields', 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Format the payload according to API requirements
      const payload = {
        title: newChallenge.title,
        description: newChallenge.description || "",
        challenge_type: newChallenge.type,
        target_value: parseFloat(newChallenge.targetValue),
        unit: newChallenge.unit,
        start_date: `${newChallenge.startDate}T00:00:00Z`,
        end_date: `${newChallenge.endDate}T23:59:59Z`
      };
      
      console.log("Sending challenge payload:", payload);
      
      const res = await apiRequest("POST", "/api/challenges/create/", payload);
      if (res.ok) {
        const created = await res.json();
        setChallenges(prev => [...prev, created]);
        setNewChallengeOpen(false);
        resetNewChallengeForm();
        toast({ title: 'Success', description: 'Challenge created successfully!' });
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error('API Error:', errBody);
        toast({ 
          title: `Error ${res.status}`, 
          description: errBody.detail || 'Failed to create challenge. Make sure you have coach permission.', 
          variant: 'destructive' 
        });
      }
    } catch (e) {
      console.error('Error creating challenge:', e);
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive'});
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetNewChallengeForm = () => {
    // Get current date for defaults
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setNewChallenge({
      title: "",
      description: "",
      type: "steps",
      targetValue: "",
      unit: "steps", // Default unit matching the default type
      startDate: formatDateForInput(today),
      endDate: formatDateForInput(nextWeek)
    });
  };  const handleUpdateProgress = async (id: string) => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }
    
    try {
      const value = parseFloat(progressValue);
      if (isNaN(value) || value < 0) {
        toast({ title: 'Invalid Value', description: 'Please enter a valid positive number', variant: 'destructive' });
        return;
      }
        setIsSubmitting(true);
      console.log("Updating progress:", id, value);
      // Using added_value as per the backend API expectation
      const res = await apiRequest("POST", `/api/challenges/${id}/update-progress/`, { added_value: value });
      if (res.ok) {
        // The backend will handle adding the new value to the existing progress
        // We need to get the current participant
        const challenge = challenges.find(c => c.id === id);
        const participant = challenge?.participants?.find(p => p.user === user.id.toString());
        const currentValue = participant?.current_value || 0;
        
        setChallenges(prev => prev.map(c => 
          c.id === id ? { 
            ...c, 
            participants: c.participants.map(p => 
              p.user === user.id.toString() ? { ...p, current_value: currentValue + value } : p
            ) 
          } : c
        ));
        setUpdateProgressOpen(null);
        setProgressValue("");
        toast({ title: 'Success', description: 'Progress updated successfully!' });
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error('API Error:', errBody);
        toast({ title: `Error ${res.status}`, description: errBody.detail || 'Failed to update progress', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Error updating progress:', e);
      toast({ title: 'Error', description: 'Could not update progress.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleJoinChallenge = async (id: string) => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }
    try {
      const res = await apiRequest("POST", `/api/challenges/${id}/join/`);
      if (res.ok) {
        // Update local state with the new participant
        setChallenges(prev => prev.map(c => 
          c.id === id ? { 
            ...c, 
            participants: [...(c.participants || []), { 
              user: user.id.toString(), 
              current_value: 0 
            }] 
          } : c
        ));
        toast({ title: 'Joined', description: 'You joined the challenge.' });
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error('API Error:', errBody);
        toast({ title: `Error ${res.status}`, description: errBody.detail || 'Failed to join challenge', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Error joining challenge:', e);
      toast({ title: 'Error', description: 'Could not join challenge.', variant: 'destructive' });
    }
  };
  const hasJoinedChallenge = (challengeId: string): boolean => {
    if (!user?.id) return false;
    
    const challenge = challenges.find(c => c.id === challengeId);
    return challenge?.participants?.some(p => p.user === user.id.toString()) ?? false;
  };
  // Filter challenges based on active tab
  const filteredChallenges = challenges ? challenges.filter((challenge: any) => {
    const today = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    
    if (activeTab === "active") {
      // Active challenges have started but not ended
      return startDate <= today && today <= endDate && challenge.status !== "completed"; 
    }
    if (activeTab === "completed") {
      // Completed challenges have ended or are marked as completed
      return endDate < today || challenge.status === "completed";
    }
    if (activeTab === "upcoming") {
      // Upcoming challenges haven't started yet
      return startDate > today;
    }
    return true; // all tab
  }) : [];

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
                <div className="text-center py-12">
                  <Loader2 className={cn(
                    "h-8 w-8 animate-spin mx-auto mb-4",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )} />
                  <p className={cn(
                    "text-lg font-medium",
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>Loading challenges...</p>
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
                  )}>No {activeTab} Challenges Found</h3>
                  <p className={cn(
                    "max-w-md mx-auto mb-6",
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                  )}>
                    {activeTab === "active" ? "There are no active challenges at the moment." : 
                     activeTab === "upcoming" ? "There are no upcoming challenges scheduled." :
                     activeTab === "completed" ? "You haven't completed any challenges yet." :
                     "There are no challenges available."}
                  </p>
                </div>
              )}
            </Tabs>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="challenges" />
      
      {/* Chat Button */}
      <div className="fixed bottom-20 right-6 z-40 md:bottom-6">
        <Button 
          className={cn(
            "rounded-full h-14 w-14 shadow-lg flex items-center justify-center",
            theme === 'dark' 
              ? 'bg-[#e18d58] hover:bg-[#e18d58]/80 text-white' 
              : 'bg-[#800000] hover:bg-[#800000]/80 text-white'
          )}
          onClick={() => setChatOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
        {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent 
          className={cn(
            "sm:max-w-md h-[500px] flex flex-col p-0 gap-0 overflow-hidden",
            theme === 'dark' ? 'bg-nav-bg border-[#e18d58]' : 'bg-nav-bg border-[#800000]'
          )}
        >          <DialogHeader className={cn(
            "px-4 py-2 border-b",
            theme === 'dark' ? 'bg-[#1a1a1a] border-[#e18d58]/30' : 'bg-[#f9f9f9] border-[#800000]/30'
          )}>
            <DialogTitle className={cn(
              "flex items-center gap-2",
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>
              <MessageSquare className="h-5 w-5" />
              Fitness Challenge Assistant
            </DialogTitle>
            <DialogDescription className={cn(
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>
              Get advice for your fitness challenges
            </DialogDescription>
          </DialogHeader>
            {/* Messages Container */}
          <div className={cn(
            "flex-1 overflow-y-auto p-4 space-y-4",
            theme === 'dark' ? 'bg-[#151515]' : 'bg-[#fcfcfc]'
          )}>
            {messages.length === 0 ? (              <div className={cn(
                "text-center py-8 rounded-lg border",
                theme === 'dark' ? 'text-white/70 border-[#e18d58]/30' : 'text-[#800000]/70 border-[#800000]/30'
              )}>
                <MessageSquare className={cn(
                  "mx-auto h-10 w-10 mb-2", 
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )} />
                <p>Ask me anything about fitness challenges!</p>
                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
                    )}
                    onClick={() => setInputMessage("Suggest a good beginner fitness challenge")}
                  >
                    Suggest a good beginner fitness challenge
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
                    )}
                    onClick={() => setInputMessage("How do I stay motivated during a challenge?")}
                  >
                    How do I stay motivated during a challenge?
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
                    )}
                    onClick={() => setInputMessage("What should I eat before a workout?")}
                  >
                    What should I eat before a workout?
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div 
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",                        message.role === 'user' 
                          ? theme === 'dark' 
                            ? 'bg-[#e18d58] text-white' 
                            : 'bg-[#800000] text-white'
                          : theme === 'dark'
                            ? 'bg-[#222] border border-[#e18d58]/30 text-white'
                            : 'bg-[#f5f5f5] border border-[#800000]/30 text-[#800000]'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        message.role === 'user' 
                          ? 'text-white/70' 
                          : theme === 'dark'
                            ? 'text-white/50'
                            : 'text-[#800000]/50'
                      )}>
                        {format(message.timestamp, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">                    <div className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      theme === 'dark' ? 'bg-[#222] border border-[#e18d58]/30 text-white' : 'bg-[#f5f5f5] border border-[#800000]/30 text-[#800000]'
                    )}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-150"></div>
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-300"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messageEndRef} />
              </>
            )}
          </div>
            {/* Input Container */}
          <div className={cn(
            "p-3 border-t",
            theme === 'dark' ? 'bg-[#1a1a1a] border-[#e18d58]/30' : 'bg-[#f9f9f9] border-[#800000]/30'
          )}>
            <form 
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >              <Input
                className={cn(
                  "flex-1",
                  theme === 'dark' ? 'bg-background border-[#e18d58] text-white' : 'bg-background border-[#800000] text-[#800000]'
                )}
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isTyping}
              />
              <Button 
                type="submit"
                size="icon"
                className={cn(
                  theme === 'dark' 
                    ? 'bg-[#e18d58] hover:bg-[#e18d58]/80 text-white' 
                    : 'bg-[#800000] hover:bg-[#800000]/80 text-white'
                )}
                disabled={!inputMessage.trim() || isTyping}
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
        {/* Create New Challenge Dialog */}
      <Dialog open={newChallengeOpen} onOpenChange={setNewChallengeOpen}>
        <DialogContent className={cn(
          "sm:max-w-md bg-nav-bg",
          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>Create a New Challenge</DialogTitle>
            <DialogDescription className={cn(
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>
              Create a fitness challenge for the community
            </DialogDescription>
          </DialogHeader>          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Challenge Title</Label>
              <Input
                id="title"
                placeholder="E.g., Weekly Step Count Challenge"
                value={newChallenge.title}
                onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                className={cn(
                  "bg-background",
                  theme === 'dark' 
                    ? 'text-white border-[#e18d58]' 
                    : 'text-[#800000] border-[#800000]'
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className={cn(
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your challenge"
                value={newChallenge.description}
                onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                rows={3}
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
              )}>Challenge Type</Label>              <Select 
                value={newChallenge.type}
                onValueChange={(value) => {
                  // Map challenge types to their default units
                  const unitMap: Record<string, string> = {
                    "steps": "steps",
                    "distance": "kilometers",
                    "workout": "minutes",
                    "calories": "calories"
                  };
                  
                  setNewChallenge({
                    ...newChallenge, 
                    type: value,
                    unit: unitMap[value] || "units"
                  });
                }}
              >                <SelectTrigger className={cn(
                  "bg-background",
                  theme === 'dark' 
                    ? 'text-white border-[#e18d58]' 
                    : 'text-[#800000] border-[#800000]'
                )}>
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
                <Label htmlFor="target" className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  value={newChallenge.targetValue}
                  onChange={(e) => setNewChallenge({
                    ...newChallenge, 
                    targetValue: e.target.value
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
                <Select 
                  value={newChallenge.unit}
                  onValueChange={(value) => setNewChallenge({...newChallenge, unit: value})}
                >
                  <SelectTrigger className={cn(
                    "bg-background",
                    theme === 'dark' 
                      ? 'text-white border-[#e18d58]' 
                      : 'text-[#800000] border-[#800000]'
                  )}>
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
                <Label htmlFor="startDate" className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newChallenge.startDate}
                  onChange={(e) => setNewChallenge({...newChallenge, startDate: e.target.value})}
                  className={cn(
                    "bg-background",
                    theme === 'dark' 
                      ? 'text-white border-[#e18d58]' 
                      : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate" className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newChallenge.endDate}
                  onChange={(e) => setNewChallenge({...newChallenge, endDate: e.target.value})}
                  className={cn(
                    "bg-background",
                    theme === 'dark' 
                      ? 'text-white border-[#e18d58]' 
                      : 'text-[#800000] border-[#800000]'
                  )}
                />
              </div>
            </div>
          </div>          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewChallengeOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              className={cn(
                "bg-secondary text-white hover:bg-secondary-dark",
                theme === 'dark' 
                  ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                  : 'border-[#800000] text-white hover:bg-active'
              )}
              onClick={handleCreateChallenge}
              disabled={
                isSubmitting ||
                !newChallenge.title || 
                !newChallenge.type || 
                !newChallenge.targetValue ||
                !newChallenge.startDate ||
                !newChallenge.endDate ||
                !newChallenge.unit
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        {/* Update Progress Dialog */}      <Dialog
        open={updateProgressOpen !== null}
        onOpenChange={(open) => !open && setUpdateProgressOpen(null)}
      >
        <DialogContent className={cn(
          "sm:max-w-[425px] bg-nav-bg",
          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>Update Challenge Progress</DialogTitle>
            <DialogDescription className={cn(
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>
              Enter your current progress for this challenge
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {updateProgressOpen !== null && challenges && (
              <>
                <div className="text-center">
                  <h3 className={cn(
                    "font-medium text-lg",
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>
                    {challenges.find((c: any) => c.id === updateProgressOpen)?.title}
                  </h3>                  
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-white/70' : 'text-muted-foreground'
                  )}>
                    Target: {challenges.find((c: any) => c.id === updateProgressOpen)?.target_value}{' '}
                    {challenges.find((c: any) => c.id === updateProgressOpen)?.unit}
                  </p>
                </div>
                  <div className="space-y-2">
                  <Label htmlFor="progress" className={cn(
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>Your Current Progress</Label>
                  <Input
                    id="progress"
                    type="number"
                    placeholder={`Enter your current progress in ${challenges.find((c: any) => c.id === updateProgressOpen)?.unit}`}
                    value={progressValue}
                    onChange={(e) => setProgressValue(e.target.value)}
                    className={cn(
                      "bg-background",
                      theme === 'dark' 
                        ? 'text-white border-[#e18d58]' 
                        : 'text-[#800000] border-[#800000]'
                    )}
                  />
                </div>
              </>
            )}
          </div>          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUpdateProgressOpen(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              className={cn(
                "bg-secondary text-white hover:bg-secondary-dark",
                theme === 'dark' 
                  ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                  : 'border-[#800000] text-white hover:bg-active'
              )}
              onClick={() => updateProgressOpen && handleUpdateProgress(updateProgressOpen)}
              disabled={
                isSubmitting ||
                !progressValue || 
                isNaN(parseFloat(progressValue))
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
