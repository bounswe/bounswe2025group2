import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  updateProfileMutation: UseMutationResult<User, Error, Partial<User>>;
  applyForRoleMutation: UseMutationResult<User, Error, {role: string}>;
  handleLoginSuccess: () => void;
  handleLogout: () => void;
  isLoggedIn: boolean;
};

type LoginData = {
  username: string;
  password: string;
  remember_me?: boolean;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  user_type: "User" | "Coach";
  verification_file?: string;
  remember_me?: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  // Only fetch user if isLoggedIn is true
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isLoggedIn,
  });

  // On successful login, set isLoggedIn to true
  const handleLoginSuccess = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  // On logout, set isLoggedIn to false
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login/", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Invalid login credentials");
      }
      const userData = await res.json();
      return userData;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/user"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      handleLoginSuccess();
      toast({
        title: "Login successful!",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      console.log("Attempting registration with data:", {
        ...userData,
        password: '[REDACTED]'
      });
      try {
        // Add trailing slash to the endpoint
        const res = await apiRequest("POST", "/api/register/", userData);
        
        // Try to read the response as text first
        const textResponse = await res.text();
        console.log("Raw response:", textResponse);
        
        let jsonResponse;
        try {
          jsonResponse = JSON.parse(textResponse);
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
          throw new Error("Server returned invalid response format");
        }

        if (!res.ok) {
          console.error("Registration failed with status:", res.status, "Error:", jsonResponse);
          throw new Error(jsonResponse.message || `Registration failed: ${res.status} ${res.statusText}`);
        }

        console.log("Registration successful, response:", {
          ...jsonResponse,
          password: '[REDACTED]'
        });
        return jsonResponse;
      } catch (error) {
        console.error("Registration request failed:", error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      toast({
        title: "Registration successful",
        description: "Logging you in...",
      });
      
      // Attempt to log in with the same credentials
      try {
        await loginMutation.mutateAsync({
          username: variables.username,
          password: variables.password,
          remember_me: variables.remember_me
        });
      } catch (error) {
        // If login fails, show a message but don't throw an error since registration was successful
        toast({
          title: "Auto-login failed",
          description: "Please try logging in manually",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/logout/");
        if (!res.ok) {
          console.warn("Server logout failed, clearing local state anyway");
        }
      } catch (error) {
        console.warn("Logout request failed, clearing local state anyway:", error);
      }
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      handleLogout();
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out",
      });
      window.location.href = '/auth';
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      handleLogout();
      window.location.href = '/auth';
      toast({
        title: "Logged out",
        description: "You have been logged out (some server operations may have failed)",
        variant: "default",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const res = await apiRequest("PATCH", "/api/profile/", profileData);
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const applyForRoleMutation = useMutation({
    mutationFn: async (roleData: {role: string}) => {
      const res = await apiRequest("POST", "/api/user/apply-role", roleData);
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Role application submitted",
        description: `You have applied to be a ${updatedUser.role}. You'll be notified once approved.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Role application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        applyForRoleMutation,
        handleLoginSuccess,
        handleLogout,
        isLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
