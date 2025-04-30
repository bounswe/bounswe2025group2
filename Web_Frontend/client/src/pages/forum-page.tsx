import { useState } from "react";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, MessageCircle, ThumbsUp } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

interface ForumThread {
  id: string;
  title: string;
  author: {
    username: string;
    name: string;
    avatar: string;
  };
  category: string;
  content: string;
  likes: number;
  replies: number;
  createdAt: string;
}

const mockThreads: ForumThread[] = [
  {
    id: "1",
    title: "Best Basketball Training Drills for Beginners",
    author: {
      username: "coachsmith",
      name: "John Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=coachsmith",
    },
    category: "basketball",
    content: "I've been coaching basketball for 10 years, and I wanted to share some effective drills for beginners...",
    likes: 45,
    replies: 12,
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Marathon Training Schedule Discussion",
    author: {
      username: "runneranna",
      name: "Anna Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=runneranna",
    },
    category: "running",
    content: "Looking for advice on preparing for my first marathon. Here's my current training schedule...",
    likes: 32,
    replies: 8,
    createdAt: "2024-03-14T15:30:00Z",
  },
  {
    id: "3",
    title: "Soccer Tactics: Modern Pressing Systems",
    author: {
      username: "tactician",
      name: "Mike Torres",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tactician",
    },
    category: "soccer",
    content: "Let's discuss the evolution of pressing tactics in modern soccer and how teams implement them...",
    likes: 67,
    replies: 25,
    createdAt: "2024-03-13T09:15:00Z",
  },
];

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

  // Filter threads based on search query and selected category
  const filteredThreads = mockThreads.filter((thread) => {
    const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || thread.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

            {/* Thread List */}
            {filteredThreads.length > 0 ? (
              <div>
                {filteredThreads.map((thread, idx) => (
                  <Link key={thread.id} href={`/forum`}>
                    <div className={cn(
                      "p-4 rounded-lg bg-nav-bg border hover:border-opacity-80 transition-colors cursor-pointer",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]',
                      idx !== filteredThreads.length - 1 ? 'mb-2' : ''
                    )}>
                      <div className="flex items-start gap-4">
                        <img
                          src={thread.author.avatar}
                          alt={thread.author.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className={cn(
                            "text-lg font-semibold mb-1",
                            theme === 'dark' ? 'text-white' : 'text-[#800000]'
                          )}>
                            {thread.title}
                          </h3>
                          <p className={cn(
                            "text-sm mb-2",
                            theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                          )}>
                            {thread.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={cn(
                              "font-medium",
                              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                            )}>
                              {thread.author.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{thread.likes}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              <span>{thread.replies}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
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
                  {searchQuery || selectedCategory !== 'all'
                    ? "No threads match your search criteria. Try adjusting your filters."
                    : "There are no forum threads yet. Be the first to start a discussion!"}
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
            )}
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="forum" />
    </div>
  );
}
