import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-card text-foreground hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        soft: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-[13px] rounded-lg",
        lg: "h-12 px-6 text-base",
        icon: "size-9 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants };
