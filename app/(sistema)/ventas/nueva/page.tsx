import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { ArmadoVenta } from "./armado-venta";
import { Pagina } from "@/components/maquetacion";

export const metadata: Metadata = {
  title: "Nueva venta · Power Up",
};

export default function NuevaVenta() {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Nueva venta" actual="nueva-venta">
        Elegí el cliente, sumá productos y confirmá la forma de pago.
      </EncabezadoPagina>

      <ArmadoVenta />
    </Pagina>
  );
}
