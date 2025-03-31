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

export default function MentorsPage() {
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
                <h2 className="text-2xl font-semibold text-secondary-dark">Find Mentors & Coaches</h2>
                <p className="text-muted-foreground">Connect with experienced mentors and verified coaches</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search mentors..."
                    className="pl-9 pr-4 py-2 rounded-full text-sm border-neutral-300 w-full sm:w-60"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button className="px-3 py-1.5 rounded-full bg-white border border-neutral-300 text-neutral-700 flex items-center shrink-0">
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
                  className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${
                    selectedSport === category.id 
                      ? "bg-secondary text-white" 
                      : "bg-white border border-neutral-300 text-neutral-700"
                  }`}
                  onClick={() => setSelectedSport(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            
            {/* Tabs for Mentors and Coaches */}
            <Tabs defaultValue="mentors" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="mentors">Mentors</TabsTrigger>
                <TabsTrigger value="coaches">Verified Coaches</TabsTrigger>
              </TabsList>
              
              {/* Mentors Tab */}
              <TabsContent value="mentors">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                  </div>
                ) : mentors && mentors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentors.map((mentor: any) => (
                      <MentorCard key={mentor.id} user={mentor} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <div className="flex justify-center mb-4">
                      <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center">
                        <Award className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Mentors Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
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
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                  </div>
                ) : coaches && coaches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coaches.map((coach: any) => (
                      <MentorCard key={coach.id} user={coach} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <div className="flex justify-center mb-4">
                      <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center">
                        <Award className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Coaches Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
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
  return (
    <Card className="overflow-hidden hover:border-primary transition-colors">
      <CardContent className="p-0">
        <div className="bg-primary h-12"></div>
        <div className="p-4 pt-0 -mt-6">
          <div className="flex justify-center">
            <AvatarWithBadge
              src={user.profileImage}
              fallback={user.name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
              size="md"
              role={user.role}
              verified={user.verificationStatus}
            />
          </div>
          
          <div className="text-center mt-3">
            <h3 className="font-semibold">{user.name || user.username}</h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            
            <div className="flex justify-center flex-wrap gap-1 mt-2">
              {user.interests && user.interests.slice(0, 3).map((interest: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {user.interests && user.interests.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.interests.length - 3}
                </Badge>
              )}
            </div>
            
            {user.bio && (
              <p className="mt-3 text-sm text-foreground line-clamp-2">
                {user.bio}
              </p>
            )}
            
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <div className="flex flex-col items-center">
                <div className="flex items-center text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="ml-1 font-medium">4.8</span>
                </div>
                <span className="text-xs text-muted-foreground">Rating</span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="font-medium">24</span>
                <span className="text-xs text-muted-foreground">Mentees</span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="font-medium">3</span>
                <span className="text-xs text-muted-foreground">Years</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href={`/profile/${user.username}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Profile
                </Button>
              </Link>
              <Button size="sm" className="w-full bg-secondary text-white hover:bg-secondary-dark">
                Connect
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
