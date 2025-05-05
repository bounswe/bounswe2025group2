import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  User,
  Settings,
  Calendar,
  Award,
  Edit2,
  ChevronRight,
  Loader2,
  Camera,
  MessageSquare,
  UserPlus,
  Dumbbell,
  X,
  Save,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import  Sidebar  from "@/components/layout/sidebar";
import  MobileHeader  from "@/components/layout/mobile-header";
import  MobileNavigation  from "@/components/layout/mobile-navigation";

// Types
interface ProfileFields {
  username: string;
  name: string;
  bio: string;
  avatar_url: string;
  fitness_level: string;
  joined_date: string;
  followers_count: number;
  following_count: number;
  workouts_completed: number;
  is_following?: boolean;
  streak_days: number;
  profile_picture?: string;
}

interface ProfileUpdateData {
  name?: string;
  bio?: string;
  fitness_level?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  category: string;
  deadline: string;
}

const ProfilePage = () => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileUsername, setProfileUsername] = useState<string | undefined>(username);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<ProfileUpdateData>({
    name: '',
    bio: '',
    fitness_level: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (username) {
      // If we're viewing someone else's profile
      setProfileUsername(username);
      setIsOwnProfile(true);
    } else if (user) {
      // If we're on our own profile (no username in URL)
      setProfileUsername(user.username);
      setIsOwnProfile(true);
    }
  }, [user, username]);

  // use the /api/profile/other/<username> if the username is not the logged in user
  const profileUrl = profileUsername ? `/api/profile/other/${profileUsername}` : "/api/profile";

  const { data: profileFields, isLoading } = useQuery<ProfileFields>({
    queryKey: [profileUrl],
  });

  // get the goals of the user
  const { data: goals } = useQuery<Goal[]>({
    queryKey: [`/api/goals`],
  });

  // Setup form data when profile data is loaded
  useEffect(() => {
    if (profileFields) {
      setEditFormData({
        name: profileFields.name,
        bio: profileFields.bio,
        fitness_level: profileFields.fitness_level
      });
    }
  }, [profileFields]);

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const response = await fetch('http://localhost:8000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for uploading profile picture
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile picture');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting profile picture
  const deleteProfilePictureMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete profile picture');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been reset to default.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFollowToggle = async () => {
    // Implementation for follow/unfollow functionality
    console.log("Toggle follow for", profileFields?.username);
    // Would need API integration here
  };

  const handleProfilePictureClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit as per backend)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Profile picture size should not exceed 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, JPEG, and PNG files are allowed.",
        variant: "destructive",
      });
      return;
    }

    uploadProfilePictureMutation.mutate(file);
  };

  const handleDeleteProfilePicture = () => {
    deleteProfilePictureMutation.mutate();
  };

  const handleEditProfile = () => {
    setIsEditDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    updateProfileMutation.mutate(editFormData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="profile" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          {/* Edit Profile Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className={cn(
              "sm:max-w-md",
              theme === 'dark' ? 'bg-nav-bg border-[#e18d58]' : 'bg-nav-bg border-[#800000]'
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Edit Profile</DialogTitle>
                <DialogDescription className={cn(
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>
                  Update your profile information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitProfileUpdate}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className={cn(
                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                    )}>
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={editFormData.name || ''}
                      onChange={handleInputChange}
                      className={cn(
                        theme === 'dark'
                          ? 'bg-background border-[#e18d58] text-white focus-visible:ring-[#e18d58]'
                          : 'bg-background border-[#800000] text-[#800000] focus-visible:ring-[#800000]'
                      )}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio" className={cn(
                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                    )}>
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={editFormData.bio || ''}
                      onChange={handleInputChange}
                      className={cn(
                        theme === 'dark'
                          ? 'bg-background border-[#e18d58] text-white focus-visible:ring-[#e18d58]'
                          : 'bg-background border-[#800000] text-[#800000] focus-visible:ring-[#800000]'
                      )}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fitness_level" className={cn(
                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                    )}>
                      Fitness Level
                    </Label>
                    <Input
                      id="fitness_level"
                      name="fitness_level"
                      value={editFormData.fitness_level || ''}
                      onChange={handleInputChange}
                      className={cn(
                        theme === 'dark'
                          ? 'bg-background border-[#e18d58] text-white focus-visible:ring-[#e18d58]'
                          : 'bg-background border-[#800000] text-[#800000] focus-visible:ring-[#800000]'
                      )}
                    />
                  </div>

                  {/* Profile Picture Management */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className={cn(
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>
                        Profile Picture
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteProfilePicture}
                        className={cn(
                          "flex items-center gap-1",
                          theme === 'dark'
                            ? 'border-red-500 text-red-500 hover:bg-red-500/10'
                            : 'border-red-600 text-red-600 hover:bg-red-600/10'
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Reset</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={profileFields?.profile_picture || profileFields?.avatar_url}
                          alt={profileFields?.username}
                        />
                        <AvatarFallback className={cn(
                          theme === 'dark' ? 'bg-[#e18d58]' : 'bg-[#800000]',
                          "text-white"
                        )}>
                          {profileFields?.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleProfilePictureClick}
                        className={cn(
                          theme === 'dark'
                            ? 'border-[#e18d58] text-[#e18d58] hover:bg-[#e18d58]/10'
                            : 'border-[#800000] text-[#800000] hover:bg-[#800000]/10'
                        )}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}  // Changed from handleEditProfile
                  className={cn(
                    theme === 'dark'
                      ? 'border-[#e18d58] text-[#e18d58] hover:bg-[#e18d58]/10'
                      : 'border-[#800000] text-[#800000] hover:bg-[#800000]/10'
                  )}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "flex items-center gap-2",
                      theme === 'dark' ? 'bg-[#e18d58] hover:bg-[#e18d58]/80' : 'bg-[#800000] hover:bg-[#800000]/80'
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className={cn(
                  "text-2xl md:text-3xl font-bold",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Profile</h1>
                <p className={cn(
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>your genfit profile</p>
              </div>

              {isOwnProfile && (
                <Button
                  className={cn(
                    "flex items-center gap-2",
                    theme === 'dark' ? 'bg-[#e18d58] hover:bg-[#e18d58]/80' : 'bg-[#800000] hover:bg-[#800000]/80'
                  )}
                  onClick={handleEditProfile}
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className={cn(
                  "h-8 w-8 animate-spin",
                  theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                )} />
              </div>
            ) : profileFields ? (
              <div className="space-y-6">
                {/* Profile Header Card */}
                <Card className={cn(
                  "bg-nav-bg w-full",
                  theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                )}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar
                          className="h-24 w-24 border-4 border-background"
                          onClick={handleProfilePictureClick}
                        >
                          <AvatarImage
                            src={profileFields.profile_picture || profileFields.avatar_url}
                            alt={profileFields.username}
                          />
                          <AvatarFallback className={cn(
                            theme === 'dark' ? 'bg-[#e18d58]' : 'bg-[#800000]',
                            "text-white"
                          )}>
                            {profileFields.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isOwnProfile && (
                          <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleProfilePictureChange}
                          />
                          <div className={cn(
                            "absolute bottom-0 right-0 rounded-full p-1 cursor-pointer",
                            theme === 'dark' ? 'bg-[#e18d58]' : 'bg-[#800000]'
                          )}
                          onClick={handleProfilePictureClick}
                          >
                            <Camera className="h-4 w-4 text-white" />
                          </div>
                          </>
                        )}
                      </div>

                      {/* Profile info */}
                      <div className="flex-1 text-center md:text-left">
                        <h2 className={cn(
                          "text-xl font-bold",
                          theme === 'dark' ? 'text-white' : 'text-[#800000]'
                        )}>{profileFields.name}</h2>

                        <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                          <p className={cn(
                            "text-sm",
                            theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                          )}>@{profileFields.username}</p>

                          <Badge className={cn(
                            "text-xs",
                            theme === 'dark'
                              ? 'bg-[#e18d58]/20 text-[#e18d58] hover:bg-[#e18d58]/30'
                              : 'bg-[#800000]/20 text-[#800000] hover:bg-[#800000]/30'
                          )}>
                            {profileFields.fitness_level}
                          </Badge>
                        </div>

                        <p className={cn(
                          "mt-2 text-sm max-w-md",
                          theme === 'dark' ? 'text-white/90' : 'text-[#800000]/90'
                        )}>
                          {profileFields.bio || "No bio available."}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                          <div className="flex items-center gap-1">
                            <Calendar className={cn(
                              "h-4 w-4",
                              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                            )} />
                            <span className={cn(
                              "text-xs",
                              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                            )}>
                              Joined {formatDate(profileFields.joined_date)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Award className={cn(
                              "h-4 w-4",
                              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                            )} />
                            <span className={cn(
                              "text-xs",
                              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                            )}>
                              {profileFields.streak_days} day streak
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex justify-center md:justify-end gap-4 mb-2">
                          <div className="text-center">
                            <p className={cn(
                              "font-bold",
                              theme === 'dark' ? 'text-white' : 'text-[#800000]'
                            )}>{profileFields.followers_count}</p>
                            <p className={cn(
                              "text-xs",
                              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                            )}>Followers</p>
                          </div>

                          <div className="text-center">
                            <p className={cn(
                              "font-bold",
                              theme === 'dark' ? 'text-white' : 'text-[#800000]'
                            )}>{profileFields.following_count}</p>
                            <p className={cn(
                              "text-xs",
                              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                            )}>Following</p>
                          </div>

                          <div className="text-center">
                            <p className={cn(
                              "font-bold",
                              theme === 'dark' ? 'text-white' : 'text-[#800000]'
                            )}>{profileFields.workouts_completed}</p>
                            <p className={cn(
                              "text-xs",
                              theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                            )}>Workouts</p>
                          </div>
                        </div>

                        {!isOwnProfile && (
                          <div className="flex gap-2">
                            <Button
                              onClick={handleFollowToggle}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-1",
                                profileFields.is_following
                                  ? theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                  : theme === 'dark'
                                    ? 'bg-[#e18d58] hover:bg-[#e18d58]/80'
                                    : 'bg-[#800000] hover:bg-[#800000]/80'
                              )}
                            >
                              <UserPlus className="h-4 w-4" />
                              <span>{profileFields.is_following ? 'Following' : 'Follow'}</span>
                            </Button>

                            <Button
                              variant="outline"
                              className={cn(
                                "flex items-center justify-center",
                                theme === 'dark'
                                  ? 'border-[#e18d58] text-[#e18d58] hover:bg-[#e18d58]/10'
                                  : 'border-[#800000] text-[#800000] hover:bg-[#800000]/10'
                              )}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fitness Goals Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn(
                      "text-xl font-bold",
                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                    )}>
                      Fitness Goals
                    </h2>

                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        className={cn(
                          "flex items-center gap-1",
                          theme === 'dark'
                            ? 'border-[#e18d58] text-[#e18d58] hover:bg-[#e18d58]/10'
                            : 'border-[#800000] text-[#800000] hover:bg-[#800000]/10'
                        )}
                      >
                        <span>View All</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {goals && goals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {goals.slice(0, 4).map((goal) => (
                        <Card
                          key={goal.id}
                          className={cn(
                            "bg-nav-bg cursor-pointer hover:opacity-90 transition-opacity",
                            theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "bg-background border p-2 rounded-full",
                                theme === 'dark'
                                  ? 'border-[#e18d58]'
                                  : 'border-[#800000]'
                              )}>
                                <Dumbbell className={cn(
                                  "h-4 w-4",
                                  theme === 'dark'
                                    ? 'text-[#e18d58]'
                                    : 'text-[#800000]'
                                )} />
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className={cn(
                                    "font-medium",
                                    theme === 'dark' ? 'text-white' : 'text-[#800000]'
                                  )}>
                                    {goal.title}
                                  </h3>

                                  <Badge className={cn(
                                    "text-xs",
                                    theme === 'dark'
                                      ? 'bg-[#e18d58]/20 text-[#e18d58] hover:bg-[#e18d58]/30'
                                      : 'bg-[#800000]/20 text-[#800000] hover:bg-[#800000]/30'
                                  )}>
                                    {goal.category}
                                  </Badge>
                                </div>

                                <p className={cn(
                                  "text-xs mt-1",
                                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                                )}>
                                  {goal.description}
                                </p>

                                <div className="mt-3">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className={cn(
                                      theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                                    )}>
                                      Progress
                                    </span>
                                    <span className={cn(
                                      "font-medium",
                                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                                    )}>
                                      {goal.progress}/{goal.target} {goal.unit}
                                    </span>
                                  </div>

                                  <Progress
                                    value={(goal.progress / goal.target) * 100}
                                    className={cn(
                                      "h-2",
                                      theme === 'dark'
                                        ? 'bg-gray-700'
                                        : 'bg-gray-200'
                                    )}
                                    // indicatorClassName={cn(
                                    //   theme === 'dark'
                                    //     ? 'bg-[#e18d58]'
                                    //     : 'bg-[#800000]'
                                    // )}
                                  />

                                  <p className={cn(
                                    "text-xs mt-2",
                                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                                  )}>
                                    Deadline: {formatDate(goal.deadline)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className={cn(
                      "bg-nav-bg text-center py-8",
                      theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                    )}>
                      <CardContent>
                        <div className="flex justify-center mb-4">
                          <div className={cn(
                            "bg-background h-16 w-16 rounded-full flex items-center justify-center border",
                            theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                          )}>
                            <Dumbbell className={cn(
                              "h-8 w-8",
                              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                            )} />
                          </div>
                        </div>

                        <h3 className={cn(
                          "text-lg font-bold mb-2",
                          theme === 'dark' ? 'text-white' : 'text-[#800000]'
                        )}>No Goals Yet</h3>

                        <p className={cn(
                          "max-w-md mx-auto",
                          theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                        )}>
                          {isOwnProfile
                            ? "you haven't set any fitness goals yet. set goals to track your progress!"
                            : "this user hasn't set any fitness goals yet."}
                        </p>

                        {isOwnProfile && (
                          <Button
                            className={cn(
                              "mt-4",
                              theme === 'dark' ? 'bg-[#e18d58] hover:bg-[#e18d58]/80' : 'bg-[#800000] hover:bg-[#800000]/80'
                            )}
                          >
                            Create Goal
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Recent Activity Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn(
                      "text-xl font-bold",
                      theme === 'dark' ? 'text-white' : 'text-[#800000]'
                    )}>
                      Recent Activity
                    </h2>

                    <Button
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1",
                        theme === 'dark'
                          ? 'border-[#e18d58] text-[#e18d58] hover:bg-[#e18d58]/10'
                          : 'border-[#800000] text-[#800000] hover:bg-[#800000]/10'
                      )}
                    >
                      <span>View All</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <Card className={cn(
                    "bg-nav-bg text-center py-8",
                    theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                  )}>
                    <CardContent>
                      <div className="flex justify-center mb-4">
                        <div className={cn(
                          "bg-background h-16 w-16 rounded-full flex items-center justify-center border",
                          theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                        )}>
                          <User className={cn(
                            "h-8 w-8",
                            theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                          )} />
                        </div>
                      </div>

                      <h3 className={cn(
                        "text-lg font-bold mb-2",
                        theme === 'dark' ? 'text-white' : 'text-[#800000]'
                      )}>No Recent Activity</h3>

                      <p className={cn(
                        "max-w-md mx-auto",
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                      )}>
                        {isOwnProfile
                          ? "you haven't logged any activity yet. start tracking your workouts!"
                          : "this user hasn't logged any activity yet."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className={cn(
                "text-center py-12 bg-nav-bg rounded-xl border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <div className="flex justify-center mb-4">
                  <div className={cn(
                    "bg-background h-16 w-16 rounded-full flex items-center justify-center border",
                    theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
                  )}>
                    <User className={cn(
                      "h-8 w-8",
                      theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                    )} />
                  </div>
                </div>

                <h3 className={cn(
                  "text-lg font-bold mb-2",
                  theme === 'dark' ? 'text-white' : 'text-[#800000]'
                )}>Profile Not Found</h3>

                <p className={cn(
                  "max-w-md mx-auto",
                  theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
                )}>
                  we couldn't find the profile you're looking for. please check the username and try again.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="profile" />
    </div>
  );
};

export default ProfilePage;