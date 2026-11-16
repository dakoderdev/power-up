import { asc, desc, eq } from "drizzle-orm";
import { obtenerSaldo } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";
import { clientes, movimientosCuenta, ventas } from "@/lib/db/schema";
import { aCentavos, deCentavos } from "@/lib/moneda";

const ULTIMAS_VENTAS = 6;

export async function obtenerCliente(id: number) {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));

  return cliente ?? null;
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

// RF-C4 y CC-06: movimientos en orden cronológico con saldo acumulado; con
// desde, saldoAnterior trae lo acumulado hasta ese día.
export async function obtenerCuenta(
  clienteId: number,
  { desde, hasta }: { desde?: Date; hasta?: Date } = {},
) {
  const [saldo, todos] = await Promise.all([
    obtenerSaldo({ consulta: db, clienteId }),
    obtenerMovimientos(clienteId),
  ]);

  const previos = desde ? todos.filter((m) => m.fecha < desde) : [];
  const movimientos = todos.filter(
    (m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha < hasta),
  );

  return {
    saldo,
    saldoAnterior: previos.at(-1)?.saldo ?? deCentavos(0),
    movimientos,
  };
}

// RF-C3: últimas facturas del cliente para su ficha.
export async function obtenerUltimasVentas(clienteId: number) {
  return db
    .select({
      id: ventas.id,
      puntoVenta: ventas.puntoVenta,
      numero: ventas.numero,
      creadoEn: ventas.creadoEn,
      formaPago: ventas.formaPago,
      total: ventas.total,
      anuladaEn: ventas.anuladaEn,
    })
    .from(ventas)
    .where(eq(ventas.clienteId, clienteId))
    .orderBy(desc(ventas.creadoEn), desc(ventas.id))
    .limit(ULTIMAS_VENTAS);
}

export type ClienteDetalle = NonNullable<
  Awaited<ReturnType<typeof obtenerCliente>>
>;
export type CuentaCliente = Awaited<ReturnType<typeof obtenerCuenta>>;
