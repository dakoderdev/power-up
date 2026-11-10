import { z } from "zod";
import { aCentavos } from "@/lib/moneda";

const FORMATO_IMPORTE = /^\d{1,10}(\.\d{1,2})?$/;

function normalizarImporte(texto: string) {
  return texto.includes(",")
    ? texto.replaceAll(".", "").replace(",", ".")
    : texto;
}

export const importePositivo = z
  .string()
  .trim()
  .transform(normalizarImporte)
  .pipe(
    z
      .string()
      .regex(
        FORMATO_IMPORTE,
        "Importe inválido: hasta 10 enteros y 2 decimales, por ejemplo 45999,90.",
      )
      .refine(
        (valor) => aCentavos(valor) > 0,
        "El importe debe ser mayor que cero.",
      ),
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
