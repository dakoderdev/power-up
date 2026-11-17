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

const datos = base.omit({ id: true, creadoEn: true, activo: true });

const CONTACTO_REQUERIDO = {
  message: "Ingresá al menos un dato de contacto (teléfono o correo).",
  path: ["telefono"],
};

function tieneContacto(cliente: {
  telefono?: string | null;
  email?: string | null;
}) {
  return cliente.telefono != null || cliente.email != null;
}

export const esquemaClienteNuevo = datos.refine(
  tieneContacto,
  CONTACTO_REQUERIDO,
);

export const esquemaClienteEdicion = datos
  .extend({ activo: z.boolean() })
  .refine(tieneContacto, CONTACTO_REQUERIDO);

export const esquemaClienteFila = createSelectSchema(clientes);

export type ClienteNuevo = z.infer<typeof esquemaClienteNuevo>;
export type ClienteEdicion = z.infer<typeof esquemaClienteEdicion>;
export type ClienteFila = z.infer<typeof esquemaClienteFila>;
