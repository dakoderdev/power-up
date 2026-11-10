import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { productos } from "@/lib/db/schema";
import { importePositivo, textoOpcional } from "@/lib/esquemas-comunes";

export const CODIGO_MAXIMO = 30;
export const NOMBRE_MAXIMO = 120;
const IMAGEN_URL_MAXIMA = 2048;

const imagenUrl = textoOpcional.pipe(
  z
    .url({
      protocol: /^https$/,
      error: "La imagen debe ser una dirección https válida.",
    })
    .max(
      IMAGEN_URL_MAXIMA,
      `La dirección admite hasta ${IMAGEN_URL_MAXIMA} caracteres.`,
    )
    .nullish(),
);

const base = createInsertSchema(productos, {
  codigo: (esquema) =>
    esquema
      .trim()
      .min(1, "El código es obligatorio.")
      .max(
        CODIGO_MAXIMO,
        `El código admite hasta ${CODIGO_MAXIMO} caracteres.`,
      ),
  nombre: (esquema) =>
    esquema
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(
        NOMBRE_MAXIMO,
        `El nombre admite hasta ${NOMBRE_MAXIMO} caracteres.`,
      ),
  precio: () => importePositivo,
  imagenUrl: () => imagenUrl,
  stock: (esquema) =>
    esquema
      .int("El stock debe ser un número entero.")
      .min(0, "El stock no puede ser negativo."),
});

export const esquemaProductoNuevo = base.omit({ id: true, creadoEn: true });

export const esquemaProductoEdicion = esquemaProductoNuevo.omit({
  stock: true,
});

export const esquemaProductoFila = createSelectSchema(productos);

export type ProductoNuevo = z.infer<typeof esquemaProductoNuevo>;
export type ProductoEdicion = z.infer<typeof esquemaProductoEdicion>;
export type ProductoFila = z.infer<typeof esquemaProductoFila>;
