import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clientes, TIPOS_DOCUMENTO } from "@/lib/db/schema";
import { importePositivo, textoOpcional } from "@/lib/esquemas-comunes";

const FORMATO_DOCUMENTO = /^[0-9]+$/;
const SEPARADORES_DOCUMENTO = /[.\-\s]/g;

// RF-C2: DNI de 7 u 8 dígitos y CUIT de 11; puntos, guiones y espacios se ignoran.
export const LARGOS_DOCUMENTO = { DNI: [7, 8], CUIT: [11, 11] } as const;

const base = createInsertSchema(clientes, {
  nombre: (esquema) => esquema.trim().min(1, "El nombre es obligatorio."),
  documento: (esquema) =>
    esquema
      .trim()
      .transform((valor) => valor.replace(SEPARADORES_DOCUMENTO, ""))
      .pipe(
        z
          .string()
          .min(1, "El documento es obligatorio.")
          .regex(FORMATO_DOCUMENTO, "El documento debe ser numérico."),
      ),
  tipoDoc: () => z.enum(TIPOS_DOCUMENTO, "Elegí DNI o CUIT."),
  domicilio: () => textoOpcional,
  cuentaCorriente: () => z.boolean(),
  telefono: () => textoOpcional,
  email: () => textoOpcional,
  limiteCredito: () => textoOpcional.pipe(importePositivo.nullish()),
});

const datos = base.omit({ id: true, creadoEn: true, activo: true });

const CONTACTO_REQUERIDO = {
  message: "Ingresá al menos un dato de contacto (teléfono o correo).",
  path: ["telefono"],
};

type DatosValidables = {
  tipoDoc: (typeof TIPOS_DOCUMENTO)[number];
  documento: string;
  cuentaCorriente: boolean;
  limiteCredito?: string | null;
  telefono?: string | null;
  email?: string | null;
};

function validarCliente(cliente: DatosValidables, contexto: z.RefinementCtx) {
  const [minimo, maximo] = LARGOS_DOCUMENTO[cliente.tipoDoc];
  const largo = cliente.documento.length;

  if (largo > 0 && (largo < minimo || largo > maximo)) {
    contexto.addIssue({
      code: "custom",
      path: ["documento"],
      message:
        cliente.tipoDoc === "CUIT"
          ? "El CUIT tiene 11 dígitos."
          : "El DNI tiene 7 u 8 dígitos.",
    });
  }

  if (!tieneContacto(cliente)) {
    contexto.addIssue({ code: "custom", ...CONTACTO_REQUERIDO });
  }

  if (!cliente.cuentaCorriente && cliente.limiteCredito != null) {
    contexto.addIssue({
      code: "custom",
      path: ["limiteCredito"],
      message: "El límite de crédito solo aplica con cuenta corriente.",
    });
  }
}

function tieneContacto(cliente: {
  telefono?: string | null;
  email?: string | null;
}) {
  return cliente.telefono != null || cliente.email != null;
}

export const esquemaClienteNuevo = datos.superRefine(validarCliente);

export const esquemaClienteEdicion = datos
  .extend({ activo: z.boolean() })
  .superRefine(validarCliente);

export const esquemaClienteFila = createSelectSchema(clientes);

export type ClienteNuevo = z.infer<typeof esquemaClienteNuevo>;
export type ClienteEdicion = z.infer<typeof esquemaClienteEdicion>;
export type ClienteFila = z.infer<typeof esquemaClienteFila>;
