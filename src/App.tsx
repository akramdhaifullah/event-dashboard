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

const AuthenticatedApp = () => {
  const { session, isLoading, isAdmin, isProfileComplete, profile } = useAuth();
  const location = useLocation();

  // STAGE 1: Check session and initial loading
  // We keep the spinner visible as long as we are 'isLoading' OR if we have a session but haven't fetched the profile yet
  if (isLoading || (session && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // STAGE 2: No session means they must log in
  if (!session) {
    return <AuthPage />;
  }

  // STAGE 3: Session and Profile are loaded, now determine layout
  
  // --- Admin Logic ---
  if (isAdmin) {
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

  // --- User Logic ---
  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<UserEventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-race" element={<MyRacePage />} />
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
            <AuthenticatedApp />
          </EventProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
