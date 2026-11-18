import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { categorias } from "@/lib/db/schema";

export const NOMBRE_CATEGORIA_MAXIMO = 60;

const nombre = z
  .string("El nombre es obligatorio.")
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(
    NOMBRE_CATEGORIA_MAXIMO,
    `El nombre admite hasta ${NOMBRE_CATEGORIA_MAXIMO} caracteres.`,
  );

const base = createInsertSchema(categorias, { nombre: () => nombre });

export const esquemaCategoriaNueva = z.strictObject(
  base.pick({ nombre: true }).shape,
);

export const esquemaCategoriaEdicion = z
  .strictObject({
    nombre: nombre.optional(),
    activa: z.boolean("Activa es verdadero o falso.").optional(),
  })
  .refine(
    (cambios) => cambios.nombre !== undefined || cambios.activa !== undefined,
    "Indicá el nombre o el estado.",
  );

export type CategoriaNueva = z.infer<typeof esquemaCategoriaNueva>;
export type CategoriaEdicion = z.infer<typeof esquemaCategoriaEdicion>;
