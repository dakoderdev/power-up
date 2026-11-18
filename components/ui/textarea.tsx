import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full resize-none border border-border bg-muted px-3 py-2 text-[0.9375rem] text-white transition-colors placeholder:text-neutral-500 hover:border-neutral-600 focus:border-neutral-400 focus:outline-none aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
