import { and, eq, isNull } from "drizzle-orm";
import { ApiError } from "@/lib/api/errores";
import { db } from "@/lib/db";
import { exigirAdministrador, type UsuarioServicio } from "@/lib/servicio";
import { itemsVenta, movimientosCuenta, ventas } from "@/lib/db/schema";
import { moverStock } from "@/lib/stock/mover";

export type CodigoErrorAnulacion = "NO_ENCONTRADO" | "FACTURA_ANULADA";

type ResultadoAnular =
  | { anulada: true }
  | { anulada: false; codigo: CodigoErrorAnulacion; mensaje: string };

const YA_ANULADA: ResultadoAnular = {
  anulada: false,
  codigo: "FACTURA_ANULADA",
  mensaje: "La venta ya está anulada.",
};

// RF-V9 y regla 5: marca la factura como anulada, reingresa el stock con
// movimientos de anulación y acredita la cuenta corriente, en una sola
// transacción (VE-37 a VE-46).
export async function anularVenta({
  ventaId,
  motivo,
  usuario,
}: {
  ventaId: number;
  motivo: string;
  usuario: UsuarioServicio;
}): Promise<ResultadoAnular> {
  exigirAdministrador(usuario);
  const usuarioId = usuario.id;

  return db.transaction(async (tx) => {
    const [venta] = await tx
      .select()
      .from(ventas)
      .where(eq(ventas.id, ventaId));

    if (!venta) {
      return {
        anulada: false,
        codigo: "NO_ENCONTRADO",
        mensaje: "La venta no existe.",
      };
    }

    if (venta.anuladaEn) {
      return YA_ANULADA;
    }

    const clienteId =
      venta.formaPago === "cuenta_corriente" ? venta.clienteId : null;

    const [marcada] = await tx
      .update(ventas)
      .set({
        anuladaEn: new Date(),
        anuladaPor: usuarioId,
        motivoAnulacion: motivo,
      })
      .where(and(eq(ventas.id, ventaId), isNull(ventas.anuladaEn)))
      .returning({ id: ventas.id });

    if (!marcada) {
      return YA_ANULADA;
    }

    const items = await tx
      .select()
      .from(itemsVenta)
      .where(eq(itemsVenta.ventaId, ventaId));

    for (const item of items) {
      await moverStock({
        tx,
        productoId: item.productoId,
        tipo: "entrada",
        origen: "anulacion",
        cantidad: item.cantidad,
        motivo,
        ventaId,
        usuarioId,
      });
    }

    if (clienteId !== null) {
      await tx.insert(movimientosCuenta).values({
        clienteId,
        tipo: "anulacion",
        importe: venta.total,
        ventaId,
        observacion: motivo,
        usuarioId,
      });
    }

    return { anulada: true };
  });
}

const ESTADO_ANULACION: Record<CodigoErrorAnulacion, number> = {
  NO_ENCONTRADO: 404,
  FACTURA_ANULADA: 409,
};

// Sección 10.4 y RF-V9: una anulación rechazada pasa a ApiError (409 FACTURA_ANULADA).
export function exigirAnulada(resultado: ResultadoAnular) {
  if (resultado.anulada) {
    return;
  }

  throw new ApiError(
    ESTADO_ANULACION[resultado.codigo],
    resultado.codigo,
    resultado.mensaje,
  );
}
