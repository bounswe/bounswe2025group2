import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Trophy, Users, Calendar, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();

  const { data: latestThreads, isLoading: threadsLoading } = useQuery({
    queryKey: ["/api/forum/threads"],
    queryFn: async () => {
      const res = await fetch("/api/forum/threads?limit=3");
      if (!res.ok) throw new Error("Failed to fetch threads");
      return res.json();
    },
  });

  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ["/api/challenges"],
    queryFn: async () => {
      const res = await fetch("/api/challenges?limit=3");
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return res.json();
    },
  });

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const res = await fetch("/api/programs?limit=4");
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="home" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <section className="mb-8">
              <div className="bg-primary rounded-xl p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-secondary-dark mb-2">
                  Welcome back, {user?.name || user?.username}!
                </h1>
                <p className="text-secondary mb-4 md:text-lg">
                  Ready to continue your fitness journey today?
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-secondary text-white hover:bg-secondary-dark">
                    Set New Goal
                  </Button>
                  <Button variant="outline" className="border-secondary text-secondary-dark">
                    Explore Programs
                  </Button>
                </div>
              </div>
            </section>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Your Activity</CardTitle>
                  <CardDescription>Stats for this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-secondary">2</p>
                      <p className="text-sm text-muted-foreground">Active Goals</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-secondary">3</p>
                      <p className="text-sm text-muted-foreground">Forum Posts</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-secondary">1</p>
                      <p className="text-sm text-muted-foreground">Challenges</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-secondary">5</p>
                      <p className="text-sm text-muted-foreground">Days Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goal Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Current Goal Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Running Goal</span>
                        <span>3/5 miles</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-secondary h-2.5 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Basketball Practice</span>
                        <span>2/4 hours</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-secondary h-2.5 rounded-full" style={{ width: "50%" }}></div>
                      </div>
                    </div>
                    <Link href="/goals">
                      <Button variant="link" className="p-0 h-auto">
                        View all goals <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Active Challenges */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  {challengesLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                    </div>
                  ) : challenges && challenges.length > 0 ? (
                    <div className="space-y-3">
                      {challenges.slice(0, 2).map((challenge: any) => (
                        <div key={challenge.id} className="flex items-center p-2 rounded-lg border border-border">
                          <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <Trophy className="h-5 w-5 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{challenge.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {challenge.targetValue} {challenge.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Link href="/challenges">
                        <Button variant="link" className="p-0 h-auto">
                          View all challenges <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">No active challenges</p>
                      <Link href="/challenges">
                        <Button size="sm" className="bg-secondary text-white hover:bg-secondary-dark">
                          Join a challenge
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Forum Posts */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-secondary-dark">Recent Community Discussions</h2>
                <Link href="/forum">
                  <Button variant="link" className="text-secondary">
                    View All
                  </Button>
                </Link>
              </div>
              {threadsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                </div>
              ) : latestThreads && latestThreads.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {latestThreads.map((thread: any) => (
                    <div key={thread.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center mb-2">
                        <Link href={`/forum/${thread.id}`}>
                          <h3 className="font-medium text-secondary hover:text-secondary-dark">
                            /{thread.category}
                          </h3>
                        </Link>
                      </div>
                      <p className="text-sm text-foreground mb-3">
                        {thread.firstPost?.content?.substring(0, 150)}
                        {thread.firstPost?.content?.length > 150 ? "..." : ""}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
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
                <div className="text-center py-8 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground mb-3">No forum threads yet</p>
                  <Link href="/forum">
                    <Button className="bg-secondary text-white hover:bg-secondary-dark">
                      Start a discussion
                    </Button>
                  </Link>
                </div>
              )}
            </section>

            {/* Local Sports Programs */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-secondary-dark">
                  Nearby Sports Programs
                </h2>
                <Link href="/programs">
                  <Button variant="link" className="text-secondary">
                    View All
                  </Button>
                </Link>
              </div>
              {programsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                </div>
              ) : programs && programs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.slice(0, 3).map((program: any) => (
                    <Card key={program.id} className="overflow-hidden">
                      <div className="bg-primary h-40 flex items-center justify-center">
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
                        <h3 className="font-semibold mb-1">{program.name}</h3>
                        <div className="flex items-center text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{program.location}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{program.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {program.ageGroups.map((age: string, index: number) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-muted text-xs rounded-full"
                            >
                              {age}
                            </span>
                          ))}
                        </div>
                        <Link href={`/programs/${program.id}`}>
                          <Button size="sm" variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground mb-3">No programs found in your area</p>
                  <Link href="/programs">
                    <Button className="bg-secondary text-white hover:bg-secondary-dark">
                      Explore All Programs
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
