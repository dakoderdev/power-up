import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db";
import { itemsVenta, user, ventas } from "@/lib/db/schema";

const vendedor = alias(user, "vendedor");
const anulador = alias(user, "anulador");

// RF-V7 y VE-31: la factura completa, con vendedor, renglones y anulación si la hay.
export async function obtenerVenta(id: number) {
  const [venta] = await db
    .select({
      id: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numero: ventas.numero,
      creadoEn: ventas.creadoEn,
      clienteId: ventas.clienteId,
      clienteNombre: ventas.clienteNombre,
      clienteDocumento: ventas.clienteDocumento,
      formaPago: ventas.formaPago,
      total: ventas.total,
      vendedorId: ventas.usuarioId,
      vendedorNombre: vendedor.name,
      anuladaEn: ventas.anuladaEn,
      anuladaPorId: ventas.anuladaPor,
      anuladaPor: anulador.name,
      motivoAnulacion: ventas.motivoAnulacion,
    })
    .from(ventas)
    .innerJoin(vendedor, eq(vendedor.id, ventas.usuarioId))
    .leftJoin(anulador, eq(anulador.id, ventas.anuladaPor))
    .where(eq(ventas.id, id));

  if (!venta) {
    return null;
  }

  const items = await db
    .select({
      id: itemsVenta.id,
      productoId: itemsVenta.productoId,
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
