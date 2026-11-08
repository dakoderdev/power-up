import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/encabezado-pagina";

export const metadata: Metadata = {
  title: "Inicio · Power Up",
};

export default function Inicio() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Inicio">
        Empezá una venta o cargá un producto con los botones de la derecha.
      </EncabezadoPagina>

      <section
        aria-label="Resumen"
        className="grid min-h-80 place-items-center border border-dashed border-neutral-800 px-6 text-center text-sm text-neutral-500"
      >
        Acá va el resumen del día.
      </section>
    </div>
  );
}
