"use server";

import { revalidatePath } from "next/cache";
import { obtenerUsuarioActual } from "@/lib/usuarios/sesion";
import { confirmarVenta } from "./confirmar";
import { esquemaVentaEntrada } from "./esquemas";

export async function confirmarVentaAccion(datos: unknown) {
  const usuario = await obtenerUsuarioActual();

  const res = esquemaVentaEntrada.safeParse(datos);

  if (!res.success) {
    return {
      confirmada: false as const,
      errores: res.error.issues.map((i) => ({ mensaje: i.message })),
    };
  }

  const venta = await confirmarVenta({ entrada: res.data, usuarioId: usuario.id });

  if (venta.confirmada) {
    revalidatePath("/ventas");
  }

  return venta;
}