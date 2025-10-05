import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib';
import HomePage from "./pages/home/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import GoalPage from "./pages/goal/GoalPage";
import NotificationsPage from "./pages/notifications/notificationPage"; // Add this import
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
          <Route path="/notifications" element={<NotificationsPage />} /> {/* Add this route */}
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