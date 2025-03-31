import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileHeader() {
  const { user } = useAuth();
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
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-30">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="p-1 mr-2 rounded-md focus:outline-none md:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6 text-neutral-700" />
          </Button>
          <Link href="/">
            <h1 className="text-lg font-semibold text-secondary">
              <span className="hidden md:inline">SportsMentor</span>
              <span className="inline md:hidden">SM</span>
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            "relative",
            isSearchOpen ? "w-full md:w-64" : "w-40 md:w-64"
          )}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input 
              type="text" 
              placeholder="Search programs, mentors..." 
              className="pl-8 pr-4 py-2 rounded-full text-sm bg-neutral-100 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-primary-dark" 
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setIsSearchOpen(false)}
            />
          </div>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              className="p-1 rounded-full focus:outline-none relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-6 w-6 text-neutral-700" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-2 h-2"></span>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md border border-neutral-200 z-50">
                <div className="p-3 border-b border-neutral-200">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                {notifications && notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification: any) => (
                      <div 
                        key={notification.id} 
                        className={cn(
                          "p-3 border-b border-neutral-100 hover:bg-neutral-50",
                          !notification.read && "bg-primary-light/20"
                        )}
                      >
                        <p className="text-sm">{notification.content}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-neutral-500">
                    <p>No notifications</p>
                  </div>
                )}
                <div className="p-2 text-center border-t border-neutral-200">
                  <Link href="/notifications">
                    <Button variant="link" className="text-secondary text-sm">View all notifications</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <Link href={`/profile/${user?.username}`}>
            <Avatar className="h-8 w-8 border-2 border-primary">
              <AvatarImage src={user?.profileImage} alt="Profile" />
              <AvatarFallback className="bg-secondary text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
