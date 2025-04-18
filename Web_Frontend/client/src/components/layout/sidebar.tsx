import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import GoalProgress from "@/components/goals/goal-progress";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  MessageSquare,
  User,
  BarChart2,
  Award,
  FileText,
  LogOut,
  Bell
} from "lucide-react";

type SidebarProps = {
  activeTab?: string;
};

export default function Sidebar({ activeTab = "home" }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get user's goals for the progress section
  const { data: goals } = useQuery({
    queryKey: ["/api/goals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
    enabled: !!user
  });

  const activeClasses = "bg-primary text-secondary-dark font-medium";
  const inactiveClasses = "text-neutral-700 hover:bg-primary-light hover:text-secondary-dark";

  const links = [
    { 
      href: "/", 
      label: "Home", 
      icon: <Home className="h-5 w-5 mr-3" />, 
      id: "home" 
    },
    { 
      href: "/communities", 
      label: "Communities", 
      icon: <Users className="h-5 w-5 mr-3" />, 
      id: "communities" 
    },
    { 
      href: "/forum", 
      label: "Forums", 
      icon: <MessageSquare className="h-5 w-5 mr-3" />, 
      id: "forum" 
    },
    { 
      href: "/mentors", 
      label: "Mentors", 
      icon: <User className="h-5 w-5 mr-3" />, 
      id: "mentors" 
    },
    { 
      href: "/goals", 
      label: "My Goals", 
      icon: <BarChart2 className="h-5 w-5 mr-3" />, 
      id: "goals" 
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: <Bell className="h-5 w-5 mr-3" />,
      id: "notifications"
    },
    { 
      href: "/challenges", 
      label: "Challenges", 
      icon: <Award className="h-5 w-5 mr-3" />, 
      id: "challenges" 
    },
    { 
      href: "/programs", 
      label: "Programs", 
      icon: <FileText className="h-5 w-5 mr-3" />, 
      id: "programs" 
    }
  ];

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Handle outside clicks to close mobile menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isMobileMenuOpen) {
        const target = e.target as HTMLElement;
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMobileMenuOpen]);

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-neutral-200 overflow-y-auto z-40",
          isMobileMenuOpen ? "block" : "hidden md:block"
        )}
      >
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <Link 
              key={link.id}
              href={link.href}
              className={cn(
                "flex items-center p-2 rounded-md", 
                activeTab === link.id ? activeClasses : inactiveClasses
              )}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center p-2 rounded-md w-full text-left text-neutral-700 hover:bg-primary-light hover:text-secondary-dark"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </nav>
        
        {/* Goals progress section */}
        <div className="p-3 mt-6 border-t border-neutral-200">
          <div className="bg-neutral-100 rounded-lg p-3">
            <h3 className="font-medium text-secondary-dark text-sm">Your Progress</h3>
            
            {goals && goals.length > 0 ? (
              <div className="mt-2 space-y-3">
                {goals.slice(0, 2).map((goal: any) => (
                  <GoalProgress key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-neutral-600">
                <p>No active goals</p>
                <Link href="/goals">
                  <span className="text-secondary hover:underline text-xs mt-1 inline-block">
                    Set your first goal →
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
