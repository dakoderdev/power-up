import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoPagina } from "@/components/encabezado-pagina";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Fila, Linea, Pagina, Pila, Seccion } from "@/components/maquetacion";

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
    <Pagina>
      <EncabezadoPagina titulo="Ventas">
        Historial de ventas, de la más reciente a la más antigua.
      </EncabezadoPagina>

      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <Lista parametros={searchParams} />
      </Suspense>
    </Pagina>
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
    <Seccion className="gap-8">
      <FiltrosVentas
        valores={valores}
        activos={activos}
        vendedores={opciones.vendedores}
        clientes={opciones.clientes}
      />

      {activos ? (
        <Fila className="min-h-10 gap-4">
          <Badge className="text-inherit">
            {contar({ cantidad, singular: "venta", plural: "ventas" })}
          </Badge>
          <Linea tono="secundario" className="text-sm tabular-nums">
            Total emitido: {formatearMoneda(totalEmitido)}
          </Linea>
        </Fila>
      ) : null}

      {grupos.length === 0 ? (
        <Vacio>
          Ninguna venta coincide con los filtros. Probá con otros o limpialos.
        </Vacio>
      ) : (
        <Pila className="gap-4">
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
        </Pila>
      )}
    </Seccion>
  );
}
