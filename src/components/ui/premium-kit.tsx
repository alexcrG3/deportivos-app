import * as React from "react";
import { cn } from "@/lib/utils";

// 1. <BaseLayout /> (El contenedor maestro de páginas)
export interface BaseLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function BaseLayout({ className, children, ...props }: BaseLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-[#F8F9FA] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full", className)} {...props}>
      {children}
    </div>
  );
}

// 2. <PremiumCard /> (El contenedor de secciones)
export interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PremiumCard({ className, children, ...props }: PremiumCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[12px] p-6 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// 3. <MetricBlock /> (El visualizador de datos y KPIs)
export interface MetricBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
}

export function MetricBlock({ label, value, subtext, className }: MetricBlockProps) {
  return (
    <div className={cn("space-y-1 p-5 rounded-[12px] bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-sm", className)}>
      <p className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">{label}</p>
      <p className="text-[28px] font-bold text-[#0F172A] dark:text-slate-100 my-1 font-mono tracking-tight leading-none">{value}</p>
      {subtext && <p className="text-[12px] font-normal text-[#475569] dark:text-slate-400">{subtext}</p>}
    </div>
  );
}

// 4. <BadgePill /> (Las cápsulas de estado y tiempo)
export interface BadgePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "info" | "neutral";
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  default: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
  success: "bg-[#10B981]/10 text-[#059669] border-[#10B981]/20",
  warning: "bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/20",
  destructive: "bg-[#EF4444]/10 text-[#DC2626] border-[#EF4444]/20",
  info: "bg-[#0EA5E9]/10 text-[#0284C7] border-[#0EA5E9]/20",
  neutral: "bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-300 border-[#E2E8F0] dark:border-slate-700",
};

export function BadgePill({ variant = "neutral", className, children, ...props }: BadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[10px] py-[4px] text-[12px] font-medium border leading-none transition-colors",
        variantStyles[variant] || variantStyles.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
