import { and, eq, gte, sql } from "drizzle-orm";
import type { Transaccion } from "@/lib/db";
import { movimientosStock, productos } from "@/lib/db/schema";

type Movimiento = {
  tx: Transaccion;
  productoId: number;
  tipo: "entrada" | "salida";
  origen: "manual" | "venta" | "anulacion";
  cantidad: number;
  motivo?: string | null;
  ventaId?: number | null;
  usuarioId: string;
};

export type StockMovido = { movimientoId: number; stock: number };

// Sección 10.2, regla 1 y regla 2: única función que cambia la existencia.
// Descuenta con condición (stock >= cantidad) y graba el movimiento en la misma transacción; null si no alcanza.
export async function moverStock({
  tx,
  productoId,
  tipo,
  origen,
  cantidad,
  motivo = null,
  ventaId = null,
  usuarioId,
}: Movimiento): Promise<StockMovido | null> {
  const esSalida = tipo === "salida";
  const variacion = esSalida ? -cantidad : cantidad;

  const [actualizado] = await tx
    .update(productos)
    .set({ stock: sql`${productos.stock} + ${variacion}` })
    .where(
      and(
        eq(productos.id, productoId),
        esSalida ? gte(productos.stock, cantidad) : undefined,
      ),
    )
    .returning({ stock: productos.stock });

  if (!actualizado) {
    return null;
  }

  const [movimiento] = await tx
    .insert(movimientosStock)
    .values({
      productoId,
      tipo,
      origen,
      cantidad,
      motivo,
      ventaId,
      usuarioId,
    })
    .returning({ id: movimientosStock.id });

  return { movimientoId: movimiento.id, stock: actualizado.stock };
}
