"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { idPositivo } from "@/lib/esquemas-comunes";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
import { esquemaProductoEdicion, esquemaProductoNuevo } from "./esquemas";
import {
  crearProducto,
  editarProducto,
  type ResultadoGuardar,
} from "./guardar";

function revalidarProductos(id: number) {
  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  revalidatePath("/");
}

export async function crearProductoAccion(
  datos: unknown,
): Promise<ResultadoGuardar> {
  const usuario = await requerirAdministrador();
  const validacion = esquemaProductoNuevo.safeParse(datos);

  if (!validacion.success) {
    return {
      guardado: false,
      errores: z.flattenError(validacion.error).fieldErrors,
    };
  }

  const resultado = await crearProducto({
    entrada: validacion.data,
    usuarioId: usuario.id,
  });

  if (resultado.guardado) {
    revalidarProductos(resultado.productoId);
  }

  return resultado;
}

export async function editarProductoAccion({
  id,
  datos,
}: {
  id: unknown;
  datos: unknown;
}): Promise<ResultadoGuardar> {
  await requerirAdministrador();
  const idValido = idPositivo.safeParse(id);

  if (!idValido.success) {
    return {
      guardado: false,
      errores: {},
      mensaje: "El producto no existe. Volvé al listado y elegí otro.",
    };
  }

  const validacion = esquemaProductoEdicion.safeParse(datos);

  if (!validacion.success) {
    return {
      guardado: false,
      errores: z.flattenError(validacion.error).fieldErrors,
    };
  }

  const resultado = await editarProducto({
    id: idValido.data,
    entrada: validacion.data,
  });

  if (resultado.guardado) {
    revalidarProductos(resultado.productoId);
  }

  return resultado;
}
