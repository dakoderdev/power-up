import type { TIPOS_CUENTA } from "@/lib/db/schema";

export const ETIQUETAS_TIPO_CUENTA: Record<
  (typeof TIPOS_CUENTA)[number],
  string
> = {
  venta: "Venta",
  pago: "Pago",
  anulacion: "Anulación",
};
