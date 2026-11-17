"use client";

import { Printer } from "pixelarticons/react/Printer.js";
import { Boton } from "@/components/ui/boton";

export function BotonImprimir() {
  function imprimir() {
    window.print();
  }

  return (
    <Boton variante="secundario" type="button" onClick={imprimir}>
      <Printer aria-hidden="true" className="size-5" />
      Imprimir comprobante
    </Boton>
  );
}
