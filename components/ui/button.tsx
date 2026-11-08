import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ocd-orange-dark disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Texte noir sur orange : contraste AA (7:1), fidèle au logo « OCD » + « Live ».
        default:
          "bg-ocd-orange text-ocd-black shadow-[0_10px_30px_-10px_rgb(232_121_43/0.7)] hover:bg-ocd-orange-dark hover:shadow-[0_14px_36px_-10px_rgb(232_121_43/0.8)]",
        dark: "bg-ocd-black text-white hover:bg-black dark:bg-white dark:text-ocd-black dark:hover:bg-ocd-cream",
        outline:
          "border-2 border-ocd-black/10 bg-card text-foreground hover:border-ocd-orange hover:bg-ocd-cream dark:border-white/15 dark:hover:bg-white/5",
        ghost: "text-foreground hover:bg-ocd-cream dark:hover:bg-white/5",
        whatsapp: "bg-whatsapp text-white shadow-[0_10px_30px_-12px_rgb(21_128_61/0.7)] hover:bg-whatsapp-dark",
        link: "text-accent-text underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        default: "h-12 px-6 text-base",
        lg: "h-14 px-7 text-base sm:text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
