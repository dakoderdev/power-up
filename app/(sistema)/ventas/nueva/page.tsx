import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { ArmadoVenta } from "./armado-venta";

export const metadata: Metadata = {
  title: "Nueva venta · Power Up",
};

export default function NuevaVenta() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Nueva venta" actual="nueva-venta">
        Elegí el cliente, sumá productos y confirmá la forma de pago.
      </EncabezadoPagina>

      <ArmadoVenta />
    </div>
  );
}
