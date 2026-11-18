import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Pagina } from "@/components/maquetacion";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCategorias } from "@/lib/categorias/servicio";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { ListaCategorias } from "./lista-categorias";

export const metadata: Metadata = {
  title: "Categorías · Power Up",
};

export default function Categorias() {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Categorías">
        Grupos del catálogo. Una categoría con productos activos no se puede dar
        de baja.
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Contenido />
      </Suspense>
    </Pagina>
  );
}

async function Contenido() {
  const { esAdministrador } = await obtenerUsuarioActual();
  const categorias = await listarCategorias({
    incluirInactivas: esAdministrador,
  });

  return (
    <ListaCategorias categorias={categorias} puedeEditar={esAdministrador} />
  );
}
