import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function useAdminAccess() {
  const { user, initialized: authInitialized } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkRole() {
      if (!authInitialized) {
        return;
      }

      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          if (mounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (mounted) {
          if (error) {
            console.error("Error fetching user role:", error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data?.role === "admin" || data?.role === "sub_admin");
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error fetching user role:", err);
        if (mounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    }

    checkRole();

    return () => {
      mounted = false;
    };
  }, [user, authInitialized]);

  return { isAdmin, isLoading: isLoading || !authInitialized };
}
