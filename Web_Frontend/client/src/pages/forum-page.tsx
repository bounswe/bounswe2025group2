import {JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useEffect, useState} from "react";
import {Link} from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Search, Filter, MessageCircle, ThumbsUp} from "lucide-react";
import {useTheme} from "@/theme/ThemeContext";
import {cn} from "@/lib/utils";
import {useMutation, useQuery} from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

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

function getCsrfToken() {
  const name = 'csrftoken';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const lastPart = parts.pop();
    if (lastPart) {
      const value = lastPart.split(';').shift();
      return value ?? '';
    }
  }
  return '';
}

export default function ForumPage() {
  const {theme} = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [selectedcategoryName, setSelectedcategoryName] = useState<string>("");
  const {data: forums, isLoading: forumsLoading} = useQuery({
    queryKey: ["forums"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/forums");

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return response.json();
    }
  });

  console.log(forums);

  useEffect(() => {
    if (forums && forums.length > 0) {
      setSelectedCategory(forums[0].id);
      setSelectedcategoryName(forums[0].title);
    }
  }, [forums]);

  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/threads/");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    }
  });
  console.log(threads);

  const [filteredThreads, setFilteredThreads] = useState([]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!threadsLoading && threads && Array.isArray(threads)) {
        console.log(threads)
        const filtered = threads.filter(
            (thread: any) => thread.forum === selectedcategoryName
        );

        const threadsWithContent: any[] = await Promise.all(
            filtered.map(async (thread: any) => {
              const csrfToken = getCsrfToken();
              const response = await fetch(
                  `http://localhost:8000/api/threads/${thread.id}`,
                  {
                    method: "GET",
                    credentials: "include",
                    headers: {
                      "X-CSRFToken": csrfToken,
                      "Content-Type": "application/json"
                    }
                  }
              );

              if (!response.ok) {
                throw new Error("Failed to fetch thread content");
              }

              const data = await response.json();
              return { ...thread, content: data.content };
            })
        );

        setFilteredThreads(threadsWithContent);
      }
    };

    fetchContent();
  }, [threads, threadsLoading, selectedcategoryName]);




  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const body = {
      forum: selectedCategory,
      title: title.trim(),
      content: content.trim(),
      is_pinned: false,
      is_locked: false
    };

    try {
      const csrfToken = getCsrfToken();

      const response = await fetch('http://localhost:8000/api/threads/', {
        method: "POST",
        body: JSON.stringify(body),
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create thread');
      }

      const data = await response.json();
      console.log(data);
      closeModal();
    } catch (err: any) {
      console.error(err.message);
    }
  };

  // State to control the modal visibility
  const [isModalOpen, setModalOpen] = useState(false);
  // State for input fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Function to open the modal
  const openModal = () => {
    setModalOpen(true); // Set modal visibility to true
  };

  // Function to close the modal
  const closeModal = () => {
    setModalOpen(false); // Set modal visibility to false
  };
  // @ts-ignore
  return (
      <div className="min-h-screen bg-background">
        <MobileHeader/>
        <div className="flex mt-14">
          <Sidebar activeTab="forum"/>
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
                    <Button className={cn(
                        "bg-nav-bg border",
                        theme === 'dark'
                            ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                            : 'border-[#800000] text-[#800000] hover:bg-background'
                      )}
                      onClick={openModal}>
                      + New Thread
                    </Button>
                </div>

                {/* Modal Popup */}
                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                      <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-lg font-semibold mb-4">Create a New Thread</h2>
                        {/* Form for thread creation */}
                        <form onSubmit={handleSubmit}>
                          <div className="mb-4">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                              Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                placeholder="Enter thread title"
                                value={title} // Bind input to the state
                                onChange={(e) => setTitle(e.target.value)} // Update state when user types
                            />
                          </div>
                          <div className="mb-4">
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                              Content
                            </label>
                            <textarea
                                id="content"
                                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                placeholder="Enter thread content"
                                value={content} // Bind textarea to the state
                                onChange={(e) => setContent(e.target.value)} // Update state when user types
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                                type="submit"
                                className={cn(
                                    "px-4 py-2 rounded-md mr-2 border",
                                    theme === 'dark'
                                        ? 'bg-[#e18d58] text-white hover:bg-[#e18d58]/80'
                                        : 'bg-[#800000] text-white hover:bg-[#a00000]'
                                )}
                            >
                              Submit
                            </button>
                            {/* Cancel button to close the modal */}
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                                onClick={closeModal} // Close modal on cancel
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                )}
              </div>

              {/* Categories */}
              <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
              {forumsLoading ? (
                  <div>Loading...</div>
                ) : (
                  forums.map((forum: any) => {
                    const isSelected = selectedCategory === forum.id;
                    const baseStyles = "px-4 py-1.5 text-sm rounded-full whitespace-nowrap bg-nav-bg border";
                    const darkStyles = isSelected
                        ? "font-bold bg-[#e18d58]/20 border-[#e18d58] text-white hover:bg-[#e18d58]/20"
                        : "border-[#e18d58] text-white hover:bg-[#e18d58]/20";

                    const lightStyles = isSelected
                        ? "font-bold border-[#800000] text-[#800000] hover:bg-background"
                        : "border-[#800000] text-[#800000] hover:bg-background";
                    return (
                        <Button
                            key={forum.id}
                            variant={isSelected ? "default" : "outline"}
                            className={cn(baseStyles, theme === 'dark' ? darkStyles : lightStyles)}
                            onClick={() => {setSelectedCategory(forum.id);
                                                  setSelectedcategoryName(forum.title);}}
                        >
                          {forum.title}
                        </Button>
                    );
                  })
              )}
            </div>

              {/* Thread List */}
              {(threadsLoading || filteredThreads.length === 0) ? (
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
                    {searchQuery
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
                      onClick={openModal}
                  >
                    Create New Thread
                  </Button>
                </div>
              ) : filteredThreads.map((thread: any, idx : any) => (
                  <Link key={thread.id} href={`/forum/` + thread.id}>
                    <div className={cn(
                        "p-4 rounded-lg bg-nav-bg border hover:border-opacity-80 transition-colors cursor-pointer",
                        theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]',
                        idx !== filteredThreads.length - 1 ? 'mb-2' : ''
                    )}>
                      <div className="flex items-start gap-4">
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
                            {thread.content ? `${thread.content.substring(0, 150)}...` : "(No content)"}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={cn(
                                "font-medium",
                                theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                            )}>
                              {thread.author}
                            </span>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              <span>{thread.comment_count}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Last activity:</span>
                              <span>
                                {thread.updated_at
                                    ? `${formatDistanceToNow(new Date(thread.last_activity), { addSuffix: true })}`
                                  : "Unknown"}
                              </span>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
              ))}
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="forum" />
    </div>
  );
}


