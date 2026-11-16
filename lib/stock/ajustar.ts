import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { movimientosStock, productos } from "@/lib/db/schema";
import type { AjusteManual } from "./esquemas";

export type ResultadoAjuste =
  | { ajustado: true; movimientoId: number; stock: number }
  | {
      ajustado: false;
      errores: Partial<Record<keyof AjusteManual, string[]>>;
    };

function sinStock(stock: number): ResultadoAjuste {
  return {
    ajustado: false,
    errores: {
      cantidad: [`No se puede sacar más que el stock actual (${stock}).`],
    },
  };
}

// RF-P4, RF-P5 y regla 2: ingreso o egreso manual; actualiza la existencia
// con condición (stock >= cantidad) y graba el movimiento en la misma transacción.
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

    const esSalida = entrada.tipo === "salida";

    if (esSalida && entrada.cantidad > producto.stock) {
      return sinStock(producto.stock);
    }

    const variacion = esSalida ? -entrada.cantidad : entrada.cantidad;

    const [actualizado] = await tx
      .update(productos)
      .set({ stock: sql`${productos.stock} + ${variacion}` })
      .where(
        and(
          eq(productos.id, producto.id),
          esSalida ? gte(productos.stock, entrada.cantidad) : undefined,
        ),
      )
      .returning({ stock: productos.stock });

    if (!actualizado) {
      return sinStock(producto.stock);
    }

    const [movimiento] = await tx
      .insert(movimientosStock)
      .values({
        productoId: producto.id,
        tipo: entrada.tipo,
        origen: "manual",
        cantidad: entrada.cantidad,
        motivo: entrada.motivo,
        usuarioId,
      })
      .returning({ id: movimientosStock.id });

    return {
      ajustado: true,
      movimientoId: movimiento.id,
      stock: actualizado.stock,
    };
  });
}
