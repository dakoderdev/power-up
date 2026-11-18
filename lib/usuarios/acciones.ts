"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/acciones";
import { ApiError, noEncontrado } from "@/lib/api/errores";
import { validarEntrada } from "@/lib/servicio";
import {
  esquemaCambioContrasena,
  esquemaUsuarioEdicion,
  esquemaUsuarioNuevo,
} from "./esquemas";
import {
  crearUsuario,
  editarUsuario,
  exigirUsuarioCreado,
  exigirUsuarioGuardado,
  restablecerContrasena,
} from "./guardar";
import {
  cambiarContrasena,
  obtenerUsuarioActual,
  requerirAdministrador,
} from "./sesion";

const MENSAJE_ACTUAL = "La contraseña actual no coincide.";

function idUsuario(id: unknown) {
  if (typeof id !== "string" || id === "") {
    throw noEncontrado("El usuario");
  }

  return id;
}

export async function crearUsuarioAccion(datos: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await requerirAdministrador();
    const entrada = validarEntrada(esquemaUsuarioNuevo, datos);
    const id = exigirUsuarioCreado(await crearUsuario({ usuario, entrada }));
    revalidatePath("/usuarios");

    return { id };
  });
}

export async function editarUsuarioAccion({
  id,
  datos,
}: {
  id: unknown;
  datos: unknown;
}) {
  return ejecutarAccion(async () => {
    const usuario = await requerirAdministrador();
    const usuarioId = idUsuario(id);
    const entrada = validarEntrada(esquemaUsuarioEdicion, datos);
    exigirUsuarioGuardado(
      await editarUsuario({ id: usuarioId, entrada, usuario }),
    );
    revalidatePath("/usuarios");

    return { id: usuarioId };
  });
}

// RF-U5 y US-31: el administrador restablece la contraseña de otro usuario con una temporal.
export async function restablecerContrasenaAccion(id: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await requerirAdministrador();
    const resultado = await restablecerContrasena({
      usuario,
      id: idUsuario(id),
    });

    if (!resultado) {
      throw noEncontrado("El usuario");
    }

    return resultado;
  });
}

// RF-U5 y US-20: cada usuario cambia su propia contraseña; la actual la verifica Better Auth.
export async function cambiarContrasenaAccion(datos: unknown) {
  return ejecutarAccion(async () => {
    await obtenerUsuarioActual();
    const entrada = validarEntrada(esquemaCambioContrasena, datos);
    const resultado = await cambiarContrasena({
      entrada,
      headers: await headers(),
    });

    if (!resultado.cambiada) {
      throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", MENSAJE_ACTUAL, [
        { campo: "actual", mensaje: MENSAJE_ACTUAL },
      ]);
    }

    return { cambiada: true };
  });
}
