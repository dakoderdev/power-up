import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCategorias } from "@/lib/categorias/servicio";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
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

      <Suspense
        fallback={<Skeleton aria-hidden="true" className="h-96 max-w-2xl" />}
      >
        <Alta />
      </Suspense>
    </Pagina>
  );
}

async function Alta() {
  await requerirAdministrador();
  const categorias = await listarCategorias();

  return <FormularioProducto categorias={categorias} />;
}
