import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib';
import HomePage from "./pages/home/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import GoalPage from "./pages/goal/GoalPage";
import ForumPage from "./pages/forum/forum_page";
import IndividualForumPage from "./pages/forum/[id]/page";
import ThreadPage from "./pages/forum/thread/[id]/page";
import '../index.css';


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/goals" element={<GoalPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forums/:id" element={<IndividualForumPage />} />
          <Route path="/threads/:id" element={<ThreadPage />} />
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