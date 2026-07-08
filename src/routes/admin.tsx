import { Outlet, createFileRoute, Navigate, useRouter, Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";
import { useAuth } from "@/features/auth/AuthProvider";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  // 1. loading -> render loading boundary
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 2. anonymous -> login flow
  if (!user) {
    return <Navigate to="/auth/login" search={{ redirect: router.state.location.href }} replace />;
  }

  // user.role is expected from the auth provider if it reads canonical application role
  // However, Supabase session user often doesn't have the `role` attached directly unless using custom claims.
  // Wait, let's implement a safe adapter here if the app already has a canonical role.
  // We'll use a specific hook `useAdminAccess`
  return <AdminGuard />;
}

import { useAdminAccess, resolveAcademyDestination } from "@/features/admin/hooks/useAdminAccess";

function AdminGuard() {
  const { user } = useAuth();
  const { isAdmin, role, roleQueryStatus, isLoading } = useAdminAccess();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const destination = resolveAcademyDestination({
    authenticated: true,
    roleQueryStatus,
    role,
  });

  if (destination === "/student") {
    return <Navigate to="/student" replace />;
  }

  // 3. authenticated non-admin -> forbidden
  if (destination === "forbidden" || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p>You do not have permission to access the admin area.</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Go Home
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    await authService.signOut();
    router.navigate({ to: "/auth/login", replace: true });
  };

  // 4. admin/sub_admin -> Outlet with Admin Navbar
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg hidden sm:inline-block text-primary">Academy Admin</span>
            <span className="font-bold text-lg sm:hidden text-primary">Admin</span>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                to="/admin/courses"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Courses
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {user?.email && (
              <span className="hidden md:inline-block text-muted-foreground">{user.email}</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
              {role}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
