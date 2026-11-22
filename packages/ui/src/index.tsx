import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", children, ...props },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";
    const variants = {
      primary:
        "bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:ring-blue-500",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus:ring-slate-400",
      outline:
        "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-blue-500",
      ghost:
        "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-400",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500",
    };
    const sizes = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-3.5 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

// Badge
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "blue" | "teal" | "emerald" | "amber" | "rose" | "purple" | "slate";
}

export function Badge({
  className,
  variant = "slate",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    teal: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
    emerald:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    amber:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    rose: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    purple:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    slate:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Card
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// MetricCard
export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  subtext,
  trend,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("p-4 flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="text-slate-400 dark:text-slate-500">{icon}</div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-50">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>
      {(subtext || trend) && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[11px] leading-tight">
          {subtext && (
            <span className="text-slate-500 dark:text-slate-400">
              {subtext}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                "font-semibold ml-auto flex items-center gap-0.5 shrink-0",
                trend.isNeutral
                  ? "text-slate-500"
                  : trend.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
