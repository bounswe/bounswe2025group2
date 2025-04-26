import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ForumPage from "@/pages/forum-page";
import ProfilePage from "@/pages/profile-page";
import MentorsPage from "@/pages/mentors-page";
import ProgramsPage from "@/pages/programs-page";
import GoalsPage from "@/pages/goals-page";
import ChallengesPage from "@/pages/challenges-page";
import NotificationsPage from "@/pages/notifications-page";
import CommunitiesPage from "@/pages/communities-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./theme/ThemeContext";

console.log("VITE_API_URL is:", import.meta.env.VITE_API_URL);


function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/forum" component={ForumPage} />
      <ProtectedRoute path="/communities" component={CommunitiesPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/mentors" component={MentorsPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/programs" component={ProgramsPage} />
      <ProtectedRoute path="/programs/:id" component={ProgramsPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/challenges" component={ChallengesPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/create" component={GoalsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
