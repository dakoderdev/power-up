import { z } from "zod";
import { ApiError, detallesDeZod } from "@/lib/api/errores";

export type UsuarioServicio = {
  id: string;
  nombre: string;
  esAdministrador: boolean;
};

// Sección 10.2 y 10.5: cada servicio verifica el rol; el vendedor recibe 403 aunque llame a la API directo.
export function exigirAdministrador(usuario: UsuarioServicio) {
  if (!usuario.esAdministrador) {
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Esta operación es solo para administradores.",
    );
  }
}

// Sección 10.2 y 10.4: el servicio valida con el esquema compartido; 422 con detalle por campo.
export function validarEntrada<S extends z.ZodType>(
  esquema: S,
  datos: unknown,
): z.output<S> {
  const resultado = esquema.safeParse(datos);

  if (!resultado.success) {
    throw new ApiError(
      422,
      "VALIDACION",
      "Hay campos con errores.",
      detallesDeZod(resultado.error),
    );
  }

  return resultado.data;
}
