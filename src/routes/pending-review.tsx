import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from "@/components/layout/SiteHeader"

export const Route = createFileRoute('/pending-review')({
  component: PendingReviewPage,
})

function PendingReviewPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <h1 className="text-2xl font-bold">Chờ xem xét</h1>
        <p className="mt-4 text-muted-foreground">
          Tài khoản của bạn đang được xem xét. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
        </p>
      </div>
    </div>
  )
}
