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

export default function ProgramsPage() {
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
    ? [...new Set(programs.map((p: any) => p.location))]
    : [];
  
  const sportTypes = programs
    ? [...new Set(programs.map((p: any) => p.sportType))]
    : [];
  
  const ageGroups = programs
    ? [...new Set(programs.flatMap((p: any) => p.ageGroups))]
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
                <h2 className="text-2xl font-semibold text-secondary-dark">Sports Programs</h2>
                <p className="text-muted-foreground">Find local sports programs and activities</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search programs..."
                    className="pl-9 pr-4 py-2 rounded-full text-sm border-neutral-300 w-full sm:w-60"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Filters */}
            <div className="bg-card rounded-lg border border-border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map((location: string) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Age Group</label>
                  <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All age groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All age groups</SelectItem>
                      {ageGroups.map((age: string) => (
                        <SelectItem key={age} value={age}>
                          {age}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Sport Type</label>
                  <Select value={sportTypeFilter} onValueChange={setSportTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sports" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sports</SelectItem>
                      {sportTypes.map((sport: string) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="w-full"
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
                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
              </div>
            ) : filteredPrograms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program: any) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <div className="flex justify-center mb-4">
                  <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">No Programs Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We couldn't find any programs matching your criteria. Try adjusting your filters or search terms.
                </p>
                <Button variant="outline" onClick={clearFilters}>
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
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-primary flex items-center justify-center">
        {program.sportType === "Basketball" && (
          <BasketballIcon className="h-16 w-16 text-secondary-dark" />
        )}
        {program.sportType === "Soccer" && (
          <SoccerIcon className="h-16 w-16 text-secondary-dark" />
        )}
        {program.sportType === "Swimming" && (
          <SwimmingIcon className="h-16 w-16 text-secondary-dark" />
        )}
        {program.sportType === "Running" && (
          <RunningIcon className="h-16 w-16 text-secondary-dark" />
        )}
        {program.sportType === "Tennis" && (
          <TennisIcon className="h-16 w-16 text-secondary-dark" />
        )}
        {program.sportType === "Football" && (
          <FootballIcon className="h-16 w-16 text-secondary-dark" />
        )}
        {!["Basketball", "Soccer", "Swimming", "Running", "Tennis", "Football"].includes(program.sportType) && (
          <div className="text-2xl font-bold text-secondary-dark">{program.sportType}</div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{program.name}</h3>
        
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span className="truncate">{program.location}</span>
        </div>
        
        <p className="text-sm text-foreground line-clamp-2 mb-3">
          {program.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {program.ageGroups.map((age: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {age}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <DollarSign className="h-3.5 w-3.5 mr-1" />
            <span>{program.cost}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>Flexible schedule</span>
          </div>
          <div className="flex items-center">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span>All skill levels</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-3.5 w-3.5 mr-1" />
            <span>Contact available</span>
          </div>
        </div>
        
        <Link href={`/programs/${program.id}`}>
          <Button className="w-full bg-secondary text-white hover:bg-secondary-dark">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function BasketballIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93a19.4 19.4 0 0 1 4.7 7.28 19.4 19.4 0 0 1-7.28-4.7" />
      <path d="M11.5 12.5A19.4 19.4 0 0 1 11.5 19a19.4 19.4 0 0 1 0-13" />
      <path d="M12.5 11.5a19.4 19.4 0 0 0 6.5 6.5 19.4 19.4 0 0 0-13 0" />
    </svg>
  );
}

function SoccerIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m12 2 3 7h6l-5 5 2 8-6-4-6 4 2-8-5-5h6l3-7z" />
    </svg>
  );
}

function SwimmingIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 21a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14z"></path>
      <path d="M6 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"></path>
      <path d="M18 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"></path>
      <path d="M6 20v-7"></path>
      <path d="M18 20v-7"></path>
      <path d="M12 20v-9"></path>
      <path d="M12 8a4 4 0 0 1-4-4 4 4 0 0 1 8 0 4 4 0 0 1-4 4Z"></path>
    </svg>
  );
}

function RunningIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M13 4h3a2 2 0 0 1 2 2v14"></path>
      <path d="M2 20h3"></path>
      <path d="M13 20h9"></path>
      <path d="M10 12v8"></path>
      <path d="M6 12v8"></path>
      <path d="M10 12 2 9l8-7 8 7-8.055 2.99Z"></path>
    </svg>
  );
}

function TennisIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M18.09 8.57a6 6 0 0 0-8.48 8.48"></path>
      <path d="M5.91 15.43a6 6 0 0 0 8.48-8.48"></path>
    </svg>
  );
}

function FootballIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2v4"></path>
      <path d="M12 18v4"></path>
      <path d="m4.93 4.93 2.83 2.83"></path>
      <path d="m16.24 16.24 2.83 2.83"></path>
      <path d="M2 12h4"></path>
      <path d="M18 12h4"></path>
      <path d="m4.93 19.07 2.83-2.83"></path>
      <path d="m16.24 7.76 2.83-2.83"></path>
    </svg>
  );
}
