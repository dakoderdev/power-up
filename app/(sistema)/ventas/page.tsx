import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { Paginacion } from "@/components/paginacion";
import { Vacio } from "@/components/vacio";
import { etiquetaDia } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/moneda";
import { limpiarPagina } from "@/lib/paginacion";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { listarVentas } from "@/lib/ventas/listado";
import { TablaVentas } from "../tabla-ventas";

export const metadata: Metadata = {
  title: "Ventas · Power Up",
};

type Parametros = { pagina?: string | string[] };

export default function Ventas({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Ventas">
        Historial de ventas, de la más reciente a la más antigua.
      </EncabezadoPagina>

      <Suspense
        fallback={<div aria-hidden="true" className="esqueleto h-96" />}
      >
        <Lista parametros={searchParams} />
      </Suspense>
    </div>
  );
}

async function Lista({ parametros }: { parametros: Promise<Parametros> }) {
  await obtenerUsuarioActual();
  const { pagina: paginaTexto } = await parametros;
  const { grupos, pagina, paginas } = await listarVentas(
    limpiarPagina(paginaTexto),
  );

  if (grupos.length === 0) {
    return (
      <Vacio>Todavía no hay ventas. Cargá la primera con Nueva venta.</Vacio>
    );
  }

  const ahora = new Date();

  return (
    <section className="flex flex-col gap-4">
      <TablaVentas
        grupos={grupos.map((grupo) => ({
          clave: grupo.dia,
          titulo: etiquetaDia({ clave: grupo.dia, ahora }),
          detalle: `${grupo.cantidad} ${grupo.cantidad === 1 ? "venta" : "ventas"} · ${formatearMoneda(grupo.total)}`,
          ventas: grupo.ventas,
        }))}
      />
      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) =>
          numero > 1 ? `/ventas?pagina=${numero}` : "/ventas"
        }
      />
    </section>
  );
}
