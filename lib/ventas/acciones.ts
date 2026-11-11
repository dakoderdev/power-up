"use server";

import { revalidatePath } from "next/cache";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { buscarProductosActivos } from "@/lib/productos/listado";
import {
  obtenerUsuarioActual,
  requerirAdministrador,
} from "@/lib/usuarios/sesion";
import { anularVenta } from "./anular";
import { confirmarVenta } from "./confirmar";
import { esquemaAnulacion, esquemaVentaEntrada } from "./esquemas";

export async function confirmarVentaAccion(datos: unknown) {
  const usuario = await obtenerUsuarioActual();

  const res = esquemaVentaEntrada.safeParse(datos);

  if (!res.success) {
    return {
      confirmada: false as const,
      errores: res.error.issues.map((i) => ({ mensaje: i.message })),
    };
  }

  const venta = await confirmarVenta({
    entrada: res.data,
    usuarioId: usuario.id,
  });

  if (venta.confirmada) {
    revalidatePath("/ventas");
  }

  return venta;
}

export async function anularVentaAccion(datos: unknown) {
  const usuario = await requerirAdministrador();

  const validacion = esquemaAnulacion.safeParse(datos);

  if (!validacion.success) {
    return {
      anulada: false as const,
      mensaje: validacion.error.issues[0].message,
    };
  }

  const resultado = await anularVenta({
    ventaId: validacion.data.id,
    motivo: validacion.data.motivoAnulacion,
    usuarioId: usuario.id,
  });

  if (resultado.anulada) {
    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath(`/ventas/${validacion.data.id}`);
    revalidatePath("/productos");
  }

  return resultado;
}

export async function buscarProductosAccion(busqueda: unknown) {
  await obtenerUsuarioActual();

  return buscarProductosActivos(
    limpiarBusqueda(typeof busqueda === "string" ? busqueda : ""),
  );
}
