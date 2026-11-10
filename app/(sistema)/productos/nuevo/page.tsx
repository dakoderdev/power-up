import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { FormularioProducto } from "../_comun/formulario-producto";

export const metadata: Metadata = {
  title: "Nuevo producto · Power Up",
};

export default function NuevoProducto() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Nuevo producto" actual="nuevo-producto">
        Cargá nombre, código, precio y el stock con el que entra.
      </EncabezadoPagina>

      <FormularioProducto />
    </div>
  );
}
