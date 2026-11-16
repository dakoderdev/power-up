import { and, eq, isNull, sql } from "drizzle-orm";
import { obtenerSaldo } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";
import {
  itemsVenta,
  movimientosCuenta,
  movimientosStock,
  productos,
  ventas,
} from "@/lib/db/schema";
import { aCentavos, formatearMoneda } from "@/lib/moneda";

export type CodigoErrorAnulacion =
  "NO_ENCONTRADO" | "FACTURA_ANULADA" | "SALDO_INSUFICIENTE";

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
  usuarioId,
}: {
  ventaId: number;
  motivo: string;
  usuarioId: string;
}): Promise<ResultadoAnular> {
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

    if (clienteId !== null) {
      const saldo = await obtenerSaldo({ consulta: tx, clienteId });

      if (aCentavos(saldo) < aCentavos(venta.total)) {
        return {
          anulada: false,
          codigo: "SALDO_INSUFICIENTE",
          mensaje: `No se puede anular: el saldo de ${venta.clienteNombre} es ${formatearMoneda(saldo)} y quedaría negativo, porque ya pagó parte de esta venta.`,
        };
      }
    }

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

    await tx.insert(movimientosStock).values(
      items.map((item) => ({
        productoId: item.productoId,
        tipo: "entrada" as const,
        origen: "anulacion" as const,
        cantidad: item.cantidad,
        motivo,
        ventaId,
        usuarioId,
      })),
    );

    for (const item of items) {
      await tx
        .update(productos)
        .set({ stock: sql`${productos.stock} + ${item.cantidad}` })
        .where(eq(productos.id, item.productoId));
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
