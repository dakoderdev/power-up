"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/acciones";
import { idPositivo } from "@/lib/esquemas-comunes";
import { validarEntrada } from "@/lib/servicio";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
import { esquemaProductoEdicion, esquemaProductoNuevo } from "./esquemas";
import {
  crearProducto,
  editarProducto,
  exigirProductoGuardado,
} from "./guardar";

function revalidarProductos(id: number) {
  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  revalidatePath("/");
}

export async function crearProductoAccion(datos: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await requerirAdministrador();
    const entrada = validarEntrada(esquemaProductoNuevo, datos);
    const productoId = exigirProductoGuardado(
      await crearProducto({ entrada, usuario }),
    );
    revalidarProductos(productoId);

    return { productoId };
  });
}

export async function editarProductoAccion({
  id,
  datos,
}: {
  id: unknown;
  datos: unknown;
}) {
  return ejecutarAccion(async () => {
    const usuario = await requerirAdministrador();
    const productoId = validarEntrada(idPositivo, id);
    const entrada = validarEntrada(esquemaProductoEdicion, datos);
    exigirProductoGuardado(
      await editarProducto({ id: productoId, entrada, usuario }),
    );
    revalidarProductos(productoId);

    return { productoId };
  });
}
