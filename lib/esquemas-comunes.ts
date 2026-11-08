import { z } from "zod";

const FORMATO_IMPORTE = /^\d{1,10}(\.\d{1,2})?$/;

export function aCentavos(importe: string) {
  const [enteros, decimales = ""] = importe.split(".");
  return Number(enteros + decimales.padEnd(2, "0"));
}

export const importePositivo = z
  .string()
  .trim()
  .regex(
    FORMATO_IMPORTE,
    "Importe inválido: hasta 10 enteros y 2 decimales, con punto.",
  )
  .refine(
    (valor) => aCentavos(valor) > 0,
    "El importe debe ser mayor que cero.",
  );

export const enteroPositivo = z
  .number("Ingresá un número.")
  .int("Debe ser un número entero.")
  .positive("Debe ser mayor que cero.");

export const idPositivo = z.number().int().positive();

export const textoOpcional = z
  .string()
  .trim()
  .transform((valor) => (valor === "" ? null : valor))
  .nullish();
