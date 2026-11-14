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

export const esquemaUsuarioNuevo = z.object({
  nombre,
  correo,
  rol,
  contrasena: z.string().min(8, "La contraseña tiene al menos 8 caracteres."),
});

export const esquemaUsuarioEdicion = z.object({
  nombre,
  correo,
  rol,
  activo: z.boolean(),
});

export type UsuarioNuevo = z.infer<typeof esquemaUsuarioNuevo>;
export type UsuarioEdicion = z.infer<typeof esquemaUsuarioEdicion>;
