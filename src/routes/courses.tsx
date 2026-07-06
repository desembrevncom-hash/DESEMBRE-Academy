import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/courses")({
  beforeLoad: ({ location }) => {
    // Standard TanStack router redirect. This assumes an auth context,
    // but doing it at the component level is safer if the route tree
    // isn't deeply injected with auth context. We will just redirect to /auth/login.
    throw redirect({
      to: "/auth/login",
      search: {
        returnTo: location.pathname + location.search,
      },
    });
  },
  component: () => null,
});
