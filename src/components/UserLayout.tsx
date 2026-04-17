import { useAuth } from "@/contexts/AuthContext";
import { UserNavbar } from "./UserNavbar";
import { Navigate, useLocation } from "react-router-dom";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { isProfileComplete, isAdmin, session } = useAuth();
  const location = useLocation();

  // If logged in but profile is incomplete, redirect to profile page
  const isOnProfilePage = location.pathname === "/profile";
  if (session && !isAdmin && !isProfileComplete && !isOnProfilePage) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <UserNavbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
