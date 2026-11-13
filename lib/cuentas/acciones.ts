"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { esquemaPago } from "./esquemas";
import { registrarPago, type ResultadoPago } from "./pagar";

export async function registrarPagoAccion(
  datos: unknown,
): Promise<ResultadoPago> {
  const usuario = await obtenerUsuarioActual();
  const validacion = esquemaPago.safeParse(datos);

  if (!validacion.success) {
    return {
      registrado: false,
      errores: z.flattenError(validacion.error).fieldErrors,
    };
  }

  const resultado = await registrarPago({
    entrada: validacion.data,
    usuarioId: usuario.id,
  });

  if (resultado.registrado) {
    revalidatePath("/");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${validacion.data.clienteId}`);
  }

  return resultado;
}
