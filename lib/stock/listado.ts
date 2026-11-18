import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import {
  categorias,
  movimientosStock,
  ORIGENES_STOCK,
  productos,
  TIPOS_STOCK,
  user,
  ventas,
} from "@/lib/db/schema";
import { ubicarPagina } from "@/lib/paginacion";

const MOVIMIENTOS_POR_PAGINA = 30;
const PRODUCTOS_POR_PAGINA = 36;

const anteriores = alias(movimientosStock, "anteriores");

// RF-P6 y ST-24: existencia luego del movimiento, suma de entradas menos
// salidas del producto hasta ese movimiento; no se guarda.
const EXISTENCIA_RESULTANTE =
  sql<number>`(select coalesce(sum(case when ${anteriores.tipo} = 'entrada' then ${anteriores.cantidad} else -${anteriores.cantidad} end), 0) from ${movimientosStock} as anteriores where ${anteriores.productoId} = ${movimientosStock.productoId} and (${anteriores.creadoEn} < ${movimientosStock.creadoEn} or (${anteriores.creadoEn} = ${movimientosStock.creadoEn} and ${anteriores.id} <= ${movimientosStock.id})))`.mapWith(
    Number,
  );

export type OrigenStock = (typeof ORIGENES_STOCK)[number];

export function limpiarOrigen(valor?: string | string[]) {
  const texto = Array.isArray(valor) ? valor[0] : valor;

  return ORIGENES_STOCK.find((origen) => origen === texto);
}

export function limpiarProductoId(valor?: string | string[]) {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const numero = Number(texto);

  return Number.isSafeInteger(numero) && numero > 0 ? numero : undefined;
}

export async function listarInventario({
  busqueda,
  paginaPedida,
}: {
  busqueda: string;
  paginaPedida: number;
}) {
  const filtro = busqueda
    ? coincideBusqueda({
        columnas: [productos.nombre, productos.codigo],
        busqueda,
      })
    : undefined;

  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(productos)
    .where(filtro);

  const { pagina, paginas, desde } = ubicarPagina({
    cantidad,
    porPagina: PRODUCTOS_POR_PAGINA,
    pedida: paginaPedida,
  });

  const lista = await db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      nombre: productos.nombre,
      stock: productos.stock,
      stockMinimo: productos.stockMinimo,
      activo: productos.activo,
      imagenUrl: productos.imagenUrl,
    })
    .from(productos)
    .where(filtro)
    .orderBy(asc(productos.stock), asc(productos.nombre), asc(productos.id))
    .limit(PRODUCTOS_POR_PAGINA)
    .offset(desde);

  return { lista, cantidad, pagina, paginas };
}

// RF-P6: datos de la ficha del producto (existencia, mínimo y categoría).
export async function obtenerProductoStock(id: number) {
  const [producto] = await db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      nombre: productos.nombre,
      categoriaNombre: categorias.nombre,
      precio: productos.precio,
      stock: productos.stock,
      stockMinimo: productos.stockMinimo,
      activo: productos.activo,
      imagenUrl: productos.imagenUrl,
    })
    .from(productos)
    .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
    .where(eq(productos.id, id));

  return producto;
}

export type TipoStock = (typeof TIPOS_STOCK)[number];

// RF-P6 y ST-11: movimientos del más nuevo al más viejo, con usuario,
// referencia a la venta y existencia resultante (ST-24); filtrables por
// producto, origen, tipo y fechas.
export async function listarMovimientos({
  productoId,
  paginaPedida,
  origen,
  tipo,
  desde,
  hasta,
  porPagina = MOVIMIENTOS_POR_PAGINA,
}: {
  productoId?: number;
  paginaPedida: number;
  origen?: OrigenStock;
  tipo?: TipoStock;
  desde?: Date;
  hasta?: Date;
  porPagina?: number;
}) {
  const filtro = and(
    productoId ? eq(movimientosStock.productoId, productoId) : undefined,
    origen ? eq(movimientosStock.origen, origen) : undefined,
    tipo ? eq(movimientosStock.tipo, tipo) : undefined,
    desde ? gte(movimientosStock.creadoEn, desde) : undefined,
    hasta ? lt(movimientosStock.creadoEn, hasta) : undefined,
  );

  const [{ cantidad }] = await db
    .select({ cantidad: count() })
    .from(movimientosStock)
    .where(filtro);

  const {
    pagina,
    paginas,
    desde: salto,
  } = ubicarPagina({
    cantidad,
    porPagina,
    pedida: paginaPedida,
  });

  const movimientos = await db
    .select({
      id: movimientosStock.id,
      productoId: movimientosStock.productoId,
      productoCodigo: productos.codigo,
      productoNombre: productos.nombre,
      tipo: movimientosStock.tipo,
      origen: movimientosStock.origen,
      cantidad: movimientosStock.cantidad,
      existenciaResultante: EXISTENCIA_RESULTANTE,
      motivo: movimientosStock.motivo,
      creadoEn: movimientosStock.creadoEn,
      usuarioId: user.id,
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
    .limit(porPagina)
    .offset(salto);

  return { movimientos, cantidad, pagina, paginas };
}

export type MovimientoStockFila = Awaited<
  ReturnType<typeof listarMovimientos>
>["movimientos"][number];

// RF-P4 y RF-P5: un movimiento recién registrado, para devolverlo con su existencia resultante.
export async function obtenerMovimiento(id: number) {
  const [movimiento] = await db
    .select({
      id: movimientosStock.id,
      productoId: movimientosStock.productoId,
      productoCodigo: productos.codigo,
      productoNombre: productos.nombre,
      tipo: movimientosStock.tipo,
      origen: movimientosStock.origen,
      cantidad: movimientosStock.cantidad,
      existenciaResultante: EXISTENCIA_RESULTANTE,
      motivo: movimientosStock.motivo,
      creadoEn: movimientosStock.creadoEn,
      usuarioId: user.id,
      usuarioNombre: user.name,
      ventaId: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numeroVenta: ventas.numero,
    })
    .from(movimientosStock)
    .innerJoin(productos, eq(productos.id, movimientosStock.productoId))
    .innerJoin(user, eq(user.id, movimientosStock.usuarioId))
    .leftJoin(ventas, eq(ventas.id, movimientosStock.ventaId))
    .where(eq(movimientosStock.id, id));

  return movimiento ?? null;
}
