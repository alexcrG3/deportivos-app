import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/leads")({ component: LeadsRedirect });

function LeadsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/crm" });
  }, [navigate]);

  return null;
}
