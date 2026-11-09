import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { itemsVenta, productos, ventas } from "@/lib/db/schema";

export async function listarVentas() {
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
    .orderBy(desc(ventas.creadoEn), desc(ventas.id));

  if (lista.length === 0) return [];

  const items = await db
    .select({
      ventaId: itemsVenta.ventaId,
      cantidad: itemsVenta.cantidad,
      descripcion: itemsVenta.descripcion,
      imagenUrl: productos.imagenUrl,
    })
    .from(itemsVenta)
    .innerJoin(productos, eq(productos.id, itemsVenta.productoId))
    .where(
      inArray(
        itemsVenta.ventaId,
        lista.map((v) => v.id),
      ),
    )
    .orderBy(asc(itemsVenta.id));

  return lista.map((v) => ({
    ...v,
    items: items.filter((i) => i.ventaId === v.id),
  }));
}