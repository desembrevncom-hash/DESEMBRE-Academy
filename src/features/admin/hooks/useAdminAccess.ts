import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type RoleQueryStatus = "idle" | "loading" | "success" | "error";

export function useAdminAccess() {
  const { user, initialized: authInitialized } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [roleQueryStatus, setRoleQueryStatus] = useState<RoleQueryStatus>("idle");
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
          setRole(null);
          setRoleQueryStatus("success");
          setIsLoading(false);
        }
        return;
      }

      if (mounted) setRoleQueryStatus("loading");

      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          if (mounted) {
            setIsAdmin(false);
            setRole(null);
            setRoleQueryStatus("error");
            setIsLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (mounted) {
          if (error) {
            console.error("Error fetching user role:", error);
            setIsAdmin(false);
            setRole(null);
            setRoleQueryStatus("error");
          } else {
            const currentRole = data?.role || null;
            setRole(currentRole);
            setIsAdmin(currentRole === "admin" || currentRole === "sub_admin");
            setRoleQueryStatus("success");
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error fetching user role:", err);
        if (mounted) {
          setIsAdmin(false);
          setRole(null);
          setRoleQueryStatus("error");
          setIsLoading(false);
        }
      }
    }

    checkRole();

    return () => {
      mounted = false;
    };
  }, [user, authInitialized]);

  return { isAdmin, role, roleQueryStatus, isLoading: isLoading || !authInitialized };
}

export type AcademyDestination = "/admin/courses" | "/student" | "forbidden";

export function resolveAcademyDestination(input: {
  authenticated: boolean;
  roleQueryStatus: RoleQueryStatus;
  role: string | null;
}): AcademyDestination | null {
  if (
    !input.authenticated ||
    input.roleQueryStatus === "idle" ||
    input.roleQueryStatus === "loading"
  ) {
    return null;
  }

  if (input.roleQueryStatus === "error") {
    return "forbidden";
  }

  if (input.role === "admin" || input.role === "sub_admin") {
    return "/admin/courses";
  }

  if (input.role === null) {
    return "/student";
  }

  return "forbidden";
}
