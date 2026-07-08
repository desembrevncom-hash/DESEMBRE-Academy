import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { BookOpen, Home, LogOut, TrendingUp, User, Loader2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { authService } from "@/features/auth/services/auth.service";
import { useStudent } from "@/features/student/useStudent";
import { useAdminAccess, resolveAcademyDestination } from "@/features/admin/hooks/useAdminAccess";

const navItems = [
  { to: "/student", label: "Tổng quan", icon: Home, exact: true },
  { to: "/student/courses", label: "Khóa học", icon: BookOpen, exact: false },
  { to: "/student", label: "Tiến độ", icon: TrendingUp, exact: false, hash: "progress" },
  { to: "/student/profile", label: "Hồ sơ", icon: User, exact: false },
] as const;

export function StudentLayout() {
  const { session, initialized: authInitialized } = useAuth();
  const {
    initialized: studentInitialized,
    bootstrapState,
    customer,
    tier,
    latestExpiredMembership,
    error,
    retry,
  } = useStudent();
  const { role, roleQueryStatus, isLoading: roleLoading } = useAdminAccess();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authInitialized && !session) {
      navigate({ to: "/auth/login" });
    }
  }, [authInitialized, session, navigate]);

  // Role-aware routing: Prevent admins from accessing student layout
  useEffect(() => {
    if (authInitialized && session && roleQueryStatus !== "loading" && roleQueryStatus !== "idle") {
      const destination = resolveAcademyDestination({
        authenticated: true,
        roleQueryStatus,
        role,
      });

      if (destination === "/admin/courses") {
        navigate({ to: "/admin/courses", replace: true });
      } else if (destination === "forbidden") {
        navigate({ to: "/", replace: true });
      }
    }
  }, [authInitialized, session, roleQueryStatus, role, navigate]);

  if (!authInitialized || !studentInitialized || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-card p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load profile</h2>
          <p className="text-sm text-muted-foreground mb-6">{error.message}</p>
          <Button onClick={retry} variant="outline" className="rounded-2xl">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (bootstrapState === "NO_STUDENT_ACCOUNT") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            Your Academy profile has not been provisioned yet.
          </p>
        </div>
      </div>
    );
  }

  if (bootstrapState === "NO_CUSTOMER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Your Academy profile is incomplete.</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate({ to: "/auth/login" });
    } catch (e) {
      console.error(e);
    }
  };

  const displayName = customer?.name || session.user.email || "Unknown Student";
  const displayEmail = customer?.email || session.user.email || "";
  const displayPhone = customer?.phone || "";

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(displayName);

  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto flex max-w-7xl gap-6 px-3 sm:px-6 py-6">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col rounded-3xl border border-border/70 bg-card p-5 sticky top-6 h-[calc(100dvh-3rem)]">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              DA
            </div>
            <div className="text-sm font-bold">DESEMBRE Academy</div>
          </Link>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-accent/60 p-4 relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary-dark font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate text-foreground">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{displayEmail}</div>
                {displayPhone && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {displayPhone}
                  </div>
                )}
              </div>
            </div>
            {tier && (
              <div className="relative z-10 mt-1">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-dark border border-primary/20">
                  {tier.name}
                </span>
              </div>
            )}
          </div>
          <nav className="mt-6 flex flex-col gap-1">
            {navItems.map((n) => {
              const active = n.exact
                ? location.pathname === n.to
                : location.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary/10 text-primary-dark font-semibold" : "text-foreground/70 hover:bg-accent hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start rounded-2xl text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 pb-24 md:pb-6 flex flex-col gap-6">
          {bootstrapState === "NO_ACTIVE_MEMBERSHIP" && (
            <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-sm text-yellow-800 dark:text-yellow-200">
              <div className="font-semibold mb-1 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No active Academy membership was found.
              </div>
              {latestExpiredMembership && latestExpiredMembership.ends_at && (
                <p className="mt-2 text-yellow-700/80 dark:text-yellow-300/80">
                  Your last membership expired on{" "}
                  {new Date(latestExpiredMembership.ends_at).toLocaleDateString()}.
                </p>
              )}
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 rounded-full glass p-1.5 shadow-[var(--shadow-float)] z-40">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((n) => {
            const active = n.exact
              ? location.pathname === n.to
              : location.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.label}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 rounded-full py-2 text-[10px] ${active ? "bg-primary text-primary-foreground font-semibold" : "text-foreground/70"}`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
