"use client";

import { Printer } from "pixelarticons/react/Printer.js";
import { claseBoton } from "@/components/estilos";

export function BotonImprimir() {
  function imprimir() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={imprimir}
      className={claseBoton({ variante: "secundario" })}
    >
      <Printer aria-hidden="true" className="size-5" />
      Imprimir comprobante
    </button>
  );
}
