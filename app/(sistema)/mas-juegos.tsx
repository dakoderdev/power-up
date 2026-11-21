"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function MasJuegos({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Tooltip open={abierto} onOpenChange={setAbierto}>
      <TooltipTrigger
        type="button"
        onClick={(evento) => {
          evento.preventDefault();
          setAbierto(!abierto);
        }}
        className="ml-2 inline-flex h-5 shrink-0 items-center rounded-md border px-2 text-xs font-medium tabular-nums text-foreground transition-colors hover:bg-accent"
      >
        {etiqueta}
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
