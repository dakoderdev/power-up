import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "pixelarticons/react/ArrowLeft.js";
import { Paginacion } from "@/components/paginacion";
import { Tapa } from "@/components/tapa";
import { Button } from "@/components/ui/button";
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
import { enlaceStock, SOLO_ESCRITORIO } from "./_comun/stock";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <Button asChild variant="ghost" className="-ml-3 self-start">
        <Link href="/stock">
          <ArrowLeft aria-hidden="true" className="size-5" />
          Todo el stock
        </Link>
      </Button>

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
        <Button asChild variant="ghost" className="sm:ml-auto">
          <Link href={`/productos/${producto.id}`}>Ver producto</Link>
        </Button>
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
            <Button
              key={filtro.etiqueta}
              asChild
              variant={activo ? "outline" : "ghost"}
              className={activo ? "" : "border border-transparent"}
            >
              <Link
                href={enlaceStock({ productoId, origen: filtro.valor })}
                aria-current={activo ? "page" : undefined}
              >
                {filtro.etiqueta}
              </Link>
            </Button>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-px pr-6">
                Fecha
              </TableHead>
              <TableHead scope="col" className="w-px pr-6">
                Origen
              </TableHead>
              <TableHead scope="col" className={`pr-6 ${SOLO_ESCRITORIO}`}>
                Detalle
              </TableHead>
              <TableHead scope="col" className={`w-px pr-6 ${SOLO_ESCRITORIO}`}>
                Usuario
              </TableHead>
              <TableHead scope="col" className="w-px text-right">
                Cantidad
              </TableHead>
              <TableHead scope="col" className="w-px pl-6 text-right">
                Existencia
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((movimiento) => (
              <TableRow key={movimiento.id}>
                <TableCell className="pr-6 tabular-nums text-neutral-300">
                  {formatearFechaHora(new Date(movimiento.creadoEn))}
                </TableCell>
                <TableCell className="pr-6">
                  <Badge>{ETIQUETAS_ORIGEN[movimiento.origen]}</Badge>
                </TableCell>
                <TableCell
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
                </TableCell>
                <TableCell
                  className={`pr-6 text-neutral-300 ${SOLO_ESCRITORIO}`}
                >
                  {movimiento.usuarioNombre}
                </TableCell>
                <TableCell className="text-right tabular-nums text-white">
                  {movimiento.tipo === "entrada" ? "+" : "−"}
                  {movimiento.cantidad}
                </TableCell>
                <TableCell className="pl-6 text-right tabular-nums text-neutral-300">
                  {movimiento.existenciaResultante}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        enlace={(numero) => enlaceStock({ productoId, origen, pagina: numero })}
      />
    </section>
  );
}
