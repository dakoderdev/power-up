export const PUNTO_VENTA = 1;

const DIGITOS_PUNTO = 4;
const DIGITOS_NUMERO = 8;

export function formatearComprobante({
  puntoVenta,
  numero,
}: {
  puntoVenta: number;
  numero: number;
}) {
  const punto = String(puntoVenta).padStart(DIGITOS_PUNTO, "0");

  return `${punto}-${String(numero).padStart(DIGITOS_NUMERO, "0")}`;
}
