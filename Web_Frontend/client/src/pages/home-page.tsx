import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Trophy, Users, Calendar, MapPin, Search, UserCircle } from "lucide-react";
import { QuoteDailyCard } from "@/components/ui/quote-daily-card";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();

  // const { data: latestThreads, isLoading: threadsLoading } = useQuery({
  //   queryKey: ["/api/forum/threads"],
  //   queryFn: async () => {
  //     const res = await fetch("/api/forum/threads?limit=3");
  //     if (!res.ok) throw new Error("Failed to fetch threads");
  //     return res.json();
  //   },
  // });

  // const { data: challenges, isLoading: challengesLoading } = useQuery({
  //   queryKey: ["/api/challenges"],
  //   queryFn: async () => {
  //     const res = await fetch("/api/challenges?limit=3");
  //     if (!res.ok) throw new Error("Failed to fetch challenges");
  //     return res.json();
  //   },
  // });

  // const { data: programs, isLoading: programsLoading } = useQuery({
  //   queryKey: ["/api/programs"],
  //   queryFn: async () => {
  //     const res = await fetch("/api/programs?limit=4");
  //     if (!res.ok) throw new Error("Failed to fetch programs");
  //     return res.json();
  //   },
  // });

  // Mock data for demonstration
    const latestThreads = [
        {
        id: 1,
        category: "Basketball",
        firstPost: { content: "How to improve my shooting?" },
        postCount: 5,
        createdAt: "2023-10-01T12:00:00Z",
        },
        {
        id: 2,
        category: "Soccer",
        firstPost: { content: "Best drills for dribbling?" },
        postCount: 3,
        createdAt: "2023-10-02T12:00:00Z",
        },
    ];
    const challenges = [
        { id: 1, title: "30-Day Running Challenge", targetValue: 100, unit: "km" },
        { id: 2, title: "Weekly Basketball Practice", targetValue: 5, unit: "hours" },
    ];
    const programs = [
        { id: 1, name: "Local Basketball League", location: "Downtown Gym", description: "Join our local basketball league for all ages.", sportType: "Basketball", ageGroups: ["18-25", "26-35"] },
        { id: 2, name: "Soccer Training Camp", location: "City Park", description: "Intensive training for aspiring soccer players.", sportType: "Soccer", ageGroups: ["12-18"] },
    ];

    const challengesLoading = false;
    const programsLoading = false;
    const threadsLoading = false;

  // Display daily motivational quote
  const quotedailySection = (
    <div className="mb-6">
      <QuoteDailyCard />
    </div>
  );

  // MOCK DATA START - GOAL PROGRESSES - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION
  const mockGoalProgresses = [
    {
      id: 1,
      title: "Run 5K",
      progress: 60,
      type: "running"
    },
    {
      id: 2,
      title: "Daily Steps",
      progress: 75,
      type: "walking"
    }
  ];
  // MOCK DATA END - GOAL PROGRESSES - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION

  // MOCK DATA START - CHALLENGES - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION
  const mockChallenges = [
    {
      id: 1,
      title: "10K Steps Challenge",
      participants: 24,
      daysLeft: 5
    },
    {
      id: 2,
      title: "Swimming Marathon",
      participants: 12,
      daysLeft: 15
    }
  ];
  // MOCK DATA END - CHALLENGES - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION

  // MOCK DATA START - COMMUNITY DISCUSSIONS - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION
  const mockDiscussions = [
    {
      id: 1,
      title: "Best pre-workout routine",
      author: "John Doe",
      replies: 12,
      category: "Training"
    },
    {
      id: 2,
      title: "Marathon preparation tips",
      author: "Jane Smith",
      replies: 8,
      category: "Running"
    }
  ];
  // MOCK DATA END - COMMUNITY DISCUSSIONS - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION

  // MOCK DATA START - SPORTS PROGRAMS - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION
  const mockPrograms = [
    {
      id: 1,
      title: "Basketball Training",
      location: "Istanbul",
      price: "500₺/month"
    },
    {
      id: 2,
      title: "Swimming Classes",
      location: "Ankara",
      price: "600₺/month"
    }
  ];
  // MOCK DATA END - SPORTS PROGRAMS - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION

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
                    onClick={() => setLocation("/goals?new=true")}
                  >
                    Set New Goal
                  </Button>
                  <Button
                    variant="default"
                    className={cn(
                      "flex items-center gap-2 bg-nav-bg border",
                      theme === 'dark'
                        ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                        : 'border-[#800000] text-[#800000] hover:bg-active'
                    )}
                    onClick={() => setLocation("/programs")}
                  >
                    <Search size={20} />
                    Browse Programs
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
                  )}>Your Activity</CardTitle>
                  <CardDescription className={cn(
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                  )}>Stats for this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "2", label: "Active Goals" },
                      { value: "3", label: "Forum Posts" },
                      { value: "1", label: "Challenges" },
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
                    {[
                      { label: "Running Goal", progress: "3/5 miles", percent: "60%" },
                      { label: "Basketball Practice", progress: "2/4 hours", percent: "50%" }
                    ].map((goal, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={cn(
                            "font-medium",
                            theme === 'dark' ? 'text-white' : 'text-[#800000]'
                          )}>{goal.label}</span>
                          <span className={cn(
                            theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                          )}>{goal.progress}</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2.5">
                          <div className={cn(
                            "h-2.5 rounded-full",
                            theme === 'dark' ? 'bg-[#e18d58]' : 'bg-[#800000]'
                          )} style={{ width: goal.percent }}></div>
                        </div>
                      </div>
                    ))}
                    <Link href="/goals" className={cn(
                      "flex items-center text-sm font-medium hover:underline",
                      theme === 'dark' 
                        ? 'text-[#e18d58] hover:text-[#e18d58]/80' 
                        : 'text-[#800000] hover:text-[#800000]/80'
                    )}>
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
                  {latestThreads.map((thread: any) => (
                    <div key={thread.id} className={cn(
                      "rounded-xl border p-4 bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <div className="flex items-center mb-2">
                        <Link href={`/forum?category=${encodeURIComponent(thread.category.toLowerCase())}`}
                          className={cn(
                            "font-semibold hover:underline cursor-pointer",
                            theme === 'dark' ? 'text-[#e18d58] hover:text-[#e18d58]/80' : 'text-[#800000] hover:text-[#800000]/80'
                          )}
                        >
                          /{thread.category}
                        </Link>
                      </div>
                      <p className={cn(
                        "text-sm mb-3",
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                      )}>
                        {thread.firstPost?.content?.substring(0, 150)}
                        {thread.firstPost?.content?.length > 150 ? "..." : ""}
                      </p>
                      <div className={cn(
                        "flex items-center text-xs",
                        theme === 'dark' ? 'text-white/50' : 'text-[#800000]/70'
                      )}>
                        <Users className="h-3 w-3 mr-1" />
                        <span className="mr-4">{thread.postCount} posts</span>
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
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

            {/* Local Sports Programs */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className={cn(
                  "text-xl font-semibold",
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )}>
                  Nearby Sports Programs
                </h2>
                <Link href="/programs" className={cn(
                  "flex items-center text-sm font-medium hover:underline",
                  theme === 'dark' 
                    ? 'text-[#e18d58] hover:text-[#e18d58]/80' 
                    : 'text-[#800000] hover:text-[#800000]/80'
                )}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              {programsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className={cn(
                    "h-8 w-8 animate-spin",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )} />
                </div>
              ) : programs && programs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.slice(0, 3).map((program: any) => (
                    <Card key={program.id} className={cn(
                      "overflow-hidden border bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <div className="bg-nav-bg h-40 flex items-center justify-center">
                        {program.sportType === "Basketball" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-16 w-16 text-secondary-dark"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M4.93 4.93a19.4 19.4 0 0 1 4.7 7.28 19.4 19.4 0 0 1-7.28-4.7" />
                            <path d="M11.5 12.5A19.4 19.4 0 0 1 11.5 19a19.4 19.4 0 0 1 0-13" />
                            <path d="M12.5 11.5a19.4 19.4 0 0 0 6.5 6.5 19.4 19.4 0 0 0-13 0" />
                          </svg>
                        )}
                        {program.sportType === "Soccer" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-16 w-16 text-secondary-dark"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m12 2 3 7h6l-5 5 2 8-6-4-6 4 2-8-5-5h6l3-7z" />
                          </svg>
                        )}
                        {program.sportType !== "Basketball" && program.sportType !== "Soccer" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-16 w-16 text-secondary-dark"
                          >
                            <path d="M18 8c0 2.5-1 4-2 6-1.5 2.5-3 4-3 6" />
                            <path d="M9 10a3.5 3.5 0 0 0 5 0" />
                            <path d="M11 6a5 5 0 0 1 10 0c0 2.5-2 4-5 6-3 2-5 3.5-5 6" />
                            <path d="M3 14c0-2.5 2-4 5-6 3-2 5-3.5 5-6" />
                          </svg>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className={cn(
                          "font-semibold mb-1",
                          theme === 'dark' ? 'text-white' : 'text-[#800000]'
                        )}>{program.name}</h3>
                        <div className={cn(
                          "flex items-center text-xs mb-2",
                          theme === 'dark' ? 'text-white/50' : 'text-[#800000]/70'
                        )}>
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{program.location}</span>
                        </div>
                        <p className={cn(
                          "text-sm line-clamp-2 mb-3",
                          theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                        )}>{program.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {program.ageGroups.map((age: string, index: number) => (
                            <span
                              key={index}
                              className={cn(
                                "inline-block px-2 py-1 text-xs rounded-full border",
                                theme === 'dark' 
                                  ? 'border-[#e18d58] text-white bg-[#e18d58]/10' 
                                  : 'border-[#800000] text-[#800000] bg-background'
                              )}
                            >
                              {age}
                            </span>
                          ))}
                        </div>
                        <Link href={`/programs/${program.id}`}>
                          <Button className={cn(
                            "w-full bg-nav-bg border",
                            theme === 'dark'
                              ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                              : 'border-[#800000] text-[#800000] hover:bg-active'
                          )}>
                            View Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
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
                  )}>No programs available in your area</p>
                  <Link href="/programs">
                    <Button className={cn(
                      "bg-nav-bg border",
                      theme === 'dark'
                        ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                        : 'border-[#800000] text-[#800000] hover:bg-active'
                    )}>
                      Browse all programs
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="home" />
    </div>
  );
}
