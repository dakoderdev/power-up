import type { TIPOS_DOCUMENTO } from "@/lib/db/schema";

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

const MILES = /\B(?=(\d{3})+(?!\d))/g;
const LARGO_CUIT = 11;

// Sección 10.6 y RF-C2: formato único del documento (DNI 28.456.123, CUIT 20-28456123-4).
export function formatearDocumento({
  tipoDoc,
  documento,
}: {
  tipoDoc: TipoDocumento;
  documento: string;
}) {
  if (tipoDoc === "CUIT" && documento.length === LARGO_CUIT) {
    return `${documento.slice(0, 2)}-${documento.slice(2, 10)}-${documento.slice(10)}`;
  }

  return tipoDoc === "DNI" ? documento.replace(MILES, ".") : documento;
}

// RF-V7 y regla 3: documento del comprador tal como quedó copiado en la factura.
export function documentoDeVenta({
  clienteTipoDoc,
  clienteDocumento,
}: {
  clienteTipoDoc: TipoDocumento | null;
  clienteDocumento: string | null;
}) {
  return clienteDocumento === null
    ? null
    : etiquetaDocumento({
        tipoDoc: clienteTipoDoc ?? "DNI",
        documento: clienteDocumento,
      });
}

export function etiquetaDocumento({
  tipoDoc,
  documento,
}: {
  tipoDoc: TipoDocumento;
  documento: string;
}) {
  return `${tipoDoc} ${formatearDocumento({ tipoDoc, documento })}`;
}
