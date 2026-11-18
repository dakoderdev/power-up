"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/acciones";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { crearCategoria, editarCategoria } from "./servicio";

function revalidarCategorias() {
  revalidatePath("/productos");
  revalidatePath("/productos/categorias");
}

export async function crearCategoriaAccion(datos: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await obtenerUsuarioActual();
    const categoria = await crearCategoria({ usuario, datos });
    revalidarCategorias();

    return categoria;
  });
}

export async function editarCategoriaAccion({
  id,
  datos,
}: {
  id: number;
  datos: unknown;
}) {
  return ejecutarAccion(async () => {
    const usuario = await obtenerUsuarioActual();
    const categoria = await editarCategoria({ usuario, id, datos });
    revalidarCategorias();

    return categoria;
  });
}
