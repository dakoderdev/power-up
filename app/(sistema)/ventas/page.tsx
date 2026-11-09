import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { listarVentas } from "@/lib/ventas/listado";
import { TablaVentas } from "../tabla-ventas";

export const metadata: Metadata = {
  title: "Ventas · Power Up",
};

export default function Ventas() {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Ventas">
        Historial de ventas, de la más reciente a la más antigua.
      </EncabezadoPagina>

      <Suspense fallback={<div aria-hidden="true" className="esqueleto h-96" />}>
        <Lista />
      </Suspense>
    </div>
  );
}

async function Lista() {
  const ventas = await listarVentas();

  if (ventas.length === 0) {
    return <p className="text-neutral-400">Todavía no hay ventas.</p>;
  }

  return <TablaVentas ventas={ventas} />;
}
