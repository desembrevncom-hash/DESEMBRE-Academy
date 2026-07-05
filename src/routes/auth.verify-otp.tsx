import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/verify-otp")({
  beforeLoad: () => {
    throw redirect({ to: "/auth/login" });
  },
  component: () => null,
});
