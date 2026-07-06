import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/useAuth";

export const Route = createFileRoute("/courses/")({
  component: CoursesIndexRedirect,
});

function CoursesIndexRedirect() {
  const { session, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!initialized) return;
    if (session) {
      navigate({ to: "/student/courses", replace: true });
    } else {
      navigate({
        to: "/auth/login",
        search: { returnTo: location.pathname + location.search },
        replace: true,
      });
    }
  }, [initialized, session, navigate, location]);

  return null;
}
