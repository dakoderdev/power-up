import { sql } from "drizzle-orm";
import { ventas } from "@/lib/db/schema";

export function siguienteNumero(puntoVenta: number) {
  return sql<number>`(select coalesce(max(${ventas.numero}), 0) + 1 from ${ventas} where ${ventas.puntoVenta} = ${puntoVenta})`;
}
