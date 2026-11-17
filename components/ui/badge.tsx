import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-2 border border-border px-2 text-[0.8125rem] whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-5",
  {
    variants: {
      variant: {
        default: "text-neutral-300",
        secondary: "text-neutral-400",
        destructive: "text-destructive",
        outline: "text-white",
        ghost: "border-transparent text-neutral-300",
        link: "border-transparent text-neutral-300 underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
