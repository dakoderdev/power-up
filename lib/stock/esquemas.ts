import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { movimientosStock } from "@/lib/db/schema";
import { enteroPositivo, idPositivo } from "@/lib/esquemas-comunes";

const base = createInsertSchema(movimientosStock, {
  cantidad: () => enteroPositivo,
});

export const esquemaAjusteManual = base
  .pick({ productoId: true, tipo: true, cantidad: true })
  .extend({
    productoId: idPositivo,
    motivo: z.string().trim().min(1, "El motivo es obligatorio."),
  });

export const esquemaMovimientoRegistro = base
  .omit({ id: true, creadoEn: true })
  .refine(
    (movimiento) =>
      movimiento.origen !== "manual" ||
      (movimiento.motivo ?? "").trim().length > 0,
    { message: "El motivo es obligatorio en ajustes manuales.", path: ["motivo"] },
  )
  .refine(
    (movimiento) => (movimiento.origen === "venta") === (movimiento.ventaId != null),
    {
      message: "Solo los movimientos por venta llevan venta asociada.",
      path: ["ventaId"],
    },
  )
  .refine(
    (movimiento) => movimiento.origen !== "venta" || movimiento.tipo === "salida",
    { message: "Los movimientos por venta son siempre salidas.", path: ["tipo"] },
  );

export type AjusteManual = z.infer<typeof esquemaAjusteManual>;
export type MovimientoRegistro = z.infer<typeof esquemaMovimientoRegistro>;