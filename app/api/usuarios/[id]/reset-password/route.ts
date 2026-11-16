import { noEncontrado } from "@/lib/api/errores";
import { responder, ruta } from "@/lib/api/ruta";
import { restablecerContrasena } from "@/lib/usuarios/guardar";

type Params = { id: string };

// RF-U5: el administrador restablece una contraseña; la temporal se muestra una sola vez.
export const POST = ruta<Params>({ admin: true }, async ({ params }) => {
  const resultado = await restablecerContrasena(params.id);

  if (!resultado) {
    throw noEncontrado("El usuario");
  }

  return responder(resultado);
});
