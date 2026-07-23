import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/rendimiento")({ component: RendimientoLayout });

function RendimientoLayout() {
  return <Outlet />;
}
