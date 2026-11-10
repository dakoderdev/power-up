import { asc, count, desc, eq, inArray, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { itemsVenta, productos, ventas } from "@/lib/db/schema";
import { claveDia, ZONA } from "@/lib/fechas";
import { ubicarPagina } from "@/lib/paginacion";

const VENTAS_POR_PAGINA = 30;

const DIA = sql<string>`to_char((${ventas.creadoEn} at time zone 'UTC') at time zone ${sql.raw(`'${ZONA}'`)}, 'YYYY-MM-DD')`;

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
    .select({ dia: DIA, cantidad: count(), total: sum(ventas.total) })
    .from(ventas)
    .where(inArray(DIA, dias))
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
      numero: ventas.numero,
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
