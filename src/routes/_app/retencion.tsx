import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/retencion")({ component: RetencionRedirect });

function RetencionRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/crm" });
  }, [navigate]);

  return null;
}
