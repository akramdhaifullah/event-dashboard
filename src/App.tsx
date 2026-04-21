import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventProvider } from "@/contexts/EventContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import UserLayout from "@/components/UserLayout";
import AdminEventsPage from "./pages/AdminEventsPage";
import UserEventsPage from "./pages/UserEventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import RegistrationPage from "./pages/RegistrationPage";
import ParticipantsPage from "./pages/ParticipantsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, isReady, isAdmin } = useAuth();
  const location = useLocation();

  // STAGE 1: Initial authentication check
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // STAGE 2: Handle Admin Login explicitly
  const isAuthPage = location.pathname === "/admin";
  if (isAuthPage) {
    return session && isAdmin ? <Navigate to="/admin/dashboard" replace /> : <AuthPage />;
  }

  // STAGE 3: Admin Layout
  if (session && isAdmin) {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminEventsPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/events/:id" element={<EventDetailPage />} />
          <Route path="/admin/participants" element={<ParticipantsPage />} />
          {/* Compatibility redirects */}
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/participants" element={<Navigate to="/admin/participants" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    );
  }

  // STAGE 4: User/Guest Layout
  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<UserEventsPage />} />
        <Route path="/events" element={<UserEventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/register/:categoryId" element={<RegistrationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UserLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <EventProvider>
            <AppRoutes />
          </EventProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
