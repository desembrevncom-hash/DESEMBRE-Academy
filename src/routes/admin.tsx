import { Outlet, createFileRoute, Navigate, useRouter, Link, useMatchRoute } from "@tanstack/react-router";
import { LogOut, GraduationCap } from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";
import { useAuth } from "@/features/auth/AuthProvider";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" search={{ redirect: router.state.location.href }} replace />;
  }

  return <AdminGuard />;
}

import { useAdminAccess, resolveAcademyDestination } from "@/features/admin/hooks/useAdminAccess";

const NAV_LINKS = [
  { to: "/admin/courses" as const, label: "Khóa học" },
  { to: "/admin/batches" as const, label: "Lớp" },
  { to: "/admin/calendar" as const, label: "Lịch" },
  { to: "/admin/instructors" as const, label: "Giảng viên" },
  { to: "/admin/academy-categories" as const, label: "Danh mục" },
  { to: "/admin/academy-students" as const, label: "Học viên" },
  { to: "/admin/academy-enrollments" as const, label: "Đăng ký" },
  { to: "/admin/academy-access" as const, label: "Phân quyền" },
  { to: "/admin/notifications" as const, label: "ZNS" },
];

function NavItem({ to, label }: { to: string; label: string }) {
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({ to, fuzzy: true });
  return (
    <Link
      to={to as any}
      className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        isActive
          ? "bg-indigo-100 text-indigo-800 shadow-sm"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}

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

  if (destination === "forbidden" || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Không có quyền truy cập</h1>
        <p className="text-slate-500">Bạn không có quyền vào trang quản trị.</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    await authService.signOut();
    router.navigate({ to: "/auth/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900 hidden sm:inline">Academy Admin</span>
          </div>

          {/* Nav - scrollable on mobile */}
          <nav className="flex-1 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max px-1">
              {NAV_LINKS.map((link) => (
                <NavItem key={link.to} to={link.to} label={link.label} />
              ))}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider border border-indigo-100">
              {role}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors text-sm"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-semibold">Đăng xuất</span>
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
