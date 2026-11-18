"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/acciones";
import { validarEntrada } from "@/lib/servicio";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { esquemaPago } from "./esquemas";
import { exigirPagoRegistrado, registrarPago } from "./pagar";

export async function registrarPagoAccion(datos: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await obtenerUsuarioActual();
    const entrada = validarEntrada(esquemaPago, datos);
    const pago = exigirPagoRegistrado(
      await registrarPago({ entrada, usuarioId: usuario.id }),
    );
    revalidatePath("/");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${entrada.clienteId}`);

    return pago;
  });
}
