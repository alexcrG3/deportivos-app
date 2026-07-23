import { createFileRoute } from "@tanstack/react-router";
import { FinanzasEgresos } from "@/components/finanzas-egresos";

export const Route = createFileRoute("/_app/egresos")({
  component: EgresosPage,
});

function EgresosPage() {
  return (
    <div className="space-y-6">
      <FinanzasEgresos />
    </div>
  );
}
