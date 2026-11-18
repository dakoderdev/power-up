import type { MEDIOS_PAGO, TIPOS_CUENTA } from "@/lib/db/schema";

// RF-C5: medio con el que el cliente paga su cuenta.
export const ETIQUETAS_MEDIO_PAGO: Record<
  (typeof MEDIOS_PAGO)[number],
  string
> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta de débito",
};

export function etiquetaMedio(medio: (typeof MEDIOS_PAGO)[number] | null) {
  return medio ? ETIQUETAS_MEDIO_PAGO[medio] : "Sin dato";
}

export const ETIQUETAS_TIPO_CUENTA: Record<
  (typeof TIPOS_CUENTA)[number],
  string
> = {
  venta: "Venta",
  pago: "Pago",
  anulacion: "Anulación",
};
