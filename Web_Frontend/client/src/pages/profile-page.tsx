import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
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
import { queryClient } from "@/lib/queryClient.ts";

interface UserFields {
  email: string;
  id: number;
  is_verified_coach: boolean;
  user_type: string;
  username: string;
}

interface UserProfileDetails {
  age: string;
  bio: string;
  birth_date: string;
  location: string;
  name: string;
}

interface UserGoal {
  description: string;
  goal_type: string;
  id: number;
  last_updated: string;
  setting_mentor_id: number;
  progress_percentage: number;
  start_date: string;
  status: string;
  target_date: string;
  current_value: number;
  target_value: number;
  title: string;
  unit: string;
}

function getCsrfToken() {
  const name = 'csrftoken';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const lastPart = parts.pop();
    if (lastPart) {
      const value = lastPart.split(';').shift();
      return value ?? '';
    }
  }
  return '';
}

const apiClient = {
  fetch: (url: string, options: RequestInit = {}) => {
    const csrfToken = getCsrfToken();
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
        ...options.headers
      }
    };

    // Merge default options with provided options
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };

    return fetch(url, mergedOptions);
  },

  get: (url: string) => {
    return apiClient.fetch(url);
  },

  post: (url: string, data: any, p0: { headers: { 'Content-Type': string; }; }) => {
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export default function ProfilePage() {
  const { user: currentUser, updateProfileMutation, applyForRoleMutation } = useAuth();
  // @ts-ignore
  const username = currentUser.username
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: "",
    bio: "",
    interests: [] as string[],
    visibility: "public",
    role: "",
    location: "",
    age: "",
  });

  // Fetch profile picture
  const [newInterest, setNewInterest] = useState("");

  // Fetch profile picture, this is sent to the front end server
  const { data: profilePicture, isLoading: profilePictureLoading } = useQuery({
    queryKey: ['api/profile/picture'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('http://localhost:8000/api/profile/picture/');

        // Check if the response is successful
        if (!res.ok) {
          if (res.status === 401) {
            console.error('Authentication required. Please log in.');
            // Redirect to login if needed
          }
          throw new Error(`API error: ${res.status}`);
        }

        // Check if the response contains an image
        const contentType = res.headers.get('Content-Type');
        if (contentType && contentType.startsWith('image/')) {
          // If it's an image, we handle it as a blob
          const imageBlob = await res.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          return imageUrl; // Return the image URL
        }

        // If it's not an image, assume it's a JSON response and parse it
        return res.json(); // This is where you'd handle other types of responses
      } catch (err) {
        console.error(err);
        throw err; // Propagate error to be handled by useQuery
      }
    },
  });


  const { data: profileDetails, isLoading: profileDetailsLoading } = useQuery<UserProfileDetails>({
    queryKey: ['/api/profile/'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('http://localhost:8000/api/profile/');

        // Check if the response is successful
        if (!res.ok) {
          if (res.status === 401) {
            console.error('Authentication required. Please log in.');
            // Redirect to login if needed
          }
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        console.log("Profile Details:", data);
        // If it's not an image, assume it's a JSON response and parse it
        return data; // This is where you'd handle other types of responses
      } catch (err) {
        console.error(err);
        throw err; // Propagate error to be handled by useQuery
      }
    },
  });


  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const csrfToken = getCsrfToken();
      const formData = new FormData();
      formData.append('profile_picture', file);

      console.log("File Type:", file.type);
      console.log("File:", file);

      const response = await fetch('http://localhost:8000/api/profile/picture/upload/', {
        method: "POST",
        body: formData,
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api/profile/picture'] });
    },
    onError: (error) => {
      console.error('Error uploading profile picture:', error);
    }
  });


  // Delete profile picture mutation
  const deleteProfilePictureMutation = useMutation({
    mutationFn: async () => {
      const csrfToken = getCsrfToken();

      const response = await fetch('http://localhost:8000/api/profile/picture/delete/', {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': csrfToken
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile picture');
      }

      return response.json(); // or response.text() if applicable
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api/profile/picture'] });
    },
    onError: (error) => {
      console.error('Error deleting profile picture:', error);
    }
  });

  // Fetch profile data of the user with the given username
  const { data: profileUser, isLoading } = useQuery<UserFields>({
    queryKey: ['/api/user'],
  });

  // Fetch user's goals
  const { data: userGoals, isLoading: goalsLoading } = useQuery<UserGoal[]>({
    queryKey: ['/api/goals'],
  });


  // Set default values for editing
  useState(() => {
    if (profileDetails) {
      setEditedProfile({
        interests: [], role: "", visibility: "",
        name: profileDetails.name || "",
        location: profileDetails.location || "",
        bio: profileDetails.bio || "",
        age: profileDetails.age || ""
      });
    }
  });

  const isOwnProfile = currentUser?.id === profileUser?.id;
  const isPrivateProfile = false;

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
                  {profileUser && (<AvatarWithBadge
                    fallback={profileUser.username[0].toUpperCase()}

                    size="lg"
                    role={username === "johndoe" ? "trainee" : username === "janedoe" ? "coach" : ""}
                    verified={username === "johndoe" || username === "janedoe"}
                    src={profilePictureLoading ? "" : profilePicture}
                  />)}
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
                    {username}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs py-0 h-5">
                      @{username}
                    </Badge>
                    <Badge
                      className="text-xs py-0 h-5"
                    >
                      {username === "johndoe" ? "Trainee" : username === "janedoe" ? "Coach" : "Trainee"}
                    </Badge>
                    {username === "johndoe" || username === "janedoe" && (
                      <Badge variant="outline" className="text-xs py-0 h-5 border-green-500 text-green-600">
                        Verified
                      </Badge>
                    )}
                  </div>
                  {!isPrivateProfile && username && (
                    <p className="text-secondary mt-2">{username}</p>
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
                    {profileUser && (

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
                    <h3 className="text-xl font-bold">
                      {userGoals?.filter(goal => goal.status === 'ACTIVE').length ?? 0}
                    </h3>

                    <p className="text-muted-foreground text-sm">Active Goals</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="bg-primary inline-flex p-2 rounded-full mb-2">
                      <MessageSquare className="h-6 w-6 text-secondary-dark" />
                    </div>
                    <h3 className="text-xl font-bold">0</h3>
                    <p className="text-muted-foreground text-sm">Forum Posts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="bg-primary inline-flex p-2 rounded-full mb-2">
                      <Trophy className="h-6 w-6 text-secondary-dark" />
                    </div>
                    <h3 className="text-xl font-bold">0</h3>
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
                  {username} has set their profile to private. Only they can view their detailed information.
                </p>
              </div>
            ) : (
              <Tabs defaultValue="goals" className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="posts">Forum Posts</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  {(username === "johndoe" || username === "janedoe") && (
                    <TabsTrigger value="mentees">Mentees</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="goals">
                  {userGoals && userGoals.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {userGoals.map((goal) => (
                        <Card key={goal.id} className="bg-card border-border hover:bg-accent/5 transition-colors">
                          <CardContent className="pt-6">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <Badge variant="outline" className="mb-2">{goal.goal_type}</Badge>
                                  <h3 className="text-lg font-semibold mb-1">{goal.title}</h3>
                                  <p className="text-muted-foreground text-sm">{goal.description}</p>
                                </div>
                                <Badge
                                  variant={goal.status === 'ACTIVE' ? 'default' : 'secondary'}
                                  className="capitalize"
                                >
                                  {goal.status.toLowerCase()}
                                </Badge>
                              </div>

                              <GoalProgress
                                goal={{
                                  id: goal.id,
                                  title: goal.title,
                                  type: goal.goal_type,
                                  targetValue: goal.target_value,
                                  currentValue: goal.current_value,
                                  unit: goal.unit,
                                  status: goal.status
                                }}
                                showTitle={false}
                              />

                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex gap-4">
                                  <span>Started: {new Date(goal.start_date).toLocaleDateString()}</span>
                                  <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                                </div>
                                <span>Last updated: {new Date(goal.last_updated).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-card rounded-xl border border-border">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Goals Set</h3>
                      <p className="text-muted-foreground mb-4">
                        {isOwnProfile
                          ? "You haven't set any fitness goals yet."
                          : `This person hasn't set any fitness goals yet.`
                        }
                      </p>                      {isOwnProfile && (
                        <Button 
                          className="bg-secondary text-white hover:bg-secondary-dark"
                          onClick={() => window.location.href = "/goals?new=true"}
                        >
                          Set Your First Goal
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="posts">
                  {username === "johndoe" && (
                    <div className="text-center py-8 bg-card rounded-xl border border-border">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Forum Posts</h3>
                      <p className="text-muted-foreground mb-4">

                        {isOwnProfile
                          ? "You haven't created any forum posts yet."
                          : `This person hasn't created any forum posts yet.`
                        }

                      </p>
                      {username === "johndoe" && (
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
              </Tabs>
            )}
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="profile" />
    </div>
  );
}
