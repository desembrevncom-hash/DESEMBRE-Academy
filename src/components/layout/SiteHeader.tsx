import { Link } from "@tanstack/react-router";
import { GraduationCap, Menu, X } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useAdminAccess } from "@/features/admin/hooks/useAdminAccess";
import { authService } from "@/features/auth/services/auth.service";
import { maskPhone } from "@/utils/privacy";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AcademyLogo } from "@/components/brand/AcademyLogo";

const nav = [
  { to: "/about", label: "Về DESEMBRE" },
  { to: "/lich-khai-giang", label: "Lịch khai giảng" },
  { to: "/courses", label: "Khóa học" },
  { to: "/", hash: "resources", label: "Tài liệu" },
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
    <header className="sticky top-4 z-50 w-full px-4 pointer-events-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 rounded-full border border-teal-100 bg-white/90 px-5 shadow-sm backdrop-blur pointer-events-auto">
        <Link to="/" className="shrink-0" aria-label="DESEMBRE Academy Home">
          <AcademyLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {nav.map((n, i) => (
            <Link
              key={i}
              to={n.to}
              hash={n.hash}
              activeOptions={{ exact: n.to === "/" && !n.hash }}
              className="rounded-full px-3 py-2 text-slate-600 transition hover:text-teal-700 hover:bg-teal-50 data-[status=active]:text-teal-700 data-[status=active]:bg-teal-50 data-[status=active]:font-semibold"
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
                <Link to="/lich-khai-giang">Đăng ký học</Link>
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
                hash={n.hash}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 data-[status=active]:bg-teal-50 data-[status=active]:text-teal-700 data-[status=active]:font-semibold"
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
                    <Link to="/lich-khai-giang" onClick={() => setOpen(false)}>Đăng ký học</Link>
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
