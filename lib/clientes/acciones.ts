"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/acciones";
import { idPositivo } from "@/lib/esquemas-comunes";
import { validarEntrada } from "@/lib/servicio";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { esquemaClienteEdicion, esquemaClienteNuevo } from "./esquemas";
import {
  crearCliente,
  editarCliente,
  exigirClienteCreado,
  exigirClienteGuardado,
} from "./guardar";

export async function crearClienteAccion(datos: unknown) {
  return ejecutarAccion(async () => {
    await obtenerUsuarioActual();
    const entrada = validarEntrada(esquemaClienteNuevo, datos);
    const cliente = exigirClienteCreado(await crearCliente(entrada));
    revalidatePath("/clientes");

    return cliente;
  });
}

export async function editarClienteAccion({
  id,
  datos,
}: {
  id: unknown;
  datos: unknown;
}) {
  return ejecutarAccion(async () => {
    await obtenerUsuarioActual();
    const clienteId = validarEntrada(idPositivo, id);
    const entrada = validarEntrada(esquemaClienteEdicion, datos);
    exigirClienteGuardado(await editarCliente({ id: clienteId, entrada }));
    revalidatePath("/");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${clienteId}`);

    return { id: clienteId };
  });
}
