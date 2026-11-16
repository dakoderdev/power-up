import { APIError } from "better-auth/api";
import { ApiError, noEncontrado } from "@/lib/api/errores";
import { esquemaLoginApi } from "@/lib/api/esquemas";
import { formatearUsuarioApi } from "@/lib/api/formato";
import { leerJson, rutaPublica, validar } from "@/lib/api/ruta";
import { auth } from "@/lib/auth";
import { consultarUsuario } from "@/lib/usuarios/detalle";

const MENSAJE_INVALIDO = "Correo o contraseña incorrectos.";

// RF-U1: inicio de sesión; mismo mensaje si el correo no existe, la
// contraseña no coincide o el usuario está inactivo.
export const POST = rutaPublica(async ({ solicitud }) => {
  const { email, password } = validar(
    esquemaLoginApi,
    await leerJson(solicitud),
  );

  try {
    const { headers, response } = await auth.api.signInEmail({
      body: { email, password },
      headers: solicitud.headers,
      returnHeaders: true,
    });
    const usuario = await consultarUsuario(response.user.id);

    if (!usuario) {
      throw noEncontrado("El usuario");
    }

    return Response.json(formatearUsuarioApi(usuario), { headers });
  } catch (error) {
    if (error instanceof APIError) {
      throw new ApiError(401, "CREDENCIALES_INVALIDAS", MENSAJE_INVALIDO);
    }

    throw error;
  }
});
