import { cn } from "@/lib/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-red-600/20 text-red-300",
        variant === "success" && "bg-emerald-600/20 text-emerald-300",
        variant === "warning" && "bg-amber-600/20 text-amber-300",
        variant === "danger" && "bg-red-900/40 text-red-200",
        variant === "muted" && "bg-white/10 text-white/60",
        className
      )}
      {...props}
    />
  );
}
