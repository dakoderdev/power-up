import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "pixelarticons/react/ArrowLeft.js";
import { CLASE_BADGE, CLASE_FILA } from "@/components/estilos";
import { Paginacion } from "@/components/paginacion";
import { Tapa } from "@/components/tapa";
import { Boton } from "@/components/ui/boton";
import { Vacio } from "@/components/vacio";
import { ETIQUETAS_ESTADO } from "@/lib/estados";
import { formatearFechaHora } from "@/lib/fechas";
import { esStockBajo, ETIQUETAS_ORIGEN } from "@/lib/stock/etiquetas";
import {
  listarMovimientos,
  obtenerProductoStock,
  type OrigenStock,
} from "@/lib/stock/listado";
import { contar } from "@/lib/texto";
import { formatearComprobante } from "@/lib/ventas/comprobante";
import { AjustarStock } from "./ajustar-stock";
import { CLASE_COLUMNA, enlaceStock, SOLO_ESCRITORIO } from "./_comun/stock";

const FILTROS: { valor?: OrigenStock; etiqueta: string }[] = [
  { etiqueta: "Todos" },
  { valor: "manual", etiqueta: "Ajustes manuales" },
  { valor: "venta", etiqueta: "Ventas" },
  { valor: "anulacion", etiqueta: "Anulaciones" },
];

export async function MovimientosProducto({
  productoId,
  origen,
  paginaPedida,
  puedeAjustar,
}: {
  productoId: number;
  origen?: OrigenStock;
  paginaPedida: number;
  puedeAjustar: boolean;
}) {
  const producto = await obtenerProductoStock(productoId);

  if (!producto) {
    notFound();
  }

  const { movimientos, pagina, paginas } = await listarMovimientos({
    productoId,
    paginaPedida,
    origen,
  });

  return (
    <section className="flex flex-col gap-4">
      <Boton asChild variante="texto" className="-ml-3 self-start">
        <Link href="/stock">
          <ArrowLeft aria-hidden="true" className="size-5" />
          Todo el stock
        </Link>
      </Boton>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <Tapa url={producto.imagenUrl} className="h-8 w-6 shrink-0" />
          <div className="min-w-0">
            <h2 className="truncate font-pixel text-3xl leading-none tracking-[-0.01em] text-white">
              {producto.nombre}
            </h2>
            <p className="text-sm tabular-nums text-neutral-400">
              {producto.codigo}
              {producto.activo ? "" : ` · ${ETIQUETAS_ESTADO.inactivo}`}
            </p>
          </div>
        </div>
        <p className="text-[0.9375rem] font-medium tabular-nums text-white">
          <span
            className={esStockBajo(producto) ? "text-yellow-400/75" : undefined}
          >
            {contar({
              cantidad: producto.stock,
              singular: "unidad",
              plural: "unidades",
            })}
          </span>{" "}
          en stock
          {esStockBajo(producto) ? (
            <span className="text-sm font-normal text-neutral-400">
              {" "}
              · Stock bajo
            </span>
          ) : null}
        </p>
        <Boton asChild variante="texto" className="sm:ml-auto">
          <Link href={`/productos/${producto.id}`}>Ver producto</Link>
        </Boton>
      </div>

      {puedeAjustar ? (
        <div className="border-t border-neutral-900 pt-10">
          <AjustarStock productoId={producto.id} stock={producto.stock} />
        </div>
      ) : null}

      <h3 className="border-t border-neutral-900 pt-10 text-[0.9375rem] font-medium text-white">
        Movimientos
      </h3>

      <nav aria-label="Filtrar por origen" className="flex flex-wrap gap-2">
        {FILTROS.map((filtro) => {
          const activo = filtro.valor === origen;

          return (
            <Boton
              key={filtro.etiqueta}
              asChild
              variante={activo ? "secundario" : "texto"}
              className={activo ? "" : "border border-transparent"}
            >
              <Link
                href={enlaceStock({ productoId, origen: filtro.valor })}
                aria-current={activo ? "page" : undefined}
              >
                {filtro.etiqueta}
              </Link>
            </Boton>
          );
        })}
      </nav>

      {movimientos.length === 0 ? (
        <Vacio>
          {origen
            ? "Este producto no tiene movimientos con este origen."
            : "Este producto todavía no tiene movimientos de stock. Registrá una entrada con Ajustar stock."}
        </Vacio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-neutral-900">
                <th scope="col" className={`${CLASE_COLUMNA} w-px pr-6`}>
                  Fecha
                </th>
                <th scope="col" className={`${CLASE_COLUMNA} w-px pr-6`}>
                  Origen
                </th>
                <th
                  scope="col"
                  className={`${CLASE_COLUMNA} pr-6 ${SOLO_ESCRITORIO}`}
                >
                  Detalle
                </th>
                <th
                  scope="col"
                  className={`${CLASE_COLUMNA} w-px pr-6 ${SOLO_ESCRITORIO}`}
                >
                  Usuario
                </th>
                <th scope="col" className={`${CLASE_COLUMNA} w-px text-right`}>
                  Cantidad
                </th>
                <th
                  scope="col"
                  className={`${CLASE_COLUMNA} w-px pl-6 text-right`}
                >
                  Existencia
                </th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => (
                <tr key={movimiento.id} className={CLASE_FILA}>
                  <td className="pr-6 tabular-nums text-neutral-300">
                    {formatearFechaHora(new Date(movimiento.creadoEn))}
                  </td>
                  <td className="pr-6">
                    <span className={`${CLASE_BADGE} text-neutral-300`}>
                      {ETIQUETAS_ORIGEN[movimiento.origen]}
                    </span>
                  </td>
                  <td
                    className={`max-w-80 truncate pr-6 text-neutral-300 ${SOLO_ESCRITORIO}`}
                  >
                    {movimiento.ventaId && movimiento.numeroVenta ? (
                      <Link
                        href={`/ventas/${movimiento.ventaId}`}
                        className="transition-colors hover:text-white"
                      >
                        {formatearComprobante({
                          puntoVenta: movimiento.puntoVenta ?? 1,
                          numero: movimiento.numeroVenta,
                        })}
                      </Link>
                    ) : (
                      (movimiento.motivo ?? "—")
                    )}
                  </td>
                  <td className={`pr-6 text-neutral-300 ${SOLO_ESCRITORIO}`}>
                    {movimiento.usuarioNombre}
                  </td>
                  <td className="text-right tabular-nums text-white">
                    {movimiento.tipo === "entrada" ? "+" : "−"}
                    {movimiento.cantidad}
                  </td>
                  <td className="pl-6 text-right tabular-nums text-neutral-300">
                    {movimiento.existenciaResultante}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) => enlaceStock({ productoId, origen, pagina: numero })}
      />
    </section>
  );
}
