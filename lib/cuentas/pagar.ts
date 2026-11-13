import { z } from "zod";
import { db } from "@/lib/db";
import { clientes, movimientosCuenta } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { crearEsquemaPago, type PagoEntrada } from "./esquemas";
import { obtenerSaldo } from "./saldo";

export type ResultadoPago =
  | { registrado: true }
  | {
      registrado: false;
      errores: Partial<Record<keyof PagoEntrada, string[]>>;
    };

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

    await tx.insert(movimientosCuenta).values({
      clienteId: cliente.id,
      tipo: "pago",
      importe: validacion.data.importe,
      observacion: validacion.data.observacion ?? null,
      usuarioId,
    });

    return { registrado: true };
  });
}
