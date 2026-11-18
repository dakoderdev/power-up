import type { OrigenStock } from "@/lib/stock/listado";

export const SOLO_ESCRITORIO = "hidden sm:table-cell";

export function enlaceStock({
  busqueda,
  productoId,
  origen,
  pagina = 1,
}: {
  busqueda?: string;
  productoId?: number;
  origen?: OrigenStock;
  pagina?: number;
}) {
  const consulta = new URLSearchParams();

  if (busqueda) {
    consulta.set("q", busqueda);
  }

  if (productoId) {
    consulta.set("producto", String(productoId));
  }

  if (origen) {
    consulta.set("origen", origen);
  }

  if (pagina > 1) {
    consulta.set("pagina", String(pagina));
  }

  const texto = consulta.toString();

  return texto ? `/stock?${texto}` : "/stock";
}
