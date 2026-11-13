import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { FormularioCliente } from "../_comun/formulario-cliente";

export const metadata: Metadata = {
  title: "Nuevo cliente · Power Up",
};

export default function NuevoCliente() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Nuevo cliente">
        Con documento y un dato de contacto ya puede comprar en cuenta
        corriente.
      </EncabezadoPagina>

      <FormularioCliente />
    </div>
  );
}
