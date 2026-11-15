import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coincideBusqueda } from "@/lib/db/busqueda";
import {
  movimientosStock,
  ORIGENES_STOCK,
  productos,
  user,
  ventas,
} from "@/lib/db/schema";
import { ubicarPagina } from "@/lib/paginacion";

const MOVIMIENTOS_POR_PAGINA = 30;
const PRODUCTOS_POR_PAGINA = 36;

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

export async function obtenerProductoStock(id: number) {
  const [producto] = await db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      nombre: productos.nombre,
      stock: productos.stock,
      activo: productos.activo,
      imagenUrl: productos.imagenUrl,
    })
    .from(productos)
    .where(eq(productos.id, id));

  return producto;
}

export async function listarMovimientos({
  productoId,
  paginaPedida,
  origen,
}: {
  productoId: number;
  paginaPedida: number;
  origen?: OrigenStock;
}) {
  const filtro = and(
    eq(movimientosStock.productoId, productoId),
    origen ? eq(movimientosStock.origen, origen) : undefined,
  );

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
      usuarioNombre: user.name,
      ventaId: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numeroVenta: ventas.numero,
    })
    .from(movimientosStock)
    .innerJoin(user, eq(user.id, movimientosStock.usuarioId))
    .leftJoin(ventas, eq(ventas.id, movimientosStock.ventaId))
    .where(filtro)
    .orderBy(desc(movimientosStock.creadoEn), desc(movimientosStock.id))
    .limit(MOVIMIENTOS_POR_PAGINA)
    .offset(desde);

  return { movimientos, pagina, paginas };
}
