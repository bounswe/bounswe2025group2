import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Mail, User, Trash2, Calendar, UserCircle } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

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

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    // TODO: Implement delete account functionality
    setShowDeleteConfirmation(false);
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

              

              {/* Notifications Section */}
              <div className={cn(
                "bg-nav-bg rounded-lg p-6 border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <h3 className={cn(
                  "text-lg font-semibold mb-4",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Notifications</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className={cn(
                        "h-5 w-5",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                      <Label htmlFor="email-notifications" className={cn(
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>Email Notifications</Label>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
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

              {/* Account Section */}
              <div className={cn(
                "bg-nav-bg rounded-lg p-6 border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <h3 className={cn(
                  "text-lg font-semibold mb-4",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Account</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trash2 className={cn(
                        "h-5 w-5",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )} />
                      <Label htmlFor="delete-account" className={cn(
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>Delete Account</Label>
                    </div>
                    <Button
                      className={cn(
                        "border-2",
                        theme === 'dark'
                          ? 'border-[#e18d58] text-white bg-transparent hover:bg-[#e18d58]/20'
                          : 'border-[#800000] text-[#800000] bg-transparent hover:bg-[#800000]/20'
                      )}
                      onClick={() => setShowDeleteConfirmation(true)}
                    >
                      Delete
                    </Button>
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
                      : 'border-[#800000] text-[#800000] bg-transparent hover:bg-[#800000]/20'
                  )}
                  onClick={handleApplyChanges}
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="settings" />

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={cn(
            "bg-nav-bg rounded-lg p-6 border max-w-md w-full mx-4",
            theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
          )}>
            <h3 className={cn(
              "text-xl font-semibold mb-4",
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>Delete Account</h3>
            <p className={cn(
              "mb-6",
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
            )}>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                className={cn(
                  "border-2",
                  theme === 'dark'
                    ? 'border-[#e18d58] text-white bg-transparent hover:bg-[#e18d58]/20'
                    : 'border-[#800000] text-[#800000] bg-transparent hover:bg-[#800000]/20'
                )}
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "border-2",
                  theme === 'dark'
                    ? 'border-[#e18d58] text-white bg-transparent hover:bg-[#e18d58]/20'
                    : 'border-[#800000] text-[#800000] bg-transparent hover:bg-[#800000]/20'
                )}
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Overlay */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={cn(
            "bg-nav-bg rounded-lg p-6 border max-w-md w-full mx-4",
            theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
          )}>
            <h3 className={cn(
              "text-xl font-semibold mb-4",
              theme === 'dark' ? 'text-white' : 'text-[#800000]'
            )}>Edit Profile</h3>
            
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className={cn(
                  "w-24 h-24 rounded-full border-2 flex items-center justify-center",
                  theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                )}>
                  <UserCircle className={cn(
                    "w-16 h-16",
                    theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                  )} />
                </div>
              </div>

              {/* Name and Surname */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={cn(
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>Name</Label>
                  <Input
                    className={cn(
                      "border-2",
                      theme === 'dark'
                        ? 'border-[#e18d58] text-white bg-transparent'
                        : 'border-[#800000] text-[#800000] bg-transparent'
                    )}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={cn(
                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                  )}>Surname</Label>
                  <Input
                    className={cn(
                      "border-2",
                      theme === 'dark'
                        ? 'border-[#e18d58] text-white bg-transparent'
                        : 'border-[#800000] text-[#800000] bg-transparent'
                    )}
                    placeholder="Enter your surname"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Username</Label>
                <Input
                  className={cn(
                    "border-2",
                    theme === 'dark'
                      ? 'border-[#e18d58] text-white bg-transparent'
                      : 'border-[#800000] text-[#800000] bg-transparent'
                  )}
                  placeholder="Enter your username"
                />
              </div>

              {/* Birthday */}
              <div className="space-y-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Birthday</Label>
                <Input
                  type="date"
                  className={cn(
                    "border-2",
                    theme === 'dark'
                      ? 'border-[#e18d58] text-white bg-transparent'
                      : 'border-[#800000] text-[#800000] bg-transparent'
                  )}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Gender</Label>
                <Select>
                  <SelectTrigger className={cn(
                    "border-2",
                    theme === 'dark'
                      ? 'border-[#e18d58] text-white bg-transparent'
                      : 'border-[#800000] text-[#800000] bg-transparent'
                  )}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Type */}
              <div className="space-y-2">
                <Label className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>User Type</Label>
                <Select>
                  <SelectTrigger className={cn(
                    "border-2",
                    theme === 'dark'
                      ? 'border-[#e18d58] text-white bg-transparent'
                      : 'border-[#800000] text-[#800000] bg-transparent'
                  )}>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  className={cn(
                    "border-2",
                    theme === 'dark'
                      ? 'border-[#e18d58] text-white bg-transparent hover:bg-[#e18d58]/20'
                      : 'border-[#800000] text-[#800000] bg-transparent hover:bg-[#800000]/20'
                  )}
                  onClick={() => setShowEditProfile(false)}
                >
                  Cancel
                </Button>
                <Button
                  className={cn(
                    "border-2",
                    theme === 'dark'
                      ? 'border-[#e18d58] text-white bg-transparent hover:bg-[#e18d58]/20'
                      : 'border-[#800000] text-[#800000] bg-transparent hover:bg-[#800000]/20'
                  )}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 