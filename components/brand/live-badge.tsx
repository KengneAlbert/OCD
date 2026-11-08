import { cn } from "@/lib/utils";

/** Badge « ● EN DIRECT » rouge clignotant. */
export function LiveBadge({ className, label = "EN DIRECT" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-ocd-live px-3 py-1 text-xs font-bold tracking-wider text-white shadow-[0_6px_20px_-6px_rgb(220_38_38/0.7)]",
        className,
      )}
    >
      <span aria-hidden className="size-2 animate-live rounded-full bg-white" />
      {label}
    </span>
  );
}
