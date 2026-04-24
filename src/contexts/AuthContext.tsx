import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isOrganizer: boolean;
  managedEventIds: string[];
  isLoading: boolean;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [managedEventIds, setManagedEventIds] = useState<string[]>([]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("id")
        .eq("id", userId)
        .single();
      
      return !!data && !error;
    } catch {
      return false;
    }
  };

  const checkOrganizerStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("event_organizers")
        .select("event_id")
        .eq("user_id", userId);
      
      if (error) return { status: false, eventIds: [] };
      return { 
        status: data.length > 0, 
        eventIds: data.map(item => item.event_id) 
      };
    } catch {
      return { status: false, eventIds: [] };
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthEvent = async (session: Session | null) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const [adminStatus, organizerStatus] = await Promise.all([
          checkAdminStatus(session.user.id),
          checkOrganizerStatus(session.user.id)
        ]);
        
        if (mounted) {
          setIsAdmin(adminStatus);
          setIsOrganizer(organizerStatus.status);
          setManagedEventIds(organizerStatus.eventIds);
        }
      } else {
        if (mounted) {
          setIsAdmin(false);
          setIsOrganizer(false);
          setManagedEventIds([]);
        }
      }

      if (mounted) {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    // Listen for auth changes - this also triggers for the initial state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthEvent(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    if (data.user) {
      const [adminStatus, organizerStatus] = await Promise.all([
        checkAdminStatus(data.user.id),
        checkOrganizerStatus(data.user.id)
      ]);

      if (!adminStatus && !organizerStatus.status) {
        await supabase.auth.signOut();
        throw new Error("Access denied: Not an administrator or organizer");
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isOrganizer, managedEventIds, isLoading, isReady, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
