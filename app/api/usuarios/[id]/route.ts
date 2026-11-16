import { revalidatePath } from "next/cache";
import { ApiError, noEncontrado } from "@/lib/api/errores";
import { esquemaUsuarioPatchApi, fusionarUsuario } from "@/lib/api/esquemas";
import { formatearUsuarioApi } from "@/lib/api/formato";
import { exigir, leerJson, responder, ruta, validar } from "@/lib/api/ruta";
import { consultarUsuario } from "@/lib/usuarios/detalle";
import { editarUsuario, type CodigoErrorUsuario } from "@/lib/usuarios/guardar";

type Params = { id: string };

const ESTADO_POR_CODIGO: Record<CodigoErrorUsuario, number> = {
  EMAIL_DUPLICADO: 409,
  NO_ENCONTRADO: 404,
  OPERACION_SOBRE_SI_MISMO: 422,
  ULTIMO_ADMINISTRADOR: 422,
};

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
    const resultado = await editarUsuario({
      id: params.id,
      entrada,
      actualId: usuario.id,
    });

    if (!resultado.guardado) {
      const codigo = resultado.codigo ?? "NO_ENCONTRADO";

      throw new ApiError(
        ESTADO_POR_CODIGO[codigo],
        codigo,
        resultado.mensaje ?? "Ya hay un usuario con ese correo.",
      );
    }

    const editado = await consultarUsuario(params.id);

    if (!editado) {
      throw noEncontrado("El usuario");
    }

    revalidatePath("/usuarios");

    return responder(formatearUsuarioApi(editado));
  },
);
