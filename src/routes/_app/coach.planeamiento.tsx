import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/coach/planeamiento")({
  component: CoachPlaneamientoRedirect,
});

function CoachPlaneamientoRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/planeamiento");
  }
  return null;
}
