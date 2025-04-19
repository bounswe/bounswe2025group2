import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Phone, 
  Clock,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

export default function ProgramsPage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState("");
  const [sportTypeFilter, setSportTypeFilter] = useState("");

  // Fetch all sports programs
  const { data: programs, isLoading } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const res = await fetch("/api/programs");
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });

  // Filter programs by search query and filters
  const filteredPrograms = programs ? programs.filter((program: any) => {
    // Search query filter
    const matchesSearch = searchQuery === "" || 
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.sportType.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Location filter
    const matchesLocation = locationFilter === "" || locationFilter === "all" || 
      program.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    // Age group filter
    const matchesAgeGroup = ageGroupFilter === "" || ageGroupFilter === "all" ||
      program.ageGroups.includes(ageGroupFilter);
    
    // Sport type filter
    const matchesSportType = sportTypeFilter === "" || sportTypeFilter === "all" ||
      program.sportType.toLowerCase() === sportTypeFilter.toLowerCase();
    
    return matchesSearch && matchesLocation && matchesAgeGroup && matchesSportType;
  }) : [];

  // Get unique locations, age groups, and sport types for filter options
  const locations = programs 
    ? Array.from(new Set(programs.map((p: any) => p.location)))
    : [];
  
  const sportTypes = programs
    ? Array.from(new Set(programs.map((p: any) => p.sportType)))
    : [];
  
  const ageGroups = programs
    ? Array.from(new Set(programs.flatMap((p: any) => p.ageGroups)))
    : [];

  const clearFilters = () => {
    setLocationFilter("all");
    setAgeGroupFilter("all");
    setSportTypeFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="programs" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className={cn(
                  "text-2xl font-semibold",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Sports Programs</h2>
                <p className={cn(
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>Find local sports programs and activities</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className={cn(
                    "absolute left-3 top-2.5 h-4 w-4",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )} />
                  <Input
                    type="text"
                    placeholder="Search programs..."
                    className={cn(
                      "pl-9 pr-4 py-2 rounded-full text-sm w-full sm:w-60 bg-nav-bg",
                      theme === 'dark' 
                        ? 'border-[#e18d58] text-white placeholder:text-white/70' 
                        : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/70'
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Filters */}
            <div className={cn(
              "bg-nav-bg rounded-lg border p-4 mb-6",
              theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
            )}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className={cn(
                    "text-sm font-medium mb-1 block",
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className={cn(
                      "bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
                    )}>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      "bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <SelectItem value="all" className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}>
                        All locations
                      </SelectItem>
                      {locations.map((location) => (
                        <SelectItem 
                          key={location as string} 
                          value={location as string} 
                          className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}
                        >
                          {location as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className={cn(
                    "text-sm font-medium mb-1 block",
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>Age Group</label>
                  <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
                    <SelectTrigger className={cn(
                      "bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
                    )}>
                      <SelectValue placeholder="All age groups" />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      "bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <SelectItem value="all" className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}>
                        All age groups
                      </SelectItem>
                      {ageGroups.map((age) => (
                        <SelectItem 
                          key={age as string} 
                          value={age as string} 
                          className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}
                        >
                          {age as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className={cn(
                    "text-sm font-medium mb-1 block",
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>Sport Type</label>
                  <Select value={sportTypeFilter} onValueChange={setSportTypeFilter}>
                    <SelectTrigger className={cn(
                      "bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58] text-white' : 'border-[#800000] text-[#800000]'
                    )}>
                      <SelectValue placeholder="All sports" />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      "bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <SelectItem value="all" className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}>
                        All sports
                      </SelectItem>
                      {sportTypes.map((sport) => (
                        <SelectItem 
                          key={sport as string} 
                          value={sport as string}
                          className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}
                        >
                          {sport as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full bg-nav-bg",
                      theme === 'dark' ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' : 'border-[#800000] text-[#800000] hover:bg-active'
                    )}
                    onClick={clearFilters}
                    disabled={(locationFilter === "all" || !locationFilter) && 
                             (ageGroupFilter === "all" || !ageGroupFilter) && 
                             (sportTypeFilter === "all" || !sportTypeFilter) && 
                             !searchQuery}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Programs Grid */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className={cn(
                  "h-8 w-8 animate-spin",
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )} />
              </div>
            ) : filteredPrograms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program: any) => (
                  <ProgramCard key={program.id} program={program} />
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
                    <Users className={cn(
                      "h-8 w-8",
                      theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                    )} />
                  </div>
                </div>
                <h3 className={cn(
                  "text-lg font-medium mb-2",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>No Programs Found</h3>
                <p className={cn(
                  "max-w-md mx-auto mb-6",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>
                  We couldn't find any programs matching your criteria. Try adjusting your filters or search terms.
                </p>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className={cn(
                    "bg-nav-bg",
                    theme === 'dark' ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' : 'border-[#800000] text-[#800000] hover:bg-active'
                  )}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="programs" />
    </div>
  );
}

function ProgramCard({ program }: { program: any }) {
  const { theme } = useTheme();
  
  return (
    <Card className={cn(
      "bg-nav-bg border",
      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={cn(
              "text-lg font-semibold mb-1",
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>{program.name}</h3>
            <p className={cn(
              "text-sm mb-2",
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>{program.description}</p>
          </div>
          <SportIcon sport={program.sportType} className={theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className={cn(
              "h-4 w-4 shrink-0",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}>{program.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className={cn(
              "h-4 w-4 shrink-0",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}>{program.schedule}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className={cn(
              "h-4 w-4 shrink-0",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <div className="flex flex-wrap gap-1">
              {program.ageGroups.map((age: string) => (
                <Badge 
                  key={age} 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    theme === 'dark' 
                      ? 'border-[#e18d58] text-white bg-transparent' 
                      : 'border-[#800000] text-[#800000] bg-transparent'
                  )}
                >
                  {age}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className={cn(
              "h-4 w-4 shrink-0",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}>{program.price}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className={cn(
              "h-4 w-4 shrink-0",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}>{program.contact}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className={cn(
              "h-4 w-4 shrink-0",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )} />
            <span className={theme === 'dark' ? 'text-white' : 'text-[#800000]'}>Duration: {program.duration}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            className={cn(
              "bg-nav-bg",
              theme === 'dark' 
                ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                : 'border-[#800000] text-[#800000] hover:bg-active'
            )}
          >
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SportIcon({ sport, className }: { sport: string; className?: string }) {
  switch (sport) {
    case "Basketball":
      return <BasketballIcon className={className} />;
    case "Soccer":
      return <SoccerIcon className={className} />;
    case "Swimming":
      return <SwimmingIcon className={className} />;
    case "Running":
      return <RunningIcon className={className} />;
    case "Tennis":
      return <TennisIcon className={className} />;
    case "Football":
      return <FootballIcon className={className} />;
    default:
      return (
        <div className={cn(
          "text-2xl font-bold",
          className
        )}>
          {sport}
        </div>
      );
  }
}

function BasketballIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l4.24 4.24" />
      <path d="M14.83 14.83l4.24 4.24" />
      <path d="M14.83 9.17l4.24-4.24" />
      <path d="M4.93 19.07l4.24-4.24" />
    </svg>
  );
}

function SoccerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function SwimmingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12h20" />
      <path d="M2 20h20" />
      <path d="M6 8l4-4 4 4 4-4" />
    </svg>
  );
}

function RunningIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M13 4v16" />
      <path d="M17 4v16" />
      <path d="M21 4v16" />
      <path d="M8 8l-5 8" />
      <path d="M4 20l5-8" />
    </svg>
  );
}

function TennisIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function FootballIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
