"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/acciones";
import { validarEntrada } from "@/lib/servicio";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
import { anularVenta, exigirAnulada } from "./anular";
import { esquemaAnulacion } from "./esquemas";

export async function anularVentaAccion(datos: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await requerirAdministrador();
    const entrada = validarEntrada(esquemaAnulacion, datos);
    exigirAnulada(
      await anularVenta({
        ventaId: entrada.id,
        motivo: entrada.motivoAnulacion,
        usuario,
      }),
    );
    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath(`/ventas/${entrada.id}`);
    revalidatePath("/productos");

    return { id: entrada.id };
  });
}
