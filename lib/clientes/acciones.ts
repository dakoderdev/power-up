"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { idPositivo } from "@/lib/esquemas-comunes";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { esquemaClienteEdicion, esquemaClienteNuevo } from "./esquemas";
import { crearCliente, editarCliente, type ResultadoEditar } from "./guardar";
import { buscarClientes } from "./listado";

export async function buscarClientesAccion(busqueda: unknown) {
  await obtenerUsuarioActual();

  return buscarClientes(
    limpiarBusqueda(typeof busqueda === "string" ? busqueda : ""),
  );
}

export async function crearClienteAccion(datos: unknown) {
  await obtenerUsuarioActual();

  const validacion = esquemaClienteNuevo.safeParse(datos);

  if (!validacion.success) {
    return {
      creado: false as const,
      errores: z.flattenError(validacion.error).fieldErrors,
    };
  }

  const resultado = await crearCliente(validacion.data);

  if (resultado.creado) {
    revalidatePath("/clientes");
  }

  return resultado;
}

export async function editarClienteAccion({
  id,
  datos,
}: {
  id: unknown;
  datos: unknown;
}): Promise<ResultadoEditar> {
  await obtenerUsuarioActual();
  const idValido = idPositivo.safeParse(id);

  if (!idValido.success) {
    return {
      guardado: false,
      errores: {},
      mensaje: "El cliente no existe. Volvé al listado y elegí otro.",
    };
  }

  const validacion = esquemaClienteEdicion.safeParse(datos);

  if (!validacion.success) {
    return {
      guardado: false,
      errores: z.flattenError(validacion.error).fieldErrors,
    };
  }

  const resultado = await editarCliente({
    id: idValido.data,
    entrada: validacion.data,
  });

  if (resultado.guardado) {
    revalidatePath("/");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${idValido.data}`);
  }

  return resultado;
}
