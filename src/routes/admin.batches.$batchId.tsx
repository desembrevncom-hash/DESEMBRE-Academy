import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/batches/$batchId")({
  component: BatchDetailLayout,
});

function BatchDetailLayout() {
  return <Outlet />;
}
