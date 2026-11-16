import { aCentavos, deCentavos } from "@/lib/moneda";

// VE-50: el vuelto es el monto recibido menos el total; nunca es negativo.
export function calcularVuelto({
  recibido,
  total,
}: {
  recibido: string;
  total: string;
}) {
  return deCentavos(Math.max(0, aCentavos(recibido) - aCentavos(total)));
}
