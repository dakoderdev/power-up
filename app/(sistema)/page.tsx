import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Resumen } from "./resumen";
import { Skeleton } from "@/components/ui/skeleton";
import { Grilla, Pagina } from "@/components/maquetacion";

export const metadata: Metadata = {
  title: "Inicio · Power Up",
};

export default function Inicio() {
  return (
    <Pagina>
      <EncabezadoPagina titulo="Inicio">
        Lo que pasó hoy y lo que queda por resolver.
      </EncabezadoPagina>

      <Suspense fallback={<ResumenCargando />}>
        <Resumen />
      </Suspense>
    </Pagina>
  );
}

function ResumenCargando() {
  return (
    <Grilla aria-hidden="true" className="gap-10 lg:grid-cols-2">
      <Skeleton className="h-28 lg:col-span-2" />
      <Skeleton className="order-last h-64 lg:order-none lg:col-span-2" />
      <Skeleton className="h-56" />
      <Skeleton className="h-56" />
      <Skeleton className="h-56 lg:col-span-2" />
    </Grilla>
  );
}
