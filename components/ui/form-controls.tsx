import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-2xl border border-border bg-card px-4 hover:border-foreground/25 text-base text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-ocd-orange-dark focus-visible:ring-4 focus-visible:ring-ocd-glow/70 dark:focus-visible:ring-ocd-orange/30 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-ocd-live aria-[invalid=true]:ring-red-100";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(controlBase, "h-12", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(controlBase, "min-h-28 py-3 leading-relaxed", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(controlBase, "h-12 cursor-pointer appearance-none pr-10 hover:border-foreground/30", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
    </div>
  ),
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}

export const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn("control-check mt-0.5", className)}
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";

interface FieldProps {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string; "aria-required"?: boolean }) => React.ReactNode;
}

/** Champ accessible : label + aide + message d'erreur reliés au contrôle. */
export function Field({ id, label, required, hint, error, className, children }: FieldProps) {
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="ml-0.5 text-accent-text" aria-hidden>
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(facultatif)</span>
        )}
      </Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy, "aria-required": required || undefined })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-medium text-ocd-live dark:text-red-400">
      {message}
    </p>
  );
}
