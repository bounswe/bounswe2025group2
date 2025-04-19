import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Moon } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode state based on current theme
  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  // Handle applying theme changes
  const handleApplyChanges = () => {
    // Only toggle if the current state doesn't match the desired state
    if ((isDarkMode && theme === 'light') || (!isDarkMode && theme === 'dark')) {
      toggleTheme();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="settings" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className={cn(
                "text-2xl font-semibold",
                theme === 'dark' ? 'text-white' : 'text-[#800000]'
              )}>Settings</h2>
              <p className={cn(
                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
              )}>Manage your account preferences</p>
            </div>

            {/* Settings Content */}
            <div className="space-y-6">
              {/* Appearance Section */}
              <div className={cn(
                "bg-nav-bg rounded-lg p-6 border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <h3 className={cn(
                  "text-lg font-semibold mb-4",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Appearance</h3>
                
                <div className="space-y-4">
                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Moon className={cn(
                        "h-5 w-5",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                      <Label htmlFor="dark-mode" className={cn(
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>Dark Mode</Label>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={isDarkMode}
                      onCheckedChange={setIsDarkMode}
                      className={cn(
                        "border-2",
                        theme === 'dark' 
                          ? 'data-[state=checked]:bg-[#e18d58] border-[#e18d58] data-[state=unchecked]:bg-background data-[state=unchecked]:before:bg-[#e18d58]' 
                          : 'data-[state=checked]:bg-[#800000] border-[#800000] data-[state=unchecked]:bg-background'
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end">
                <Button 
                  className={cn(
                    "border-2",
                    theme === 'dark'
                      ? 'border-[#e18d58] text-white bg-transparent hover:bg-[#e18d58]/20'
                      : 'border-[#800080] text-[#800000] bg-transparent hover:bg-[#800000]/20'
                  )}
                  onClick={handleApplyChanges}
                >
                  Apply Changes
                </Button>
              </div>

              {/* Placeholder for future settings */}
              <div className={cn(
                "bg-nav-bg rounded-lg p-6 border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <p className={cn(
                  "text-center",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>More settings coming soon...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="settings" />
    </div>
  );
} 