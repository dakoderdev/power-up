import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { movimientosStock } from "@/lib/db/schema";
import { enteroPositivo, idPositivo } from "@/lib/esquemas-comunes";

export const MOTIVO_MINIMO = 3;
export const MOTIVO_MAXIMO = 200;

const base = createInsertSchema(movimientosStock, {
  cantidad: () => enteroPositivo,
});

export const esquemaAjusteManual = base
  .pick({ productoId: true, tipo: true, cantidad: true })
  .extend({
    productoId: idPositivo,
    motivo: z
      .string()
      .trim()
      .min(
        MOTIVO_MINIMO,
        `El motivo debe tener al menos ${MOTIVO_MINIMO} caracteres.`,
      )
      .max(
        MOTIVO_MAXIMO,
        `El motivo puede tener hasta ${MOTIVO_MAXIMO} caracteres.`,
      ),
  });

export const esquemaMovimientoRegistro = base
  .omit({ id: true, creadoEn: true })
  .refine(
    (movimiento) =>
      movimiento.origen !== "manual" ||
      (movimiento.motivo ?? "").trim().length > 0,
    {
      message: "El motivo es obligatorio en ajustes manuales.",
      path: ["motivo"],
    },
  )
  .refine(
    (movimiento) =>
      (movimiento.origen !== "manual") === (movimiento.ventaId != null),
    {
      message:
        "Solo los movimientos por venta o anulación llevan venta asociada.",
      path: ["ventaId"],
    },
  )
  .refine(
    (movimiento) =>
      movimiento.origen !== "venta" || movimiento.tipo === "salida",
    {
      message: "Los movimientos por venta son siempre salidas.",
      path: ["tipo"],
    },
  )
  .refine(
    (movimiento) =>
      movimiento.origen !== "anulacion" || movimiento.tipo === "entrada",
    {
      message: "Los movimientos por anulación son siempre entradas.",
      path: ["tipo"],
    },
  );

export type AjusteManual = z.infer<typeof esquemaAjusteManual>;
export type MovimientoRegistro = z.infer<typeof esquemaMovimientoRegistro>;
