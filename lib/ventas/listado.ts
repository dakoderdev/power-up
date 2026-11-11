import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { itemsVenta, productos, ventas } from "@/lib/db/schema";
import { claveDia, DESFASE_HORAS } from "@/lib/fechas";
import { ubicarPagina } from "@/lib/paginacion";

const VENTAS_POR_PAGINA = 30;

const DIA = sql<string>`strftime('%Y-%m-%d', ${ventas.creadoEn} / 1000, 'unixepoch', ${sql.raw(`'${DESFASE_HORAS} hours'`)})`;

async function obtenerItems(ventaIds: number[]) {
  return db
    .select({
      ventaId: itemsVenta.ventaId,
      cantidad: itemsVenta.cantidad,
      descripcion: itemsVenta.descripcion,
      imagenUrl: productos.imagenUrl,
    })
    .from(itemsVenta)
    .innerJoin(productos, eq(productos.id, itemsVenta.productoId))
    .where(inArray(itemsVenta.ventaId, ventaIds))
    .orderBy(asc(itemsVenta.id));
}

async function obtenerTotalesPorDia(dias: string[]) {
  return db
    .select({
      dia: DIA,
      cantidad: count(),
      total: sum(ventas.total).mapWith(ventas.total),
    })
    .from(ventas)
    .where(and(inArray(DIA, dias), isNull(ventas.anuladaEn)))
    .groupBy(DIA);
}

export async function listarVentas(paginaPedida: number) {
  const [{ cantidad }] = await db.select({ cantidad: count() }).from(ventas);
  const { pagina, paginas, desde } = ubicarPagina({
    cantidad,
    porPagina: VENTAS_POR_PAGINA,
    pedida: paginaPedida,
  });

  const lista = await db
    .select({
      id: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numero: ventas.numero,
      anuladaEn: ventas.anuladaEn,
      creadoEn: ventas.creadoEn,
      clienteNombre: ventas.clienteNombre,
      formaPago: ventas.formaPago,
      total: ventas.total,
    })
    .from(ventas)
    .orderBy(desc(ventas.creadoEn), desc(ventas.id))
    .limit(VENTAS_POR_PAGINA)
    .offset(desde);

  if (lista.length === 0) {
    return { grupos: [], pagina, paginas };
  }

  const dias = [...new Set(lista.map((venta) => claveDia(venta.creadoEn)))];
  const [items, totales] = await Promise.all([
    obtenerItems(lista.map((venta) => venta.id)),
    obtenerTotalesPorDia(dias),
  ]);

  const grupos = dias.map((dia) => {
    const delDia = totales.find((fila) => fila.dia === dia);

    return {
      dia,
      cantidad: delDia?.cantidad ?? 0,
      total: delDia?.total ?? "0",
      ventas: lista
        .filter((venta) => claveDia(venta.creadoEn) === dia)
        .map((venta) => ({
          ...venta,
          items: items.filter((item) => item.ventaId === venta.id),
        })),
    };
  });

  return { grupos, pagina, paginas };
}
