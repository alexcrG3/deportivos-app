import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/coach/")({
  component: () => <Navigate to="/dashboard" replace />,
});
