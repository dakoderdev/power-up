import { PestanasProductos } from "@/components/pestanas-productos";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import type { ParametrosListado } from "@/lib/productos/listado";
import { Listado } from "./listado";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagina } from "@/components/maquetacion";

export const metadata: Metadata = {
  title: "Productos · Power Up",
};

export default function Productos({
  searchParams,
}: {
  searchParams: Promise<ParametrosListado>;
}) {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Productos">
        Juegos y consolas del catálogo, con su precio y stock.
      </EncabezadoPagina>

      <PestanasProductos actual="catalogo" />

      <Suspense fallback={<ListadoCargando />}>
        <Listado parametros={searchParams} />
      </Suspense>
    </Pagina>
  );
}

function ListadoCargando() {
  return <Skeleton aria-hidden="true" className="h-96" />;
}
