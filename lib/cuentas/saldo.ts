import { eq, sql } from "drizzle-orm";
import type { Consulta } from "@/lib/db";
import { movimientosCuenta } from "@/lib/db/schema";

export const SALDO =
  sql<string>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'venta' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`.mapWith(
    movimientosCuenta.importe,
  );

export async function obtenerSaldo({
  consulta,
  clienteId,
}: {
  consulta: Consulta;
  clienteId: number;
}) {
  const [{ saldo }] = await consulta
    .select({ saldo: SALDO })
    .from(movimientosCuenta)
    .where(eq(movimientosCuenta.clienteId, clienteId));

  return saldo;
}
