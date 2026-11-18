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
        className="ml-2 inline-flex h-6 shrink-0 items-center border border-neutral-800 px-2 text-[0.8125rem] tabular-nums text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
      >
        {etiqueta}
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
