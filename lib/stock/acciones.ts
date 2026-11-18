"use server";

import { revalidatePath } from "next/cache";
import { ejecutarAccion } from "@/lib/acciones";
import { validarEntrada } from "@/lib/servicio";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
import { ajustarStock, exigirAjuste } from "./ajustar";
import { esquemaAjusteManual } from "./esquemas";

// RF-P4 y RF-P5 (sección 3): los ajustes manuales de stock son solo del administrador.
export async function ajustarStockAccion(datos: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await requerirAdministrador();
    const entrada = validarEntrada(esquemaAjusteManual, datos);
    const ajuste = exigirAjuste(await ajustarStock({ entrada, usuario }));
    revalidatePath("/");
    revalidatePath("/stock");
    revalidatePath("/productos");
    revalidatePath(`/productos/${entrada.productoId}`);

    return ajuste;
  });
}
