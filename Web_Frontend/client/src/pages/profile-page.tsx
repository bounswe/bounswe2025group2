import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import AvatarWithBadge from "@/components/ui/avatar-with-badge";
import GoalProgress from "@/components/goals/goal-progress";
import ForumThreadCard from "@/components/forum/forum-thread-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { User, Loader2, Settings, Edit, Camera, Trophy, MessageSquare, Target } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
const baseUrl = "http://localhost:8000"//import.meta.env.VITE_API_BASE_URL;


export default function ProfilePage() {
  var { username } = useParams<{ username?: string }>();
  var { user: currentUser, updateProfileMutation, applyForRoleMutation } = useAuth();
  const effectiveUsername = username ?? currentUser?.username;
  username = effectiveUsername
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: "",
    bio: "",
    interests: [] as string[],
    visibility: "public",
    role: ""
  });

  // Fetch profile picture
  const [newInterest, setNewInterest] = useState("");

  // Fetch profile picture
  const { data: profilePicture, isLoading: profilePictureLoading } = useQuery({
    queryKey: ['profile-picture'],
    queryFn: async () => {
      const res = await fetch('/profile/picture/');
      if (!res.ok) throw new Error('Failed to fetch profile picture');
      const blob = await res.blob();
      return URL.createObjectURL(blob); // browser friendly image URL
    },
  });

  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('picture', file);

      const res = await fetch('/profile/picture/upload/', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload profile picture');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-picture'] });
    }
  });

  // Delete profile picture mutation
  const deleteProfilePictureMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/profile/picture/delete/', {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete profile picture');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-picture'] });
    }
  });
  
  const { data: profileUser, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/user`);
      if (!res.ok) throw new Error('Failed to fetch user profile');
      return res.json();
    },
  });

  const { data: userThreads, isLoading: threadsLoading } = useQuery({
    queryKey: [`/api/forum/threads`, `user_${profileUser?.id}`],
    queryFn: async () => {
      const res = await fetch(`/api/forum/threads?userId=${profileUser?.id}`);
      if (!res.ok) throw new Error("Failed to fetch user threads");
      return res.json();
    },
    enabled: !!profileUser?.id,
  });


  // Fetch user's goals
  const { data: userGoals, isLoading: goalsLoading } = useQuery({
    queryKey: [`/api/goals`],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/goals/`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch user goals");
      return res.json();
    },
    enabled: !!profileUser?.id && (currentUser?.id === profileUser?.id || profileUser?.visibility === "public"),
  });

  // Set default values for editing
  useState(() => {
    if (profileUser && currentUser?.id === profileUser.id) {
      setEditedProfile({
        name: profileUser.name || "",
        bio: profileUser.bio || "",
        interests: profileUser.interests || [],
        visibility: profileUser.visibility || "public",
        role: profileUser.role || "trainee"
      });
    }
  });

  const isOwnProfile = currentUser?.id === profileUser?.id;
  const isPrivateProfile = profileUser?.visibility === "private" && !isOwnProfile;

  const handleUpdateProfile = async () => {
    if (!isOwnProfile) return;

    updateProfileMutation.mutate({
      name: editedProfile.name,
      bio: editedProfile.bio,
      interests: editedProfile.interests,
      visibility: editedProfile.visibility
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });

  };

  const handleApplyForRole = (role: string) => {
    if (!isOwnProfile) return;
    // Role application would go here

  };

  const addInterest = () => {
    if (newInterest.trim() && !editedProfile.interests.includes(newInterest.trim())) {
      setEditedProfile({
        ...editedProfile,
        interests: [...editedProfile.interests, newInterest.trim()]
      });
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setEditedProfile({
      ...editedProfile,
      interests: editedProfile.interests.filter(i => i !== interest)
    });
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-dark mb-2">User Not Found</h2>
          <p className="text-muted-foreground">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-primary rounded-xl p-6 mb-6 relative">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="relative">
                  <AvatarWithBadge
                    src={profilePicture}
                    fallback={profileUser.name?.[0]?.toUpperCase() || profileUser.username[0].toUpperCase()}
                    size="lg"
                    role={profileUser.role}
                    verified={profileUser.verificationStatus}
                  />

                  {isOwnProfile && (
                    <div className="absolute -bottom-2 -left-2 right-0 flex justify-between">
                      {/* Upload Button - Positioned bottom-left */}
                      <Button
                        variant="ghost"
                        className="w-5 h-5 p-0 rounded-full bg-transparent text-foreground/80 bg-accent/20 hover:bg-accent/20 hover:text-foreground"
                        size="icon"
                        onClick={() => document.getElementById('upload-photo')?.click()}
                        aria-label="Upload profile picture"
                      >
                        <Camera className="h-3 w-3" />
                      </Button>

                      {/* Delete Button - Positioned bottom-right */}
                      <Button
                        variant="ghost"
                        className="w-5 h-5 p-0 rounded-full bg-transparent text-foreground/80 bg-accent/20 hover:bg-accent/20 hover:text-foreground"
                        size="icon"
                        onClick={() => deleteProfilePictureMutation.mutate()}
                        aria-label="Delete profile picture"
                      >
                        <span className="text-xs">×</span>
                      </Button>

                      {/* Hidden File Input */}
                      <input
                        id="upload-photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            alert("File too large. Maximum 5MB allowed.");
                            return;
                          }
                          uploadProfilePictureMutation.mutate(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  )}

                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-secondary-dark">
                    {profileUser.name || profileUser.username}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs py-0 h-5">
                      @{profileUser.username}
                    </Badge>
                    <Badge
                      variant={profileUser.role === "mentor" ? "outline" : "default"}
                      className="text-xs py-0 h-5"
                    >
                      {profileUser.role === "coach" ? "Coach" : profileUser.role === "mentor" ? "Mentor" : "Trainee"}
                    </Badge>
                    {profileUser.verificationStatus && (
                      <Badge variant="outline" className="text-xs py-0 h-5 border-green-500 text-green-600">
                        Verified
                      </Badge>
                    )}
                  </div>
                  {!isPrivateProfile && profileUser.bio && (
                    <p className="text-secondary mt-2">{profileUser.bio}</p>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit Profile
                    </Button>

                    {profileUser.role === "trainee" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <User className="h-3 w-3 mr-1" />
                            Become a Mentor
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Apply to be a Mentor or Coach</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                              Share your sports experience with others by becoming a mentor or coach.
                              Mentors can guide trainees, while coaches require verification of their credentials.
                            </p>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleApplyForRole("mentor")}
                              >
                                <User className="h-4 w-4 mr-2" />
                                Apply as Mentor
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleApplyForRole("coach")}
                              >
                                <Trophy className="h-4 w-4 mr-2" />
                                Apply as Coach
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle>Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editedProfile.name}
                          onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editedProfile.bio}
                          onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Interests</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {editedProfile.interests.map((interest, index) => (
                            <Badge key={index} variant="secondary" className="px-2 py-1">
                              {interest}
                              <button
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                onClick={() => removeInterest(interest)}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add interest..."
                            value={newInterest}
                            onChange={(e) => setNewInterest(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                          />
                          <Button type="button" onClick={addInterest}>Add</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="visibility">Profile Visibility</Label>
                        <Select
                          value={editedProfile.visibility}
                          onValueChange={(value) => setEditedProfile({ ...editedProfile, visibility: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : "Save Changes"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            {!isPrivateProfile && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="bg-primary inline-flex p-2 rounded-full mb-2">
                      <Target className="h-6 w-6 text-secondary-dark" />
                    </div>
                    <h3 className="text-xl font-bold">{userGoals?.length || 0}</h3>
                    <p className="text-muted-foreground text-sm">Active Goals</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="bg-primary inline-flex p-2 rounded-full mb-2">
                      <MessageSquare className="h-6 w-6 text-secondary-dark" />
                    </div>
                    <h3 className="text-xl font-bold">{userThreads?.length || 0}</h3>
                    <p className="text-muted-foreground text-sm">Forum Posts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="bg-primary inline-flex p-2 rounded-full mb-2">
                      <Trophy className="h-6 w-6 text-secondary-dark" />
                    </div>
                    <h3 className="text-xl font-bold">5</h3>
                    <p className="text-muted-foreground text-sm">Achievements</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {isPrivateProfile ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="flex justify-center mb-4">
                  <Settings className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">This Profile is Private</h2>
                <p className="text-muted-foreground mb-4">
                  {profileUser.username} has set their profile to private. Only they can view their detailed information.
                </p>
              </div>
            ) : (
              <Tabs defaultValue="goals" className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="posts">Forum Posts</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  {(profileUser.role === "mentor" || profileUser.role === "coach") && (
                    <TabsTrigger value="mentees">Mentees</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="goals">
                  {goalsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                    </div>
                  ) : userGoals && userGoals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userGoals.map((goal: any) => (
                        <div
                          key={goal.id}
                          onClick={() => {
                            setSelectedGoal(goal);
                            setShowGoalDialog(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Card className="hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{goal.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <GoalProgress goal={goal} />
                              <div className="flex justify-between items-center mt-2 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                  <span className="capitalize">{goal.type}</span>
                                  <span className="mx-2">•</span>
                                  <span>{goal.unit}</span>
                                </div>
                                <Badge variant={goal.status === "completed" ? "default" : "outline"}>
                                  {goal.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}

                    </div>
                  ) : (
                    <div className="text-center py-8 bg-card rounded-xl border border-border">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Goals Set</h3>
                      <p className="text-muted-foreground mb-4">
                        {isOwnProfile
                          ? "You haven't set any fitness goals yet."
                          : `${profileUser.username} hasn't set any fitness goals yet.`
                        }
                      </p>
                      {isOwnProfile && (
                        <Button className="bg-secondary text-white hover:bg-secondary-dark">
                          Set Your First Goal
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="posts">
                  {threadsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                    </div>
                  ) : userThreads && userThreads.length > 0 ? (
                    <div className="space-y-4">
                      {userThreads.map((thread: any) => (
                        <ForumThreadCard key={thread.id} thread={thread} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-card rounded-xl border border-border">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Forum Posts</h3>
                      <p className="text-muted-foreground mb-4">
                        {isOwnProfile
                          ? "You haven't created any forum posts yet."
                          : `${profileUser.username} hasn't created any forum posts yet.`
                        }
                      </p>
                      {isOwnProfile && (
                        <Button className="bg-secondary text-white hover:bg-secondary-dark">
                          Create Your First Post
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="achievements">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="bg-primary inline-flex p-3 rounded-full mb-3">
                          <Trophy className="h-8 w-8 text-secondary-dark" />
                        </div>
                        <h3 className="font-semibold mb-1">Early Adopter</h3>
                        <p className="text-muted-foreground text-sm">Joined during the platform's first month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="bg-primary inline-flex p-3 rounded-full mb-3">
                          <MessageSquare className="h-8 w-8 text-secondary-dark" />
                        </div>
                        <h3 className="font-semibold mb-1">Community Contributor</h3>
                        <p className="text-muted-foreground text-sm">Created 5+ forum posts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="bg-muted inline-flex p-3 rounded-full mb-3">
                          <Target className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-1 text-muted-foreground">Goal Getter</h3>
                        <p className="text-muted-foreground text-sm">Complete 3 goals (2/3)</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {(profileUser.role === "mentor" || profileUser.role === "coach") && (
                  <TabsContent value="mentees">
                    <div className="text-center py-8 bg-card rounded-xl border border-border">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Mentees Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {isOwnProfile
                          ? "You don't have any mentees yet."
                          : `${profileUser.username} doesn't have any mentees yet.`
                        }
                      </p>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        </main>
      </div>

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 max-w-md rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedGoal?.title}</DialogTitle>
          </DialogHeader>

          {selectedGoal ? (
            <div className="space-y-4 mt-2">
              <div className="text-sm">
                <span className="font-medium">Type:</span>{" "}
                <span className="capitalize text-muted-foreground">{selectedGoal.goal_type}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Progress:</span>{" "}
                <span className="text-primary">{selectedGoal.progress_percentage}%</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Mentor ID:</span>{" "}
                <span className="text-muted-foreground">{selectedGoal.mentor}</span>
              </div>
              {selectedGoal.description && (
                <div className="text-sm">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedGoal.description}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No goal selected.</p>
          )}
        </DialogContent>
      </Dialog>
      <MobileNavigation activeTab="profile" />
    </div>
  );
}
