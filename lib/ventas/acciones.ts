"use server";

import { revalidatePath } from "next/cache";
import { limpiarBusqueda } from "@/lib/db/busqueda";
import { buscarProductosActivos } from "@/lib/productos/listado";
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

  const venta = await confirmarVenta({
    entrada: res.data,
    usuarioId: usuario.id,
  });

  if (venta.confirmada) {
    revalidatePath("/ventas");
  }

  return venta;
}

export async function buscarProductosAccion(busqueda: unknown) {
  await obtenerUsuarioActual();

  return buscarProductosActivos(
    limpiarBusqueda(typeof busqueda === "string" ? busqueda : ""),
  );
}
