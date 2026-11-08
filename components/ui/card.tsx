import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl border border-border bg-card p-6 glow-card", className)} {...props} />;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "orange" | "dark" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        variant === "default" && "bg-ocd-cream text-ocd-black dark:bg-white/10 dark:text-white",
        variant === "orange" && "bg-ocd-orange text-ocd-black",
        variant === "dark" && "bg-ocd-black text-white dark:bg-white dark:text-ocd-black",
        variant === "outline" && "border border-border text-foreground",
        className,
      )}
      {...props}
    />
  );
}
