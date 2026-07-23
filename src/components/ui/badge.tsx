import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#8545e8] text-white shadow hover:bg-[#7839d4]",
        secondary:
          "border-transparent bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-700 font-bold",
        outline: "text-foreground",
        success:
          "border-transparent bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow hover:bg-emerald-500/30",
        warning:
          "border-transparent bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow hover:bg-amber-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
