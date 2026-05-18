import type { ReactNode } from "react";

type Variant = "accent" | "muted" | "trim";

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variants: Record<Variant, string> = {
  accent:
    "bg-accent-light text-accent text-[10px] font-bold uppercase tracking-[0.5px] px-[9px] py-[3px] rounded-[20px]",
  muted:
    "bg-border text-text-muted text-[10px] font-semibold px-[7px] py-[2px] rounded-[10px]",
  trim:
    "bg-accent-light text-accent text-[11px] font-semibold px-[8px] py-[2px] rounded-[10px] whitespace-nowrap",
};

export function Badge({ variant = "accent", children, className = "" }: BadgeProps) {
  return <span className={`${variants[variant]} ${className}`}>{children}</span>;
}
