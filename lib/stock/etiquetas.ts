import { contar } from "../texto";

export const MOTIVO_STOCK_INICIAL = "Stock inicial";

export const UMBRAL_STOCK_BAJO = 3;

export function esStockBajo({
  stock,
  activo,
}: {
  stock: number;
  activo: boolean;
}) {
  return activo && stock <= UMBRAL_STOCK_BAJO;
}

export const ETIQUETAS_ORIGEN = {
  manual: "Ajuste manual",
  venta: "Venta",
  anulacion: "Anulación",
};

export const ANCLA_AJUSTE = "ajustar";

export const MOTIVOS_SUGERIDOS = {
  entrada: [
    "Compra a proveedor",
    "Conteo de inventario",
    "Corrección de carga",
  ],
  salida: ["Rotura", "Pérdida o robo", "Conteo de inventario", "Uso interno"],
};

export const MENSAJE_FALLA =
  "No se pudo registrar el ajuste. Revisá la conexión y probá de nuevo.";

export function avisoAjuste({
  tipo,
  cantidad,
}: {
  tipo: "entrada" | "salida";
  cantidad: number;
}) {
  const unidades = contar({ cantidad, singular: "unidad", plural: "unidades" });

  return tipo === "entrada"
    ? `Se cargaron ${unidades}.`
    : `Se descontaron ${unidades}.`;
}
