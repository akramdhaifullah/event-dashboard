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
import ParticipantsPage from "./pages/ParticipantsPage";
import ProfilePage from "./pages/ProfilePage";
import MyRacePage from "./pages/MyRacePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, isLoading, isAdmin, profile } = useAuth();
  const location = useLocation();

  // STAGE 1: Initial authentication check
  if (isLoading || (session && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // STAGE 2: Handle Login and Register explicitly
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  if (isAuthPage) {
    return session ? <Navigate to="/" replace /> : <AuthPage />;
  }

  // STAGE 3: Admin Layout
  if (session && isAdmin) {
    const isOnProfilePage = location.pathname === "/profile";
    if (isOnProfilePage) return <Navigate to="/" replace />;

    return (
      <Layout>
        <Routes>
          <Route path="/" element={<AdminEventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/participants" element={<ParticipantsPage />} />
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
        <Route path="/events/:id" element={<EventDetailPage />} />
        
        {/* Protected User Routes */}
        <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/login" state={{ from: location }} replace />} />
        <Route path="/my-race" element={session ? <MyRacePage /> : <Navigate to="/login" state={{ from: location }} replace />} />
        
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
