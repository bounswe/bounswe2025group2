import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/ThemeContext";
import {
  Home,
  Users,
  MessageSquare,
  User,
  BarChart2,
  Award,
  FileText,
  LogOut,
  Bell,
  Settings,
  MessageCircle
} from "lucide-react";

type SidebarProps = {
  activeTab?: string;
};

export default function Sidebar({ activeTab = "home" }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeClasses = cn(
    "font-medium",
    theme === 'dark' ? 'text-white' : 'active'
  );
  const inactiveClasses = "passive hover:bg-opacity-10 hover:text-active";

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
    },
    {
      href: "/chat",
      label: "Chat",
      icon: <MessageCircle className="h-5 w-5 mr-3" />,
      id: "chat"
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5 mr-3" />,
      id: "settings"
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
          "fixed left-0 top-14 bottom-0 w-56 nav-bg border-r border-theme overflow-y-auto z-40",
          isMobileMenuOpen ? "block" : "hidden md:block",
          theme === 'dark' ? 'text-white' : 'text-black'
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
            className="flex items-center p-2 rounded-md w-full text-left passive hover:bg-opacity-10 hover:text-active"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </nav>
        
        {/*/!* Goals progress section *!/*/}
        {/*<div className="p-3">*/}
        {/*  <div className={cn(*/}
        {/*    "rounded-lg p-3",*/}
        {/*    theme === 'dark' ? 'bg-background' : 'bg-background'*/}
        {/*  )}>*/}
        {/*    <h3 className="font-medium text-sm active">Your Progress</h3>*/}
        {/*    */}
        {/*    {goals && goals.length > 0 ? (*/}
        {/*      <div className="mt-2 space-y-3">*/}
        {/*        {goals.slice(0, 2).map((goal: any) => (*/}
        {/*          <GoalProgress key={goal.id} goal={goal} />*/}
        {/*        ))}*/}
        {/*      </div>*/}
        {/*    ) : (*/}
        {/*      <div className="mt-2 text-sm text-sub">*/}
        {/*        <p>No active goals</p>*/}
        {/*        <Link href="/goals">*/}
        {/*          <span className={cn(*/}
        {/*            "hover:underline text-xs mt-1 inline-block",*/}
        {/*            theme === 'dark' ? 'text-[#e18d58]' : 'active'*/}
        {/*          )}>*/}
        {/*            Set your first goal →*/}
        {/*          </span>*/}
        {/*        </Link>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*  </div>*/}
        {/*</div>*/}
      </aside>
    </>
  );
}
