import React, { createContext, useContext, useEffect, useState } from "react";

// Simplified types to maintain compatibility with the rest of the app
export interface User {
  id: string;
  email: string;
  app_metadata?: { role?: string };
}

export interface Session {
  access_token: string;
  user: User;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Initial Session Check (Local Storage)
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true);
      try {
        const storedSession = localStorage.getItem("cozy_admin_session");
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          setSession(parsedSession);
          setUser(parsedSession.user);
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("AuthProvider: Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === "admin" && password === "admin123") {
      const mockUser: User = { 
        id: "admin-id-1", 
        email: "admin@cozy.local",
        app_metadata: { role: "admin" }
      };
      const mockSession: Session = { 
        access_token: "mock-jwt-token", 
        user: mockUser 
      };
      
      setSession(mockSession);
      setUser(mockUser);
      setIsAdmin(true);
      localStorage.setItem("cozy_admin_session", JSON.stringify(mockSession));
    } else {
      throw new Error("Invalid username or password");
    }
  };

  const signOut = async () => {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("cozy_admin_session");
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
