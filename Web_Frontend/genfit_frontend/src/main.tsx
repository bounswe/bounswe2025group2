import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib';
import GFapi from './lib/api/GFapi';
import HomePage from "./pages/home/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import GoalPage from "./pages/goal/GoalPage";
import ForumPage from "./pages/forum/forum_page";
import IndividualForumPage from "./pages/forum/[id]/page";
import BookmarkedThreadsPage from "./pages/forum/bookmarked/page";

import ThreadPage from "./pages/forum/thread/[id]/page";
import NotificationsPage from "./pages/notifications/notificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";
import ContactPage from './pages/contact/ContactPage';
import GlossaryPage from './pages/glossary/GlossaryPage';
import KnowledgeHubPage from './pages/knowledge-hub/GlossaryPage';
import '../index.css';

import ChallengesPage from "./pages/challenges/ChallengesPage";
import ChatPage from "./pages/chat/ChatPage";
import '../index.css';

// Initialize CSRF token on app startup
GFapi.initializeCSRF();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/goals" element={<GoalPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forums/bookmarked" element={<BookmarkedThreadsPage />} />
          <Route path="/forums/:id" element={<IndividualForumPage />} />
          <Route path="/threads/:id" element={<ThreadPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/other/:username" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/chatting" element={<ChatPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/knowledge-hub" element={<KnowledgeHubPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  </StrictMode>,
)
