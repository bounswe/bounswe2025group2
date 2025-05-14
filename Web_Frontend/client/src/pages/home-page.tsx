import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {Loader2, ArrowRight, Trophy, Users, Calendar, MapPin, Search, UserCircle, Eye, ThumbsUp} from "lucide-react";
import { QuoteDailyCard } from "@/components/ui/quote-daily-card";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";
import { FoodLogger } from "@/components/ui/food_logger";
import { API_BASE_URL, WEB_SOCKET_URL } from "@/lib/queryClient.ts";


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

interface Thread {
  author: string;
  comment_count: number;
  created_at: string;
  forum: string;
  id: number;
  title: string;
  like_count: number;
  view_count: number;
}


export default function HomePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`${API_BASE_URL}/api/goals/`);
        const data = await response.json();
        setGoals(data);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, []);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`${API_BASE_URL}/api/challenges/search/`);
        const data = await response.json();
        setChallenges(data);
      } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
        setIsLoading(false);
    }
    };
    fetchChallenges();
  }, []);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`${API_BASE_URL}/api/threads/`);
        const data = await response.json();
        setThreads(data);
      } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
        setIsLoading(false);
    }
    };
    fetchThreads();
  }, []);

  const latestThreads = threads.slice(0, 3);

  const challengesLoading = false;
  const programsLoading = false;
  const threadsLoading = false;

  // Display daily motivational quote
  const quotedailySection = (
    <div className="mb-6">
      <QuoteDailyCard />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="home" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <section className="mb-8">
              <div className={cn(
                "bg-nav-bg rounded-xl p-6 md:p-8 border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <h1 className={cn(
                  "text-2xl md:text-3xl font-bold mb-2",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>
                  Welcome back, {user?.name || user?.username}!
                </h1>
                <p className={cn(
                  "mb-4 md:text-lg",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                )}>
                  Ready to continue your fitness journey today?
                </p>
                <div className="flex flex-wrap gap-3">                  <Button
                    variant="default"
                    className={cn(
                      "flex items-center gap-2 bg-nav-bg border",
                      theme === 'dark'
                        ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                        : 'border-[#800000] text-[#800000] hover:bg-active'
                    )}
                    onClick={() => setLocation("/goals?")}
                  >
                    Set New Goal
                  </Button>

                  <Button
                    variant="secondary"
                    className={cn(
                      "flex items-center gap-2 bg-nav-bg border",
                      theme === 'dark'
                        ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                        : 'border-[#800000] text-[#800000] hover:bg-active'
                    )}
                    onClick={() => setLocation(`/challenges`)}>

                    View Challenges
                  </Button>

                  <Button
                    variant="secondary"
                    className={cn(
                      "flex items-center gap-2 bg-nav-bg border",
                      theme === 'dark'
                        ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                        : 'border-[#800000] text-[#800000] hover:bg-active'
                    )}
                    onClick={() => setLocation(`/profile`)}>

                    <UserCircle size={20} />
                    View Profile
                  </Button>

                </div>
              </div>
            </section>

            {/* Daily Quote Section */}
            {quotedailySection}

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Quick Stats */}
              <Card className={cn(
                "bg-nav-bg border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className={cn(
                    "text-lg",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )}>Activity</CardTitle>
                  <CardDescription className={cn(
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                  )}>Personal and Community Stats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: goals.length, label: "Active Goals" },
                      { value: threads.length, label: "Threads" },
                      { value: challenges.length, label: "Challenges" },
                      { value: "5", label: "Days Active" }
                    ].map((stat, index) => (
                      <div key={index} className={cn(
                        "bg-nav-bg p-3 rounded-lg text-center border",
                        theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                      )}>
                        <p className={cn(
                          "text-2xl font-bold",
                          theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                        )}>{stat.value}</p>
                        <p className={cn(
                          "text-sm",
                          theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                        )}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Goal Progress */}
              <Card className={cn(
                "bg-nav-bg border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className={cn(
                    "text-lg",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )}>Current Goal Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {goals.map((goal, index) => {
                      const percentage = Math.min(
                        100,
                        Math.max(0, (goal.current_value / goal.target_value) * 100)
                      ).toFixed(1);

                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={cn(
                              "font-medium",
                              theme === 'dark' ? 'text-white' : 'text-[#800000]'
                            )}>
                              {goal.title}
                            </span>
                            <span className={cn(
                              theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                            )}>
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-2.5 rounded-full transition-all duration-300",
                                theme === 'dark' ? 'bg-[#e18d58]' : 'bg-[#800000]'
                              )}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    <Link
                      href="/goals"
                      className={cn(
                        "flex items-center text-sm font-medium hover:underline",
                        theme === 'dark'
                          ? 'text-[#e18d58] hover:text-[#e18d58]/80'
                          : 'text-[#800000] hover:text-[#800000]/80'
                      )}
                    >
                      View all goals <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </CardContent>

              </Card>

              {/* Active Challenges */}
              <Card className={cn(
                "bg-nav-bg border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className={cn(
                    "text-lg",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )}>Active Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  {challengesLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className={cn(
                        "h-6 w-6 animate-spin",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                    </div>
                  ) : challenges && challenges.length > 0 ? (
                    <div className="space-y-3">
                      {challenges.slice(0, 2).map((challenge: any) => (
                        <div key={challenge.id} className={cn(
                          "flex items-center p-2 rounded-lg border bg-nav-bg",
                          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                            theme === 'dark' ? 'bg-[#e18d58]/10' : 'bg-[#800000]/10'
                          )}>
                            <Trophy className={cn(
                              "h-5 w-5",
                              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                            )} />
                          </div>
                          <div className="flex-1">
                            <h4 className={cn(
                              "font-medium text-sm",
                              theme === 'dark' ? 'text-white' : 'text-[#800000]'
                            )}>{challenge.title}</h4>
                            <p className={cn(
                              "text-xs",
                              theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                            )}>
                              {challenge.targetValue} {challenge.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Link href="/challenges" className={cn(
                        "font-semibold flex items-center text-sm hover:underline",
                        theme === 'dark'
                          ? 'text-[#e18d58] hover:text-[#e18d58]/80'
                          : 'text-[#800000] hover:text-[#800000]/80'
                      )}>
                        View all challenges <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className={cn(
                        "mb-2",
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>No active challenges</p>
                      <Button className={cn(
                        "bg-nav-bg border",
                        theme === 'dark'
                          ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                          : 'border-[#800000] text-[#800000] hover:bg-active'
                      )}>
                        Join a challenge
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Forum Posts */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className={cn(
                  "text-xl font-semibold",
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )}>Recent Community Discussions</h2>
                <Link href="/forum" className={cn(
                  "flex items-center text-sm font-medium hover:underline",
                  theme === 'dark'
                    ? 'text-[#e18d58] hover:text-[#e18d58]/80'
                    : 'text-[#800000] hover:text-[#800000]/80'
                )}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {threadsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className={cn(
                    "h-8 w-8 animate-spin",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )} />
                </div>
              ) : latestThreads && latestThreads.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {latestThreads.map((thread: Thread) => (
                    <div key={thread.id} className={cn(
                      "rounded-xl border p-4 bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <h3 className={cn(
                        "text-base font-medium mb-2",
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>
                        {thread.title}
                      </h3>
                      <div className={cn(
                        "flex items-center text-xs",
                        theme === 'dark' ? 'text-white/50' : 'text-[#800000]/70'
                      )}>
                        <Users className="h-3 w-3 mr-1" />
                        <span className="mr-4">{thread.comment_count} comments</span>
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="mr-4">{thread.view_count} views</span>
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        <span className="mr-4">{thread.like_count} likes</span>
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cn(
                  "text-center py-8 rounded-xl border bg-nav-bg",
                  theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                )}>
                  <p className={cn(
                    "mb-3",
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                  )}>No forum threads yet</p>
                  <Link href="/forum">
                    <Button className={cn(
                      "bg-nav-bg border",
                      theme === 'dark'
                        ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                        : 'border-[#800000] text-[#800000] hover:bg-active'
                    )}>
                      Start a discussion
                    </Button>
                  </Link>
                </div>
              )}
            </section>


          </div>
          <FoodLogger />

        </main>
      </div>
      <MobileNavigation activeTab="home" />
    </div>
  );
}
