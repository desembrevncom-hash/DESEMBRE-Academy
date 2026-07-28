import { Link } from "@tanstack/react-router";
import { GraduationCap, Menu, X } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useAdminAccess } from "@/features/admin/hooks/useAdminAccess";
import { authService } from "@/features/auth/services/auth.service";
import { maskPhone } from "@/utils/privacy";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Trang chủ" },
  { to: "/courses", label: "Khóa học" },
  { to: "/courses", label: "Lộ trình học", search: { sort: "featured" } as const },
  { to: "/about", label: "Về chúng tôi" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const { isAdmin } = useAdminAccess();

  // Use phone from auth session directly instead of querying DB
  const studentPhone = session?.user?.phone || session?.user?.user_metadata?.phone || null;
  // Assume active if logged in, since auth flow handles restrictions
  const studentStatus: string | null = "active";

  const handleLogout = async () => {
    await authService.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-6 pt-4 pb-2 bg-gradient-to-b from-background via-background/90 to-transparent pointer-events-none">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full glass px-4 py-2.5 shadow-[var(--shadow-float)] pointer-events-auto">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold tracking-tight">DESEMBRE</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Academy</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {nav.map((n, i) => (
            <Link
              key={i}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-3 py-2 text-foreground/70 transition hover:text-foreground hover:bg-accent/60 data-[status=active]:text-primary-dark data-[status=active]:font-semibold"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden lg:inline-block">
                {studentPhone ? maskPhone(studentPhone) : "Tài khoản của tôi"}
              </span>
              
              {isAdmin && (
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/admin/academy-students">Admin</Link>
                </Button>
              )}

              {studentStatus === "pending_review" ? (
                <Button asChild className="rounded-full bg-warning hover:bg-warning/90 text-white border-0">
                  <Link to="/pending-review">Kiểm tra trạng thái</Link>
                </Button>
              ) : (
                <Button asChild className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
                  <Link to="/student/courses">Vào học viện</Link>
                </Button>
              )}

              <Button variant="ghost" onClick={handleLogout} className="rounded-full text-muted-foreground">
                Đăng xuất
              </Button>
            </div>
          ) : (
            <>
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/auth/phone">Đăng nhập</Link>
              </Button>
              <Button asChild className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
                <Link to="/courses">Bắt đầu học</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden grid h-9 w-9 place-items-center rounded-full bg-accent"
          aria-label={open ? "Đóng menu" : "Mở menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mx-auto mt-2 max-w-6xl rounded-3xl glass p-4 shadow-[var(--shadow-float)] pointer-events-auto">
          <nav className="flex flex-col">
            {nav.map((n, i) => (
              <Link
                key={i}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {session ? (
                <>
                  <div className="px-4 py-2 text-sm text-muted-foreground text-center">
                    {studentPhone ? maskPhone(studentPhone) : "Tài khoản của tôi"}
                  </div>
                  {isAdmin && (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link to="/admin/academy-students" onClick={() => setOpen(false)}>Admin</Link>
                    </Button>
                  )}
                  {studentStatus === "pending_review" ? (
                    <Button asChild className="rounded-full bg-warning hover:bg-warning/90 text-white border-0">
                      <Link to="/pending-review" onClick={() => setOpen(false)}>Kiểm tra trạng thái</Link>
                    </Button>
                  ) : (
                    <Button asChild className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
                      <Link to="/student/courses" onClick={() => setOpen(false)}>Vào học viện</Link>
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => { handleLogout(); setOpen(false); }} className="rounded-full text-muted-foreground">
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full justify-start rounded-xl h-12" asChild>
                    <Link to="/auth/phone" onClick={() => setOpen(false)}>Đăng nhập</Link>
                  </Button>
                  <Button asChild className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
                    <Link to="/courses" onClick={() => setOpen(false)}>Bắt đầu học</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
