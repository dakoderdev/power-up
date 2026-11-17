import { sql } from "drizzle-orm";
import { movimientosCuenta } from "@/lib/db/schema";
import { formatearComprobante, PUNTO_VENTA } from "@/lib/ventas/comprobante";

// RF-C5 y regla 4: correlativo propio de los recibos, último más uno, dentro de la transacción del pago.
export function siguienteRecibo() {
  return sql<number>`(select coalesce(max(${movimientosCuenta.reciboNumero}), 0) + 1 from ${movimientosCuenta})`;
}

export function formatearRecibo(numero: number) {
  return formatearComprobante({ puntoVenta: PUNTO_VENTA, numero });
}