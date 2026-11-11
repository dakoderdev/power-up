import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { movimientosCuenta } from "@/lib/db/schema";
import {
  idPositivo,
  importePositivo,
  textoOpcional,
} from "@/lib/esquemas-comunes";
import { aCentavos } from "@/lib/moneda";

const base = createInsertSchema(movimientosCuenta, {
  importe: () => importePositivo,
});

export const esquemaPago = base
  .pick({ clienteId: true, importe: true, observacion: true })
  .extend({
    clienteId: idPositivo,
    observacion: textoOpcional,
  });

export function crearEsquemaPago({ saldo }: { saldo: string }) {
  const saldoCentavos = aCentavos(saldo);

  return esquemaPago.superRefine((pago, contexto) => {
    if (saldoCentavos <= 0) {
      contexto.addIssue({
        code: "custom",
        message: "El cliente no tiene saldo adeudado.",
        path: ["importe"],
      });
      return;
    }

    if (aCentavos(pago.importe) > saldoCentavos) {
      contexto.addIssue({
        code: "custom",
        message: "El pago no puede superar el saldo adeudado.",
        path: ["importe"],
      });
    }
  });
}

export const esquemaMovimientoCuenta = base
  .omit({ id: true, fecha: true })
  .refine(
    (movimiento) =>
      (movimiento.tipo !== "pago") === (movimiento.ventaId != null),
    {
      message:
        "Solo los movimientos por venta o anulación llevan venta asociada.",
      path: ["ventaId"],
    },
  );

export type PagoEntrada = z.infer<typeof esquemaPago>;
export type MovimientoCuenta = z.infer<typeof esquemaMovimientoCuenta>;
