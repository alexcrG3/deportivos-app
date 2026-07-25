import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
}

const accents = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({ label, value, delta, hint, icon: Icon, accent = "primary" }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">{label}</p>
          <p className="text-[28px] font-bold text-[#0F172A] dark:text-slate-100 my-1 font-mono tracking-tight leading-none">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-[12px]", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(delta !== undefined || hint) && (
        <div className="mt-3 flex items-center gap-2 text-[12px] font-normal text-[#475569] dark:text-slate-400">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium text-[11px]",
                positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
              )}
            >
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </Card>
  );
}
