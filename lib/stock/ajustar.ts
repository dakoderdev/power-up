import { eq } from "drizzle-orm";
import { ApiError, detallesDeCampos } from "@/lib/api/errores";
import { db } from "@/lib/db";
import { exigirAdministrador, type UsuarioServicio } from "@/lib/servicio";
import { productos } from "@/lib/db/schema";
import type { AjusteManual } from "./esquemas";
import { moverStock } from "./mover";

export type ResultadoAjuste =
  | { ajustado: true; movimientoId: number; stock: number }
  | {
      ajustado: false;
      errores: Partial<Record<keyof AjusteManual, string[]>>;
    };

function sinStock(stock: number): ResultadoAjuste {
  return {
    ajustado: false,
    errores: {
      cantidad: [`No se puede sacar más que el stock actual (${stock}).`],
    },
  };
}

// RF-P4, RF-P5 y regla 2: ingreso o egreso manual a través de moverStock.
export async function ajustarStock({
  entrada,
  usuario,
}: {
  entrada: AjusteManual;
  usuario: UsuarioServicio;
}): Promise<ResultadoAjuste> {
  exigirAdministrador(usuario);
  const usuarioId = usuario.id;

  return db.transaction(async (tx) => {
    const [producto] = await tx
      .select({ id: productos.id, stock: productos.stock })
      .from(productos)
      .where(eq(productos.id, entrada.productoId));

    if (!producto) {
      return {
        ajustado: false,
        errores: { cantidad: ["El producto no existe."] },
      };
    }

    const esSalida = entrada.tipo === "salida";

    if (esSalida && entrada.cantidad > producto.stock) {
      return sinStock(producto.stock);
    }

    const movido = await moverStock({
      tx,
      productoId: producto.id,
      tipo: entrada.tipo,
      origen: "manual",
      cantidad: entrada.cantidad,
      motivo: entrada.motivo,
      usuarioId,
    });

    if (!movido) {
      return sinStock(producto.stock);
    }

    return {
      ajustado: true,
      movimientoId: movido.movimientoId,
      stock: movido.stock,
    };
  });
}

// Sección 10.4 y RF-P5: un egreso que dejaría la existencia negativa pasa a ApiError (409 STOCK_INSUFICIENTE).
export function exigirAjuste(resultado: ResultadoAjuste) {
  if (resultado.ajustado) {
    return { movimientoId: resultado.movimientoId, stock: resultado.stock };
  }

  const detalles = detallesDeCampos(resultado.errores);

  throw new ApiError(
    409,
    "STOCK_INSUFICIENTE",
    detalles[0]?.mensaje ?? "Stock insuficiente.",
    detalles,
  );
}
