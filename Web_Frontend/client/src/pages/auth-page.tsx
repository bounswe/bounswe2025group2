import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/theme/ThemeContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z.string()
    .min(3)
    .max(20)
    .regex(/^[a-z][a-z0-9]*$/, {
      message: "Username must start with a lowercase letter and contain only letters and numbers"
    })
    .refine((val) => /[a-z]/.test(val) && /[0-9]/.test(val), {
      message: "Username must contain at least one letter and one number"
    }),
  email: z.string().email(),
  password: z.string().min(8),
  user_type: z.enum(["User", "Coach"], {
    required_error: "Please select a user type.",
    }),
  verification_file: z.string().optional(),
  remember_me: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const { theme } = useTheme();
  const { refetch } = useQuery({
    queryKey: ['/api/user'],
    enabled: loginMutation.isSuccess || registerMutation.isSuccess, 
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember_me: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      user_type: "User",
      verification_file: undefined,
      remember_me: false,
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: async (userData) => {
        // Set the user data immediately
        queryClient.setQueryData(["/api/user"], userData);
        // Then force a refetch to ensure we have the latest data
        await refetch();
      }
    });
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    console.log("Submitting registration data:", data);
    registerMutation.mutate(data, {
      onSuccess: async (userData) => {
        try {
          const loginResult = await loginMutation.mutateAsync({
            username: data.username,
            password: data.password,
            remember_me: data.remember_me
          });
          // Set the user data immediately
          queryClient.setQueryData(["/api/user"], loginResult);
          // Then force a refetch to ensure we have the latest data
          await refetch();
        } catch (error) {
          console.error("Auto-login failed:", error);
        }
      },
      onError: (error) => {
        console.error("Registration submission error:", error);
      }
    });
  };

  // Redirect if user is already logged in
  if (user) {
    console.log("User is authenticated, redirecting to home page", user);
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="grid w-full max-w-6xl gap-6 px-4 md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <h1 className={cn(
              "text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl",
              theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
            )}>
              GenFit
            </h1>
            <p className={cn(
              "md:text-lg",
              theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
            )}>
              Connect with fitness programs, mentors, and coaches to achieve your health and wellness goals
            </p>
          </div>
          <div className={cn(
            "space-y-4",
            theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-nav-bg border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'}
                >
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span>Find free and low-cost fitness programs near you</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-nav-bg border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'}
                >
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span>Connect with experienced mentors and coaches</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-nav-bg border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'}
                >
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span>Set fitness goals and track your progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-nav-bg border",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'}
                >
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span>Participate in challenges and earn rewards</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <Card className={cn(
            "w-full max-w-md border",
            theme === 'dark' ? 'bg-nav-bg border-[#e18d58]' : 'bg-background border-[#800000]'
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "text-2xl",
                theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
              )}>Welcome to GenFit</CardTitle>
              <CardDescription className={cn(
                theme === 'dark' ? 'text-white/70' : 'text-[#800000]/70'
              )}>
                Connect with programs, coaches, and peers to achieve your fitness goals
              </CardDescription>
            </CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={cn(
                "grid w-full grid-cols-2 bg-nav-bg border-b",
                theme === 'dark' ? 'border-[#e18d58]' : 'border-[#800000]'
              )}>
                <TabsTrigger 
                  value="login"
                  className={cn(
                    "data-[state=active]:font-bold",
                    theme === 'dark'
                      ? 'text-white data-[state=active]:text-[#e18d58] data-[state=active]:bg-[#e18d58]/20'
                      : 'text-[#800000] data-[state=active]:bg-active'
                  )}
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className={cn(
                    "data-[state=active]:font-bold",
                    theme === 'dark'
                      ? 'text-white data-[state=active]:text-[#e18d58] data-[state=active]:bg-[#e18d58]/20'
                      : 'text-[#800000] data-[state=active]:bg-active'
                  )}
                >
                  Register
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <CardContent className="p-6">
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        className={cn(
                          "bg-background border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className={cn(
                          "bg-background border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember_me"
                        {...loginForm.register("remember_me")}
                      />
                      <Label htmlFor="remember_me">Remember me</Label>
                    </div>
                    <Button
                      type="submit"
                      className={cn(
                        "w-full",
                        theme === 'dark' 
                          ? 'bg-[#e18d58] text-white hover:bg-[#e18d58]/90' 
                          : 'bg-background text-[#800000] border border-[#800000] hover:bg-background/90'
                      )}
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                  )}>
                    Don't have an account?{" "}
                    <button
                      onClick={() => setActiveTab("register")}
                      className={cn(
                        "font-medium hover:underline",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )}
                    >
                      Register
                    </button>
                  </p>
                </CardFooter>
              </TabsContent>
              <TabsContent value="register">
                <CardContent className="p-6">
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        className={cn(
                          "bg-background border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className={cn(
                          "bg-background border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className={cn(
                          "bg-background border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user_type">User Type</Label>
                      <Select
                        onValueChange={(value) => registerForm.setValue("user_type", value as "User" | "Coach")}
                        defaultValue={registerForm.getValues("user_type")}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full border-[#800000] text-[#800000] placeholder:text-[#800000]/50 dark:border-[#e18d58] dark:text-white dark:placeholder:text-white/50",
                            {
                              "border-red-500": registerForm.formState.errors.user_type,
                            }
                          )}
                        >
                          <SelectValue placeholder="Select a user type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Coach">Coach</SelectItem>
                        </SelectContent>
                      </Select>
                      {registerForm.formState.errors.user_type && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.user_type.message}
                        </p>
                      )}
                    </div>
                    {registerForm.watch('user_type') === 'Coach' && (
                      <div className="space-y-2">
                        <Label htmlFor="verification_file">Verification File</Label>
                        <Input
                          id="verification_file"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className={cn(
                            "bg-background border",
                            theme === 'dark' 
                              ? 'border-[#e18d58] text-white' 
                              : 'border-[#800000] text-[#800000]'
                          )}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Convert file to base64
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                registerForm.setValue("verification_file", reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember_me"
                        {...registerForm.register("remember_me")}
                      />
                      <Label htmlFor="remember_me">Remember me</Label>
                    </div>
                    <Button
                      type="submit"
                      className={cn(
                        "w-full",
                        theme === 'dark' 
                          ? 'bg-[#e18d58] text-white hover:bg-[#e18d58]/90' 
                          : 'bg-background text-[#800000] border border-[#800000] hover:bg-background/90'
                      )}
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                  )}>
                    Already have an account?{" "}
                    <button
                      onClick={() => setActiveTab("login")}
                      className={cn(
                        "font-medium hover:underline",
                        theme === 'dark' ? 'text-[#e18d58]' : 'text-[#800000]'
                      )}
                    >
                      Login
                    </button>
                  </p>
                </CardFooter>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
