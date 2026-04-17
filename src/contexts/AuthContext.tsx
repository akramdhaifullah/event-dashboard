import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "@/data/types";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isProfileComplete: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const lastCheckedUser = useRef<string | null>(null);

  const isProfileComplete = !!(
    profile?.full_name && 
    profile?.bib_name && 
    profile?.dob && 
    profile?.gender && 
    profile?.blood_type && 
    profile?.phone_number && 
    profile?.emergency_contact_name && 
    profile?.emergency_contact_phone && 
    profile?.emergency_contact_relationship
  );

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("profiles")
          .insert([{ id: userId, role: "user" }])
          .select("*")
          .single();

        if (!insertError) {
          setProfile(newData);
          setIsAdmin(newData.role === "admin");
        }
      } else if (!error) {
        setProfile(data);
        setIsAdmin(data.role === "admin");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === "SIGNED_IN" || (event === "TOKEN_REFRESHED" && session?.user)) {
        if (session?.user && session.user.id !== lastCheckedUser.current) {
          fetchProfile(session.user.id).finally(() => setIsLoading(false));
          lastCheckedUser.current = session.user.id;
        }
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setIsAdmin(false);
        lastCheckedUser.current = null;
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    try {
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id)
        .select("*")
        .single();

      if (error) throw error;
      setProfile(updatedProfile);
    } catch (err) {
      console.error("Error updating profile:", err);
      throw err;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isAdmin, isProfileComplete, isLoading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
