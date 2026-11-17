import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import type { ParametrosListado } from "@/lib/productos/listado";
import { Listado } from "./listado";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Productos · Power Up",
};

export default function Productos({
  searchParams,
}: {
  searchParams: Promise<ParametrosListado>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Productos">
        Juegos y consolas del catálogo, con su precio y stock.
      </EncabezadoPagina>

      <Suspense fallback={<ListadoCargando />}>
        <Listado parametros={searchParams} />
      </Suspense>
    </div>
  );
}

function ListadoCargando() {
  return <Skeleton aria-hidden="true" className="h-96" />;
}
