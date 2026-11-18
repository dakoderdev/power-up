"use client";

import { Printer } from "pixelarticons/react/Printer.js";
import { Button } from "@/components/ui/button";

export function BotonImprimir() {
  function imprimir() {
    window.print();
  }

  return (
    <Button variant="outline" type="button" onClick={imprimir}>
      <Printer aria-hidden="true" className="size-5" />
      Imprimir recibo
    </Button>
  );
}
