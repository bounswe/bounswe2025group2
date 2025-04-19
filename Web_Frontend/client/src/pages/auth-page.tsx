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

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z][a-z0-9]*$/i, {
      message: "Username must start with a letter and contain only alphanumeric characters",
    }),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
      message: "Password must contain at least one letter and one number",
    }),
  name: z.string().optional(),
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

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe : false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",      
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        // Force a refetch of the user data
        refetch();
      }
    });
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        // Force a refetch of the user data
        refetch();
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
            <p className="text-muted-foreground md:text-lg">
              Connect with local sports programs, mentors, and coaches to achieve your fitness goals 
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
                      <Label htmlFor="username" className={cn(
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                      )}>Username or Email</Label>
                      <Input
                        id="username"
                        placeholder="Enter your username or email"
                        className={cn(
                          "bg-nav-bg border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-500">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className={cn(
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                      )}>Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className={cn(
                          "bg-nav-bg border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        {...loginForm.register("rememberMe")}
                        className="accent-primary"/>
                        <Label htmlFor="rememberMe">Remember Me</Label>
                      </div>
                      <Button
  type="submit"
  className="w-full bg-secondary hover:bg-secondary-dark"
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
                      <Label htmlFor="name" className={cn(
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                      )}>Full Name (Optional)</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        className={cn(
                          "bg-nav-bg border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...registerForm.register("name")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className={cn(
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                      )}>Username</Label>
                      <Input
                        id="username"
                        placeholder="Choose a username"
                        className={cn(
                          "bg-nav-bg border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className={cn(
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                      )}>Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className={cn(
                          "bg-nav-bg border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className={cn(
                        theme === 'dark' ? 'text-white/70' : 'text-[#800000]'
                      )}>Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        className={cn(
                          "bg-nav-bg border",
                          theme === 'dark' 
                            ? 'border-[#e18d58] text-white placeholder:text-white/50' 
                            : 'border-[#800000] text-[#800000] placeholder:text-[#800000]/50'
                        )}
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                      <p className="text-xs text-sub">
                        Password must be at least 8 characters with at least one letter and one number
                      </p>
                      {registerMutation.isError && (
                        <p className="text-sm text-red-500">
                          {registerMutation.error?.message || "Registration failed"}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className={cn(
                        "w-full bg-nav-bg border",
                        theme === 'dark'
                          ? 'border-[#e18d58] text-white hover:bg-[#e18d58]/20'
                          : 'border-[#800000] text-[#800000] hover:bg-active'
                      )}
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
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

