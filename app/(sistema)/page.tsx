import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Resumen } from "./resumen";

export const metadata: Metadata = {
  title: "Inicio · Power Up",
};

export default function Inicio() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Inicio">
        Lo que pasó hoy y lo que queda por resolver.
      </EncabezadoPagina>

      <Suspense fallback={<ResumenCargando />}>
        <Resumen />
      </Suspense>
    </div>
  );
}

function ResumenCargando() {
  return (
    <div aria-hidden="true" className="grid gap-10 lg:grid-cols-2">
      <div className="esqueleto h-28 lg:col-span-2" />
      <div className="esqueleto order-last h-64 lg:order-none lg:col-span-2" />
      <div className="esqueleto h-56" />
      <div className="esqueleto h-56" />
      <div className="esqueleto h-56 lg:col-span-2" />
    </div>
  );
}
