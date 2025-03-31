import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ForumThreadCard from "@/components/forum/forum-thread-card";
import NewThreadModal from "@/components/forum/new-thread-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Filter } from "lucide-react";

export default function ForumPage() {
  const { user } = useAuth();
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: threads, isLoading } = useQuery({
    queryKey: ["/api/forum/threads", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/forum/threads" 
        : `/api/forum/threads/category/${selectedCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch threads");
      return res.json();
    },
  });

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Topics" },
    { id: "basketball", name: "Basketball" },
    { id: "soccer", name: "Soccer" },
    { id: "running", name: "Running" },
    { id: "swimming", name: "Swimming" },
    { id: "training_tips", name: "Training Tips" },
    { id: "programs", name: "Programs" },
  ];

  // Filter threads by search query if provided
  const filteredThreads = threads && searchQuery 
    ? threads.filter((thread: any) => 
        thread.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.firstPost?.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="forum" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-3xl mx-auto">
            {/* Header with actions */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-dark">Forum</h2>
              
              <div className="flex space-x-2">
                <Button 
                  className="px-3 py-1.5 text-sm font-medium rounded-full bg-primary text-secondary-dark flex items-center" 
                  onClick={() => setIsNewThreadModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Thread
                </Button>
                
                <Button className="px-3 py-1.5 text-sm font-medium rounded-full bg-white border border-neutral-300 text-neutral-700 flex items-center">
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </div>
            
            {/* Search bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search discussions..."
                  className="pl-9 pr-4 py-2 rounded-full text-sm border-neutral-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Categories */}
            <div className="flex overflow-x-auto pb-2 mb-4 gap-2 no-scrollbar">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap ${
                    selectedCategory === category.id 
                      ? "bg-secondary text-white" 
                      : "bg-white border border-neutral-300 text-neutral-700"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            
            {/* Threads list */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
              </div>
            ) : filteredThreads && filteredThreads.length > 0 ? (
              <>
                {filteredThreads.map((thread: any) => (
                  <ForumThreadCard key={thread.id} thread={thread} />
                ))}
                
                <div className="my-6 flex justify-center">
                  <Button className="px-4 py-2 bg-white border border-neutral-300 rounded-full text-neutral-700 text-sm hover:bg-neutral-50">
                    Load More Posts
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <h3 className="text-lg font-medium text-secondary-dark mb-2">No threads found</h3>
                <p className="text-neutral-600 mb-4">
                  {searchQuery 
                    ? "No results match your search. Try different keywords."
                    : selectedCategory !== "all" 
                      ? `There are no threads in the ${selectedCategory} category yet.`
                      : "There are no forum threads yet. Be the first to start a discussion!"
                  }
                </p>
                <Button 
                  className="bg-secondary text-white hover:bg-secondary-dark"
                  onClick={() => setIsNewThreadModalOpen(true)}
                >
                  Create New Thread
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="forum" />
      <NewThreadModal 
        isOpen={isNewThreadModalOpen} 
        onClose={() => setIsNewThreadModalOpen(false)} 
      />
    </div>
  );
}
