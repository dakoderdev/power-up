import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientes, movimientosCuenta, user } from "@/lib/db/schema";
import { crearEsquemaPago, type PagoEntrada } from "./esquemas";
import { siguienteRecibo } from "./recibo";
import { obtenerSaldo } from "./saldo";

export type ResultadoPago =
  | { registrado: true; pagoId: number; saldo: string }
  | {
      registrado: false;
      errores: Partial<Record<keyof PagoEntrada, string[]>>;
    };

// RF-C5 y regla 8: registra el pago y el crédito en una sola transacción;
// el importe no supera el saldo (PA-03, PA-07). Regla 4: asigna el número de recibo.
export async function registrarPago({
  entrada,
  usuarioId,
}: {
  entrada: PagoEntrada;
  usuarioId: string;
}): Promise<ResultadoPago> {
  return db.transaction(async (tx) => {
    const [cliente] = await tx
      .select({ id: clientes.id })
      .from(clientes)
      .where(eq(clientes.id, entrada.clienteId));

    if (!cliente) {
      return {
        registrado: false,
        errores: { importe: ["El cliente no existe."] },
      };
    }

    const saldo = await obtenerSaldo({ consulta: tx, clienteId: cliente.id });
    const validacion = crearEsquemaPago({ saldo }).safeParse(entrada);

    if (!validacion.success) {
      return {
        registrado: false,
        errores: z.flattenError(validacion.error).fieldErrors,
      };
    }

    const [pago] = await tx
      .insert(movimientosCuenta)
      .values({
        clienteId: cliente.id,
        tipo: "pago",
        importe: validacion.data.importe,
        observacion: validacion.data.observacion ?? null,
        reciboNumero: siguienteRecibo(),
        usuarioId,
      })
      .returning({ id: movimientosCuenta.id });

    const saldoNuevo = await obtenerSaldo({
      consulta: tx,
      clienteId: cliente.id,
    });

    return { registrado: true, pagoId: pago.id, saldo: saldoNuevo };
  });
}

// RF-C5: datos de un pago para reimprimir el recibo.
export async function obtenerPago(id: number) {
  const [pago] = await db
    .select({
      id: movimientosCuenta.id,
      reciboNumero: movimientosCuenta.reciboNumero,
      fecha: movimientosCuenta.fecha,
      importe: movimientosCuenta.importe,
      observacion: movimientosCuenta.observacion,
      clienteId: clientes.id,
      clienteNombre: clientes.nombre,
      usuarioId: user.id,
      usuarioNombre: user.name,
    })
    .from(movimientosCuenta)
    .innerJoin(clientes, eq(clientes.id, movimientosCuenta.clienteId))
    .innerJoin(user, eq(user.id, movimientosCuenta.usuarioId))
    .where(
      and(eq(movimientosCuenta.id, id), eq(movimientosCuenta.tipo, "pago")),
    );

  if (!pago) {
    return null;
  }

  const saldoCliente = await obtenerSaldo({
    consulta: db,
    clienteId: pago.clienteId,
  });

  return { ...pago, saldoCliente };
}

export type PagoDetalle = NonNullable<Awaited<ReturnType<typeof obtenerPago>>>;