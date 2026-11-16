import { ApiError } from "@/lib/api/errores";
import { esquemaContrasenaApi } from "@/lib/api/esquemas";
import { leerJson, responderVacio, ruta, validar } from "@/lib/api/ruta";
import { cambiarContrasena } from "@/lib/usuarios/sesion";

// RF-U5: cada usuario cambia su propia contraseña.
export const PUT = ruta({}, async ({ solicitud }) => {
  const entrada = validar(esquemaContrasenaApi, await leerJson(solicitud));
  const resultado = await cambiarContrasena({
    entrada,
    headers: solicitud.headers,
  });

  if (!resultado.cambiada) {
    throw new ApiError(
      422,
      "CONTRASENA_ACTUAL_INCORRECTA",
      "La contraseña actual no coincide.",
    );
  }

  return responderVacio();
});
