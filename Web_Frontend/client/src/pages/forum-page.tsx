import { useState } from "react";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

export default function ForumPage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Forum categories
  const categories = [
    { id: "all", name: "All Topics" },
    { id: "basketball", name: "Basketball" },
    { id: "soccer", name: "Soccer" },
    { id: "running", name: "Running" },
    { id: "swimming", name: "Swimming" },
    { id: "training", name: "Training Tips" },
    { id: "programs", name: "Programs" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="forum" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h1 className={cn(
                "text-2xl md:text-3xl font-bold",
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>
                Forum
              </h1>
              
              <div className="flex items-center space-x-2">
                <Link href="/forum/new">
                  <Button className={cn(
                    "bg-nav-bg border",
                    theme === 'dark' 
                      ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                      : 'border-[#800000] text-[#800000] hover:bg-background'
                  )}>
                    + New Thread
                  </Button>
                </Link>
                <Button className={cn(
                  "bg-nav-bg border",
                  theme === 'dark' 
                    ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                    : 'border-[#800000] text-[#800000] hover:bg-background'
                )}>
                  <Filter className="h-4 w-4" />
                  <span className="ml-2">Filters</span>
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className={cn(
                "absolute left-3 top-2.5 h-4 w-4",
                theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
              )} />
              <Input
                type="text"
                placeholder="Search discussions..."
                className={cn(
                  "pl-9 pr-4 py-2 w-full bg-nav-bg border",
                  theme === 'dark' 
                    ? 'border-[#e18d58] text-white placeholder:text-white/70' 
                    : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/70'
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded-full whitespace-nowrap bg-nav-bg border",
                    theme === 'dark'
                      ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                      : 'border-[#800000] text-[#800000] hover:bg-background',
                    selectedCategory === category.id && (
                      theme === 'dark'
                        ? 'font-bold bg-[#e18d58]/20'
                        : 'font-bold'
                    )
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* No Threads Message */}
            <div className={cn(
              "text-center py-12 bg-nav-bg rounded-xl border",
              theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
            )}>
              <h3 className={cn(
                "text-lg font-bold mb-2",
                theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
              )}>
                No threads found
              </h3>
              <p className={cn(
                "max-w-md mx-auto",
                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
              )}>
                There are no forum threads yet. Be the first to start a discussion!
              </p>
              <Button 
                className={cn(
                  "mt-4 bg-nav-bg border",
                  theme === 'dark' 
                    ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20' 
                    : 'border-[#800000] text-[#800000] hover:bg-background'
                )}
                onClick={() => window.location.href = '/forum/new'}
              >
                Create New Thread
              </Button>
            </div>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="forum" />
    </div>
  );
}
