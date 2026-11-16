import { noEncontrado } from "@/lib/api/errores";
import { formatearUsuarioApi } from "@/lib/api/formato";
import { responder, ruta } from "@/lib/api/ruta";
import { consultarUsuario } from "@/lib/usuarios/detalle";

// RF-U2: el usuario conectado.
export const GET = ruta({}, async ({ usuario }) => {
  const actual = await consultarUsuario(usuario.id);

  if (!actual) {
    throw noEncontrado("El usuario");
  }

  return responder(formatearUsuarioApi(actual));
});
