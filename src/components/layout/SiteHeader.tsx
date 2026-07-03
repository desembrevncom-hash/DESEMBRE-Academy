import { Link } from "@tanstack/react-router";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

const nav = [
  { to: "/", label: "Trang chủ" },
  { to: "/courses", label: "Khóa học" },
  { to: "/courses", label: "Lộ trình học", search: { sort: "featured" } as const },
  { to: "/about", label: "Về chúng tôi" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthed } = useAppStore();

  return (
    <header className="sticky top-4 z-40 w-full px-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full glass px-4 py-2.5 shadow-[var(--shadow-float)]">
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
          {isAuthed ? (
            <Button asChild className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
              <Link to="/student">Vào học ngay</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full">
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
        <div className="md:hidden mx-auto mt-2 max-w-6xl rounded-3xl glass p-4 shadow-[var(--shadow-float)]">
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              {isAuthed ? (
                <Button asChild className="col-span-2 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
                  <Link to="/student" onClick={() => setOpen(false)}>Vào học ngay</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/auth/phone" onClick={() => setOpen(false)}>Đăng nhập</Link>
                  </Button>
                  <Button asChild className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
                    <Link to="/courses" onClick={() => setOpen(false)}>Bắt đầu học</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
