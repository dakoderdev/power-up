import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clientes } from "@/lib/db/schema";
import { importePositivo, textoOpcional } from "@/lib/esquemas-comunes";

const FORMATO_DOCUMENTO = /^[0-9]+$/;

const base = createInsertSchema(clientes, {
  nombre: (esquema) => esquema.trim().min(1, "El nombre es obligatorio."),
  documento: (esquema) =>
    esquema
      .trim()
      .min(1, "El documento es obligatorio.")
      .regex(FORMATO_DOCUMENTO, "El documento debe ser numérico."),
  telefono: () => textoOpcional,
  email: () => textoOpcional,
  limiteCredito: () => textoOpcional.pipe(importePositivo.nullish()),
});

export const esquemaClienteNuevo = base
  .omit({ id: true, creadoEn: true })
  .refine((cliente) => cliente.telefono != null || cliente.email != null, {
    message: "Ingresá al menos un dato de contacto (teléfono o correo).",
    path: ["telefono"],
  });

export const esquemaClienteEdicion = esquemaClienteNuevo;

export const esquemaClienteFila = createSelectSchema(clientes);

export type ClienteNuevo = z.infer<typeof esquemaClienteNuevo>;
export type ClienteFila = z.infer<typeof esquemaClienteFila>;
