import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { movimientosStock, productos } from "@/lib/db/schema";
import type { AjusteManual } from "./esquemas";

export type ResultadoAjuste =
  | { ajustado: true }
  | {
      ajustado: false;
      errores: Partial<Record<keyof AjusteManual, string[]>>;
    };

export async function ajustarStock({
  entrada,
  usuarioId,
}: {
  entrada: AjusteManual;
  usuarioId: string;
}): Promise<ResultadoAjuste> {
  return db.transaction(async (tx) => {
    const [producto] = await tx
      .select({ id: productos.id, stock: productos.stock })
      .from(productos)
      .where(eq(productos.id, entrada.productoId));

    if (!producto) {
      return {
        ajustado: false,
        errores: { cantidad: ["El producto no existe."] },
      };
    }

    if (entrada.tipo === "salida" && entrada.cantidad > producto.stock) {
      return {
        ajustado: false,
        errores: {
          cantidad: [
            `No se puede sacar más que el stock actual (${producto.stock}).`,
          ],
        },
      };
    }

    const variacion =
      entrada.tipo === "entrada" ? entrada.cantidad : -entrada.cantidad;

    await tx
      .update(productos)
      .set({ stock: sql`${productos.stock} + ${variacion}` })
      .where(eq(productos.id, producto.id));

    await tx.insert(movimientosStock).values({
      productoId: producto.id,
      tipo: entrada.tipo,
      origen: "manual",
      cantidad: entrada.cantidad,
      motivo: entrada.motivo,
      usuarioId,
    });

    return { ajustado: true };
  });
}
