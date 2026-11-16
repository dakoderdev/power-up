import { eq, max, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ventas } from "@/lib/db/schema";
import { formatearComprobante, PUNTO_VENTA } from "./comprobante";

// Regla 4 y VE-47: correlativo por punto de venta, último más uno, dentro de la transacción de la venta.
export function siguienteNumero(puntoVenta: number) {
  return sql<number>`(select coalesce(max(${ventas.numero}), 0) + 1 from ${ventas} where ${ventas.puntoVenta} = ${puntoVenta})`;
}

// RF-V1: próximo número, solo informativo; el real se asigna al confirmar.
export async function obtenerProximoNumero() {
  const [{ ultimo }] = await db
    .select({ ultimo: max(ventas.numero) })
    .from(ventas)
    .where(eq(ventas.puntoVenta, PUNTO_VENTA));

  return formatearComprobante({
    puntoVenta: PUNTO_VENTA,
    numero: (ultimo ?? 0) + 1,
  });
}
