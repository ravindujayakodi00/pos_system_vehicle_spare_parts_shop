"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isOwner: boolean;
  isReceptionist: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data } = await getSupabaseClient()
        .from("staff")
        .select("*, role:roles(*)")
        .eq("user_id", userId)
        .single();
      return data as User | null;
    } catch {
      return null;
    }
  }, []);

  // Effect 1: Subscribe to auth state changes.
  // IMPORTANT: Never make Supabase queries inside onAuthStateChange — it
  // deadlocks because queries call auth.getSession() which awaits
  // initializePromise, and that promise hasn't resolved yet when events
  // like SIGNED_IN fire during initialization.
  useEffect(() => {
    const client = getSupabaseClient();

    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effect 2: Fetch user profile when session changes.
  // Runs AFTER onAuthStateChange returns and initializePromise resolves,
  // so Supabase queries work without deadlocking.
  useEffect(() => {
    if (session?.user) {
      let cancelled = false;
      fetchUserProfile(session.user.id).then((profile) => {
        if (!cancelled) setUser(profile);
      });
      return () => { cancelled = true; };
    } else {
      setUser(null);
    }
  }, [session, fetchUserProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      await getSupabaseClient().auth.signOut({ scope: "local" });
    } catch {
      // Ignore — we clear state and redirect regardless
    }
    setUser(null);
    setSession(null);
    window.location.href = "/admin/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        logout,
        isOwner: user?.role?.name === "owner" || user?.role?.name === "developer",
        isReceptionist: user?.role?.name === "receptionist",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
