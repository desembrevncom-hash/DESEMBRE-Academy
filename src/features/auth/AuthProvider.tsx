import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService, AuthErrorInfo } from "./services/auth.service";
import type { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: AuthErrorInfo | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<AuthErrorInfo | null>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function initializeAuth() {
      try {
        setLoading(true);
        const currentSession = await authService.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setError(null);
        }

        subscription = authService.onAuthStateChange((event, newSession) => {
          if (mounted) {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setLoading(false);
          }
        });
      } catch (err: any) {
        if (mounted) {
          setError({
            message: err.message || "Failed to initialize authentication",
            code: err.code,
            status: err.status,
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, initialized, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
