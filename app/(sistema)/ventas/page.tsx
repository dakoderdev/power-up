import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
import { CLASE_BADGE } from "@/components/estilos";
import { Paginacion } from "@/components/paginacion";
import { Vacio } from "@/components/vacio";
import { etiquetaDia } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/moneda";
import { limpiarPagina } from "@/lib/paginacion";
import { contar } from "@/lib/texto";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { enlaceVentas, leerFiltros } from "@/lib/ventas/filtros";
import { listarOpcionesFiltro, listarVentas } from "@/lib/ventas/listado";
import { TablaVentas } from "../tabla-ventas";
import { FiltrosVentas } from "./filtros-ventas";

export const metadata: Metadata = {
  title: "Ventas · Power Up",
};

type Parametros = Record<string, string | string[] | undefined>;

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

function detalleGrupo({
  cantidad,
  total,
  soloAnuladas,
}: {
  cantidad: number;
  total: string;
  soloAnuladas: boolean;
}) {
  return soloAnuladas
    ? contar({ cantidad, singular: "anulada", plural: "anuladas" })
    : `${contar({ cantidad, singular: "venta", plural: "ventas" })} · ${formatearMoneda(total)}`;
}

async function Lista({ parametros }: { parametros: Promise<Parametros> }) {
  await obtenerUsuarioActual();
  const pedidos = await parametros;
  const { filtros, valores, activos } = leerFiltros(pedidos);
  const [opciones, resultado] = await Promise.all([
    listarOpcionesFiltro(),
    listarVentas(limpiarPagina(pedidos.pagina), filtros),
  ]);
  const { grupos, pagina, paginas, cantidad, totalEmitido } = resultado;

  if (grupos.length === 0 && !activos) {
    return (
      <Vacio>Todavía no hay ventas. Cargá la primera con Nueva venta.</Vacio>
    );
  }

  const ahora = new Date();

  return (
    <section className="flex flex-col gap-8">
      <FiltrosVentas
        valores={valores}
        activos={activos}
        vendedores={opciones.vendedores}
        clientes={opciones.clientes}
      />

      {activos ? (
        <div className="flex min-h-10 items-center gap-4">
          <span className={CLASE_BADGE}>
            {contar({ cantidad, singular: "venta", plural: "ventas" })}
          </span>
          <span className="text-sm text-neutral-400 tabular-nums">
            Total emitido: {formatearMoneda(totalEmitido)}
          </span>
        </div>
      ) : null}

      {grupos.length === 0 ? (
        <Vacio>
          Ninguna venta coincide con los filtros. Probá con otros o limpialos.
        </Vacio>
      ) : (
        <div className="flex flex-col gap-4">
          <TablaVentas
            grupos={grupos.map((grupo) => ({
              clave: grupo.dia,
              titulo: etiquetaDia({ clave: grupo.dia, ahora }),
              detalle: detalleGrupo({
                cantidad: grupo.cantidad,
                total: grupo.total,
                soloAnuladas: valores.estado === "anulada",
              }),
              ventas: grupo.ventas,
            }))}
          />
          <Paginacion
            pagina={pagina}
            paginas={paginas}
            enlace={(numero) => enlaceVentas({ valores, pagina: numero })}
          />
        </div>
      )}
    </section>
  );
}
