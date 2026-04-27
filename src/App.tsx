import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventProvider } from "@/contexts/EventContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Layout from "@/components/Layout";
import UserLayout from "@/components/UserLayout";
import AdminEventsPage from "./pages/AdminEventsPage";
import UserEventsPage from "./pages/UserEventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import RegistrationPage from "./pages/RegistrationPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmPaymentPage from "./pages/ConfirmPaymentPage";
import MyPaymentsPage from "./pages/MyPaymentsPage";
import ParticipantsPage from "./pages/ParticipantsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, isReady, isAdmin, isOrganizer } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAuthPage = location.pathname === "/admin";
  if (isAuthPage) {
    return session && (isAdmin || isOrganizer) ? <Navigate to="/admin/dashboard" replace /> : <AuthPage />;
  }

  if (session && (isAdmin || isOrganizer)) {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminEventsPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/events/:id" element={<EventDetailPage />} />
          <Route path="/admin/participants" element={<ParticipantsPage />} />
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/participants" element={<Navigate to="/admin/participants" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<UserEventsPage />} />
        <Route path="/events" element={<UserEventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/register" element={<RegistrationPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/confirm-payment" element={<ConfirmPaymentPage />} />
        <Route path="/my-payments" element={<MyPaymentsPage />} />
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
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </EventProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
