import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SiteHeader } from "@/components/layout/SiteHeader"
import { studentService } from "@/features/student/services/student.service"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Loader2, RefreshCw } from "lucide-react"

export const Route = createFileRoute('/pending-review')({
  component: PendingReviewPage,
})

function PendingReviewPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    try {
      setChecking(true);
      const data = await studentService.getBootstrapData();
      if (data.student_account?.status === 'active') {
        navigate({ to: "/student" });
      } else if (data.student_account?.status === 'blocked') {
        navigate({ to: "/blocked" });
      }
    } catch (err) {
      console.error("Failed to check status", err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-24 text-center">
        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-bold text-foreground">Chờ xem xét</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Tài khoản của bạn đang được xem xét. Quá trình này có thể mất một chút thời gian. Chúng tôi sẽ thông báo cho bạn khi hoàn tất.
          </p>
          <div className="mt-8">
            <Button 
              onClick={checkStatus} 
              disabled={checking}
              className="w-full rounded-full h-11"
              variant="outline"
            >
              {checking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Kiểm tra lại trạng thái
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
