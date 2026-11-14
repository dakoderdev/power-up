import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  movimientosStock,
  ORIGENES_STOCK,
  productos,
  user,
  ventas,
} from "@/lib/db/schema";
import { ubicarPagina } from "@/lib/paginacion";

const MOVIMIENTOS_POR_PAGINA = 30;

export type OrigenStock = (typeof ORIGENES_STOCK)[number];

export function limpiarOrigen(valor?: string | string[]) {
  const texto = Array.isArray(valor) ? valor[0] : valor;

  return ORIGENES_STOCK.find((origen) => origen === texto);
}

export async function listarMovimientos({
  paginaPedida,
  origen,
}: {
  paginaPedida: number;
  origen?: OrigenStock;
}) {
  const filtro = origen ? eq(movimientosStock.origen, origen) : undefined;

  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(movimientosStock)
    .where(filtro);

  const { pagina, paginas, desde } = ubicarPagina({
    cantidad,
    porPagina: MOVIMIENTOS_POR_PAGINA,
    pedida: paginaPedida,
  });

  const movimientos = await db
    .select({
      id: movimientosStock.id,
      tipo: movimientosStock.tipo,
      origen: movimientosStock.origen,
      cantidad: movimientosStock.cantidad,
      motivo: movimientosStock.motivo,
      creadoEn: movimientosStock.creadoEn,
      productoId: productos.id,
      productoCodigo: productos.codigo,
      productoNombre: productos.nombre,
      usuarioNombre: user.name,
      ventaId: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numeroVenta: ventas.numero,
    })
    .from(movimientosStock)
    .innerJoin(productos, eq(productos.id, movimientosStock.productoId))
    .innerJoin(user, eq(user.id, movimientosStock.usuarioId))
    .leftJoin(ventas, eq(ventas.id, movimientosStock.ventaId))
    .where(filtro)
    .orderBy(desc(movimientosStock.creadoEn), desc(movimientosStock.id))
    .limit(MOVIMIENTOS_POR_PAGINA)
    .offset(desde);

  return { movimientos, pagina, paginas };
}
