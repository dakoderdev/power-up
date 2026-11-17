import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { FormularioProducto } from "../_comun/formulario-producto";
import { Pagina } from "@/components/maquetacion";

export const metadata: Metadata = {
  title: "Nuevo producto · Power Up",
};

export default function NuevoProducto() {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Nuevo producto" actual="nuevo-producto">
        Cargá nombre, código, precio y el stock con el que entra.
      </EncabezadoPagina>

      <FormularioProducto />
    </Pagina>
  );
}
