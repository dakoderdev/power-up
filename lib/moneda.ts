const FORMATO_IMPORTE = /^-?\d+(\.\d+)?$/;
const SEPARADOR_MILES = /\B(?=(\d{3})+(?!\d))/g;

export function aCentavos(importe: string) {
  if (!FORMATO_IMPORTE.test(importe)) {
    return NaN;
  }

  const negativo = importe.startsWith("-");
  const [enteros, decimales = ""] = importe.replace("-", "").split(".");
  const centavos = Number(enteros + decimales.padEnd(2, "0").slice(0, 2));

  return negativo ? -centavos : centavos;
}

export function deCentavos(centavos: number) {
  const absoluto = Math.abs(centavos);
  const enteros = Math.floor(absoluto / 100);
  const decimales = String(absoluto % 100).padStart(2, "0");

  return `${centavos < 0 ? "-" : ""}${enteros}.${decimales}`;
}

export function formatearMoneda(importe: string) {
  const centavos = aCentavos(importe);

  if (!Number.isSafeInteger(centavos)) {
    throw new Error(`Importe inválido: ${importe}`);
  }

  const absoluto = Math.abs(centavos);
  const enteros = String(Math.floor(absoluto / 100)).replace(
    SEPARADOR_MILES,
    ".",
  );
  const decimales = String(absoluto % 100).padStart(2, "0");

  return `${centavos < 0 ? "-" : ""}$ ${enteros},${decimales}`;
}
