import { createFileRoute } from "@tanstack/react-router";
import { FinanzasBalance } from "@/components/finanzas-balance";

export const Route = createFileRoute("/_app/balance")({
  component: BalancePage,
});

function BalancePage() {
  return (
    <div className="space-y-6">
      <FinanzasBalance />
    </div>
  );
}
