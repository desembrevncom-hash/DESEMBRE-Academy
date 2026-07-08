import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from "@/components/layout/SiteHeader"

export const Route = createFileRoute('/blocked')({
  component: BlockedPage,
})

function BlockedPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <h1 className="text-2xl font-bold text-error">Tài khoản bị khóa</h1>
        <p className="mt-4 text-muted-foreground">
          Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết.
        </p>
      </div>
    </div>
  )
}
