"use server";

import { z } from "zod";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { crearCliente } from "./crear";
import { esquemaClienteNuevo } from "./esquemas";
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

  return crearCliente(validacion.data);
}
