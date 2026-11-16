"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirAdministrador } from "@/lib/usuarios/sesion";
import { ajustarStock, type ResultadoAjuste } from "./ajustar";
import { esquemaAjusteManual } from "./esquemas";

// RF-P4 y RF-P5 (sección 3): los ajustes manuales de stock son solo del administrador.
export async function ajustarStockAccion(
  datos: unknown,
): Promise<ResultadoAjuste> {
  const usuario = await requerirAdministrador();
  const validacion = esquemaAjusteManual.safeParse(datos);

  if (!validacion.success) {
    return {
      ajustado: false,
      errores: z.flattenError(validacion.error).fieldErrors,
    };
  }

  const resultado = await ajustarStock({
    entrada: validacion.data,
    usuarioId: usuario.id,
  });

  if (resultado.ajustado) {
    revalidatePath("/");
    revalidatePath("/stock");
    revalidatePath("/productos");
    revalidatePath(`/productos/${validacion.data.productoId}`);
  }

  return resultado;
}
