import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { itemsVenta, user, ventas } from "@/lib/db/schema";

export async function obtenerVenta(id: number) {
  const [venta] = await db
    .select({
      id: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numero: ventas.numero,
      creadoEn: ventas.creadoEn,
      clienteNombre: ventas.clienteNombre,
      clienteDocumento: ventas.clienteDocumento,
      formaPago: ventas.formaPago,
      total: ventas.total,
      anuladaEn: ventas.anuladaEn,
      anuladaPor: user.name,
      motivoAnulacion: ventas.motivoAnulacion,
    })
    .from(ventas)
    .leftJoin(user, eq(user.id, ventas.anuladaPor))
    .where(eq(ventas.id, id));

  if (!venta) {
    return null;
  }

  const items = await db
    .select({
      id: itemsVenta.id,
      codigo: itemsVenta.codigo,
      descripcion: itemsVenta.descripcion,
      cantidad: itemsVenta.cantidad,
      precioUnitario: itemsVenta.precioUnitario,
      subtotal: itemsVenta.subtotal,
    })
    .from(itemsVenta)
    .where(eq(itemsVenta.ventaId, id))
    .orderBy(asc(itemsVenta.id));

  return { ...venta, items };
}

export type VentaDetalle = NonNullable<
  Awaited<ReturnType<typeof obtenerVenta>>
>;
