import { Link, useLocation } from "wouter";
import { 
  Home,
  Users,
  MessageSquare,
  User,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

type MobileNavigationProps = {
  activeTab?: string;
};

export default function MobileNavigation({ activeTab = "home" }: MobileNavigationProps) {
  const [location] = useLocation();

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
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center -mt-5 shadow-lg border-4 border-white">
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
      href: "/mentors",
      icon: <User className="h-6 w-6" />,
      label: "Mentors",
      id: "mentors"
    }
  ];

  // Handle special case for profile
  if (location.startsWith("/profile/")) {
    activeTab = "profile";
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex md:hidden z-30">
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-2",
            item.id === "create" 
              ? "" 
              : activeTab === item.id 
                ? "text-secondary-dark" 
                : "text-neutral-500"
          )}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
