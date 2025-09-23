import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

export default function CommunitiesPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="communities" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className={cn(
              "bg-nav-bg rounded-xl border p-8",
              theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
            )}>
              <h1 className={cn(
                "text-2xl md:text-3xl font-bold mb-2",
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>
                Communities
              </h1>
              <p className={cn(
                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
              )}>
                Connect with others who share your fitness interests
              </p>
            </div>

            {/* Coming Soon Message */}
            <div className="mt-8 text-center">
              <p className={cn(
                theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
              )}>Coming soon...</p>
            </div>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="communities" />
    </div>
  );
} 