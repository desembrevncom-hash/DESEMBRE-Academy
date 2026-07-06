import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/courses/$slug")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/auth/login",
      search: {
        returnTo: location.pathname + location.search,
      },
    });
  },
  component: () => null,
});
