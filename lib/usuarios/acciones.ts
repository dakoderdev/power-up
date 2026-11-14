"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { esquemaUsuarioEdicion, esquemaUsuarioNuevo } from "./esquemas";
import {
  crearUsuario,
  editarUsuario,
  type ResultadoCrear,
  type ResultadoEditar,
} from "./guardar";
import { requerirAdministrador } from "./sesion";

export async function crearUsuarioAccion(
  datos: unknown,
): Promise<ResultadoCrear> {
  await requerirAdministrador();

  const validacion = esquemaUsuarioNuevo.safeParse(datos);

  if (!validacion.success) {
    return {
      creado: false,
      errores: z.flattenError(validacion.error).fieldErrors,
    };
  }

  const resultado = await crearUsuario(validacion.data);

  if (resultado.creado) {
    revalidatePath("/usuarios");
  }

  return resultado;
}

export async function editarUsuarioAccion({
  id,
  datos,
}: {
  id: unknown;
  datos: unknown;
}): Promise<ResultadoEditar> {
  const actual = await requerirAdministrador();

  if (typeof id !== "string" || id === "") {
    return {
      guardado: false,
      errores: {},
      mensaje: "El usuario no existe. Volvé al listado y elegí otro.",
    };
  }

  const validacion = esquemaUsuarioEdicion.safeParse(datos);

  if (!validacion.success) {
    return {
      guardado: false,
      errores: z.flattenError(validacion.error).fieldErrors,
    };
  }

  const resultado = await editarUsuario({
    id,
    entrada: validacion.data,
    actualId: actual.id,
  });

  if (resultado.guardado) {
    revalidatePath("/usuarios");
  }

  return resultado;
}
