import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib';
import GFapi from './lib/api/GFapi';
import HomePage from "./pages/home/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import GoalPage from "./pages/goal/GoalPage";
import NotificationsPage from "./pages/notifications/notificationPage"; 
import ProfilePage from "./pages/profile/ProfilePage";
import '../index.css';

import ChallengesPage from "./pages/challenges/ChallengesPage";
import '../index.css';

// Initialize CSRF token on app startup
GFapi.initializeCSRF();


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/goals" element={<GoalPage />} />
          <Route path="/notifications" element={<NotificationsPage />} /> 
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/other/:username" element={<ProfilePage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
