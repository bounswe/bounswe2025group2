import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import AvatarWithBadge from "@/components/ui/avatar-with-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  Filter,
  MessageSquare, 
  Award,
  Star, 
  ChevronRight
} from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

export default function MentorsPage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");

  // Fetch mentors and coaches
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users/mentors"],
    queryFn: async () => {
      const res = await fetch("/api/users/mentors");
      if (!res.ok) throw new Error("Failed to fetch mentors");
      return res.json();
    },
  });

  // Filter users by role, sport, and search query
  const filterUsers = (role: string) => {
    if (!users) return [];
    
    return users
      .filter((user: any) => user.role === role)
      .filter((user: any) => {
        if (searchQuery === "") return true;
        return (
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
      .filter((user: any) => {
        if (selectedSport === "all") return true;
        return user.interests && user.interests.some((interest: string) => 
          interest.toLowerCase() === selectedSport.toLowerCase()
        );
      });
  };

  const mentors = filterUsers("mentor");
  const coaches = filterUsers("coach");

  // Sports categories for filtering
  const sportsCategories = [
    { id: "all", name: "All Sports" },
    { id: "basketball", name: "Basketball" },
    { id: "soccer", name: "Soccer" },
    { id: "running", name: "Running" },
    { id: "swimming", name: "Swimming" },
    { id: "tennis", name: "Tennis" },
    { id: "football", name: "Football" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="mentors" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className={cn(
                  "text-2xl md:text-3xl font-bold",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Find Mentors & Coaches</h1>
                <p className={cn(
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>Connect with experienced mentors and verified coaches</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className={cn(
                    "absolute left-3 top-2.5 h-4 w-4",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )} />
                  <Input
                    type="text"
                    placeholder="Search mentors..."
                    className={cn(
                      "pl-9 pr-4 py-2 rounded-full text-sm bg-nav-bg w-full sm:w-60",
                      theme === 'dark' 
                        ? 'border-[#e18d58] text-white placeholder:text-white/70' 
                        : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/70'
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button className={cn(
                  "px-3 py-1.5 rounded-full bg-nav-bg border",
                  theme === 'dark' 
                    ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                    : 'border-[#800000] text-[#800000] hover:bg-background'
                )}>
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>
            </div>
            
            {/* Sports categories for filtering */}
            <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
              {sportsCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedSport === category.id ? "default" : "outline"}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded-full whitespace-nowrap bg-nav-bg border",
                    theme === 'dark' 
                      ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                      : 'border-[#800000] text-[#800000] hover:bg-background',
                    selectedSport === category.id && (
                      theme === 'dark' 
                        ? 'font-bold bg-[#e18d58]/20' 
                        : 'font-bold'
                    )
                  )}
                  onClick={() => setSelectedSport(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            
            {/* Tabs for Mentors and Coaches */}
            <Tabs defaultValue="mentors" className="w-full">
              <TabsList className={cn(
                "grid w-full max-w-md grid-cols-2 mb-6 bg-nav-bg border rounded-lg",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <TabsTrigger 
                  value="mentors" 
                  className={cn(
                    "data-[state=active]:bg-[#800000] data-[state=active]:text-white",
                    theme === 'dark' 
                      ? 'text-white data-[state=active]:bg-[#e18d58]' 
                      : 'text-[#800000]'
                  )}
                >
                  Mentors
                </TabsTrigger>
                <TabsTrigger 
                  value="coaches" 
                  className={cn(
                    "data-[state=active]:bg-[#800000] data-[state=active]:text-white",
                    theme === 'dark' 
                      ? 'text-white data-[state=active]:bg-[#e18d58]' 
                      : 'text-[#800000]'
                  )}
                >
                  Verified Coaches
                </TabsTrigger>
              </TabsList>
              
              {/* Mentors Tab */}
              <TabsContent value="mentors">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className={cn(
                      "h-8 w-8 animate-spin",
                      theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                    )} />
                  </div>
                ) : mentors && mentors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentors.map((mentor: any) => (
                      <MentorCard key={mentor.id} user={mentor} />
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
                        <Award className={cn(
                          "h-8 w-8",
                          theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                        )} />
                      </div>
                    </div>
                    <h3 className={cn(
                      "text-lg font-bold mb-2",
                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                    )}>No Mentors Found</h3>
                    <p className={cn(
                      "max-w-md mx-auto",
                      theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                    )}>
                      {searchQuery || selectedSport !== "all"
                        ? "Try adjusting your search filters to find mentors."
                        : "There are no mentors available at the moment. Check back later!"}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              {/* Coaches Tab */}
              <TabsContent value="coaches">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className={cn(
                      "h-8 w-8 animate-spin",
                      theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                    )} />
                  </div>
                ) : coaches && coaches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coaches.map((coach: any) => (
                      <MentorCard key={coach.id} user={coach} />
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
                        <Award className={cn(
                          "h-8 w-8",
                          theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                        )} />
                      </div>
                    </div>
                    <h3 className={cn(
                      "text-lg font-bold mb-2",
                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                    )}>No Coaches Found</h3>
                    <p className={cn(
                      "max-w-md mx-auto",
                      theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                    )}>
                      {searchQuery || selectedSport !== "all"
                        ? "Try adjusting your search filters to find coaches."
                        : "There are no verified coaches available at the moment. Check back later!"}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="mentors" />
    </div>
  );
}

function MentorCard({ user }: { user: any }) {
  const { theme } = useTheme();
  
  return (
    <Card className={cn(
      "bg-nav-bg transition-colors",
      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <AvatarWithBadge 
            src={user.profileImage}
            fallback={user.name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
            size="md"
            role={user.role}
            verified={user.verificationStatus}
            className={cn(
              theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className={cn(
                  "font-semibold truncate",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>
                  {user.name || user.username}
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className={cn(
                  "h-4 w-4",
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )} />
                <span className={cn(
                  "font-medium",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>
                  {user.rating || "4.5"}
                </span>
              </div>
            </div>
            
            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.interests.map((interest: string) => (
                  <Badge 
                    key={interest}
                    variant="outline"
                    className={cn(
                      "text-xs bg-nav-bg",
                      theme === 'dark' 
                        ? 'border-[#e18d58] text-white' 
                        : 'border-[#800000] text-[#800000]'
                    )}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
            
            {user.bio && (
              <p className={cn(
                "text-sm mt-2 line-clamp-2",
                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
              )}>
                {user.bio}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <MessageSquare className={cn(
                  "h-4 w-4",
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )} />
                <span className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>
                  {user.responseTime || "Usually responds in 24h"}
                </span>
              </div>
              
              <Link href={`/mentors/${user.id}`}>
                <Button 
                  size="sm"
                  className={cn(
                    "bg-nav-bg border",
                    theme === 'dark' 
                      ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                      : 'border-[#800000] text-[#800000] hover:bg-background'
                  )}
                >
                  View Profile
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
