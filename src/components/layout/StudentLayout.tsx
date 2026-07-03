import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { BookOpen, Home, LogOut, TrendingUp, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";

const navItems = [
  { to: "/student", label: "Tổng quan", icon: Home, exact: true },
  { to: "/student/courses", label: "Khóa học", icon: BookOpen, exact: false },
  { to: "/student", label: "Tiến độ", icon: TrendingUp, exact: false, hash: "progress" },
  { to: "/student/profile", label: "Hồ sơ", icon: User, exact: false },
] as const;

export function StudentLayout() {
  const { isAuthed, logout, student } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthed) navigate({ to: "/auth/phone" });
  }, [isAuthed, navigate]);

  if (!isAuthed) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto flex max-w-7xl gap-6 px-3 sm:px-6 py-6">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col rounded-3xl border border-border/70 bg-card p-5 sticky top-6 h-[calc(100dvh-3rem)]">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">DA</div>
            <div className="text-sm font-bold">DESEMBRE Academy</div>
          </Link>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-accent/60 p-3">
            <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/20 text-primary-dark">{student.fullName.slice(0, 1)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{student.fullName}</div>
              <div className="text-xs text-muted-foreground truncate">{student.phone}</div>
            </div>
          </div>
          <nav className="mt-6 flex flex-col gap-1">
            {navItems.map((n) => {
              const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm ${active ? "bg-primary/10 text-primary-dark font-semibold" : "text-foreground/70 hover:bg-accent"}`}
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto">
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start rounded-2xl text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 rounded-full glass p-1.5 shadow-[var(--shadow-float)] z-40">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
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
