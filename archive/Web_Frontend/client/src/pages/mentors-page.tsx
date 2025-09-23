import { useState } from "react";
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
  Search, 
  Filter,
  MessageSquare, 
  Award,
  Star, 
  ChevronRight
} from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  username: string;
  name: string;
  role: 'mentor' | 'coach';
  bio: string;
  interests: string[];
  rating: number;
  reviewCount: number;
  verificationStatus: boolean;
  profileImage?: string;
}

// MOCK DATA START - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION
const mockUsers: User[] = [
  {
    id: 1,
    username: "johndoe",
    name: "John Doe",
    role: "mentor",
    bio: "Experienced basketball trainer with 5 years of experience",
    interests: ["basketball", "fitness"],
    rating: 4.8,
    reviewCount: 24,
    verificationStatus: false,
    profileImage: ""
  },
  {
    id: 2,
    username: "sarahsmith",
    name: "Sarah Smith",
    role: "coach",
    bio: "Professional swimming coach and former Olympic athlete",
    interests: ["swimming", "fitness"],
    rating: 4.9,
    reviewCount: 56,
    verificationStatus: true,
    profileImage: ""
  },
  {
    id: 3,
    username: "mikebrown",
    name: "Mike Brown",
    role: "mentor",
    bio: "Soccer enthusiast helping others improve their game",
    interests: ["soccer", "running"],
    rating: 4.7,
    reviewCount: 18,
    verificationStatus: false,
    profileImage: ""
  }
];
// MOCK DATA END - DESIGN CAN BE CHANGED OR DATA CAN BE REMOVED DURING IMPLEMENTATION

export default function MentorsPage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");

  // Filter users by role, sport, and search query
  const filterUsers = (role: 'mentor' | 'coach') => {
    return mockUsers
      .filter(user => user.role === role)
      .filter(user => {
        if (searchQuery === "") return true;
        return (
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.bio.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .filter(user => {
        if (selectedSport === "all") return true;
        return user.interests.some(interest => 
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
                {mentors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentors.map((mentor) => (
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
                {coaches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coaches.map((coach) => (
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

interface MentorCardProps {
  user: User;
}

function MentorCard({ user }: MentorCardProps) {
  const { theme } = useTheme();
  
  return (
    <Card className={cn(
      "bg-nav-bg border",
      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AvatarWithBadge
            src={user.profileImage}
            fallback={user.name[0].toUpperCase()}
            size="lg"
            role={user.role}
            verified={user.verificationStatus}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className={cn(
                  "font-semibold truncate",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>{user.name}</h3>
                <p className={cn(
                  "text-sm truncate",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>@{user.username}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className={cn(
                  "h-4 w-4 fill-current",
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>{user.rating}</span>
              </div>
            </div>
            <p className={cn(
              "text-sm mt-2 line-clamp-2",
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>{user.bio}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {user.interests.map((interest, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={cn(
                    "text-xs py-0 h-5",
                    theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
                  )}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className={cn(
              "h-4 w-4",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={cn(
              "text-sm",
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>{user.reviewCount} reviews</span>
          </div>
          <Link href={`/mentors`}>
            <Button
              variant="ghost"
              className={cn(
                "text-sm",
                theme === 'dark' ? 'text-white hover:text-[#e18d58]' : 'text-[#800000] hover:text-[#800000]/70'
              )}
            >
              View Profile
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
