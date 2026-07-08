import { Outlet, createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
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

import { useAdminAccess } from "@/features/admin/hooks/useAdminAccess";

function AdminGuard() {
  const { isAdmin, isLoading } = useAdminAccess();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 3. authenticated non-admin -> forbidden
  if (!isAdmin) {
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

  // 4. admin/sub_admin -> Outlet
  return <Outlet />;
}
