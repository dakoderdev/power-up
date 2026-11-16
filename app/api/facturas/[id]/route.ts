import { noEncontrado } from "@/lib/api/errores";
import { formatearFacturaApi } from "@/lib/api/formato";
import { leerId, responder, ruta } from "@/lib/api/ruta";
import { obtenerVenta } from "@/lib/ventas/detalle";

type Params = { id: string };

// RF-V7: la factura completa; si está anulada, suma la anulación.
export const GET = ruta<Params>({}, async ({ params }) => {
  const venta = await obtenerVenta(leerId(params.id));

  if (!venta) {
    throw noEncontrado("La factura");
  }

  return responder(formatearFacturaApi({ venta }));
});
