import { z } from "zod";
import { ROLES } from "@/lib/db/schema";

const nombre = z
  .string()
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(120, "Hasta 120 caracteres.");

const correo = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Ingresá un correo válido."));

const rol = z.enum(ROLES, "Elegí un rol.");

export const CONTRASENA_MINIMA = 8;

// US-21: la contraseña tiene al menos 8 caracteres.
const contrasena = z
  .string()
  .min(
    CONTRASENA_MINIMA,
    `La contraseña tiene al menos ${CONTRASENA_MINIMA} caracteres.`,
  );

export const esquemaUsuarioNuevo = z.object({
  nombre,
  correo,
  rol,
  contrasena,
});

// RF-U5 y US-20: cada usuario cambia su propia contraseña.
export const esquemaCambioContrasena = z.object({
  actual: z.string().min(1, "Ingresá tu contraseña actual."),
  nueva: contrasena,
});

export const esquemaUsuarioEdicion = z.object({
  nombre,
  correo,
  rol,
  activo: z.boolean(),
});

export type UsuarioNuevo = z.infer<typeof esquemaUsuarioNuevo>;
export type UsuarioEdicion = z.infer<typeof esquemaUsuarioEdicion>;
export type CambioContrasena = z.infer<typeof esquemaCambioContrasena>;
