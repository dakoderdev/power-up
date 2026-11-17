import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex shrink-0 cursor-pointer items-center justify-center gap-2 px-3 text-[0.9375rem] font-medium whitespace-nowrap transition-colors disabled:cursor-wait disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/85 active:bg-primary/70",
        destructive:
          "bg-red-500 text-primary-foreground hover:bg-red-500/85 active:bg-red-500/70",
        outline: "border border-border text-white hover:border-neutral-600",
        secondary: "bg-muted text-secondary-foreground hover:text-white",
        ghost: "text-muted-foreground hover:text-white",
        link: "text-white underline-offset-4 decoration-neutral-600 hover:underline",
      },
      size: {
        default: "h-10",
        xs: "h-6 px-2 text-[0.8125rem]",
        sm: "h-9",
        lg: "h-11",
        icon: "size-10 px-0",
        "icon-xs": "size-6 px-0",
        "icon-sm": "size-9 px-0",
        "icon-lg": "size-11 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
