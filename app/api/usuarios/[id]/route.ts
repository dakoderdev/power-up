import { revalidatePath } from "next/cache";
import { noEncontrado } from "@/lib/api/errores";
import { esquemaUsuarioPatchApi, fusionarUsuario } from "@/lib/api/esquemas";
import { formatearUsuarioApi } from "@/lib/api/formato";
import { exigir, leerJson, responder, ruta, validar } from "@/lib/api/ruta";
import { consultarUsuario } from "@/lib/usuarios/detalle";
import { editarUsuario, exigirUsuarioGuardado } from "@/lib/usuarios/guardar";

type Params = { id: string };

// RF-U4: edición parcial de nombre, email, rol o estado (admin).
export const PATCH = ruta<Params>(
  { admin: true },
  async ({ solicitud, usuario, params }) => {
    const actual = await consultarUsuario(params.id);

    if (!actual) {
      throw noEncontrado("El usuario");
    }

    const cambios = validar(esquemaUsuarioPatchApi, await leerJson(solicitud));
    const entrada = exigir(fusionarUsuario({ actual, cambios }));
    exigirUsuarioGuardado(
      await editarUsuario({ id: params.id, entrada, usuario }),
    );

    const editado = await consultarUsuario(params.id);

    if (!editado) {
      throw noEncontrado("El usuario");
    }

    revalidatePath("/usuarios");

    return responder(formatearUsuarioApi(editado));
  },
);
