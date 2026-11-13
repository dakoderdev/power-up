import { asc, eq } from "drizzle-orm";
import { obtenerSaldo } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";
import { clientes, movimientosCuenta, ventas } from "@/lib/db/schema";
import { aCentavos, deCentavos } from "@/lib/moneda";

export async function obtenerCliente(id: number) {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));

  return cliente ?? null;
}

async function obtenerMovimientos(clienteId: number) {
  const filas = await db
    .select({
      id: movimientosCuenta.id,
      tipo: movimientosCuenta.tipo,
      importe: movimientosCuenta.importe,
      observacion: movimientosCuenta.observacion,
      fecha: movimientosCuenta.fecha,
      ventaId: movimientosCuenta.ventaId,
      puntoVenta: ventas.puntoVenta,
      numero: ventas.numero,
    })
    .from(movimientosCuenta)
    .leftJoin(ventas, eq(ventas.id, movimientosCuenta.ventaId))
    .where(eq(movimientosCuenta.clienteId, clienteId))
    .orderBy(asc(movimientosCuenta.fecha), asc(movimientosCuenta.id));

  return filas.reduce<{ centavos: number; lista: MovimientoConSaldo[] }>(
    (acumulado, fila) => {
      const signo = fila.tipo === "venta" ? 1 : -1;
      const centavos = acumulado.centavos + signo * aCentavos(fila.importe);

      return {
        centavos,
        lista: [...acumulado.lista, { ...fila, saldo: deCentavos(centavos) }],
      };
    },
    { centavos: 0, lista: [] },
  ).lista;
}

type MovimientoConSaldo = {
  id: number;
  tipo: "venta" | "pago" | "anulacion";
  importe: string;
  observacion: string | null;
  fecha: Date;
  ventaId: number | null;
  puntoVenta: number | null;
  numero: number | null;
  saldo: string;
};

export async function obtenerCuenta(clienteId: number) {
  const [saldo, movimientos] = await Promise.all([
    obtenerSaldo({ consulta: db, clienteId }),
    obtenerMovimientos(clienteId),
  ]);

  return { saldo, movimientos };
}

export type ClienteDetalle = NonNullable<
  Awaited<ReturnType<typeof obtenerCliente>>
>;
export type CuentaCliente = Awaited<ReturnType<typeof obtenerCuenta>>;
