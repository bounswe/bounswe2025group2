import { Link, useLocation } from "wouter";
import { 
  Home,
  Users,
  MessageSquare,
  User,
  Plus,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/ThemeContext";

type MobileNavigationProps = {
  activeTab?: string;
};

export default function MobileNavigation({ activeTab = "home" }: MobileNavigationProps) {
  const [location] = useLocation();
  const { theme } = useTheme();

  // Navigation items
  const navItems = [
    {
      href: "/",
      icon: <Home className="h-6 w-6" />,
      label: "Home",
      id: "home"
    },
    {
      href: "/communities",
      icon: <Users className="h-6 w-6" />,
      label: "Communities",
      id: "communities"
    },
    {
      href: "/create",
      icon: (
        <div className="w-12 h-12 rounded-full nav-bg flex items-center justify-center -mt-5 shadow-lg border-4 border-theme">
          <Plus className="h-6 w-6 text-white" />
        </div>
      ),
      label: "New",
      id: "create"
    },
    {
      href: "/forum",
      icon: <MessageSquare className="h-6 w-6" />,
      label: "Forums",
      id: "forum"
    },
    {
      href: "/settings",
      icon: <Settings className="h-6 w-6" />,
      label: "Settings",
      id: "settings"
    }
  ];

  // Handle special case for profile
  if (location.startsWith("/profile/")) {
    activeTab = "profile";
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 nav-bg border-t border-theme flex md:hidden z-30",
      theme === 'dark' ? 'text-white' : 'text-black'
    )}>
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-2",
            item.id === "create" 
              ? "" 
              : activeTab === item.id 
                ? "active" 
                : "passive"
          )}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
