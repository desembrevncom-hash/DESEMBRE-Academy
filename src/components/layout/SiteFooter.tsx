import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold">DESEMBRE</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Academy
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Nền tảng đào tạo dành cho khách hàng, đối tác và đội ngũ DESEMBRE.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Sản phẩm</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Khóa học</li>
            <li>Lộ trình học</li>
            <li>Chứng nhận</li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Hỗ trợ</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Trung tâm trợ giúp</li>
            <li>Liên hệ</li>
            <li>Câu hỏi thường gặp</li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Pháp lý</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Điều khoản sử dụng</li>
            <li>Chính sách bảo mật</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DESEMBRE Academy. Học đúng kiến thức. Phát triển đúng hướng.
      </div>
    </footer>
  );
}
