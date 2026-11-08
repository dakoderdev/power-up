import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/encabezado-pagina";

export const metadata: Metadata = {
  title: "Nueva venta · Power Up",
};

export default function NuevaVenta() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Nueva venta" actual="nueva-venta">
        Elegí el cliente, sumá productos y confirmá la forma de pago.
      </EncabezadoPagina>

      <section
        aria-label="Armado de la venta"
        className="grid min-h-80 place-items-center border border-dashed border-neutral-800 px-6 text-center text-sm text-neutral-500"
      >
        Acá va el armado de la venta.
      </section>
    </div>
  );
}
