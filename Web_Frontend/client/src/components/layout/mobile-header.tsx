import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/ThemeContext";

export default function MobileHeader() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Get unread notifications count
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!user
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const isHidden = sidebar.classList.contains('hidden');
      sidebar.classList.toggle('hidden', !isHidden);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.name) {
      return user.name.split(' ').map(part => part[0]).join('').toUpperCase();
    }
    return user.username[0].toUpperCase();
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 nav-bg border-b border-theme z-30",
      theme === 'dark' ? 'text-white' : 'text-black'
    )}>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="p-1 mr-2 rounded-md focus:outline-none md:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/">
            <h1 className="text-lg font-semibold mention">
              <span className="hidden md:inline">GenFit</span>
              <span className="inline md:hidden">GF</span>
            </h1>
          </Link>
        </div>
        
        <div className={cn(
          "relative",
          isSearchOpen ? "w-full md:w-64" : "w-40 md:w-64"
        )}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sub" />
          <Input 
            type="text" 
            placeholder="Search programs, mentors..." 
            className="pl-8 pr-4 py-2 rounded-full text-sm bg-background border border-theme focus:outline-none focus:ring-2 focus:ring-active" 
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setIsSearchOpen(false)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button 
              variant="ghost" 
              className={cn(
                "p-1 rounded-full focus:outline-none relative",
                theme === 'dark' ? 'text-[#e18d58]' : ''
              )}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className={cn(
                "h-6 w-6",
                theme === 'dark' ? 'text-[#e18d58]' : ''
              )} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-2 h-2"></span>
              )}
            </Button>
            
            {showNotifications && (
              <div className={cn(
                "absolute right-0 mt-2 w-80 shadow-lg rounded-md border border-theme z-50",
                theme === 'dark' ? 'bg-[#2c2c2c]' : 'bg-[#f0f0f0]'
              )}>
                <div className="p-3 border-b border-theme">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                {notifications && notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification: any) => (
                      <div 
                        key={notification.id} 
                        className={cn(
                          "p-3 border-b border-theme hover:bg-opacity-10",
                          !notification.read && "bg-active bg-opacity-20"
                        )}
                      >
                        <p className="text-sm">{notification.content}</p>
                        <p className="text-xs text-sub mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sub">
                    <p>No notifications</p>
                  </div>
                )}
                <div className="p-2 text-center border-t border-theme">
                  <Link href="/notifications">
                    <Button variant="link" className="active text-sm">View all notifications</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <Link href="/profile">
            <Avatar className="h-8 w-8 border-2 border-theme">
              <AvatarImage src={user?.profileImage || undefined} alt="Profile" />
              <AvatarFallback className="nav-bg text-text">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
